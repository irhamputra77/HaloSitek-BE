jest.mock('../../src/domains/admins/repositories', () => ({
  adminRepository: {
    findByEmail: jest.fn(),
    findByIdOrFail: jest.fn(),
    updateProfile: jest.fn(),
    update: jest.fn(),
    countAdmins: jest.fn(),
  },
}));

jest.mock('../../src/utils/password-hasher', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  validatePasswordStrength: jest.fn(),
}));

jest.mock('../../src/utils/jwt-helper', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyToken: jest.fn(),
}));

const adminAuthService = require('../../src/domains/admins/services/admin-auth.service');
const { adminRepository } = require('../../src/domains/admins/repositories');
const PasswordHasher = require('../../src/utils/password-hasher');
const JWTHelper = require('../../src/utils/jwt-helper');
const {
  ValidationError,
  AuthenticationError,
  BadRequestError,
} = require('../../src/errors/app-errors');

describe('AdminAuthService - Login', () => {
  it('should login admin successfully', async () => {
    adminRepository.findByEmail.mockResolvedValue({
      id: '1',
      email: 'admin@mail.com',
      password: 'hashed',
      fullName: 'Admin',
      role: 'ADMIN',
    });

    PasswordHasher.compare.mockResolvedValue(true);
    JWTHelper.generateAccessToken.mockReturnValue('access-token');
    JWTHelper.generateRefreshToken.mockReturnValue('refresh-token');

    const result = await adminAuthService.login({
      email: 'admin@mail.com',
      password: 'Password123!',
    });

    expect(result.success).toBe(true);
    expect(result.data.tokens.accessToken).toBe('access-token');
  });

  it('should throw ValidationError if email missing', async () => {
    await expect(
      adminAuthService.login({ password: '123' })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('should throw AuthenticationError if password invalid', async () => {
    adminRepository.findByEmail.mockResolvedValue({
      password: 'hashed',
    });

    PasswordHasher.compare.mockResolvedValue(false);

    await expect(
      adminAuthService.login({
        email: 'admin@mail.com',
        password: 'wrong',
      })
    ).rejects.toBeInstanceOf(AuthenticationError);
  });
});

describe('AdminAuthService - Change Password', () => {
  it('should change password successfully', async () => {
    adminRepository.findByIdOrFail.mockResolvedValue({
      id: '1',
      email: 'admin@mail.com',
      password: 'old-hash',
    });

    PasswordHasher.compare.mockResolvedValue(true);
    PasswordHasher.validatePasswordStrength.mockReturnValue({ isValid: true });
    PasswordHasher.hash.mockResolvedValue('new-hash');

    const result = await adminAuthService.changePassword('1', {
      oldPassword: 'old',
      newPassword: 'NewPassword123!',
    });

    expect(result.success).toBe(true);
  });

  it('should throw error if old password wrong', async () => {
    adminRepository.findByIdOrFail.mockResolvedValue({
      password: 'hash',
    });

    PasswordHasher.compare.mockResolvedValue(false);

    await expect(
      adminAuthService.changePassword('1', {
        oldPassword: 'wrong',
        newPassword: 'NewPassword123!',
      })
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});

describe('AdminAuthService - Refresh Token', () => {
  it('should refresh access token', async () => {
    JWTHelper.verifyToken.mockReturnValue({
      id: '1',
      type: 'refresh',
    });

    adminRepository.findByIdOrFail.mockResolvedValue({
      id: '1',
      email: 'admin@mail.com',
    });

    JWTHelper.generateAccessToken.mockReturnValue('new-access-token');

    const result = await adminAuthService.refreshAccessToken('refresh-token');

    expect(result.data.accessToken).toBe('new-access-token');
  });
});
