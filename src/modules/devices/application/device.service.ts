import { Injectable, NotFoundException } from '@nestjs/common';
import { DeviceRepository } from '../domain/device.repository';

@Injectable()
export class DeviceService {
  constructor(private readonly repository: DeviceRepository) {}

  list() {
    return this.repository.findTokens();
  }

  async create(token: string) {
    const existing = await this.repository.findByToken(token);
    const device = existing
      ? await this.repository.update(existing.id)
      : await this.repository.create(token);
    return { device, created: !existing };
  }

  async remove(id: string) {
    try {
      await this.repository.remove(BigInt(id));
    } catch {
      throw new NotFoundException({ error: 'Device not found' });
    }
  }
}
