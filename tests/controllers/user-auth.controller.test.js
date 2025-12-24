jest.mock('../../src/domains/users/services', () => ({
  userAuthService: {
    register: jest.fn(),
    login: jest.fn(),
  },
}));

const userAuthController = require('../../src/domains/users/controllers/user-auth.controller');
const { userAuthService } = require('../../src/domains/users/services');
const ResponseFormatter = require('../../src/utils/response-formatter');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

jest.spyOn(ResponseFormatter, 'created');
jest.spyOn(ResponseFormatter, 'success');


describe('UserAuthController - Register', () => {
  it('should call service and return response', async () => {
    const req = {
      body: {
        email: 'test@mail.com',
        username: 'testuser',
        password: 'Password123!',
        fullName: 'Test User',
      },
      file: null,
    };

    const res = mockRes();
    const next = jest.fn();

    userAuthService.register.mockResolvedValue({
      data: { id: 1 },
      message: 'Registration successful',
    });

    await userAuthController.register(req, res, next);

    expect(userAuthService.register).toBeCalled();
    expect(ResponseFormatter.created).toBeCalled();
  });
});

describe('UserAuthController - Login', () => {
  it('should login user', async () => {
    const req = {
      body: {
        identifier: 'test@mail.com',
        password: 'Password123!',
      },
    };

    const res = mockRes();
    const next = jest.fn();

    userAuthService.login.mockResolvedValue({
      data: { token: 'access-token' },
      message: 'Login successful',
    });

    await userAuthController.login(req, res, next);

    expect(userAuthService.login).toBeCalled();
    expect(ResponseFormatter.success).toBeCalled();
  });
});
