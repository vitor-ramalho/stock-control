import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FinancialEntry, EntryType } from './entities/financial-entry.entity';
import { CreateFinancialEntryDto } from './dto/create-financial-entry.dto';
import { CashRegister, CashRegisterStatus } from '../cash-register/entities/cash-register.entity';

@Injectable()
export class FinancialEntryService {
  constructor(
    @InjectRepository(FinancialEntry)
    private financialEntryRepository: Repository<FinancialEntry>,
    @InjectRepository(CashRegister)
    private cashRegisterRepository: Repository<CashRegister>,
  ) {}

  /**
   * Create a manual financial entry
   * Must have an open cash register
   */
  async createEntry(
    createFinancialEntryDto: CreateFinancialEntryDto,
    userId: string,
    tenantId: string,
  ): Promise<FinancialEntry> {
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

    const entry = this.financialEntryRepository.create({
      ...createFinancialEntryDto,
      tenantId,
      cashRegisterId: cashRegister.id,
    });

    return this.financialEntryRepository.save(entry);
  }

  /**
   * Auto-create entry when a sale happens
   * Called by Sales/POS module
   */
  async autoEntryForSale(
    saleId: string,
    value: number,
    cashRegisterId: string,
    tenantId: string,
    description?: string,
  ): Promise<FinancialEntry> {
    // Verify cash register exists and is open
    const cashRegister = await this.cashRegisterRepository.findOne({
      where: {
        id: cashRegisterId,
        tenantId,
        status: CashRegisterStatus.OPEN,
      },
    });

    if (!cashRegister) {
      throw new BadRequestException(
        'Cash register not found or is closed.',
      );
    }

    const entry = this.financialEntryRepository.create({
      tenantId,
      cashRegisterId,
      saleId,
      type: EntryType.IN,
      value,
      description: description || `Sale #${saleId}`,
      category: 'sales',
    });

    return this.financialEntryRepository.save(entry);
  }

  /**
   * Get all entries for a specific cash register
   */
  async getEntriesByRegister(
    cashRegisterId: string,
    tenantId: string,
  ): Promise<FinancialEntry[]> {
    // Verify cash register belongs to tenant
    const cashRegister = await this.cashRegisterRepository.findOne({
      where: { id: cashRegisterId, tenantId },
    });

    if (!cashRegister) {
      throw new NotFoundException('Cash register not found');
    }

    return this.financialEntryRepository.find({
      where: {
        cashRegisterId,
        tenantId,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all entries for the tenant (with pagination)
   */
  async findAll(
    tenantId: string,
    limit = 100,
    offset = 0,
  ): Promise<FinancialEntry[]> {
    return this.financialEntryRepository.find({
      where: { tenantId },
      relations: ['cashRegister'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get entries by type (IN or OUT)
   */
  async getEntriesByType(
    type: EntryType,
    tenantId: string,
    limit = 100,
  ): Promise<FinancialEntry[]> {
    return this.financialEntryRepository.find({
      where: { type, tenantId },
      relations: ['cashRegister'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get entries by category
   */
  async getEntriesByCategory(
    category: string,
    tenantId: string,
    limit = 100,
  ): Promise<FinancialEntry[]> {
    return this.financialEntryRepository.find({
      where: { category, tenantId },
      relations: ['cashRegister'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
