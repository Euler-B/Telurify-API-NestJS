import { NotFoundException } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceRepository } from '../domain/device.repository';

describe('DeviceService', () => {
  it('creates a device and reports its status', async () => {
    const repository = { findByToken: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 1n }) } as unknown as DeviceRepository;
    const result = await new DeviceService(repository).create('token');
    expect(result).toEqual({ device: { id: 1n }, created: true });
    expect(repository.create).toHaveBeenCalledWith('token');
  });

  it('translates missing devices to a domain HTTP error', async () => {
    const repository = { remove: jest.fn().mockRejectedValue(new Error()) } as unknown as DeviceRepository;
    await expect(new DeviceService(repository).remove('1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
