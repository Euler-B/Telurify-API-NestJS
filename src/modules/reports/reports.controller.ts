import { Body, Controller, Param, Post } from '@nestjs/common';
import { ReportService } from './application/report.service';
import { CreateReportDto } from './presentation/create-report.dto';

@Controller('sismos/:sismoId/reports')
export class ReportsController {
  constructor(private readonly service: ReportService) {}

  @Post()
  async create(@Param('sismoId') sismoId: string, @Body() body: CreateReportDto) {
    const report = await this.service.create(sismoId, body.felt, body.intensity);
    return { data: { id: Number(report.id), type: 'report', attributes: { felt: report.felt, intensity: report.intensity, sismo_id: Number(report.sismoId), created_at: report.createdAt } } };
  }
}
