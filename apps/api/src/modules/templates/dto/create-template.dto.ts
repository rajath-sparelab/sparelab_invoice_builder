import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  documentType!: string;

  @IsObject()
  @IsNotEmpty()
  configuration!: Record<string, unknown>;

  @IsString()
  @IsOptional()
  createdBy?: string;
}
