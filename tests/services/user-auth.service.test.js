jest.mock('../../src/domains/users/repositories', () => ({
  userRepository: {
    isEmailExists: jest.fn(),
    isUsernameExists: jest.fn(),
    createUser: jest.fn(),
    findByEmailOrUsername: jest.fn(),
  },
}));

jest.mock('../../src/utils/password-hasher', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
  validatePasswordStrength: jest.fn(),
}));

jest.mock('../../src/utils/jwt-helper', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
}));

const userAuthService = require('../../src/domains/users/services/user-auth.service');
const { userRepository } = require('../../src/domains/users/repositories');
const PasswordHasher = require('../../src/utils/password-hasher');
const JWTHelper = require('../../src/utils/jwt-helper');
const { ValidationError, AuthenticationError, ConflictError } = require('../../src/errors/app-errors');

describe('UserAuthService - Register', () => {
  it('should register user successfully', async () => {
    userRepository.isEmailExists.mockResolvedValue(false);
    userRepository.isUsernameExists.mockResolvedValue(false);
    PasswordHasher.validatePasswordStrength.mockReturnValue({ isValid: true });
    PasswordHasher.hash.mockResolvedValue('hashed-password');

    userRepository.createUser.mockResolvedValue({
      id: '1',
      email: 'test@mail.com',
      username: 'testuser',
      fullName: 'Test User',
      profilePictureUrl: null,
      emailVerified: false,
    });

    JWTHelper.generateAccessToken.mockReturnValue('access-token');
    JWTHelper.generateRefreshToken.mockReturnValue('refresh-token');

    const result = await userAuthService.register({
      email: 'test@mail.com',
      username: 'testuser',
      password: 'Password123!',
      fullName: 'Test User',
    });

    expect(result.success).toBe(true);
    expect(result.data.user.email).toBe('test@mail.com');
    expect(result.data.tokens.accessToken).toBe('access-token');
  });

  it('should throw error if email already exists', async () => {
    userRepository.isEmailExists.mockResolvedValue(true);

    await expect(
      userAuthService.register({
        email: 'test@mail.com',
        username: 'testuser',
        password: 'Password123!',
        fullName: 'Test User',
      })
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('UserAuthService - Login', () => {
  it('should login successfully', async () => {
    userRepository.findByEmailOrUsername.mockResolvedValue({
      id: '1',
      email: 'test@mail.com',
      username: 'testuser',
      password: 'hashed-password',
      fullName: 'Test User',
      emailVerified: true,
    });

    PasswordHasher.compare.mockResolvedValue(true);
    JWTHelper.generateAccessToken.mockReturnValue('access-token');
    JWTHelper.generateRefreshToken.mockReturnValue('refresh-token');

    const result = await userAuthService.login({
      identifier: 'test@mail.com',
      password: 'Password123!',
    });

    expect(result.success).toBe(true);
    expect(result.data.user.username).toBe('testuser');
  });

  it('should throw AuthenticationError if password wrong', async () => {
    userRepository.findByEmailOrUsername.mockResolvedValue({
      password: 'hashed-password',
    });

    PasswordHasher.compare.mockResolvedValue(false);

    await expect(
      userAuthService.login({
        identifier: 'test@mail.com',
        password: 'wrong',
      })
    ).rejects.toBeInstanceOf(AuthenticationError);
  });
});
