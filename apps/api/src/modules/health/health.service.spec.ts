import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reports database up when the connection query succeeds', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]) };
    const service = new HealthService(prisma as any);

    const result = await service.check();

    expect(result.status).toBe('up');
    expect(result.database.status).toBe('up');
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('reports database down when the connection query fails', async () => {
    const error = new Error('connection refused');
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(error) };
    const service = new HealthService(prisma as any);

    const result = await service.check();

    expect(result.status).toBe('down');
    expect(result.database.status).toBe('down');
    expect(result.database.message).toBe('connection refused');
  });
});
