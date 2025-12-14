import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePosModule1733177000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sales table
    await queryRunner.createTable(
      new Table({
        name: 'sales',
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
            name: 'total',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'paymentMethod',
            type: 'enum',
            enum: ['cash', 'credit_card', 'debit_card', 'pix'],
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'closed', 'cancelled'],
            default: "'pending'",
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

    // Create sale_items table
    await queryRunner.createTable(
      new Table({
        name: 'sale_items',
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
            name: 'saleId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'productId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'unitPrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Add foreign keys for sales
    await queryRunner.createForeignKey(
      'sales',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'sales',
      new TableForeignKey({
        columnNames: ['cashRegisterId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cash_registers',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign keys for sale_items
    await queryRunner.createForeignKey(
      'sale_items',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'sale_items',
      new TableForeignKey({
        columnNames: ['saleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'sales',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'sale_items',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for sales
    await queryRunner.createIndex(
      'sales',
      new TableIndex({
        name: 'IDX_SALES_TENANT',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'sales',
      new TableIndex({
        name: 'IDX_SALES_CASH_REGISTER',
        columnNames: ['cashRegisterId'],
      }),
    );

    await queryRunner.createIndex(
      'sales',
      new TableIndex({
        name: 'IDX_SALES_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'sales',
      new TableIndex({
        name: 'IDX_SALES_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );

    // Composite index for tenant + status queries
    await queryRunner.createIndex(
      'sales',
      new TableIndex({
        name: 'IDX_SALES_TENANT_STATUS',
        columnNames: ['tenantId', 'status'],
      }),
    );

    // Create indexes for sale_items
    await queryRunner.createIndex(
      'sale_items',
      new TableIndex({
        name: 'IDX_SALE_ITEMS_TENANT',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'sale_items',
      new TableIndex({
        name: 'IDX_SALE_ITEMS_SALE',
        columnNames: ['saleId'],
      }),
    );

    await queryRunner.createIndex(
      'sale_items',
      new TableIndex({
        name: 'IDX_SALE_ITEMS_PRODUCT',
        columnNames: ['productId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes for sale_items
    await queryRunner.dropIndex('sale_items', 'IDX_SALE_ITEMS_PRODUCT');
    await queryRunner.dropIndex('sale_items', 'IDX_SALE_ITEMS_SALE');
    await queryRunner.dropIndex('sale_items', 'IDX_SALE_ITEMS_TENANT');

    // Drop indexes for sales
    await queryRunner.dropIndex('sales', 'IDX_SALES_TENANT_STATUS');
    await queryRunner.dropIndex('sales', 'IDX_SALES_CREATED_AT');
    await queryRunner.dropIndex('sales', 'IDX_SALES_STATUS');
    await queryRunner.dropIndex('sales', 'IDX_SALES_CASH_REGISTER');
    await queryRunner.dropIndex('sales', 'IDX_SALES_TENANT');

    // Drop foreign keys for sale_items
    const saleItemsTable = await queryRunner.getTable('sale_items');
    if (saleItemsTable) {
      const productFk = saleItemsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('productId') !== -1,
      );
      const saleFk = saleItemsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('saleId') !== -1,
      );
      const tenantFk = saleItemsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('tenantId') !== -1,
      );
      if (productFk) {
        await queryRunner.dropForeignKey('sale_items', productFk);
      }
      if (saleFk) {
        await queryRunner.dropForeignKey('sale_items', saleFk);
      }
      if (tenantFk) {
        await queryRunner.dropForeignKey('sale_items', tenantFk);
      }
    }

    // Drop foreign keys for sales
    const salesTable = await queryRunner.getTable('sales');
    if (salesTable) {
      const cashRegisterFk = salesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('cashRegisterId') !== -1,
      );
      const tenantFk = salesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('tenantId') !== -1,
      );
      if (cashRegisterFk) {
        await queryRunner.dropForeignKey('sales', cashRegisterFk);
      }
      if (tenantFk) {
        await queryRunner.dropForeignKey('sales', tenantFk);
      }
    }

    // Drop tables
    await queryRunner.dropTable('sale_items');
    await queryRunner.dropTable('sales');
  }
}
