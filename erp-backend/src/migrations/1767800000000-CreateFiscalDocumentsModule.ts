import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFiscalDocumentsModule1767800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE fiscal_document_state_enum AS ENUM (
          'PREPARED',
          'QUEUED',
          'TRANSMITTING',
          'UNKNOWN_RESULT',
          'AUTHORIZED',
          'REJECTED',
          'CONTINGENCY',
          'CANCEL_REQUESTED',
          'CANCELED',
          'VOID_REQUESTED',
          'VOIDED',
          'TECHNICAL_FAILURE'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE fiscal_emission_mode_enum AS ENUM (
          'NORMAL',
          'CONTINGENCY'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE fiscal_processing_status_enum AS ENUM (
          'PENDING',
          'PROCESSING',
          'PROCESSED',
          'FAILED',
          'REQUIRES_MANUAL_ACTION'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE fiscal_operation_type_enum AS ENUM (
          'EMIT',
          'CANCEL',
          'VOID',
          'QUERY'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE fiscal_event_type_enum AS ENUM (
          'EMISSION_REQUESTED',
          'CANCEL_REQUESTED',
          'VOID_REQUESTED',
          'TRANSMISSION_RESULT'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS fiscal_documents (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "establishmentId" uuid NOT NULL,
        "saleId" uuid NULL,
        "documentModel" establishment_fiscal_profiles_documentmodel_enum NOT NULL,
        environment establishment_fiscal_profiles_environment_enum NOT NULL,
        series integer NOT NULL,
        number bigint NOT NULL,
        "accessKey" varchar(44) NULL,
        state fiscal_document_state_enum NOT NULL,
        "emissionMode" fiscal_emission_mode_enum NOT NULL DEFAULT 'NORMAL',
        "schemaVersion" varchar(20) NOT NULL,
        "totalsSnapshot" jsonb NULL,
        "generatedXml" text NULL,
        "signedXml" text NULL,
        "authorizedXml" text NULL,
        "protocolNumber" varchar(30) NULL,
        "rejectionCode" varchar(10) NULL,
        "rejectionReason" text NULL,
        "queuedAt" timestamp NULL,
        "transmittedAt" timestamp NULL,
        "responseAt" timestamp NULL,
        "authorizedAt" timestamp NULL,
        "createdByUserId" uuid NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_FISCAL_DOCUMENT_NUMBER" UNIQUE (
          "tenantId",
          "establishmentId",
          "documentModel",
          environment,
          series,
          number
        )
      );
    `);

    await queryRunner.query(`
      ALTER TABLE fiscal_documents
      ADD CONSTRAINT "FK_FISCAL_DOCUMENT_TENANT"
      FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE fiscal_documents
      ADD CONSTRAINT "FK_FISCAL_DOCUMENT_ESTABLISHMENT"
      FOREIGN KEY ("establishmentId") REFERENCES establishments(id) ON DELETE RESTRICT;
    `);
    await queryRunner.query(`
      ALTER TABLE fiscal_documents
      ADD CONSTRAINT "FK_FISCAL_DOCUMENT_SALE"
      FOREIGN KEY ("saleId") REFERENCES sales(id) ON DELETE SET NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE fiscal_documents
      ADD CONSTRAINT "FK_FISCAL_DOCUMENT_CREATED_BY"
      FOREIGN KEY ("createdByUserId") REFERENCES users(id) ON DELETE RESTRICT;
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_FISCAL_DOCUMENT_TENANT" ON fiscal_documents ("tenantId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_FISCAL_DOCUMENT_ESTABLISHMENT" ON fiscal_documents ("establishmentId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_FISCAL_DOCUMENT_SALE" ON fiscal_documents ("saleId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_FISCAL_DOCUMENT_STATE" ON fiscal_documents (state)',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS fiscal_document_items (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "fiscalDocumentId" uuid NOT NULL,
        "saleItemId" uuid NULL,
        "productId" uuid NULL,
        "lineNumber" integer NOT NULL,
        description varchar(255) NOT NULL,
        ncm varchar(8) NULL,
        cfop varchar(4) NULL,
        cest varchar(7) NULL,
        quantity decimal(14,4) NOT NULL,
        "unitPrice" decimal(14,4) NOT NULL,
        "grossTotal" decimal(14,2) NOT NULL,
        "discountTotal" decimal(14,2) NOT NULL DEFAULT 0,
        "taxSnapshot" jsonb NULL,
        "createdAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      ALTER TABLE fiscal_document_items
      ADD CONSTRAINT "FK_FISCAL_DOCUMENT_ITEM_TENANT"
      FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE fiscal_document_items
      ADD CONSTRAINT "FK_FISCAL_DOCUMENT_ITEM_DOCUMENT"
      FOREIGN KEY ("fiscalDocumentId") REFERENCES fiscal_documents(id) ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE fiscal_document_items
      ADD CONSTRAINT "FK_FISCAL_DOCUMENT_ITEM_SALE_ITEM"
      FOREIGN KEY ("saleItemId") REFERENCES sale_items(id) ON DELETE SET NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE fiscal_document_items
      ADD CONSTRAINT "FK_FISCAL_DOCUMENT_ITEM_PRODUCT"
      FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE SET NULL;
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_FISCAL_DOCUMENT_ITEM_TENANT" ON fiscal_document_items ("tenantId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_FISCAL_DOCUMENT_ITEM_DOCUMENT" ON fiscal_document_items ("fiscalDocumentId")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS fiscal_state_history (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "fiscalDocumentId" uuid NOT NULL,
        "fromState" fiscal_document_state_enum NULL,
        "toState" fiscal_document_state_enum NOT NULL,
        reason text NOT NULL,
        metadata jsonb NULL,
        "createdByUserId" uuid NULL,
        "createdAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      ALTER TABLE fiscal_state_history
      ADD CONSTRAINT "FK_FISCAL_STATE_HISTORY_TENANT"
      FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE fiscal_state_history
      ADD CONSTRAINT "FK_FISCAL_STATE_HISTORY_DOCUMENT"
      FOREIGN KEY ("fiscalDocumentId") REFERENCES fiscal_documents(id) ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE fiscal_state_history
      ADD CONSTRAINT "FK_FISCAL_STATE_HISTORY_CREATED_BY"
      FOREIGN KEY ("createdByUserId") REFERENCES users(id) ON DELETE SET NULL;
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_FISCAL_STATE_HISTORY_TENANT" ON fiscal_state_history ("tenantId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_FISCAL_STATE_HISTORY_DOCUMENT" ON fiscal_state_history ("fiscalDocumentId")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS fiscal_events (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "fiscalDocumentId" uuid NOT NULL,
        "eventType" fiscal_event_type_enum NOT NULL,
        payload jsonb NULL,
        status fiscal_processing_status_enum NOT NULL DEFAULT 'PENDING',
        "createdAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      ALTER TABLE fiscal_events
      ADD CONSTRAINT "FK_FISCAL_EVENT_TENANT"
      FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE fiscal_events
      ADD CONSTRAINT "FK_FISCAL_EVENT_DOCUMENT"
      FOREIGN KEY ("fiscalDocumentId") REFERENCES fiscal_documents(id) ON DELETE CASCADE;
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_FISCAL_EVENT_TENANT" ON fiscal_events ("tenantId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_FISCAL_EVENT_DOCUMENT" ON fiscal_events ("fiscalDocumentId")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS fiscal_transmission_attempts (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "fiscalDocumentId" uuid NOT NULL,
        operation fiscal_operation_type_enum NOT NULL,
        endpoint varchar(255) NULL,
        "transportStatus" varchar(50) NULL,
        "fiscalStatusCode" varchar(10) NULL,
        "fiscalReason" text NULL,
        "rawResponse" text NULL,
        "errorClass" text NULL,
        "errorMessage" text NULL,
        "createdAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      ALTER TABLE fiscal_transmission_attempts
      ADD CONSTRAINT "FK_FISCAL_ATTEMPT_TENANT"
      FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE fiscal_transmission_attempts
      ADD CONSTRAINT "FK_FISCAL_ATTEMPT_DOCUMENT"
      FOREIGN KEY ("fiscalDocumentId") REFERENCES fiscal_documents(id) ON DELETE CASCADE;
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_FISCAL_ATTEMPT_TENANT" ON fiscal_transmission_attempts ("tenantId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_FISCAL_ATTEMPT_DOCUMENT" ON fiscal_transmission_attempts ("fiscalDocumentId")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS fiscal_processing_queue (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "aggregateType" varchar(80) NOT NULL,
        "aggregateId" uuid NOT NULL,
        operation fiscal_operation_type_enum NOT NULL,
        payload jsonb NOT NULL,
        status fiscal_processing_status_enum NOT NULL DEFAULT 'PENDING',
        attempts integer NOT NULL DEFAULT 0,
        "nextAttemptAt" timestamp NOT NULL,
        "lockedAt" timestamp NULL,
        "lockToken" varchar(120) NULL,
        "processedAt" timestamp NULL,
        "lastError" text NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_FISCAL_QUEUE_STATUS_NEXT_ATTEMPT" ON fiscal_processing_queue (status, "nextAttemptAt")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_FISCAL_QUEUE_TENANT" ON fiscal_processing_queue ("tenantId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_FISCAL_QUEUE_AGGREGATE" ON fiscal_processing_queue ("aggregateType", "aggregateId")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS fiscal_idempotency_keys (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "establishmentId" uuid NOT NULL,
        operation fiscal_operation_type_enum NOT NULL,
        key varchar(120) NOT NULL,
        "fiscalDocumentId" uuid NULL,
        "expiresAt" timestamp NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_FISCAL_IDEMPOTENCY_SCOPE" UNIQUE ("tenantId", "establishmentId", operation, key)
      );
    `);

    await queryRunner.query(`
      ALTER TABLE fiscal_idempotency_keys
      ADD CONSTRAINT "FK_FISCAL_IDEMPOTENCY_TENANT"
      FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE fiscal_idempotency_keys
      ADD CONSTRAINT "FK_FISCAL_IDEMPOTENCY_EST"
      FOREIGN KEY ("establishmentId") REFERENCES establishments(id) ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE fiscal_idempotency_keys
      ADD CONSTRAINT "FK_FISCAL_IDEMPOTENCY_DOC"
      FOREIGN KEY ("fiscalDocumentId") REFERENCES fiscal_documents(id) ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS fiscal_schema_versions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "documentModel" establishment_fiscal_profiles_documentmodel_enum NOT NULL,
        environment establishment_fiscal_profiles_environment_enum NOT NULL,
        "schemaVersion" varchar(20) NOT NULL,
        "technicalNoteVersion" varchar(30) NULL,
        "activeFrom" timestamp NULL,
        "activeTo" timestamp NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_FISCAL_SCHEMA_MODEL_ENV" ON fiscal_schema_versions ("documentModel", environment)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS fiscal_schema_versions');

    await queryRunner.query(
      'ALTER TABLE fiscal_idempotency_keys DROP CONSTRAINT IF EXISTS "FK_FISCAL_IDEMPOTENCY_DOC"',
    );
    await queryRunner.query(
      'ALTER TABLE fiscal_idempotency_keys DROP CONSTRAINT IF EXISTS "FK_FISCAL_IDEMPOTENCY_EST"',
    );
    await queryRunner.query(
      'ALTER TABLE fiscal_idempotency_keys DROP CONSTRAINT IF EXISTS "FK_FISCAL_IDEMPOTENCY_TENANT"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS fiscal_idempotency_keys');

    await queryRunner.query('DROP TABLE IF EXISTS fiscal_processing_queue');

    await queryRunner.query(
      'ALTER TABLE fiscal_transmission_attempts DROP CONSTRAINT IF EXISTS "FK_FISCAL_ATTEMPT_DOCUMENT"',
    );
    await queryRunner.query(
      'ALTER TABLE fiscal_transmission_attempts DROP CONSTRAINT IF EXISTS "FK_FISCAL_ATTEMPT_TENANT"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS fiscal_transmission_attempts');

    await queryRunner.query('ALTER TABLE fiscal_events DROP CONSTRAINT IF EXISTS "FK_FISCAL_EVENT_DOCUMENT"');
    await queryRunner.query('ALTER TABLE fiscal_events DROP CONSTRAINT IF EXISTS "FK_FISCAL_EVENT_TENANT"');
    await queryRunner.query('DROP TABLE IF EXISTS fiscal_events');

    await queryRunner.query(
      'ALTER TABLE fiscal_state_history DROP CONSTRAINT IF EXISTS "FK_FISCAL_STATE_HISTORY_CREATED_BY"',
    );
    await queryRunner.query(
      'ALTER TABLE fiscal_state_history DROP CONSTRAINT IF EXISTS "FK_FISCAL_STATE_HISTORY_DOCUMENT"',
    );
    await queryRunner.query(
      'ALTER TABLE fiscal_state_history DROP CONSTRAINT IF EXISTS "FK_FISCAL_STATE_HISTORY_TENANT"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS fiscal_state_history');

    await queryRunner.query(
      'ALTER TABLE fiscal_document_items DROP CONSTRAINT IF EXISTS "FK_FISCAL_DOCUMENT_ITEM_PRODUCT"',
    );
    await queryRunner.query(
      'ALTER TABLE fiscal_document_items DROP CONSTRAINT IF EXISTS "FK_FISCAL_DOCUMENT_ITEM_SALE_ITEM"',
    );
    await queryRunner.query(
      'ALTER TABLE fiscal_document_items DROP CONSTRAINT IF EXISTS "FK_FISCAL_DOCUMENT_ITEM_DOCUMENT"',
    );
    await queryRunner.query(
      'ALTER TABLE fiscal_document_items DROP CONSTRAINT IF EXISTS "FK_FISCAL_DOCUMENT_ITEM_TENANT"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS fiscal_document_items');

    await queryRunner.query('ALTER TABLE fiscal_documents DROP CONSTRAINT IF EXISTS "FK_FISCAL_DOCUMENT_CREATED_BY"');
    await queryRunner.query('ALTER TABLE fiscal_documents DROP CONSTRAINT IF EXISTS "FK_FISCAL_DOCUMENT_SALE"');
    await queryRunner.query(
      'ALTER TABLE fiscal_documents DROP CONSTRAINT IF EXISTS "FK_FISCAL_DOCUMENT_ESTABLISHMENT"',
    );
    await queryRunner.query('ALTER TABLE fiscal_documents DROP CONSTRAINT IF EXISTS "FK_FISCAL_DOCUMENT_TENANT"');
    await queryRunner.query('DROP TABLE IF EXISTS fiscal_documents');

    await queryRunner.query('DROP TYPE IF EXISTS fiscal_event_type_enum');
    await queryRunner.query('DROP TYPE IF EXISTS fiscal_operation_type_enum');
    await queryRunner.query('DROP TYPE IF EXISTS fiscal_processing_status_enum');
    await queryRunner.query('DROP TYPE IF EXISTS fiscal_emission_mode_enum');
    await queryRunner.query('DROP TYPE IF EXISTS fiscal_document_state_enum');
  }
}
