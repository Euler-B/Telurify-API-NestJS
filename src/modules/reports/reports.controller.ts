import { Body, Controller, NotFoundException, Param, Post, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

const INTENSITY_LEVELS = ['not_felt', 'weak', 'light', 'moderate', 'strong', 'severe'];

@Controller('sismos/:sismoId/reports')
export class ReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async create(@Param('sismoId') sismoId: string, @Body() body: { felt?: boolean; intensity?: string }) {
    const id = BigInt(sismoId);
    const sismo = await this.prisma.sismo.findUnique({ where: { id } });
    if (!sismo) throw new NotFoundException({ error: 'Feature not found' });
    if (typeof body.felt !== 'boolean' || !INTENSITY_LEVELS.includes(body.intensity ?? '')) {
      throw new UnprocessableEntityException({ errors: ['Felt and intensity are invalid'] });
    }
    const now = new Date();
    const report = await this.prisma.report.create({ data: { sismoId: id, felt: body.felt, intensity: body.intensity!, createdAt: now, updatedAt: now } });
    return { data: { id: Number(report.id), type: 'report', attributes: { felt: report.felt, intensity: report.intensity, sismo_id: Number(report.sismoId), created_at: report.createdAt } } };
  }
}
