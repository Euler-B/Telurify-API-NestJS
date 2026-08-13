import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Post, Res, UseGuards, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import type { Response } from 'express';
import { AdminTokenGuard } from './admin-token.guard';

@Controller('devices')
export class DevicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @UseGuards(AdminTokenGuard)
  async index(@Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    const devices = await this.prisma.device.findMany({ orderBy: { id: 'asc' }, select: { fcmToken: true } });
    return { data: devices.map(({ fcmToken }) => fcmToken) };
  }

  @Post()
  async create(@Body() body: { fcm_token?: string; platform?: string }, @Res({ passthrough: true }) response: Response) {
    const token = body.fcm_token;
    if (!token || token.length > 255 || /\s/.test(token) || (body.platform && body.platform !== 'web')) {
      throw new UnprocessableEntityException({ errors: ['Fcm token or platform is invalid'] });
    }
    const existing = await this.prisma.device.findUnique({ where: { fcmToken: token } });
    response.status(existing ? 200 : 201);
    const device = existing
      ? await this.prisma.device.update({ where: { id: existing.id }, data: { platform: 'web', updatedAt: new Date() } })
      : await this.prisma.device.create({ data: { fcmToken: token, platform: 'web', createdAt: new Date(), updatedAt: new Date() } });
    return { data: { id: Number(device.id), type: 'device' } };
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AdminTokenGuard)
  async destroy(@Param('id') id: string) {
    try {
      await this.prisma.device.delete({ where: { id: BigInt(id) } });
    } catch {
      throw new NotFoundException({ error: 'Device not found' });
    }
    return undefined;
  }
}
