import { jest } from '@jest/globals';
import { processForgotPassword } from '../src/services/authService.js';
import User from '../src/models/User.js';

jest.mock('../src/models/User.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

describe('processForgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'production';
  });

  test('returns a reset token for an existing user in production', async () => {
    const save = jest.fn().mockResolvedValue(true);
    User.findOne.mockResolvedValue({
      email: 'user@ispace.com',
      save,
    });

    const result = await processForgotPassword('user@ispace.com');

    expect(result.ok).toBe(true);
    expect(result.data.resetToken).toBeDefined();
    expect(save).toHaveBeenCalledTimes(1);
  });
});
