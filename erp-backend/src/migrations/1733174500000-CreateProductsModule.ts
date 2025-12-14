import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateProductsModule1733174500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create categories table
    await queryRunner.createTable(
      new Table({
        name: 'categories',
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
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add foreign key for tenantId in categories table
    await queryRunner.createForeignKey(
      'categories',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    // Create unique index on name + tenantId for categories
    await queryRunner.createIndex(
      'categories',
      new TableIndex({
        name: 'idx_categories_name_tenant',
        columnNames: ['name', 'tenantId'],
        isUnique: true,
      }),
    );

    // Create products table
    await queryRunner.createTable(
      new Table({
        name: 'products',
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
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'sku',
            type: 'varchar',
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'cost',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'quantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'categoryId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'barcode',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add foreign key for tenantId in products table
    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key for categoryId in products table
    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        columnNames: ['categoryId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'SET NULL',
      }),
    );

    // Create unique index on sku + tenantId for products (SKU unique per tenant)
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'idx_products_sku_tenant',
        columnNames: ['sku', 'tenantId'],
        isUnique: true,
      }),
    );

    // Create index on barcode for fast lookup
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'idx_products_barcode',
        columnNames: ['barcode'],
      }),
    );

    // Create index on name for search performance
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'idx_products_name',
        columnNames: ['name'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes on products
    await queryRunner.dropIndex('products', 'idx_products_name');
    await queryRunner.dropIndex('products', 'idx_products_barcode');
    await queryRunner.dropIndex('products', 'idx_products_sku_tenant');

    // Drop foreign keys from products
    const productsTable = await queryRunner.getTable('products');
    const categoryForeignKey = productsTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('categoryId') !== -1,
    );
    if (categoryForeignKey) {
      await queryRunner.dropForeignKey('products', categoryForeignKey);
    }

    const productsTenantForeignKey = productsTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('tenantId') !== -1,
    );
    if (productsTenantForeignKey) {
      await queryRunner.dropForeignKey('products', productsTenantForeignKey);
    }

    // Drop products table
    await queryRunner.dropTable('products');

    // Drop index on categories
    await queryRunner.dropIndex('categories', 'idx_categories_name_tenant');

    // Drop foreign key from categories
    const categoriesTable = await queryRunner.getTable('categories');
    const categoriesTenantForeignKey = categoriesTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('tenantId') !== -1,
    );
    if (categoriesTenantForeignKey) {
      await queryRunner.dropForeignKey(
        'categories',
        categoriesTenantForeignKey,
      );
    }

    // Drop categories table
    await queryRunner.dropTable('categories');
  }
}
