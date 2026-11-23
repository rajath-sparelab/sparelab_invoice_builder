import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

type AuditClient = Pick<Prisma.TransactionClient, 'documentAuditEvent'>;

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

  async record(input: AuditEventInput, client: AuditClient = this.prisma) {
    return client.documentAuditEvent.create({
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
