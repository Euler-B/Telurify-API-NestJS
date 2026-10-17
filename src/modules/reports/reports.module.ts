import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportService } from './application/report.service';
import { ReportRepository } from './domain/report.repository';
import { PrismaReportRepository } from './infrastructure/prisma-report.repository';

@Module({ controllers: [ReportsController], providers: [ReportService, PrismaReportRepository, { provide: ReportRepository, useExisting: PrismaReportRepository }] })
export class ReportsModule {}
