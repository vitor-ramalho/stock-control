import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RepairCustomersSchema1767600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasCustomersTable = await queryRunner.hasTable('customers');
    if (!hasCustomersTable) {
      return;
    }

    if (!(await queryRunner.hasColumn('customers', 'document'))) {
      await queryRunner.addColumn(
        'customers',
        new TableColumn({
          name: 'document',
          type: 'varchar',
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('customers', 'address'))) {
      await queryRunner.addColumn(
        'customers',
        new TableColumn({
          name: 'address',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('customers', 'notes'))) {
      await queryRunner.addColumn(
        'customers',
        new TableColumn({
          name: 'notes',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('customers', 'isActive'))) {
      await queryRunner.addColumn(
        'customers',
        new TableColumn({
          name: 'isActive',
          type: 'boolean',
          isNullable: false,
          default: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('customers', 'createdAt'))) {
      await queryRunner.addColumn(
        'customers',
        new TableColumn({
          name: 'createdAt',
          type: 'timestamp',
          isNullable: false,
          default: 'now()',
        }),
      );
    }

    if (!(await queryRunner.hasColumn('customers', 'updatedAt'))) {
      await queryRunner.addColumn(
        'customers',
        new TableColumn({
          name: 'updatedAt',
          type: 'timestamp',
          isNullable: false,
          default: 'now()',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasCustomersTable = await queryRunner.hasTable('customers');
    if (!hasCustomersTable) {
      return;
    }

    if (await queryRunner.hasColumn('customers', 'updatedAt')) {
      await queryRunner.dropColumn('customers', 'updatedAt');
    }

    if (await queryRunner.hasColumn('customers', 'createdAt')) {
      await queryRunner.dropColumn('customers', 'createdAt');
    }

    if (await queryRunner.hasColumn('customers', 'isActive')) {
      await queryRunner.dropColumn('customers', 'isActive');
    }

    if (await queryRunner.hasColumn('customers', 'notes')) {
      await queryRunner.dropColumn('customers', 'notes');
    }

    if (await queryRunner.hasColumn('customers', 'address')) {
      await queryRunner.dropColumn('customers', 'address');
    }

    if (await queryRunner.hasColumn('customers', 'document')) {
      await queryRunner.dropColumn('customers', 'document');
    }
  }
}
