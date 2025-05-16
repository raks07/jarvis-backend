import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { Ingestion } from './entities/ingestion.entity';
import { CreateIngestionDto } from './dto/create-ingestion.dto';
import { DocumentsService } from '../documents/documents.service';
import { IngestionStatus } from './enums/ingestion-status.enum';

@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(Ingestion)
    private ingestionRepository: Repository<Ingestion>,
    private documentsService: DocumentsService,
    private httpService: HttpService,
    private configService: ConfigService,
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
      throw new BadRequestException('Document is already being ingested');
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
    const pythonBackendUrl = this.configService.get('PYTHON_BACKEND_URL');
    
    // Get document content
    const content = await this.documentsService.getDocumentContent(document.id);
    
    try {
      // Send to Python backend
      await firstValueFrom(
        this.httpService.post(`${pythonBackendUrl}/api/ingest`, {
          external_id: document.id,
          title: document.title,
          description: document.description,
          content: content.toString(),
        }),
      );
      
      // Update ingestion status to processing
      await this.ingestionRepository.update(ingestionId, {
        status: IngestionStatus.PROCESSING,
      });
    } catch (error) {
      // Update ingestion status to failed
      await this.ingestionRepository.update(ingestionId, {
        status: IngestionStatus.FAILED,
        errorMessage: error.message,
      });
      
      console.error(`Failed to trigger ingestion: ${error.message}`);
    }
  }

  async findAll(): Promise<Ingestion[]> {
    return this.ingestionRepository.find({
      relations: ['document'],
    });
  }

  async findOne(id: string): Promise<Ingestion> {
    const ingestion = await this.ingestionRepository.findOne({
      where: { id },
      relations: ['document'],
    });
    
    if (!ingestion) {
      throw new NotFoundException(`Ingestion with ID ${id} not found`);
    }
    
    return ingestion;
  }

  async findByDocumentId(documentId: string): Promise<Ingestion[]> {
    return this.ingestionRepository.find({
      where: { documentId },
      relations: ['document'],
      order: { startedAt: 'DESC' },
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
      throw new BadRequestException('Can only cancel pending or processing ingestions');
    }
    
    // TODO: Send cancellation request to Python backend if implemented
    
    // Mark as failed with cancellation message
    ingestion.status = IngestionStatus.FAILED;
    ingestion.errorMessage = 'Cancelled by user';
    await this.ingestionRepository.save(ingestion);
  }
}
