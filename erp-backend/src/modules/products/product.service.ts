import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    tenantId: string,
  ): Promise<Product> {
    if (!tenantId) {
      throw new BadRequestException('TenantId is required');
    }

    // Enforce SKU uniqueness per tenant
    const existingProduct = await this.productRepository.findOne({
      where: { sku: createProductDto.sku, tenantId },
    });

    if (existingProduct) {
      throw new ConflictException(
        'Product with this SKU already exists in this tenant',
      );
    }

    const product = this.productRepository.create({
      ...createProductDto,
      tenantId,
    });

    return this.productRepository.save(product);
  }

  async findAll(tenantId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { tenantId },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, tenantId },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    tenantId: string,
  ): Promise<Product> {
    const product = await this.findOne(id, tenantId);

    // Check SKU uniqueness if SKU is being updated
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: updateProductDto.sku, tenantId },
      });

      if (existingProduct) {
        throw new ConflictException(
          'Product with this SKU already exists in this tenant',
        );
      }
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const product = await this.findOne(id, tenantId);
    await this.productRepository.remove(product);
  }

  async search(query: string, tenantId: string): Promise<Product[]> {
    if (!query || query.trim() === '') {
      return this.findAll(tenantId);
    }

    return this.productRepository.find({
      where: [
        { name: ILike(`%${query}%`), tenantId },
        { sku: ILike(`%${query}%`), tenantId },
        { barcode: ILike(`%${query}%`), tenantId },
      ],
      relations: ['category'],
      order: { name: 'ASC' },
      take: 50, // Limit results for POS performance
    });
  }

  async findBySku(sku: string, tenantId: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { sku, tenantId },
      relations: ['category'],
    });
  }

  async findByBarcode(
    barcode: string,
    tenantId: string,
  ): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { barcode, tenantId },
      relations: ['category'],
    });
  }

  async updateQuantity(
    id: string,
    quantity: number,
    tenantId: string,
  ): Promise<Product> {
    const product = await this.findOne(id, tenantId);
    product.quantity = quantity;
    return this.productRepository.save(product);
  }

  async adjustQuantity(
    id: string,
    adjustment: number,
    tenantId: string,
  ): Promise<Product> {
    const product = await this.findOne(id, tenantId);
    product.quantity += adjustment;
    return this.productRepository.save(product);
  }
}
