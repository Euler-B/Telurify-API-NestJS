import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { AdminTokenGuard } from './admin-token.guard';
import { DeviceService } from './application/device.service';
import { DeviceRepository } from './domain/device.repository';
import { PrismaDeviceRepository } from './infrastructure/prisma-device.repository';

@Module({
  controllers: [DevicesController],
  providers: [AdminTokenGuard, DeviceService, PrismaDeviceRepository, { provide: DeviceRepository, useExisting: PrismaDeviceRepository }],
})
export class DevicesModule {}
