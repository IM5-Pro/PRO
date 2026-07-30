import * as NotificationController from '../src/controllers/NotificationController.js';
import Notification from '../src/models/Notification.js';
import User from '../src/models/User.js';

jest.mock('../src/models/Notification.js', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ ...data }),
    })),
  };
});

jest.mock('../src/models/User.js', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('../src/utils/logger.js', () => ({
  appLogger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    logRequest: jest.fn(),
    logDatabaseOperation: jest.fn(),
    logResponse: jest.fn(),
  },
}));

describe('NotificationController recipient resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves employee IDs to their linked user IDs before saving a notification', async () => {
    const employeeId = '64f0c1b2d3e4f5a6b7c8d9e0';
    const linkedUserId = '64f0c1b2d3e4f5a6b7c8d9f1';

    User.findById.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    }));

    User.findOne.mockImplementation((query) => {
      if (query && query.employeeId === employeeId) {
        return {
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue({ _id: linkedUserId }),
        };
      }

      return {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
    });

    await NotificationController.createNotification({
      userId: employeeId,
      type: 'leave_approval',
      title: 'Approval',
      message: 'Approved',
    });

    expect(Notification).toHaveBeenCalledWith(expect.objectContaining({
      userId: linkedUserId,
    }));
  });
});
