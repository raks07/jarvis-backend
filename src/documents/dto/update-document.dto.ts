import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDocumentDto {
  @ApiProperty({ description: 'Title of the document', example: 'Updated Company Policy', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Description of the document', example: 'Updated company policy for employees', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
