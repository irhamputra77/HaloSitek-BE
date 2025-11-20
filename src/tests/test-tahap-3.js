const {
  architectRepository,
  certificationRepository,
  portfolioLinkRepository,
  transactionRepository
} = require('./src/domains/architects/repositories');

async function testTahap3() {
  console.log('🧪 Testing TAHAP 3 Repository Layer...\n');

  try {
    // Test each repository
    const architectCount = await architectRepository.count();
    console.log('✅ Architect Repository:', architectCount, 'records');

    const certCount = await certificationRepository.count();
    console.log('✅ Certification Repository:', certCount, 'records');

    const linkCount = await portfolioLinkRepository.count();
    console.log('✅ Portfolio Link Repository:', linkCount, 'records');

    const transCount = await transactionRepository.count();
    console.log('✅ Transaction Repository:', transCount, 'records');

    // Test statistics
    const stats = await architectRepository.countByStatus();
    console.log('\n📊 Architect Statistics:', stats);

    console.log('\n✅ All TAHAP 3 repositories are working!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTahap3();