/**
 * Server Entry Point
 */

require('dotenv').config();
const app = require('./app');
const prisma = require('./config/prisma-client');
const emailService = require('./common/services/email.service');

const PORT = process.env.PORT || 3000;

// Test database connection
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Test email connection (optional)
async function testEmailConnection() {
  try {
    const isConnected = await emailService.verifyConnection();
    if (isConnected) {
      console.log('✅ Email service ready');
    } else {
      console.warn('⚠️  Email service not configured properly');
    }
  } catch (error) {
    console.warn('⚠️  Email service error:', error.message);
  }
}

// Start server
async function startServer() {
  try {
    // Test connections
    await testDatabaseConnection();
    await testEmailConnection();

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Start the server
startServer();