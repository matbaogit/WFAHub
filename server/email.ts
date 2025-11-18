import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { decrypt } from './utils/encryption';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName?: string;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig | null = null;

  constructor(config?: EmailConfig) {
    if (config) {
      this.configure(config);
    }
  }

  configure(config: EmailConfig) {
    this.config = config;
    
    // Decrypt password if it's encrypted
    const password = decrypt(config.password);
    
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: password,
      },
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.transporter || !this.config) {
      throw new Error('Email service chưa được cấu hình');
    }

    const mailOptions = {
      from: this.config.fromName 
        ? `"${this.config.fromName}" <${this.config.fromEmail}>`
        : this.config.fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendVerificationEmail(to: string, username: string, token: string, baseUrl: string): Promise<void> {
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ Xác thực tài khoản WFA Hub</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${username}</strong>,</p>
              <p>Cảm ơn bạn đã đăng ký tài khoản WFA Hub! Vui lòng xác thực địa chỉ email của bạn bằng cách nhấn vào nút bên dưới:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Xác thực Email</a>
              </div>
              <p>Hoặc copy link sau vào trình duyệt:</p>
              <p style="background: #e5e7eb; padding: 10px; border-radius: 4px; word-break: break-all;">
                ${verificationUrl}
              </p>
              <p><strong>Lưu ý:</strong> Link này sẽ hết hạn sau 24 giờ.</p>
              <p>Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} WFA Hub. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Xin chào ${username},

Cảm ơn bạn đã đăng ký tài khoản WFA Hub! Vui lòng xác thực địa chỉ email của bạn bằng cách truy cập link sau:

${verificationUrl}

Lưu ý: Link này sẽ hết hạn sau 24 giờ.

Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.

© ${new Date().getFullYear()} WFA Hub
    `;

    await this.sendEmail({
      to,
      subject: '🔐 Xác thực tài khoản WFA Hub',
      html,
      text,
    });
  }

  async sendPasswordResetEmail(to: string, username: string, token: string, baseUrl: string): Promise<void> {
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 Đặt lại mật khẩu</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${username}</strong>,</p>
              <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tạo mật khẩu mới:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
              </div>
              <p>Hoặc copy link sau vào trình duyệt:</p>
              <p style="background: #e5e7eb; padding: 10px; border-radius: 4px; word-break: break-all;">
                ${resetUrl}
              </p>
              <div class="warning">
                <strong>⚠️ Lưu ý bảo mật:</strong>
                <ul style="margin: 10px 0;">
                  <li>Link này sẽ hết hạn sau 24 giờ</li>
                  <li>Chỉ sử dụng link này nếu bạn đã yêu cầu đặt lại mật khẩu</li>
                  <li>Không chia sẻ link này cho bất kỳ ai</li>
                </ul>
              </div>
              <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} WFA Hub. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Xin chào ${username},

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Truy cập link sau để tạo mật khẩu mới:

${resetUrl}

⚠️ LƯU Ý BẢO MẬT:
- Link này sẽ hết hạn sau 24 giờ
- Chỉ sử dụng link này nếu bạn đã yêu cầu đặt lại mật khẩu
- Không chia sẻ link này cho bất kỳ ai

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.

© ${new Date().getFullYear()} WFA Hub
    `;

    await this.sendEmail({
      to,
      subject: '🔐 Đặt lại mật khẩu WFA Hub',
      html,
      text,
    });
  }
}

// Global email service instance
let globalEmailService: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!globalEmailService) {
    globalEmailService = new EmailService();
  }
  return globalEmailService;
}

export function configureEmailService(config: EmailConfig): void {
  const service = getEmailService();
  service.configure(config);
}
