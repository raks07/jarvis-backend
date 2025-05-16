import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { User } from '../users/entities/user.entity';

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
  ) {}

  async create(createDocumentDto: CreateDocumentDto, file: Express.Multer.File, user: User): Promise<Document> {
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await mkdirAsync(uploadDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }

    // Generate unique filename
    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // Write file to disk
    await writeFileAsync(filePath, file.buffer);

    // Create document record
    const document = this.documentsRepository.create({
      title: createDocumentDto.title,
      description: createDocumentDto.description,
      filePath: uniqueFilename,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedById: user.id,
    });

    return this.documentsRepository.save(document);
  }

  async findAll(): Promise<Document[]> {
    return this.documentsRepository.find({
      relations: ['uploadedBy'],
    });
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    const document = await this.findOne(id);
    Object.assign(document, updateDocumentDto);
    return this.documentsRepository.save(document);
  }

  async remove(id: string): Promise<void> {
    const document = await this.findOne(id);
    
    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), 'uploads', document.filePath);
      await unlinkAsync(filePath);
    } catch (error) {
      console.error(`Failed to delete file: ${error.message}`);
      // Continue with document deletion even if file deletion fails
    }
    
    await this.documentsRepository.remove(document);
  }

  async getDocumentContent(id: string): Promise<Buffer> {
    const document = await this.findOne(id);
    const filePath = path.join(process.cwd(), 'uploads', document.filePath);
    
    try {
      return fs.readFileSync(filePath);
    } catch (error) {
      throw new NotFoundException(`Document file not found: ${error.message}`);
    }
  }
}
