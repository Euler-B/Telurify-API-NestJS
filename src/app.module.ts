import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './shared/database/database.module';
import { SismosModule } from './modules/sismos/sismos.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DevicesModule } from './modules/devices/devices.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    SismosModule,
    ReportsModule,
    DevicesModule,
  ],
})
export class AppModule {}
