import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOperator,
  FindOptionsWhere,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Sale, SaleStatus } from '../pos/entities/sale.entity';
import {
  StockMovement,
  MovementType,
} from '../stock/entities/stock-movement.entity';
import { Product } from '../products/entities/product.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import {
  FinancialEntry,
  EntryType,
} from '../financial-entry/entities/financial-entry.entity';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';
import { StockReportQueryDto } from './dto/stock-report-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepository: Repository<CashRegister>,
    @InjectRepository(FinancialEntry)
    private readonly financialEntryRepository: Repository<FinancialEntry>,
  ) {}

  async getSalesReport(query: SalesReportQueryDto, tenantId: string) {
    const where: FindOptionsWhere<Sale> = {
      tenantId,
      status: SaleStatus.CLOSED,
    };

    if (query.start && query.end) {
      const start = new Date(query.start);
      start.setHours(0, 0, 0, 0);

      const end = new Date(query.end);
      end.setHours(23, 59, 59, 999);

      where.createdAt = Between(start, end) as FindOperator<Date>;
    } else if (query.start) {
      const start = new Date(query.start);
      start.setHours(0, 0, 0, 0);
      where.createdAt = MoreThanOrEqual(start) as FindOperator<Date>;
    } else if (query.end) {
      const end = new Date(query.end);
      end.setHours(23, 59, 59, 999);
      where.createdAt = LessThanOrEqual(end) as FindOperator<Date>;
    }

    const sales = await this.saleRepository.find({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalItems = sales.reduce(
      (sum, sale) =>
        sum +
        (sale.items || []).reduce((inner, item) => inner + item.quantity, 0),
      0,
    );

    const averageTicket = totalSales ? totalRevenue / totalSales : 0;

    const byPaymentMethod = sales.reduce<Record<string, number>>((acc, sale) => {
      const key = sale.paymentMethod || 'unknown';
      acc[key] = (acc[key] || 0) + Number(sale.total);
      return acc;
    }, {});

    return {
      period: {
        start: query.start || null,
        end: query.end || null,
      },
      summary: {
        totalSales,
        totalRevenue,
        averageTicket,
        totalItems,
      },
      byPaymentMethod,
      data: sales,
    };
  }

  async getStockMovementsReport(query: StockReportQueryDto, tenantId: string) {
    const where: FindOptionsWhere<StockMovement> = {
      tenantId,
    };

    if (query.productId) {
      const product = await this.productRepository.findOne({
        where: { id: query.productId, tenantId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      where.productId = query.productId;
    }

    if (query.start && query.end) {
      const start = new Date(query.start);
      start.setHours(0, 0, 0, 0);

      const end = new Date(query.end);
      end.setHours(23, 59, 59, 999);

      where.createdAt = Between(start, end) as FindOperator<Date>;
    } else if (query.start) {
      const start = new Date(query.start);
      start.setHours(0, 0, 0, 0);
      where.createdAt = MoreThanOrEqual(start) as FindOperator<Date>;
    } else if (query.end) {
      const end = new Date(query.end);
      end.setHours(23, 59, 59, 999);
      where.createdAt = LessThanOrEqual(end) as FindOperator<Date>;
    }

    const limit = query.limit ?? 100;

    const movements = await this.stockMovementRepository.find({
      where,
      relations: ['product'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const totalIn = movements
      .filter((movement) => movement.type === MovementType.IN)
      .reduce((sum, movement) => sum + movement.quantity, 0);

    const totalOut = movements
      .filter((movement) => movement.type === MovementType.OUT)
      .reduce((sum, movement) => sum + movement.quantity, 0);

    let currentProductQuantity: number | null = null;

    if (query.productId) {
      const product = await this.productRepository.findOne({
        where: { id: query.productId, tenantId },
      });
      currentProductQuantity = product ? product.quantity : null;
    }

    return {
      period: {
        start: query.start || null,
        end: query.end || null,
      },
      productId: query.productId || null,
      summary: {
        totalMovements: movements.length,
        totalIn,
        totalOut,
        netMovement: totalIn - totalOut,
        currentProductQuantity,
      },
      data: movements,
    };
  }

  async getCashReportByDate(dateRaw: string | undefined, tenantId: string) {
    const date = dateRaw ? new Date(dateRaw) : new Date();

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const registers = await this.cashRegisterRepository.find({
      where: {
        tenantId,
        openedAt: Between(startOfDay, endOfDay),
      },
      relations: ['user'],
      order: { openedAt: 'ASC' },
    });

    const registerIds = registers.map((register) => register.id);

    const entries = registerIds.length
      ? await this.financialEntryRepository.find({
          where: {
            tenantId,
            cashRegisterId: In(registerIds),
          },
          order: { createdAt: 'ASC' },
        })
      : [];

    const totalIn = entries
      .filter((entry) => entry.type === EntryType.IN)
      .reduce((sum, entry) => sum + Number(entry.value), 0);

    const totalOut = entries
      .filter((entry) => entry.type === EntryType.OUT)
      .reduce((sum, entry) => sum + Number(entry.value), 0);

    const totalInitialBalance = registers.reduce(
      (sum, register) => sum + Number(register.initialBalance),
      0,
    );

    const totalFinalBalance = registers
      .filter((register) => register.finalBalance !== null)
      .reduce((sum, register) => sum + Number(register.finalBalance), 0);

    return {
      date: startOfDay.toISOString().split('T')[0],
      registers,
      entries,
      summary: {
        totalRegisters: registers.length,
        totalInitialBalance,
        totalFinalBalance,
        totalIn,
        totalOut,
        netBalance: totalIn - totalOut,
      },
    };
  }
}
