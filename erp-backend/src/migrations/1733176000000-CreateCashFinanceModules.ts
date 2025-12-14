import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCashFinanceModules1733176000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create cash_registers table
    await queryRunner.createTable(
      new Table({
        name: 'cash_registers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenantId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'openedAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'closedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'initialBalance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'finalBalance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['open', 'closed'],
            default: "'open'",
          },
        ],
      }),
      true,
    );

    // Create financial_entries table
    await queryRunner.createTable(
      new Table({
        name: 'financial_entries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenantId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'cashRegisterId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'saleId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['in', 'out'],
            isNullable: false,
          },
          {
            name: 'value',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add foreign keys for cash_registers
    await queryRunner.createForeignKey(
      'cash_registers',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'cash_registers',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign keys for financial_entries
    await queryRunner.createForeignKey(
      'financial_entries',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'financial_entries',
      new TableForeignKey({
        columnNames: ['cashRegisterId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cash_registers',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for cash_registers
    await queryRunner.createIndex(
      'cash_registers',
      new TableIndex({
        name: 'IDX_CASH_REGISTERS_TENANT',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'cash_registers',
      new TableIndex({
        name: 'IDX_CASH_REGISTERS_USER',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'cash_registers',
      new TableIndex({
        name: 'IDX_CASH_REGISTERS_STATUS',
        columnNames: ['status'],
      }),
    );

    // Composite index for finding open register by user and tenant
    await queryRunner.createIndex(
      'cash_registers',
      new TableIndex({
        name: 'IDX_CASH_REGISTERS_USER_TENANT_STATUS',
        columnNames: ['userId', 'tenantId', 'status'],
      }),
    );

    // Create indexes for financial_entries
    await queryRunner.createIndex(
      'financial_entries',
      new TableIndex({
        name: 'IDX_FINANCIAL_ENTRIES_TENANT',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'financial_entries',
      new TableIndex({
        name: 'IDX_FINANCIAL_ENTRIES_CASH_REGISTER',
        columnNames: ['cashRegisterId'],
      }),
    );

    await queryRunner.createIndex(
      'financial_entries',
      new TableIndex({
        name: 'IDX_FINANCIAL_ENTRIES_SALE',
        columnNames: ['saleId'],
      }),
    );

    await queryRunner.createIndex(
      'financial_entries',
      new TableIndex({
        name: 'IDX_FINANCIAL_ENTRIES_TYPE',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'financial_entries',
      new TableIndex({
        name: 'IDX_FINANCIAL_ENTRIES_CATEGORY',
        columnNames: ['category'],
      }),
    );

    await queryRunner.createIndex(
      'financial_entries',
      new TableIndex({
        name: 'IDX_FINANCIAL_ENTRIES_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes for financial_entries
    await queryRunner.dropIndex('financial_entries', 'IDX_FINANCIAL_ENTRIES_CREATED_AT');
    await queryRunner.dropIndex('financial_entries', 'IDX_FINANCIAL_ENTRIES_CATEGORY');
    await queryRunner.dropIndex('financial_entries', 'IDX_FINANCIAL_ENTRIES_TYPE');
    await queryRunner.dropIndex('financial_entries', 'IDX_FINANCIAL_ENTRIES_SALE');
    await queryRunner.dropIndex('financial_entries', 'IDX_FINANCIAL_ENTRIES_CASH_REGISTER');
    await queryRunner.dropIndex('financial_entries', 'IDX_FINANCIAL_ENTRIES_TENANT');

    // Drop indexes for cash_registers
    await queryRunner.dropIndex('cash_registers', 'IDX_CASH_REGISTERS_USER_TENANT_STATUS');
    await queryRunner.dropIndex('cash_registers', 'IDX_CASH_REGISTERS_STATUS');
    await queryRunner.dropIndex('cash_registers', 'IDX_CASH_REGISTERS_USER');
    await queryRunner.dropIndex('cash_registers', 'IDX_CASH_REGISTERS_TENANT');

    // Drop foreign keys for financial_entries
    const financialEntriesTable = await queryRunner.getTable('financial_entries');
    if (financialEntriesTable) {
      const cashRegisterFk = financialEntriesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('cashRegisterId') !== -1,
      );
      const tenantFk = financialEntriesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('tenantId') !== -1,
      );
      if (cashRegisterFk) {
        await queryRunner.dropForeignKey('financial_entries', cashRegisterFk);
      }
      if (tenantFk) {
        await queryRunner.dropForeignKey('financial_entries', tenantFk);
      }
    }

    // Drop foreign keys for cash_registers
    const cashRegistersTable = await queryRunner.getTable('cash_registers');
    if (cashRegistersTable) {
      const userFk = cashRegistersTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('userId') !== -1,
      );
      const tenantFk = cashRegistersTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('tenantId') !== -1,
      );
      if (userFk) {
        await queryRunner.dropForeignKey('cash_registers', userFk);
      }
      if (tenantFk) {
        await queryRunner.dropForeignKey('cash_registers', tenantFk);
      }
    }

    // Drop tables
    await queryRunner.dropTable('financial_entries');
    await queryRunner.dropTable('cash_registers');
  }
}
