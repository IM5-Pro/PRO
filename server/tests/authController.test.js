import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import AuthController from '../src/controllers/AuthController.js';
import User from '../src/models/User.js';
import Roles from '../src/constants/roles.js';

jest.mock('../src/models/User.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(() => ({
      lean: jest.fn(),
    })),
  },
}));

const app = express();
app.use(cookieParser());
app.use(express.json());
app.post('/api/auth/register-superadmin', AuthController.registerSuperAdmin);

describe('AuthController registerSuperAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPER_ADMIN_SETUP_KEY = 'test-key';
  });

  test('returns a clean conflict message when a SUPER_ADMIN already exists', async () => {
    User.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ role: Roles.SUPER_ADMIN }),
    });

    const res = await request(app)
      .post('/api/auth/register-superadmin')
      .send({
        email: 'admin@ispace.com',
        password: 'Abcdef1!',
        setupKey: 'test-key',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Super admin already exists');
  });
});
