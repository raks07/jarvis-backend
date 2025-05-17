import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Document } from "../../documents/entities/document.entity";
import { IngestionStatus } from "../enums/ingestion-status.enum";

@Entity("ingestions")
export class Ingestion {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Document, (document) => document.ingestions)
  @JoinColumn({ name: "document_id" })
  document: Document;

  @Column({ name: "document_id" })
  documentId: string;

  @Column({
    type: "enum",
    enum: IngestionStatus,
    default: IngestionStatus.PENDING,
  })
  status: IngestionStatus;

  @CreateDateColumn({ name: "started_at" })
  startedAt: Date;

  @Column({ name: "completed_at", nullable: true })
  completedAt: Date;

  @Column({ name: "error_message", nullable: true, type: "text" })
  errorMessage: string;

  @Column({ name: "metadata", nullable: true, type: "jsonb", default: "{}" })
  metadata: Record<string, any>;
}
