jest.mock('../../src/domains/admins/services/admin-auth.service');

const adminAuthController = require('../../src/domains/admins/controllers/admin-auth.controller');
const adminAuthService = require('../../src/domains/admins/services/admin-auth.service');
const ResponseFormatter = require('../../src/utils/response-formatter');

jest.spyOn(ResponseFormatter, 'success');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('AdminAuthController - Login', () => {
  it('should login admin', async () => {
    const req = {
      body: {
        email: 'admin@mail.com',
        password: 'Password123!',
      },
    };

    const res = mockRes();
    const next = jest.fn();

    adminAuthService.login.mockResolvedValue({
      data: { token: 'access-token' },
      message: 'Login successful',
    });

    await adminAuthController.login(req, res, next);

    expect(adminAuthService.login).toBeCalled();
    expect(ResponseFormatter.success).toBeCalled();
  });
});

describe('AdminAuthController - Get Profile', () => {
  it('should return admin profile', async () => {
    const req = {
      user: { id: '1' },
    };

    const res = mockRes();
    const next = jest.fn();

    adminAuthService.getProfile.mockResolvedValue({
      id: '1',
      email: 'admin@mail.com',
    });

    await adminAuthController.getProfile(req, res, next);

    expect(adminAuthService.getProfile).toBeCalledWith('1');
    expect(ResponseFormatter.success).toBeCalled();
  });
});

describe('AdminAuthController - Dashboard', () => {
  it('should return dashboard stats', async () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    adminAuthService.getDashboardStats.mockResolvedValue({
      users: { total: 10 },
    });

    await adminAuthController.getDashboard(req, res, next);

    expect(adminAuthService.getDashboardStats).toBeCalled();
    expect(ResponseFormatter.success).toBeCalled();
  });
});
