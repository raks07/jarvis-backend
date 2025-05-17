import { Controller, Get, Post, Body, Param, Delete, UseGuards, HttpCode } from "@nestjs/common";
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";

import { IngestionService } from "./ingestion.service";
import { CreateIngestionDto } from "./dto/create-ingestion.dto";
import { Ingestion } from "./entities/ingestion.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/enums/user-role.enum";
import { UpdateIngestionStatusDto } from "./dto/update-ingestion-status.dto";

@ApiTags("ingestion")
@Controller("ingestion")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: "Trigger document ingestion" })
  @ApiResponse({ status: 201, description: "Ingestion started", type: Ingestion })
  @ApiResponse({ status: 400, description: "Bad request" })
  create(@Body() createIngestionDto: CreateIngestionDto) {
    return this.ingestionService.create(createIngestionDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all ingestions" })
  @ApiResponse({ status: 200, description: "Return all ingestions", type: [Ingestion] })
  findAll() {
    return this.ingestionService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an ingestion by ID" })
  @ApiResponse({ status: 200, description: "Return the ingestion", type: Ingestion })
  @ApiResponse({ status: 404, description: "Ingestion not found" })
  findOne(@Param("id") id: string) {
    return this.ingestionService.findOne(id);
  }

  @Get("document/:documentId")
  @ApiOperation({ summary: "Get ingestions by document ID" })
  @ApiResponse({ status: 200, description: "Return ingestions for document", type: [Ingestion] })
  findByDocumentId(@Param("documentId") documentId: string) {
    return this.ingestionService.findByDocumentId(documentId);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: "Cancel an ingestion" })
  @ApiResponse({ status: 200, description: "Ingestion cancelled" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Ingestion not found" })
  remove(@Param("id") id: string) {
    return this.ingestionService.remove(id);
  }

  @Post("webhook/status")
  @HttpCode(200)
  @ApiOperation({ summary: "Webhook for Python backend to update ingestion status" })
  @ApiResponse({ status: 200, description: "Status updated successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Ingestion not found" })
  @ApiBody({ type: UpdateIngestionStatusDto })
  updateStatus(@Body() updateStatusDto: UpdateIngestionStatusDto) {
    return this.ingestionService.updateStatusFromWebhook(updateStatusDto);
  }
}
