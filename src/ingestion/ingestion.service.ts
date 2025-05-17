import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

import { Ingestion } from "./entities/ingestion.entity";
import { CreateIngestionDto } from "./dto/create-ingestion.dto";
import { DocumentsService } from "../documents/documents.service";
import { IngestionStatus } from "./enums/ingestion-status.enum";

@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(Ingestion)
    private ingestionRepository: Repository<Ingestion>,
    private documentsService: DocumentsService,
    private httpService: HttpService,
    private configService: ConfigService
  ) {}

  async create(createIngestionDto: CreateIngestionDto): Promise<Ingestion> {
    // Check if document exists
    const document = await this.documentsService.findOne(createIngestionDto.documentId);

    // Check if there's already an ingestion in progress
    const existingIngestion = await this.ingestionRepository.findOne({
      where: {
        documentId: document.id,
        status: IngestionStatus.PENDING || IngestionStatus.PROCESSING,
      },
    });

    if (existingIngestion) {
      throw new BadRequestException("Document is already being ingested");
    }

    // Create ingestion record
    const ingestion = this.ingestionRepository.create({
      documentId: document.id,
      status: IngestionStatus.PENDING,
    });

    await this.ingestionRepository.save(ingestion);

    // Trigger ingestion in Python backend
    this.triggerPythonIngestion(ingestion.id, document);

    return ingestion;
  }

  private async triggerPythonIngestion(ingestionId: string, document: any): Promise<void> {
    const pythonBackendUrl = this.configService.get("PYTHON_BACKEND_URL") || "http://localhost:8000";
    const nestjsBaseUrl = this.configService.get("NESTJS_BASE_URL") || "http://localhost:3000";

    // Get document content
    const content = await this.documentsService.getDocumentContent(document.id);

    try {
      console.log(`Sending document ${document.id} to Python backend for ingestion...`);

      // Send to Python backend
      await firstValueFrom(
        this.httpService.post(`${pythonBackendUrl}/api/v1/ingestion`, {
          external_id: document.id,
          title: document.title,
          description: document.description || "",
          content: content.toString("utf8"),
          callback_url: `${nestjsBaseUrl}/ingestion/webhook/status`,
        })
      );

      console.log(`Document ${document.id} successfully sent to Python backend`);

      // Update ingestion status to processing
      await this.ingestionRepository.update(ingestionId, {
        status: IngestionStatus.PROCESSING,
      });
    } catch (error) {
      console.error(`Failed to trigger ingestion for document ${document.id}: ${error.message}`);

      // Update ingestion status to failed
      await this.ingestionRepository.update(ingestionId, {
        status: IngestionStatus.FAILED,
        errorMessage: `Failed to trigger ingestion: ${error.message}`,
      });
    }
  }

  async findAll(): Promise<Ingestion[]> {
    return this.ingestionRepository.find({
      relations: ["document"],
    });
  }

  async findOne(id: string): Promise<Ingestion> {
    const ingestion = await this.ingestionRepository.findOne({
      where: { id },
      relations: ["document"],
    });

    if (!ingestion) {
      throw new NotFoundException(`Ingestion with ID ${id} not found`);
    }

    return ingestion;
  }

  async findByDocumentId(documentId: string): Promise<Ingestion[]> {
    return this.ingestionRepository.find({
      where: { documentId },
      relations: ["document"],
      order: { startedAt: "DESC" },
    });
  }

  async updateStatus(id: string, status: IngestionStatus, errorMessage?: string): Promise<Ingestion> {
    const ingestion = await this.findOne(id);

    ingestion.status = status;

    if (status === IngestionStatus.COMPLETED) {
      ingestion.completedAt = new Date();
    } else if (status === IngestionStatus.FAILED && errorMessage) {
      ingestion.errorMessage = errorMessage;
    }

    return this.ingestionRepository.save(ingestion);
  }

  async remove(id: string): Promise<void> {
    const ingestion = await this.findOne(id);

    // Only allow cancellation if status is pending or processing
    if (ingestion.status !== IngestionStatus.PENDING && ingestion.status !== IngestionStatus.PROCESSING) {
      throw new BadRequestException("Can only cancel pending or processing ingestions");
    }

    const pythonBackendUrl = this.configService.get("PYTHON_BACKEND_URL") || "http://localhost:8000";

    try {
      // Try to cancel the ingestion in the Python backend
      await firstValueFrom(this.httpService.delete(`${pythonBackendUrl}/api/v1/ingestion/${ingestion.documentId}`));
      console.log(`Sent cancellation request to Python backend for document ${ingestion.documentId}`);
    } catch (error) {
      console.error(`Failed to cancel ingestion in Python backend: ${error.message}`);
      // Continue with marking as failed even if the cancellation request fails
    }

    // Mark as failed with cancellation message
    ingestion.status = IngestionStatus.FAILED;
    ingestion.errorMessage = "Cancelled by user";
    await this.ingestionRepository.save(ingestion);
  }

  async updateStatusFromWebhook(updateStatusDto: any): Promise<Ingestion> {
    const { externalId, status, errorMessage, chunksProcessed, totalChunks } = updateStatusDto;

    // Find the most recent ingestion for this document
    const ingestions = await this.findByDocumentId(externalId);

    if (!ingestions || ingestions.length === 0) {
      throw new NotFoundException(`No ingestion found for document ${externalId}`);
    }

    // Get the most recent ingestion (should be the first one because of ordering in findByDocumentId)
    const ingestion = ingestions[0];

    // Update the status
    ingestion.status = status;

    if (status === IngestionStatus.COMPLETED) {
      ingestion.completedAt = new Date();
    } else if (status === IngestionStatus.FAILED && errorMessage) {
      ingestion.errorMessage = errorMessage;
    }

    // Store additional metadata if provided
    if (chunksProcessed !== undefined || totalChunks !== undefined) {
      ingestion.metadata = ingestion.metadata || {};
      if (chunksProcessed !== undefined) ingestion.metadata.chunksProcessed = chunksProcessed;
      if (totalChunks !== undefined) ingestion.metadata.totalChunks = totalChunks;
    }

    return this.ingestionRepository.save(ingestion);
  }
}
