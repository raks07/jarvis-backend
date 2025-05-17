import { IsNotEmpty, IsString, IsEnum, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IngestionStatus } from "../enums/ingestion-status.enum";

export class UpdateIngestionStatusDto {
  @ApiProperty({ description: "External ID of the document", example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsNotEmpty()
  @IsString()
  externalId: string;

  @ApiProperty({ description: "Status of the ingestion", enum: IngestionStatus, example: IngestionStatus.COMPLETED })
  @IsNotEmpty()
  @IsEnum(IngestionStatus)
  status: IngestionStatus;

  @ApiProperty({ description: "Error message (if status is FAILED)", required: false, example: "Failed to process document" })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiProperty({ description: "Number of chunks processed", required: false, example: 10 })
  @IsOptional()
  chunksProcessed?: number;

  @ApiProperty({ description: "Total number of chunks", required: false, example: 10 })
  @IsOptional()
  totalChunks?: number;
}
