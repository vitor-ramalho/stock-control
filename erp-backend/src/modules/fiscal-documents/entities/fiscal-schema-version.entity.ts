import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FiscalDocumentModel, FiscalEnvironment } from '../../fiscal-config/enums/fiscal.enums';

@Entity('fiscal_schema_versions')
@Index('IDX_FISCAL_SCHEMA_MODEL_ENV', ['documentModel', 'environment'])
export class FiscalSchemaVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: FiscalDocumentModel,
  })
  documentModel: FiscalDocumentModel;

  @Column({
    type: 'enum',
    enum: FiscalEnvironment,
  })
  environment: FiscalEnvironment;

  @Column({ type: 'varchar', length: 20 })
  schemaVersion: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  technicalNoteVersion: string | null;

  @Column({ type: 'timestamp', nullable: true })
  activeFrom: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  activeTo: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
