import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  CashRegister,
  CashRegisterStatus,
} from './entities/cash-register.entity';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto';
import { FinancialEntry } from '../financial-entry/entities/financial-entry.entity';

@Injectable()
export class CashRegisterService {
  constructor(
    @InjectRepository(CashRegister)
    private cashRegisterRepository: Repository<CashRegister>,
    @InjectRepository(FinancialEntry)
    private financialEntryRepository: Repository<FinancialEntry>,
  ) {}

  /**
   * Open a new cash register
   * Only one register can be open per user at a time
   */
  async openRegister(
    openCashRegisterDto: OpenCashRegisterDto,
    userId: string,
    tenantId: string,
  ): Promise<CashRegister> {
    // Check if user already has an open register
    const existingOpenRegister = await this.cashRegisterRepository.findOne({
      where: {
        userId,
        tenantId,
        status: CashRegisterStatus.OPEN,
      },
    });

    if (existingOpenRegister) {
      throw new BadRequestException(
        'You already have an open cash register. Please close it before opening a new one.',
      );
    }

    const cashRegister = this.cashRegisterRepository.create({
      tenantId,
      userId,
      initialBalance: openCashRegisterDto.initialBalance || 0,
      status: CashRegisterStatus.OPEN,
    });

    return this.cashRegisterRepository.save(cashRegister);
  }

  /**
   * Close the current open cash register
   * Calculates final balance based on entries
   */
  async closeRegister(
    closeCashRegisterDto: CloseCashRegisterDto,
    userId: string,
    tenantId: string,
  ): Promise<CashRegister> {
    // Find the open register for this user
    const cashRegister = await this.cashRegisterRepository.findOne({
      where: {
        userId,
        tenantId,
        status: CashRegisterStatus.OPEN,
      },
    });

    if (!cashRegister) {
      throw new NotFoundException(
        'No open cash register found for this user.',
      );
    }

    // Calculate final balance from entries
    const entries = await this.financialEntryRepository.find({
      where: {
        cashRegisterId: cashRegister.id,
        tenantId,
      },
    });

    const totalIn = entries
      .filter((e) => e.type === 'in')
      .reduce((sum, e) => sum + Number(e.value), 0);

    const totalOut = entries
      .filter((e) => e.type === 'out')
      .reduce((sum, e) => sum + Number(e.value), 0);

    const calculatedBalance =
      Number(cashRegister.initialBalance) + totalIn - totalOut;

    // Use provided finalBalance or calculated balance
    cashRegister.finalBalance =
      closeCashRegisterDto.finalBalance ?? calculatedBalance;
    cashRegister.closedAt = new Date();
    cashRegister.status = CashRegisterStatus.CLOSED;

    return this.cashRegisterRepository.save(cashRegister);
  }

  /**
   * Get the current open register for a user
   */
  async getCurrentRegister(
    userId: string,
    tenantId: string,
  ): Promise<CashRegister | null> {
    const cashRegister = await this.cashRegisterRepository.findOne({
      where: {
        userId,
        tenantId,
        status: CashRegisterStatus.OPEN,
      },
      relations: ['user'],
    });

    return cashRegister;
  }

  /**
   * Get daily report for a specific date
   * Includes all registers and entries for that day
   */
  async getDailyReport(date: Date, tenantId: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all registers opened on this day
    const registers = await this.cashRegisterRepository.find({
      where: {
        tenantId,
        openedAt: Between(startOfDay, endOfDay),
      },
      relations: ['user'],
      order: { openedAt: 'ASC' },
    });

    // Get all entries for these registers
    const registerIds = registers.map((r) => r.id);
    const entries = registerIds.length
      ? await this.financialEntryRepository.find({
          where: {
            tenantId,
            cashRegisterId: Between(registerIds[0], registerIds[registerIds.length - 1]),
          },
          order: { createdAt: 'ASC' },
        })
      : [];

    // Calculate totals
    const totalIn = entries
      .filter((e) => e.type === 'in')
      .reduce((sum, e) => sum + Number(e.value), 0);

    const totalOut = entries
      .filter((e) => e.type === 'out')
      .reduce((sum, e) => sum + Number(e.value), 0);

    const totalInitialBalance = registers.reduce(
      (sum, r) => sum + Number(r.initialBalance),
      0,
    );

    const totalFinalBalance = registers
      .filter((r) => r.finalBalance !== null)
      .reduce((sum, r) => sum + Number(r.finalBalance), 0);

    return {
      date: date.toISOString().split('T')[0],
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

  /**
   * Find a specific register by ID (tenant-scoped)
   */
  async findOne(id: string, tenantId: string): Promise<CashRegister> {
    const cashRegister = await this.cashRegisterRepository.findOne({
      where: { id, tenantId },
      relations: ['user'],
    });

    if (!cashRegister) {
      throw new NotFoundException('Cash register not found');
    }

    return cashRegister;
  }
}
