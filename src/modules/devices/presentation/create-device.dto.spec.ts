import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDeviceDto } from './create-device.dto';

describe('CreateDeviceDto', () => {
  it('accepts a valid device', async () => {
    const errors = await validate(plainToInstance(CreateDeviceDto, { fcm_token: 'token', platform: 'web' }));
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid tokens and platforms', async () => {
    const errors = await validate(plainToInstance(CreateDeviceDto, { fcm_token: 'bad token', platform: 'ios' }));
    expect(errors.map(({ property }) => property)).toEqual(expect.arrayContaining(['fcm_token', 'platform']));
  });
});
