import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, DataSource } from 'typeorm';
import {
  CashRegister,
  CashRegisterStatus,
} from './entities/cash-register.entity';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto';
import {
  FinancialEntry,
  EntryType,
} from '../financial-entry/entities/financial-entry.entity';

@Injectable()
export class CashRegisterService {
  constructor(
    @InjectRepository(CashRegister)
    private cashRegisterRepository: Repository<CashRegister>,
    @InjectRepository(FinancialEntry)
    private financialEntryRepository: Repository<FinancialEntry>,
    private dataSource: DataSource,
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
    return this.dataSource.transaction(async (manager) => {
      const cashRegister = await manager.findOne(CashRegister, {
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

      const entries = await manager.find(FinancialEntry, {
        where: {
          cashRegisterId: cashRegister.id,
          tenantId,
        },
      });

      const totalIn = entries
        .filter((e) => e.type === EntryType.IN)
        .reduce((sum, e) => sum + Number(e.value), 0);

      const totalOut = entries
        .filter((e) => e.type === EntryType.OUT)
        .reduce((sum, e) => sum + Number(e.value), 0);

      const calculatedBalance =
        Number(cashRegister.initialBalance) + totalIn - totalOut;

      cashRegister.finalBalance =
        closeCashRegisterDto.finalBalance ?? calculatedBalance;
      cashRegister.closedAt = new Date();
      cashRegister.status = CashRegisterStatus.CLOSED;

      return manager.save(cashRegister);
    });
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
            cashRegisterId: In(registerIds),
          },
          order: { createdAt: 'ASC' },
        })
      : [];

    // Calculate totals
    const totalIn = entries
      .filter((e) => e.type === EntryType.IN)
      .reduce((sum, e) => sum + Number(e.value), 0);

    const totalOut = entries
      .filter((e) => e.type === EntryType.OUT)
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

  /**
   * Get admin overview of all open cash registers
   * Returns summary and detailed information for each open register
   */
  async getAdminOverview(tenantId: string) {
    // Fetch all open registers with user details
    const openRegisters = await this.cashRegisterRepository.find({
      where: {
        tenantId,
        status: CashRegisterStatus.OPEN,
      },
      relations: ['user'],
      order: { openedAt: 'DESC' },
    });

    // Calculate details for each register
    const registersWithDetails = await Promise.all(
      openRegisters.map(async (register) => {
        const entries = await this.financialEntryRepository.find({
          where: { tenantId, cashRegisterId: register.id },
        });

        const totalIn = entries
          .filter((e) => e.type === EntryType.IN)
          .reduce((sum, e) => sum + Number(e.value), 0);

        const totalOut = entries
          .filter((e) => e.type === EntryType.OUT)
          .reduce((sum, e) => sum + Number(e.value), 0);

        const currentBalance =
          Number(register.initialBalance) + totalIn - totalOut;

        // Totals by category
        const salesTotal = entries
          .filter((e) => e.category === 'sales')
          .reduce((sum, e) => sum + Number(e.value), 0);

        const expensesTotal = entries
          .filter((e) => e.category === 'expense')
          .reduce((sum, e) => sum + Number(e.value), 0);

        // Totals by payment method
        const paymentMethods = {
          cash: entries
            .filter((e) => e.paymentMethod === 'cash')
            .reduce((sum, e) => sum + Number(e.value), 0),
          card: entries
            .filter((e) => e.paymentMethod === 'card')
            .reduce((sum, e) => sum + Number(e.value), 0),
          pix: entries
            .filter((e) => e.paymentMethod === 'pix')
            .reduce((sum, e) => sum + Number(e.value), 0),
        };

        // Last activity
        const lastEntry = entries.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];

        return {
          id: register.id,
          userId: register.userId,
          userName: register.user?.name || 'Desconhecido',
          userEmail: register.user?.email,
          openedAt: register.openedAt,
          initialBalance: Number(register.initialBalance),
          currentBalance,
          totalIn,
          totalOut,
          salesTotal,
          expensesTotal,
          paymentMethods,
          entriesCount: entries.length,
          lastActivity: lastEntry?.createdAt || register.openedAt,
        };
      }),
    );

    // Calculate overall summary
    const totalOpenRegisters = openRegisters.length;
    const totalBalanceAllRegisters = registersWithDetails.reduce(
      (sum, r) => sum + r.currentBalance,
      0,
    );
    const totalSalesAllRegisters = registersWithDetails.reduce(
      (sum, r) => sum + r.salesTotal,
      0,
    );

    return {
      summary: {
        totalOpenRegisters,
        totalBalanceAllRegisters,
        totalSalesAllRegisters,
      },
      registers: registersWithDetails,
    };
  }
}
