import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { DeviceRepository } from '../domain/device.repository';

@Injectable()
export class PrismaDeviceRepository implements DeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTokens() {
    const devices = await this.prisma.device.findMany({ orderBy: { id: 'asc' }, select: { fcmToken: true } });
    return devices.map(({ fcmToken }) => fcmToken);
  }

  findByToken(token: string) {
    return this.prisma.device.findUnique({ where: { fcmToken: token }, select: { id: true } });
  }

  async create(token: string) {
    const now = new Date();
    return this.prisma.device.create({ data: { fcmToken: token, platform: 'web', createdAt: now, updatedAt: now }, select: { id: true } });
  }

  async update(id: bigint) {
    return this.prisma.device.update({ where: { id }, data: { platform: 'web', updatedAt: new Date() }, select: { id: true } });
  }

  async remove(id: bigint) {
    await this.prisma.device.delete({ where: { id } });
  }
}
