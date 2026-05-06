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
      true,
    );

    await queryRunner.createForeignKey(
      'customers',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'IDX_CUSTOMERS_TENANT',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'IDX_CUSTOMERS_TENANT_NAME',
        columnNames: ['tenantId', 'name'],
      }),
    );

    await queryRunner.addColumn(
      'sales',
      new TableColumn({
        name: 'customerId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'sales',
      new TableForeignKey({
        columnNames: ['customerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customers',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'sales',
      new TableIndex({
        name: 'IDX_SALES_CUSTOMER',
        columnNames: ['customerId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('sales', 'IDX_SALES_CUSTOMER');

    const salesTable = await queryRunner.getTable('sales');
    if (salesTable) {
      const customerFk = salesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('customerId') !== -1,
      );

      if (customerFk) {
        await queryRunner.dropForeignKey('sales', customerFk);
      }
    }

    await queryRunner.dropColumn('sales', 'customerId');

    await queryRunner.dropIndex('customers', 'IDX_CUSTOMERS_TENANT_NAME');
    await queryRunner.dropIndex('customers', 'IDX_CUSTOMERS_TENANT');

    const customersTable = await queryRunner.getTable('customers');
    if (customersTable) {
      const tenantFk = customersTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('tenantId') !== -1,
      );

      if (tenantFk) {
        await queryRunner.dropForeignKey('customers', tenantFk);
      }
    }

    await queryRunner.dropTable('customers');
  }
}
