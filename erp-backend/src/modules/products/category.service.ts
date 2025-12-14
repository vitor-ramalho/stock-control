import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    tenantId: string,
  ): Promise<Category> {
    if (!tenantId) {
      throw new BadRequestException('TenantId is required');
    }

    // Check for duplicate category name within tenant
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name, tenantId },
    });

    if (existingCategory) {
      throw new ConflictException(
        'Category with this name already exists in this tenant',
      );
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      tenantId,
    });

    return this.categoryRepository.save(category);
  }

  async findAll(tenantId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, tenantId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    tenantId: string,
  ): Promise<Category> {
    const category = await this.findOne(id, tenantId);

    // Check for duplicate name if name is being updated
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name, tenantId },
      });

      if (existingCategory) {
        throw new ConflictException(
          'Category with this name already exists in this tenant',
        );
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const category = await this.findOne(id, tenantId);
    await this.categoryRepository.remove(category);
  }
}
