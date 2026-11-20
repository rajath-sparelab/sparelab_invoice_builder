import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  templateVersionId!: string;

  @IsString()
  @IsNotEmpty()
  documentType!: string;

  @IsObject()
  @IsNotEmpty()
  data!: Record<string, unknown>;

  @IsString()
  @IsOptional()
  externalReferenceId?: string;

  @IsString()
  @IsOptional()
  createdBy?: string;
}
