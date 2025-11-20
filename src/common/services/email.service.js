/**
 * Email Service
 * Handle sending emails menggunakan Nodemailer
 */

const nodemailer = require('nodemailer');
const { ExternalServiceError } = require('../../errors/app-errors');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize Nodemailer Transporter
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  /**
   * Verify email connection
   * @returns {Promise<Boolean>} - True if connected
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email server is ready');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error.message);
      return false;
    }
  }

  /**
   * Send email
   * @param {Object} options - Email options
   * @param {String} options.to - Recipient email
   * @param {String} options.subject - Email subject
   * @param {String} options.html - HTML content
   * @param {String} options.text - Plain text content (optional)
   * @returns {Promise<Object>} - Email info
   */
  async sendEmail({ to, subject, html, text = '' }) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'HaloSitek <noreply@halositek.com>',
        to,
        subject,
        text,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      throw new ExternalServiceError(`Failed to send email: ${error.message}`, 'Email');
    }
  }

  /**
   * Send Payment Link Email
   * @param {Object} architect - Architect data
   * @param {String} paymentToken - Payment token
   * @param {String} orderId - Order ID
   * @param {Number} amount - Payment amount
   * @returns {Promise<Object>} - Email info
   */
  async sendPaymentLinkEmail(architect, paymentToken, orderId, amount) {
    const paymentUrl = `${process.env.FRONTEND_URL}/payment/${paymentToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-box { background: white; border: 1px solid #e5e7eb; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 HaloSitek</h1>
            <p>Platform Arsitek Indonesia</p>
          </div>
          
          <div class="content">
            <h2>Halo, ${architect.name}! 👋</h2>
            
            <p>Terima kasih telah mendaftar sebagai Arsitek di HaloSitek.</p>
            
            <p>Untuk mengaktifkan akun Anda, silakan selesaikan pembayaran registrasi sebesar:</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">💳 Detail Pembayaran</h3>
              <table style="width: 100%;">
                <tr>
                  <td><strong>Order ID:</strong></td>
                  <td>${orderId}</td>
                </tr>
                <tr>
                  <td><strong>Jumlah:</strong></td>
                  <td>Rp ${amount.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td><strong>Berlaku hingga:</strong></td>
                  <td>24 jam dari sekarang</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center;">
              <a href="${paymentUrl}" class="button">Bayar Sekarang</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Penting:</strong><br>
              Link pembayaran ini berlaku selama 24 jam. Setelah itu, Anda perlu melakukan registrasi ulang.
            </div>
            
            <p>Setelah pembayaran berhasil, akun Anda akan diaktifkan otomatis dan Anda dapat langsung mulai menggunakan platform HaloSitek.</p>
            
            <p>Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi kami.</p>
            
            <p>Salam hangat,<br><strong>Tim HaloSitek</strong></p>
          </div>
          
          <div class="footer">
            <p>Email ini dikirim otomatis. Mohon tidak membalas email ini.</p>
            <p>&copy; 2024 HaloSitek. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: architect.email,
      subject: '💳 Selesaikan Pembayaran Registrasi HaloSitek',
      html,
      text: `Halo ${architect.name}, silakan selesaikan pembayaran registrasi sebesar Rp ${amount.toLocaleString('id-ID')}. Link pembayaran: ${paymentUrl}`,
    });
  }

  /**
   * Send Welcome Email (after payment success)
   * @param {Object} architect - Architect data
   * @returns {Promise<Object>} - Email info
   */
  async sendWelcomeEmail(architect) {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
          .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .feature-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .feature-item:last-child { border-bottom: none; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Selamat Datang di HaloSitek!</h1>
          </div>
          
          <div class="content">
            <h2>Halo, ${architect.name}! 👋</h2>
            
            <div class="success-box">
              <strong>✅ Pembayaran Berhasil!</strong><br>
              Akun Anda telah aktif dan siap digunakan.
            </div>
            
            <p>Terima kasih telah bergabung dengan HaloSitek, platform yang menghubungkan arsitek profesional dengan klien potensial di seluruh Indonesia.</p>
            
            <div class="features">
              <h3>✨ Apa yang bisa Anda lakukan sekarang:</h3>
              
              <div class="feature-item">
                <strong>📁 Upload Portfolio</strong><br>
                Tampilkan karya-karya terbaik Anda
              </div>
              
              <div class="feature-item">
                <strong>🏗️ Publikasikan Desain</strong><br>
                Share desain rumah untuk inspirasi calon klien
              </div>
              
              <div class="feature-item">
                <strong>💬 Terima Konsultasi</strong><br>
                Dapatkan klien yang membutuhkan jasa Anda
              </div>
              
              <div class="feature-item">
                <strong>📊 Lihat Statistik</strong><br>
                Monitor performa portfolio Anda
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Login Sekarang</a>
            </div>
            
            <p>Jangan lupa untuk melengkapi profil Anda agar lebih menarik bagi calon klien!</p>
            
            <p>Jika Anda memiliki pertanyaan atau butuh bantuan, tim support kami siap membantu.</p>
            
            <p>Salam sukses,<br><strong>Tim HaloSitek</strong></p>
          </div>
          
          <div class="footer">
            <p>Email ini dikirim otomatis. Mohon tidak membalas email ini.</p>
            <p>&copy; 2024 HaloSitek. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: architect.email,
      subject: '🎉 Selamat! Akun HaloSitek Anda Telah Aktif',
      html,
      text: `Selamat ${architect.name}! Pembayaran berhasil dan akun Anda telah aktif. Silakan login di ${loginUrl}`,
    });
  }

  /**
   * Send Payment Failed Email
   * @param {Object} architect - Architect data
   * @param {String} orderId - Order ID
   * @returns {Promise<Object>} - Email info
   */
  async sendPaymentFailedEmail(architect, orderId) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .error-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Pembayaran Gagal</h1>
          </div>
          
          <div class="content">
            <h2>Halo, ${architect.name}</h2>
            
            <div class="error-box">
              <strong>Pembayaran untuk Order ID: ${orderId} gagal diproses.</strong>
            </div>
            
            <p>Mohon maaf, pembayaran Anda tidak dapat diproses. Ini bisa terjadi karena beberapa alasan:</p>
            
            <ul>
              <li>Saldo tidak mencukupi</li>
              <li>Transaksi dibatalkan</li>
              <li>Masalah dengan metode pembayaran</li>
            </ul>
            
            <p>Silakan coba lagi atau hubungi customer support kami jika Anda memerlukan bantuan.</p>
            
            <p>Terima kasih,<br><strong>Tim HaloSitek</strong></p>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 HaloSitek. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: architect.email,
      subject: '❌ Pembayaran Gagal - HaloSitek',
      html,
      text: `Halo ${architect.name}, pembayaran untuk Order ID ${orderId} gagal diproses. Silakan coba lagi.`,
    });
  }

  /**
   * Send Payment Expired Email
   * @param {Object} architect - Architect data
   * @param {String} orderId - Order ID
   * @returns {Promise<Object>} - Email info
   */
  async sendPaymentExpiredEmail(architect, orderId) {
    const registerUrl = `${process.env.FRONTEND_URL}/register/architect`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Link Pembayaran Kadaluarsa</h1>
          </div>
          
          <div class="content">
            <h2>Halo, ${architect.name}</h2>
            
            <div class="warning-box">
              <strong>Link pembayaran untuk Order ID: ${orderId} telah kadaluarsa.</strong>
            </div>
            
            <p>Link pembayaran hanya berlaku selama 24 jam. Untuk melanjutkan registrasi, silakan daftar ulang.</p>
            
            <div style="text-align: center;">
              <a href="${registerUrl}" class="button">Daftar Ulang</a>
            </div>
            
            <p>Data yang sudah Anda isi sebelumnya tidak tersimpan. Mohon isi formulir registrasi dari awal.</p>
            
            <p>Terima kasih atas pengertiannya.</p>
            
            <p>Salam,<br><strong>Tim HaloSitek</strong></p>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 HaloSitek. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: architect.email,
      subject: '⏰ Link Pembayaran Kadaluarsa - HaloSitek',
      html,
      text: `Halo ${architect.name}, link pembayaran untuk Order ID ${orderId} telah kadaluarsa. Silakan daftar ulang di ${registerUrl}`,
    });
  }
}

module.exports = new EmailService();