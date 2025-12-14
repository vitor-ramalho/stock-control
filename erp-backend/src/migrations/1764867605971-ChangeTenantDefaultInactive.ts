import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeTenantDefaultInactive1764867605971 implements MigrationInterface {
    name = 'ChangeTenantDefaultInactive1764867605971'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c58f7e88c286e5e3478960a998b"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_46a85229c9953b2b94f768190b2"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_6804855ba1a19523ea57e0769b4"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_ff56834e735fa78a15d0cf21926"`);
        await queryRunner.query(`DROP INDEX "public"."idx_users_email_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."idx_categories_name_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_sku_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_barcode"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_name"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_STOCK_MOVEMENTS_TENANT"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_STOCK_MOVEMENTS_PRODUCT"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_STOCK_MOVEMENTS_TENANT_PRODUCT"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_STOCK_MOVEMENTS_CREATED_AT"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_CASH_REGISTERS_TENANT"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_CASH_REGISTERS_USER"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_CASH_REGISTERS_STATUS"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_CASH_REGISTERS_USER_TENANT_STATUS"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_SALE_ITEMS_TENANT"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_SALE_ITEMS_SALE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_SALE_ITEMS_PRODUCT"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_SALES_TENANT"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_SALES_CASH_REGISTER"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_SALES_STATUS"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_SALES_CREATED_AT"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_SALES_TENANT_STATUS"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_FINANCIAL_ENTRIES_TENANT"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_FINANCIAL_ENTRIES_CASH_REGISTER"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_FINANCIAL_ENTRIES_SALE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_FINANCIAL_ENTRIES_TYPE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_FINANCIAL_ENTRIES_CATEGORY"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_FINANCIAL_ENTRIES_CREATED_AT"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_c58f7e88c286e5e3478960a998b" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_46a85229c9953b2b94f768190b2" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_6804855ba1a19523ea57e0769b4" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_ff56834e735fa78a15d0cf21926"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_6804855ba1a19523ea57e0769b4"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_46a85229c9953b2b94f768190b2"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c58f7e88c286e5e3478960a998b"`);
        await queryRunner.query(`CREATE INDEX "IDX_FINANCIAL_ENTRIES_CREATED_AT" ON "financial_entries" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_FINANCIAL_ENTRIES_CATEGORY" ON "financial_entries" ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_FINANCIAL_ENTRIES_TYPE" ON "financial_entries" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_FINANCIAL_ENTRIES_SALE" ON "financial_entries" ("saleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_FINANCIAL_ENTRIES_CASH_REGISTER" ON "financial_entries" ("cashRegisterId") `);
        await queryRunner.query(`CREATE INDEX "IDX_FINANCIAL_ENTRIES_TENANT" ON "financial_entries" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_SALES_TENANT_STATUS" ON "sales" ("tenantId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_SALES_CREATED_AT" ON "sales" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_SALES_STATUS" ON "sales" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_SALES_CASH_REGISTER" ON "sales" ("cashRegisterId") `);
        await queryRunner.query(`CREATE INDEX "IDX_SALES_TENANT" ON "sales" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_SALE_ITEMS_PRODUCT" ON "sale_items" ("productId") `);
        await queryRunner.query(`CREATE INDEX "IDX_SALE_ITEMS_SALE" ON "sale_items" ("saleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_SALE_ITEMS_TENANT" ON "sale_items" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_CASH_REGISTERS_USER_TENANT_STATUS" ON "cash_registers" ("tenantId", "userId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_CASH_REGISTERS_STATUS" ON "cash_registers" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_CASH_REGISTERS_USER" ON "cash_registers" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_CASH_REGISTERS_TENANT" ON "cash_registers" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_STOCK_MOVEMENTS_CREATED_AT" ON "stock_movements" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_STOCK_MOVEMENTS_TENANT_PRODUCT" ON "stock_movements" ("tenantId", "productId") `);
        await queryRunner.query(`CREATE INDEX "IDX_STOCK_MOVEMENTS_PRODUCT" ON "stock_movements" ("productId") `);
        await queryRunner.query(`CREATE INDEX "IDX_STOCK_MOVEMENTS_TENANT" ON "stock_movements" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "idx_products_name" ON "products" ("name") `);
        await queryRunner.query(`CREATE INDEX "idx_products_barcode" ON "products" ("barcode") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_products_sku_tenant" ON "products" ("tenantId", "sku") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_categories_name_tenant" ON "categories" ("tenantId", "name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_users_email_tenant" ON "users" ("tenantId", "email") `);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_6804855ba1a19523ea57e0769b4" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_46a85229c9953b2b94f768190b2" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_c58f7e88c286e5e3478960a998b" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
