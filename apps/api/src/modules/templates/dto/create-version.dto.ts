import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateVersionDto {
  @IsObject()
  @IsNotEmpty()
  configuration!: Record<string, unknown>;

  @IsString()
  @IsOptional()
  schemaVersion?: string;

  @IsString()
  @IsOptional()
  createdBy?: string;
}
