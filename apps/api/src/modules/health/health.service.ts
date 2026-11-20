import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface HealthIndicatorResult {
  status: string;
  message?: string;
}

export interface HealthCheckResponse {
  status: string;
  database: HealthIndicatorResult;
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthCheckResponse> {
    let database: HealthIndicatorResult = { status: 'up' };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      database = {
        status: 'down',
        message: error instanceof Error ? error.message : String(error),
      };
    }

    const status = database.status === 'up' ? 'up' : 'down';

    return { status, database };
  }
}
