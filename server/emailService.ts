import nodemailer from "nodemailer";
import puppeteer from "puppeteer";
import type { SmtpConfig, EmailTemplate, Quotation, Customer } from "@shared/schema";
import { decryptPassword } from "./utils/encryption";

interface EmailData {
  quotation: Quotation & { customer: Customer; items: any[] };
  template: EmailTemplate;
  smtpConfig: SmtpConfig;
  companyName?: string;
}

export async function sendQuotationEmail(data: EmailData): Promise<void> {
  const { quotation, template, smtpConfig, companyName } = data;

  // Render template with quotation data
  const renderedSubject = renderTemplate(template.subject, {
    quotationNumber: quotation.quotationNumber,
    companyName: companyName || "Công ty",
    customerName: quotation.customer.name,
  });

  const renderedHtml = renderTemplate(template.htmlContent, {
    quotationNumber: quotation.quotationNumber,
    companyName: companyName || "Công ty",
    customerName: quotation.customer.name,
    total: formatCurrency(quotation.total ?? 0),
    items: renderQuotationItems(quotation.items),
  });

  // Decrypt SMTP password
  const decryptedPassword = decryptPassword(smtpConfig.password);

  // Create transporter with SMTP config
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.port === 465, // true for 465, false for other ports
    auth: {
      user: smtpConfig.username,
      pass: decryptedPassword,
    },
  });

  // Send email
  await transporter.sendMail({
    from: `"${smtpConfig.fromName || smtpConfig.fromEmail}" <${smtpConfig.fromEmail}>`,
    to: quotation.customer.email,
    subject: renderedSubject,
    html: renderedHtml,
  });
}

function renderTemplate(template: string, data: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, value);
  }
  return rendered;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

function renderQuotationItems(items: any[]): string {
  if (!items || items.length === 0) return '<p>Không có sản phẩm</p>';

  let html = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">';
  html += '<thead><tr style="background: #f3f4f6;">';
  html += '<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Sản phẩm</th>';
  html += '<th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">SL</th>';
  html += '<th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Đơn giá</th>';
  html += '<th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Thành tiền</th>';
  html += '</tr></thead><tbody>';

  for (const item of items) {
    const unitPrice = item.unitPrice ?? 0;
    const quantity = item.quantity ?? 0;
    html += '<tr>';
    html += `<td style="padding: 12px; border: 1px solid #e5e7eb;">${item.description || ''}</td>`;
    html += `<td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">${quantity}</td>`;
    html += `<td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(unitPrice)}</td>`;
    html += `<td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(quantity * unitPrice)}</td>`;
    html += '</tr>';
  }

  html += '</tbody></table>';
  return html;
}

export async function sendTestEmail(smtpConfig: SmtpConfig, testEmail: string): Promise<void> {
  // Decrypt SMTP password
  const decryptedPassword = decryptPassword(smtpConfig.password);

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.port === 465,
    auth: {
      user: smtpConfig.username,
      pass: decryptedPassword,
    },
  });

  await transporter.sendMail({
    from: `"${smtpConfig.fromName || smtpConfig.fromEmail}" <${smtpConfig.fromEmail}>`,
    to: testEmail,
    subject: "Test Email từ WFA Hub",
    html: '<p>Đây là email test từ hệ thống WFA Hub.</p><p>SMTP configuration của bạn đang hoạt động tốt!</p>',
  });
}

interface CampaignEmailData {
  recipientEmail: string;
  recipientName?: string;
  customData: Record<string, any>;
  subject: string;
  body: string;
  smtpConfig: SmtpConfig;
  trackingPixelUrl?: string;
  quotationTemplateHtml?: string;
}

// Helper function to check if password is encrypted (hex format)
function isEncryptedPassword(password: string): boolean {
  const parts = password.split(':');
  if (parts.length !== 3) return false;
  
  // Check if all parts are valid hex strings
  const hexRegex = /^[0-9a-fA-F]+$/;
  return parts.every(part => part.length > 0 && hexRegex.test(part));
}

// Generate PDF from quotation template HTML with merged data
export async function generateQuotationPDF(
  templateHtml: string,
  recipientData: Record<string, any>
): Promise<Buffer> {
  // Replace {field} placeholders with actual data
  let renderedHtml = templateHtml;
  for (const [key, value] of Object.entries(recipientData)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    renderedHtml = renderedHtml.replace(regex, String(value || ''));
  }

  // Launch headless browser and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export async function sendCampaignEmail(data: CampaignEmailData): Promise<void> {
  const { recipientEmail, recipientName, customData, subject, body, smtpConfig, trackingPixelUrl, quotationTemplateHtml } = data;

  // Merge customData into subject and body
  const mergedData = {
    name: recipientName || '',
    email: recipientEmail,
    ...customData,
  };

  let renderedSubject = subject;
  let renderedBody = body;

  // Replace {field} placeholders with actual data
  for (const [key, value] of Object.entries(mergedData)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    renderedSubject = renderedSubject.replace(regex, String(value || ''));
    renderedBody = renderedBody.replace(regex, String(value || ''));
  }

  // Add tracking pixel if provided
  if (trackingPixelUrl) {
    renderedBody += `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none" />`;
  }

  // Decrypt SMTP password only if it's in encrypted format (hex:hex:hex)
  let decryptedPassword = smtpConfig.password;
  if (isEncryptedPassword(smtpConfig.password)) {
    try {
      decryptedPassword = decryptPassword(smtpConfig.password);
    } catch (error) {
      // If decryption fails, use password as-is (backward compatibility)
      console.warn('Password decryption failed, using plain password');
    }
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.port === 465,
    auth: {
      user: smtpConfig.username,
      pass: decryptedPassword,
    },
  });

  // Generate PDF attachment if quotation template is provided
  let attachments: any[] = [];
  if (quotationTemplateHtml) {
    try {
      const pdfBuffer = await generateQuotationPDF(quotationTemplateHtml, mergedData);
      attachments.push({
        filename: `Bao_Gia_${recipientName || 'KhachHang'}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
    } catch (error) {
      console.error('Failed to generate PDF attachment:', error);
      // Continue sending email without PDF if generation fails
    }
  }

  // Send email
  await transporter.sendMail({
    from: `"${smtpConfig.fromName || smtpConfig.fromEmail}" <${smtpConfig.fromEmail}>`,
    to: recipientEmail,
    subject: renderedSubject,
    html: renderedBody,
    attachments,
  });
}
