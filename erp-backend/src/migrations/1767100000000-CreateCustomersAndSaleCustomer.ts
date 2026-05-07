import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateCustomersAndSaleCustomer1767100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create customers table if it doesn't exist
    const customerTableExists = await queryRunner.hasTable('customers');
    if (!customerTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'customers',
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
              name: 'name',
              type: 'varchar',
              isNullable: false,
            },
            {
              name: 'email',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'phone',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'document',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'address',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'notes',
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
      );

      // Add FK constraint for tenantId
      const customersTable = await queryRunner.getTable('customers');
      if (customersTable) {
        const existingFk = customersTable.foreignKeys.find(
          (fk) => fk.columnNames.indexOf('tenantId') !== -1,
        );

        if (!existingFk) {
          await queryRunner.createForeignKey(
            'customers',
            new TableForeignKey({
              columnNames: ['tenantId'],
              referencedColumnNames: ['id'],
              referencedTableName: 'tenants',
              onDelete: 'CASCADE',
            }),
          );
        }
      }

      // Create indexes
      try {
        await queryRunner.createIndex(
          'customers',
          new TableIndex({
            name: 'IDX_CUSTOMERS_TENANT',
            columnNames: ['tenantId'],
          }),
        );
      } catch (e) {
        // Index may already exist
      }

      try {
        await queryRunner.createIndex(
          'customers',
          new TableIndex({
            name: 'IDX_CUSTOMERS_TENANT_NAME',
            columnNames: ['tenantId', 'name'],
          }),
        );
      } catch (e) {
        // Index may already exist
      }
    }

    // Add customerId column to sales table if it doesn't exist
    const salesTable = await queryRunner.getTable('sales');
    if (salesTable && !salesTable.columns.find((col) => col.name === 'customerId')) {
      await queryRunner.addColumn(
        'sales',
        new TableColumn({
          name: 'customerId',
          type: 'uuid',
          isNullable: true,
        }),
      );

      // Add FK constraint for customerId
      const updatedSalesTable = await queryRunner.getTable('sales');
      if (updatedSalesTable) {
        const existingFk = updatedSalesTable.foreignKeys.find(
          (fk) => fk.columnNames.indexOf('customerId') !== -1,
        );

        if (!existingFk) {
          await queryRunner.createForeignKey(
            'sales',
            new TableForeignKey({
              columnNames: ['customerId'],
              referencedColumnNames: ['id'],
              referencedTableName: 'customers',
              onDelete: 'SET NULL',
            }),
          );
        }
      }

      // Create index
      try {
        await queryRunner.createIndex(
          'sales',
          new TableIndex({
            name: 'IDX_SALES_CUSTOMER',
            columnNames: ['customerId'],
          }),
        );
      } catch (e) {
        // Index may already exist
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    try {
      await queryRunner.dropIndex('sales', 'IDX_SALES_CUSTOMER');
    } catch (e) {
      // Index may not exist
    }

    // Drop FK constraint
    const salesTable = await queryRunner.getTable('sales');
    if (salesTable) {
      const customerFk = salesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('customerId') !== -1,
      );

      if (customerFk) {
        await queryRunner.dropForeignKey('sales', customerFk);
      }
    }

    // Drop column
    try {
      await queryRunner.dropColumn('sales', 'customerId');
    } catch (e) {
      // Column may not exist
    }

    // Drop indexes
    try {
      await queryRunner.dropIndex('customers', 'IDX_CUSTOMERS_TENANT_NAME');
    } catch (e) {
      // Index may not exist
    }

    try {
      await queryRunner.dropIndex('customers', 'IDX_CUSTOMERS_TENANT');
    } catch (e) {
      // Index may not exist
    }

    // Drop FK constraint
    const customersTable = await queryRunner.getTable('customers');
    if (customersTable) {
      const tenantFk = customersTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('tenantId') !== -1,
      );

      if (tenantFk) {
        await queryRunner.dropForeignKey('customers', tenantFk);
      }
    }

    // Drop table
    try {
      await queryRunner.dropTable('customers');
    } catch (e) {
      // Table may not exist
    }
  }
}
