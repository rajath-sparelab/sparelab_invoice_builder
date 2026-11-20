import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export type AuditEventInput = {
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditEventInput) {
    return this.prisma.documentAuditEvent.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        actorId: input.actorId ?? undefined,
        metadata: input.metadata as any,
      },
    });
  }
}
