import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddUserIdToSales1767000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'sales',
      new TableColumn({
        name: 'userId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'sales',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'sales',
      new TableIndex({
        name: 'IDX_SALES_USER',
        columnNames: ['userId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('sales', 'IDX_SALES_USER');

    const table = await queryRunner.getTable('sales');
    if (table) {
      const userFk = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('userId') !== -1,
      );

      if (userFk) {
        await queryRunner.dropForeignKey('sales', userFk);
      }
    }

    await queryRunner.dropColumn('sales', 'userId');
  }
}
