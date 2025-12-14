import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateStockModule1733175000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create stock_movements table
    await queryRunner.createTable(
      new Table({
        name: 'stock_movements',
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
            name: 'productId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['in', 'out'],
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'origin',
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

    // Add foreign key for tenantId
    await queryRunner.createForeignKey(
      'stock_movements',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key for productId
    await queryRunner.createForeignKey(
      'stock_movements',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );

    // Create index on tenantId for filtering
    await queryRunner.createIndex(
      'stock_movements',
      new TableIndex({
        name: 'IDX_STOCK_MOVEMENTS_TENANT',
        columnNames: ['tenantId'],
      }),
    );

    // Create index on productId for product movement queries
    await queryRunner.createIndex(
      'stock_movements',
      new TableIndex({
        name: 'IDX_STOCK_MOVEMENTS_PRODUCT',
        columnNames: ['productId'],
      }),
    );

    // Create composite index for tenant + product queries
    await queryRunner.createIndex(
      'stock_movements',
      new TableIndex({
        name: 'IDX_STOCK_MOVEMENTS_TENANT_PRODUCT',
        columnNames: ['tenantId', 'productId'],
      }),
    );

    // Create index on createdAt for chronological ordering
    await queryRunner.createIndex(
      'stock_movements',
      new TableIndex({
        name: 'IDX_STOCK_MOVEMENTS_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('stock_movements', 'IDX_STOCK_MOVEMENTS_CREATED_AT');
    await queryRunner.dropIndex('stock_movements', 'IDX_STOCK_MOVEMENTS_TENANT_PRODUCT');
    await queryRunner.dropIndex('stock_movements', 'IDX_STOCK_MOVEMENTS_PRODUCT');
    await queryRunner.dropIndex('stock_movements', 'IDX_STOCK_MOVEMENTS_TENANT');

    // Drop foreign keys
    const table = await queryRunner.getTable('stock_movements');
    if (table) {
      const productForeignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('productId') !== -1,
      );
      const tenantForeignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('tenantId') !== -1,
      );
      if (productForeignKey) {
        await queryRunner.dropForeignKey('stock_movements', productForeignKey);
      }
      if (tenantForeignKey) {
        await queryRunner.dropForeignKey('stock_movements', tenantForeignKey);
      }
    }

    // Drop table
    await queryRunner.dropTable('stock_movements');
  }
}
