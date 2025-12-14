import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { Product } from '../products/entities/product.entity';
import { CreateStockInDto } from './dto/create-stock-in.dto';
import { CreateStockOutDto } from './dto/create-stock-out.dto';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  /**
   * Manual stock input (type = 'in')
   * Increases product quantity
   */
  async stockIn(
    createStockInDto: CreateStockInDto,
    tenantId: string,
  ): Promise<StockMovement> {
    const { productId, quantity, origin } = createStockInDto;

    // Verify product exists and belongs to tenant
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${productId} not found in your tenant`,
      );
    }

    // Create stock movement
    const movement = this.stockMovementRepository.create({
      tenantId,
      productId,
      type: MovementType.IN,
      quantity,
      origin: origin || 'manual',
    });

    const savedMovement = await this.stockMovementRepository.save(movement);

    // Update product quantity
    product.quantity += quantity;
    await this.productRepository.save(product);

    return savedMovement;
  }

  /**
   * Manual stock output (type = 'out')
   * Decreases product quantity
   */
  async stockOut(
    createStockOutDto: CreateStockOutDto,
    tenantId: string,
  ): Promise<StockMovement> {
    const { productId, quantity, origin } = createStockOutDto;

    // Verify product exists and belongs to tenant
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${productId} not found in your tenant`,
      );
    }

    // Check if there's enough stock
    if (product.quantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.quantity}, Requested: ${quantity}`,
      );
    }

    // Create stock movement
    const movement = this.stockMovementRepository.create({
      tenantId,
      productId,
      type: MovementType.OUT,
      quantity,
      origin: origin || 'manual',
    });

    const savedMovement = await this.stockMovementRepository.save(movement);

    // Update product quantity
    product.quantity -= quantity;
    await this.productRepository.save(product);

    return savedMovement;
  }

  /**
   * Automatic output for sale (type='out', origin='pos')
   * Called by POS/Sales module
   */
  async automaticOutput(
    productId: string,
    quantity: number,
    tenantId: string,
    origin = 'pos',
  ): Promise<StockMovement> {
    // Verify product exists and belongs to tenant
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${productId} not found in your tenant`,
      );
    }

    // Check if there's enough stock
    if (product.quantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${quantity}`,
      );
    }

    // Create stock movement
    const movement = this.stockMovementRepository.create({
      tenantId,
      productId,
      type: MovementType.OUT,
      quantity,
      origin,
    });

    const savedMovement = await this.stockMovementRepository.save(movement);

    // Update product quantity
    product.quantity -= quantity;
    await this.productRepository.save(product);

    return savedMovement;
  }

  /**
   * Get all stock movements for a specific product
   * Tenant-scoped
   */
  async getProductMovements(
    productId: string,
    tenantId: string,
  ): Promise<StockMovement[]> {
    // Verify product exists and belongs to tenant
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${productId} not found in your tenant`,
      );
    }

    return this.stockMovementRepository.find({
      where: { productId, tenantId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all stock movements for the tenant
   * With pagination support
   */
  async findAll(
    tenantId: string,
    limit = 100,
    offset = 0,
  ): Promise<StockMovement[]> {
    return this.stockMovementRepository.find({
      where: { tenantId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
