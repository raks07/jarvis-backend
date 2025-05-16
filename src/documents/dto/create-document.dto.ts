import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Title of the document', example: 'Company Policy' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Description of the document', example: 'Company policy for employees', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  // File will be handled by NestJS FileInterceptor
}
