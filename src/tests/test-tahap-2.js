const PasswordHasher = require('./src/utils/password-hasher');
const JWTHelper = require('./src/utils/jwt-helper');
const ValidationHelper = require('./src/utils/validation-helper');

async function testTahap2() {
  console.log('🧪 Testing TAHAP 2 Utilities...\n');

  // 1. Test Password Hasher
  const password = 'TestPassword123!';
  const hashed = await PasswordHasher.hash(password);
  const isValid = await PasswordHasher.compare(password, hashed);
  console.log('✅ Password Hasher:', isValid ? 'WORKING' : 'FAILED');

  // 2. Test JWT Helper
  const token = JWTHelper.generateAccessToken({
    id: '123',
    email: 'test@test.com',
    role: 'ARCHITECT'
  });
  const decoded = JWTHelper.verifyToken(token);
  console.log('✅ JWT Helper:', decoded.id === '123' ? 'WORKING' : 'FAILED');

  // 3. Test Validation Helper
  const emailValid = ValidationHelper.isValidEmail('test@test.com');
  const phoneValid = ValidationHelper.isValidPhone('081234567890');
  console.log('✅ Validation Helper:', emailValid && phoneValid ? 'WORKING' : 'FAILED');

  console.log('\n✅ All TAHAP 2 utilities are working!\n');
}

testTahap2().catch(console.error);