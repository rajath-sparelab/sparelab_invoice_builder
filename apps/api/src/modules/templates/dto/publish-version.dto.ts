import { IsString, IsOptional } from 'class-validator';

export class PublishVersionDto {
  @IsString()
  @IsOptional()
  createdBy?: string;
}
