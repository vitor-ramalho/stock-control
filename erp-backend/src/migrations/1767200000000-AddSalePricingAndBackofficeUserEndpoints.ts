import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSalePricingAndBackofficeUserEndpoints1767200000000
  implements MigrationInterface
{
  name = 'AddSalePricingAndBackofficeUserEndpoints1767200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales" ADD "subtotal" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD "discount" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD "tax" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "tax"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "discount"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "subtotal"`);
  }
}
