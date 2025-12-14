import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale, SaleStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Product } from '../products/entities/product.entity';
import { CashRegister, CashRegisterStatus } from '../cash-register/entities/cash-register.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { AddSaleItemDto } from './dto/add-sale-item.dto';
import { CloseSaleDto } from './dto/close-sale.dto';
import { StockService } from '../stock/stock.service';
import { FinancialEntryService } from '../financial-entry/financial-entry.service';

@Injectable()
export class PosService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(CashRegister)
    private cashRegisterRepository: Repository<CashRegister>,
    private stockService: StockService,
    private financialEntryService: FinancialEntryService,
  ) {}

  /**
   * Create a new sale
   * Validates that cash register exists and is open
   */
  async createSale(
    createSaleDto: CreateSaleDto,
    tenantId: string,
  ): Promise<Sale> {
    const { cashRegisterId } = createSaleDto;

    // Validate cash register exists, belongs to tenant, and is open
    const cashRegister = await this.cashRegisterRepository.findOne({
      where: {
        id: cashRegisterId,
        tenantId,
        status: CashRegisterStatus.OPEN,
      },
    });

    if (!cashRegister) {
      throw new BadRequestException(
        'Cash register not found or is not open. Please open a cash register first.',
      );
    }

    const sale = this.saleRepository.create({
      tenantId,
      cashRegisterId,
      total: 0,
      status: SaleStatus.PENDING,
    });

    return this.saleRepository.save(sale);
  }

  /**
   * Add item to sale
   * Automatically deducts stock
   * Recalculates sale total
   */
  async addItem(
    saleId: string,
    addSaleItemDto: AddSaleItemDto,
    tenantId: string,
  ): Promise<SaleItem> {
    const { productId, quantity } = addSaleItemDto;

    // Find sale and verify it belongs to tenant and is still pending
    const sale = await this.saleRepository.findOne({
      where: { id: saleId, tenantId, status: SaleStatus.PENDING },
    });

    if (!sale) {
      throw new NotFoundException(
        'Sale not found or already closed',
      );
    }

    // Find product and verify it belongs to tenant
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if product is active
    if (!product.isActive) {
      throw new BadRequestException(
        `Product "${product.name}" is not active`,
      );
    }

    // Validate sufficient stock
    if (product.quantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${quantity}`,
      );
    }

    // Calculate subtotal
    const unitPrice = Number(product.price);
    const subtotal = unitPrice * quantity;

    // Create sale item
    const saleItem = this.saleItemRepository.create({
      tenantId,
      saleId,
      productId,
      quantity,
      unitPrice,
      subtotal,
    });

    const savedItem = await this.saleItemRepository.save(saleItem);

    // Deduct stock automatically using StockService
    await this.stockService.automaticOutput(
      productId,
      quantity,
      tenantId,
      'pos',
    );

    // Recalculate sale total
    await this.recalculateSaleTotal(saleId, tenantId);

    // Return item with product relation
    const itemWithProduct = await this.saleItemRepository.findOne({
      where: { id: savedItem.id, tenantId },
      relations: ['product'],
    });

    if (!itemWithProduct) {
      throw new NotFoundException('Sale item not found');
    }

    return itemWithProduct;
  }

  /**
   * Close sale and create financial entry
   * Sets payment method and changes status to CLOSED
   */
  async closeSale(
    saleId: string,
    closeSaleDto: CloseSaleDto,
    tenantId: string,
  ): Promise<Sale> {
    const { paymentMethod } = closeSaleDto;

    // Find sale with items
    const sale = await this.saleRepository.findOne({
      where: { id: saleId, tenantId, status: SaleStatus.PENDING },
      relations: ['items'],
    });

    if (!sale) {
      throw new NotFoundException(
        'Sale not found or already closed',
      );
    }

    // Validate sale has items
    if (!sale.items || sale.items.length === 0) {
      throw new BadRequestException(
        'Cannot close sale without items',
      );
    }

    // Update sale status and payment method
    sale.status = SaleStatus.CLOSED;
    sale.paymentMethod = paymentMethod;

    const closedSale = await this.saleRepository.save(sale);

    // Create financial entry automatically
    await this.financialEntryService.autoEntryForSale(
      saleId,
      Number(sale.total),
      sale.cashRegisterId,
      tenantId,
      `Sale #${saleId} - ${paymentMethod}`,
    );

    return closedSale;
  }

  /**
   * Get sale by ID with all items and products
   */
  async findOne(saleId: string, tenantId: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id: saleId, tenantId },
      relations: ['items', 'items.product', 'cashRegister'],
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  /**
   * Get all sales for tenant (with pagination)
   */
  async findAll(
    tenantId: string,
    limit = 100,
    offset = 0,
  ): Promise<Sale[]> {
    return this.saleRepository.find({
      where: { tenantId },
      relations: ['items', 'cashRegister'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Simplified checkout - Creates sale with items and closes it in one operation
   * Requires an open cash register for the current user
   */
  async checkout(
    checkoutDto: any, // Will create proper DTO
    userId: string,
    tenantId: string,
  ): Promise<{
    saleId: string;
    receiptNumber: string;
    total: number;
    change?: number;
    createdAt: string;
    paymentMethod: string;
    customerName?: string;
  }> {
    const { items, paymentMethod, customerName, amountReceived } = checkoutDto;

    // Find the user's open cash register
    const cashRegister = await this.cashRegisterRepository.findOne({
      where: {
        userId,
        tenantId,
        status: CashRegisterStatus.OPEN,
      },
    });

    if (!cashRegister) {
      throw new BadRequestException(
        'No open cash register found. Please open a cash register first.',
      );
    }

    // Create sale
    const sale = await this.createSale(
      { cashRegisterId: cashRegister.id },
      tenantId,
    );

    // Add all items
    for (const item of items) {
      await this.addItem(
        sale.id,
        {
          productId: item.productId,
          quantity: item.quantity,
        },
        tenantId,
      );
    }

    // Close sale
    const closedSale = await this.closeSale(
      sale.id,
      { paymentMethod },
      tenantId,
    );

    // Calculate change if payment is cash
    const total = Number(closedSale.total);
    const change =
      paymentMethod === 'cash' && amountReceived
        ? amountReceived - total
        : undefined;

    return {
      saleId: closedSale.id,
      receiptNumber: closedSale.id.substring(0, 8).toUpperCase(),
      total,
      change,
      createdAt: closedSale.createdAt.toISOString(),
      paymentMethod,
      customerName,
    };
  }

  /**
   * Recalculate sale total from items
   */
  private async recalculateSaleTotal(
    saleId: string,
    tenantId: string,
  ): Promise<void> {
    const items = await this.saleItemRepository.find({
      where: { saleId, tenantId },
    });

    const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    await this.saleRepository.update(
      { id: saleId, tenantId },
      { total },
    );
  }

  /**
   * Get sales statistics
   */
  async getStats(tenantId: string, startDate?: string, endDate?: string) {
    const query = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .where('sale.tenantId = :tenantId', { tenantId })
      .andWhere('sale.status = :status', { status: SaleStatus.CLOSED });

    // Apply date filters if provided
    if (startDate) {
      query.andWhere('sale.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query.andWhere('sale.createdAt <= :endDate', { endDate: endDateTime });
    }

    const sales = await query.getMany();

    // Calculate totals
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const totalSales = sales.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    const totalItems = sales.reduce((sum, s) => {
      return sum + (s.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0);
    }, 0);

    // Payment methods breakdown
    const paymentMethods = {
      cash: 0,
      card: 0,
      pix: 0,
    };

    sales.forEach((sale) => {
      if (sale.paymentMethod) {
        paymentMethods[sale.paymentMethod] += Number(sale.total);
      }
    });

    return {
      totalRevenue,
      averageTicket,
      totalItems,
      totalSales,
      paymentMethods,
    };
  }
}
