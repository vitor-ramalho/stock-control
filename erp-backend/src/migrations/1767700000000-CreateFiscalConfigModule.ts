import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateFiscalConfigModule1767700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'establishments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'tenantId', type: 'uuid' },
          { name: 'legalName', type: 'varchar', length: '200' },
          { name: 'tradeName', type: 'varchar', length: '200', isNullable: true },
          { name: 'cnpj', type: 'varchar', length: '14' },
          { name: 'legalNature', type: 'varchar', length: '100', isNullable: true },
          { name: 'cnaeMain', type: 'varchar', length: '10', isNullable: true },
          { name: 'cnaeSecondary', type: 'text', isNullable: true },
          { name: 'street', type: 'varchar', length: '255', isNullable: true },
          { name: 'number', type: 'varchar', length: '30', isNullable: true },
          { name: 'complement', type: 'varchar', length: '120', isNullable: true },
          { name: 'neighborhood', type: 'varchar', length: '120', isNullable: true },
          { name: 'zipCode', type: 'varchar', length: '10', isNullable: true },
          { name: 'cityName', type: 'varchar', length: '120', isNullable: true },
          { name: 'stateCode', type: 'varchar', length: '2', isNullable: true },
          { name: 'cityIbgeCode', type: 'varchar', length: '7', isNullable: true },
          { name: 'countryCode', type: 'varchar', length: '4', isNullable: true },
          { name: 'contactEmail', type: 'varchar', length: '150', isNullable: true },
          { name: 'contactPhone', type: 'varchar', length: '30', isNullable: true },
          {
            name: 'registrationStatus',
            type: 'varchar',
            length: '80',
            isNullable: true,
          },
          { name: 'registrationStatusUpdatedAt', type: 'timestamp', isNullable: true },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'establishments',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'establishments',
      new TableIndex({
        name: 'IDX_ESTABLISHMENTS_TENANT',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'establishments',
      new TableIndex({
        name: 'UQ_ESTABLISHMENTS_TENANT_CNPJ',
        columnNames: ['tenantId', 'cnpj'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'establishment_fiscal_profiles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'tenantId', type: 'uuid' },
          { name: 'establishmentId', type: 'uuid' },
          {
            name: 'documentModel',
            type: 'enum',
            enum: ['NFE_55', 'NFCE_65'],
          },
          {
            name: 'environment',
            type: 'enum',
            enum: ['HOMOLOGATION', 'PRODUCTION'],
          },
          {
            name: 'icmsTaxpayerIndicator',
            type: 'enum',
            enum: ['TAXPAYER', 'EXEMPT', 'NON_TAXPAYER'],
            isNullable: true,
          },
          {
            name: 'taxRegime',
            type: 'enum',
            enum: [
              'SIMPLE_NACIONAL',
              'SIMPLE_NACIONAL_EXCESS_REVENUE',
              'NORMAL_REGIME',
            ],
            isNullable: true,
          },
          { name: 'stateRegistration', type: 'varchar', length: '20', isNullable: true },
          { name: 'stateCode', type: 'varchar', length: '2', isNullable: true },
          { name: 'cityIbgeCode', type: 'varchar', length: '7', isNullable: true },
          { name: 'isEnabled', type: 'boolean', default: false },
          { name: 'accreditationReported', type: 'boolean', default: false },
          { name: 'accreditationVerified', type: 'boolean', default: false },
          { name: 'lastFiscalValidationAt', type: 'timestamp', isNullable: true },
          {
            name: 'internalStatus',
            type: 'enum',
            enum: [
              'INCOMPLETE',
              'PENDING_REVIEW',
              'READY_FOR_HOMOLOGATION',
              'HOMOLOGATION_IN_PROGRESS',
              'READY_FOR_PRODUCTION',
              'BLOCKED',
            ],
            default: "'INCOMPLETE'",
          },
          { name: 'blockingReasons', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('establishment_fiscal_profiles', [
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['establishmentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'establishments',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createIndex(
      'establishment_fiscal_profiles',
      new TableIndex({
        name: 'UQ_FISCAL_PROFILE_EST_MODEL_ENV',
        columnNames: ['establishmentId', 'documentModel', 'environment'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'fiscal_series_controls',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'tenantId', type: 'uuid' },
          { name: 'establishmentId', type: 'uuid' },
          {
            name: 'documentModel',
            type: 'enum',
            enum: ['NFE_55', 'NFCE_65'],
          },
          {
            name: 'environment',
            type: 'enum',
            enum: ['HOMOLOGATION', 'PRODUCTION'],
          },
          { name: 'series', type: 'int' },
          { name: 'nextNumber', type: 'bigint', default: 1 },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('fiscal_series_controls', [
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['establishmentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'establishments',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createIndex(
      'fiscal_series_controls',
      new TableIndex({
        name: 'UQ_SERIES_EST_MODEL_ENV_SERIES',
        columnNames: ['establishmentId', 'documentModel', 'environment', 'series'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'digital_certificates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'tenantId', type: 'uuid' },
          { name: 'establishmentId', type: 'uuid' },
          { name: 'certificateType', type: 'enum', enum: ['A1', 'A3'] },
          { name: 'holderName', type: 'varchar', length: '200' },
          { name: 'holderCnpj', type: 'varchar', length: '14', isNullable: true },
          { name: 'issuer', type: 'varchar', length: '200', isNullable: true },
          { name: 'validFrom', type: 'date', isNullable: true },
          { name: 'validTo', type: 'date', isNullable: true },
          { name: 'secureFileRef', type: 'varchar', length: '500' },
          { name: 'encryptedPassphrase', type: 'text' },
          {
            name: 'validationStatus',
            type: 'enum',
            enum: ['NOT_VALIDATED', 'VALID', 'INVALID', 'EXPIRED'],
            default: "'NOT_VALIDATED'",
          },
          { name: 'lastVerifiedAt', type: 'timestamp', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'NOT_CONFIGURED',
              'CONFIGURED',
              'PENDING_VALIDATION',
              'VALIDATED',
              'INVALID',
              'REPLACED',
            ],
            default: "'PENDING_VALIDATION'",
          },
          { name: 'configuredByUserId', type: 'uuid' },
          { name: 'isCurrent', type: 'boolean', default: true },
          { name: 'replacedAt', type: 'timestamp', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('digital_certificates', [
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['establishmentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'establishments',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['configuredByUserId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'nfce_csc_configs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'tenantId', type: 'uuid' },
          { name: 'establishmentId', type: 'uuid' },
          { name: 'cscId', type: 'varchar', length: '80' },
          { name: 'encryptedCsc', type: 'text' },
          {
            name: 'environment',
            type: 'enum',
            enum: ['HOMOLOGATION', 'PRODUCTION'],
          },
          {
            name: 'validationStatus',
            type: 'enum',
            enum: ['NOT_VALIDATED', 'VALID', 'INVALID', 'EXPIRED'],
            default: "'NOT_VALIDATED'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'NOT_CONFIGURED',
              'CONFIGURED',
              'PENDING_VALIDATION',
              'VALIDATED',
              'INVALID',
              'REPLACED',
            ],
            default: "'PENDING_VALIDATION'",
          },
          { name: 'configuredAt', type: 'timestamp', isNullable: true },
          { name: 'lastValidatedAt', type: 'timestamp', isNullable: true },
          { name: 'configuredByUserId', type: 'uuid' },
          { name: 'isCurrent', type: 'boolean', default: true },
          { name: 'replacedAt', type: 'timestamp', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('nfce_csc_configs', [
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['establishmentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'establishments',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['configuredByUserId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'fiscal_readiness_reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'tenantId', type: 'uuid' },
          { name: 'establishmentId', type: 'uuid' },
          {
            name: 'documentModel',
            type: 'enum',
            enum: ['NFE_55', 'NFCE_65'],
          },
          {
            name: 'environment',
            type: 'enum',
            enum: ['HOMOLOGATION', 'PRODUCTION'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'INCOMPLETE',
              'PENDING_REVIEW',
              'READY_FOR_HOMOLOGATION',
              'HOMOLOGATION_IN_PROGRESS',
              'READY_FOR_PRODUCTION',
              'BLOCKED',
            ],
            default: "'INCOMPLETE'",
          },
          { name: 'pendingItems', type: 'text' },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'reviewedByUserId', type: 'uuid' },
          { name: 'reviewedAt', type: 'timestamp' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('fiscal_readiness_reviews', [
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['establishmentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'establishments',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['reviewedByUserId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'fiscal_attachments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'tenantId', type: 'uuid' },
          { name: 'establishmentId', type: 'uuid' },
          {
            name: 'attachmentType',
            type: 'enum',
            enum: [
              'COMPANY_REGISTRATION',
              'STATE_REGISTRATION_PROOF',
              'MUNICIPAL_REGISTRATION_PROOF',
              'CREDENCIAMENTO_EVIDENCE',
              'CERTIFICATE_OWNERSHIP',
              'OTHER',
            ],
          },
          { name: 'originalFileName', type: 'varchar', length: '255' },
          { name: 'storageKey', type: 'varchar', length: '255' },
          { name: 'mimeType', type: 'varchar', length: '120', isNullable: true },
          { name: 'fileSize', type: 'bigint', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'uploadedByUserId', type: 'uuid' },
          { name: 'uploadedAt', type: 'timestamp' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('fiscal_attachments', [
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['establishmentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'establishments',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['uploadedByUserId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'fiscal_audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'tenantId', type: 'uuid' },
          { name: 'establishmentId', type: 'uuid' },
          {
            name: 'action',
            type: 'enum',
            enum: [
              'ESTABLISHMENT_CREATED',
              'ESTABLISHMENT_UPDATED',
              'FISCAL_PROFILE_UPDATED',
              'SERIES_UPDATED',
              'CERTIFICATE_REPLACED',
              'CSC_REPLACED',
              'READINESS_REVIEWED',
              'ATTACHMENT_UPLOADED',
            ],
          },
          { name: 'actorUserId', type: 'uuid' },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('fiscal_audit_logs', [
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['establishmentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'establishments',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['actorUserId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    ]);

    await queryRunner.createIndex(
      'fiscal_audit_logs',
      new TableIndex({
        name: 'IDX_FISCAL_AUDIT_TENANT',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'fiscal_audit_logs',
      new TableIndex({
        name: 'IDX_FISCAL_AUDIT_EST',
        columnNames: ['establishmentId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('fiscal_audit_logs');
    await queryRunner.dropTable('fiscal_attachments');
    await queryRunner.dropTable('fiscal_readiness_reviews');
    await queryRunner.dropTable('nfce_csc_configs');
    await queryRunner.dropTable('digital_certificates');
    await queryRunner.dropTable('fiscal_series_controls');
    await queryRunner.dropTable('establishment_fiscal_profiles');
    await queryRunner.dropTable('establishments');
  }
}
