import { Body, Controller, Delete, Get, HttpCode, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminTokenGuard } from './admin-token.guard';
import { DeviceService } from './application/device.service';
import { CreateDeviceDto } from './presentation/create-device.dto';

@Controller('devices')
export class DevicesController {
  constructor(private readonly service: DeviceService) {}

  @Get()
  @UseGuards(AdminTokenGuard)
  async index(@Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    return { data: await this.service.list() };
  }

  @Post()
  async create(@Body() body: CreateDeviceDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.service.create(body.fcm_token);
    response.status(result.created ? 201 : 200);
    return { data: { id: Number(result.device.id), type: 'device' } };
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AdminTokenGuard)
  async destroy(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
