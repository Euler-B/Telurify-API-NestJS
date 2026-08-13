import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { AdminTokenGuard } from './admin-token.guard';

@Module({ controllers: [DevicesController], providers: [AdminTokenGuard] })
export class DevicesModule {}
