import nodemailer from "nodemailer";
import puppeteer from "puppeteer";
import { execSync } from "child_process";
import type { SmtpConfig, EmailTemplate, Quotation, Customer, CampaignAttachment } from "@shared/schema";
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
  quotationTemplateHtml?: string;
  fileAttachments?: CampaignAttachment[]; // User-uploaded file attachments
}

// Helper function to check if password is encrypted (hex format)
function isEncryptedPassword(password: string): boolean {
  const parts = password.split(':');
  if (parts.length !== 3) return false;
  
  // Check if all parts are valid hex strings
  const hexRegex = /^[0-9a-fA-F]+$/;
  return parts.every(part => part.length > 0 && hexRegex.test(part));
}

// Helper function to merge variables - supports both {var} and {{var}} patterns
function mergeVariables(template: string, data: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    // Replace both {{key}} (double braces) and {key} (single braces)
    const doubleRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    const singleRegex = new RegExp(`\\{${key}\\}`, 'g');
    const strValue = String(value || '');
    result = result.replace(doubleRegex, strValue);
    result = result.replace(singleRegex, strValue);
  }
  return result;
}

// Helper function to get base URL for the application
function getBaseUrl(): string {
  // Try to get from REPLIT_DOMAINS environment variable first
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    const domains = replitDomains.split(',');
    if (domains.length > 0) {
      return `https://${domains[0]}`;
    }
  }
  
  // Fallback to REPLIT_DEV_DOMAIN
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  if (devDomain) {
    return `https://${devDomain}`;
  }
  
  // Last resort fallback to localhost
  return 'http://localhost:5000';
}

// Helper function to convert relative image URLs to absolute URLs
function convertRelativeUrlsToAbsolute(html: string, baseUrl: string): string {
  // Match all <img> tags with src attributes
  const imgRegex = /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
  
  return html.replace(imgRegex, (match, beforeSrc, src, afterSrc) => {
    // Only convert relative URLs (starting with / but not //)
    if (src.startsWith('/') && !src.startsWith('//')) {
      const absoluteSrc = baseUrl + src;
      return `<img${beforeSrc}src="${absoluteSrc}"${afterSrc}>`;
    }
    // Return unchanged for absolute URLs or protocol-relative URLs
    return match;
  });
}

// Interface for inline image attachment
interface InlineImageAttachment {
  cid: string;
  content: Buffer;
  contentType: string;
}

// Extract base64 images from HTML and convert to inline CID attachments
function extractAndConvertBase64Images(html: string): {
  processedHtml: string;
  inlineAttachments: InlineImageAttachment[];
} {
  const inlineAttachments: InlineImageAttachment[] = [];
  let imageCounter = 0;
  
  // Match base64 image src in img tags: data:image/xxx;base64,xxxxxx
  const base64Regex = /<img([^>]*?)src=["'](data:image\/([a-zA-Z+]+);base64,([^"']+))["']([^>]*?)>/gi;
  
  const processedHtml = html.replace(base64Regex, (match, beforeSrc, fullDataUrl, mimeType, base64Data, afterSrc) => {
    try {
      imageCounter++;
      const cid = `inline-image-${imageCounter}-${Date.now()}`;
      
      // Get proper content type
      let contentType = `image/${mimeType}`;
      if (mimeType === 'svg+xml') {
        contentType = 'image/svg+xml';
      }
      
      // Decode base64 to buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      inlineAttachments.push({
        cid,
        content: imageBuffer,
        contentType,
      });
      
      // Replace base64 URL with cid: reference
      return `<img${beforeSrc}src="cid:${cid}"${afterSrc}>`;
    } catch (error) {
      console.error('Failed to process base64 image:', error);
      // Return original if processing fails
      return match;
    }
  });
  
  return { processedHtml, inlineAttachments };
}

// Generate PDF from quotation template HTML with merged data
export async function generateQuotationPDF(
  templateHtml: string,
  recipientData: Record<string, any>
): Promise<Buffer> {
  // Get base URL for converting relative image paths
  const baseUrl = getBaseUrl();
  
  // Convert relative image URLs to absolute URLs (so Puppeteer can load them)
  const htmlWithAbsoluteUrls = convertRelativeUrlsToAbsolute(templateHtml, baseUrl);
  
  // Replace {field} and {{field}} placeholders with actual data
  const renderedHtml = mergeVariables(htmlWithAbsoluteUrls, recipientData);

  // Find Chromium executable path
  let chromiumPath: string;
  try {
    chromiumPath = execSync('which chromium').toString().trim();
  } catch {
    // Fallback to default path if which command fails
    chromiumPath = '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium';
  }

  // Launch headless browser and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromiumPath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ],
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
  const { recipientEmail, recipientName, customData, subject, body, smtpConfig, quotationTemplateHtml, fileAttachments } = data;

  // Merge customData into subject and body
  const mergedData = {
    name: recipientName || '',
    email: recipientEmail,
    ...customData,
  };

  // Replace {field} and {{field}} placeholders with actual data
  const renderedSubject = mergeVariables(subject, mergedData);
  let renderedBody = mergeVariables(body, mergedData);

  // Extract base64 images and convert to inline CID attachments
  const { processedHtml, inlineAttachments } = extractAndConvertBase64Images(renderedBody);
  renderedBody = processedHtml;
  
  if (inlineAttachments.length > 0) {
    console.log(`[Email] Converted ${inlineAttachments.length} base64 image(s) to CID attachments`);
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

  // Collect all attachments
  let attachments: any[] = [];
  
  // 1. Add inline image attachments (converted from base64)
  for (const inlineImg of inlineAttachments) {
    attachments.push({
      filename: `image-${inlineImg.cid}.${inlineImg.contentType.split('/')[1] || 'png'}`,
      content: inlineImg.content,
      contentType: inlineImg.contentType,
      cid: inlineImg.cid, // Content-ID for inline display
      contentDisposition: 'inline', // Mark as inline attachment
    });
  }
  
  // 2. Generate PDF attachment if quotation template is provided
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

  // 3. Add user-uploaded file attachments
  if (fileAttachments && fileAttachments.length > 0) {
    for (const file of fileAttachments) {
      if (file.fileContent) {
        try {
          // Decode base64 content back to buffer
          const fileBuffer = Buffer.from(file.fileContent, 'base64');
          attachments.push({
            filename: file.originalName || file.filename,
            content: fileBuffer,
            contentType: file.mimeType || 'application/octet-stream',
          });
        } catch (error) {
          console.error(`Failed to attach file ${file.filename}:`, error);
          // Continue with other attachments if one fails
        }
      }
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
