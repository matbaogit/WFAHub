import nodemailer from "nodemailer";
import puppeteer from "puppeteer";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
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
  fileAttachments?: CampaignAttachment[];
  pdfOptions?: PdfGenerationOptions;
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

// Get MIME type from file extension
function getMimeTypeFromExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon',
  };
  return mimeTypes[ext] || 'image/png';
}

// Extract all images (base64 and local file URLs) from HTML and convert to inline CID attachments
function extractAndConvertImagesToInline(html: string): {
  processedHtml: string;
  inlineAttachments: InlineImageAttachment[];
} {
  const inlineAttachments: InlineImageAttachment[] = [];
  let imageCounter = 0;
  let processedHtml = html;
  
  // 1. Process base64 images: data:image/xxx;base64,xxxxxx
  const base64Regex = /<img([^>]*?)src=["'](data:image\/([a-zA-Z+]+);base64,([^"']+))["']([^>]*?)>/gi;
  
  processedHtml = processedHtml.replace(base64Regex, (match, beforeSrc, fullDataUrl, mimeType, base64Data, afterSrc) => {
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
      
      console.log(`[Email] Converted base64 image to CID: ${cid}`);
      return `<img${beforeSrc}src="cid:${cid}"${afterSrc}>`;
    } catch (error) {
      console.error('Failed to process base64 image:', error);
      return match;
    }
  });
  
  // 2. Process local file URLs: /attached_assets/... or attached_assets/...
  const localFileRegex = /<img([^>]*?)src=["'](\/?(attached_assets\/[^"']+))["']([^>]*?)>/gi;
  
  processedHtml = processedHtml.replace(localFileRegex, (match, beforeSrc, fullPath, relativePath, afterSrc) => {
    try {
      // Normalize the path (remove leading slash if present)
      const normalizedPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
      const absolutePath = path.resolve(process.cwd(), normalizedPath);
      
      // Check if file exists
      if (!fs.existsSync(absolutePath)) {
        console.warn(`[Email] Local image file not found: ${absolutePath}`);
        return match;
      }
      
      imageCounter++;
      const cid = `inline-local-${imageCounter}-${Date.now()}`;
      
      // Read file content
      const imageBuffer = fs.readFileSync(absolutePath);
      const contentType = getMimeTypeFromExtension(absolutePath);
      
      inlineAttachments.push({
        cid,
        content: imageBuffer,
        contentType,
      });
      
      console.log(`[Email] Converted local file to CID: ${absolutePath} -> ${cid}`);
      return `<img${beforeSrc}src="cid:${cid}"${afterSrc}>`;
    } catch (error) {
      console.error('Failed to process local image file:', error);
      return match;
    }
  });
  
  return { processedHtml, inlineAttachments };
}

// Find a working Chromium path for PDF generation
async function findChromiumPath(): Promise<string | undefined> {
  // List of common Chromium paths to try
  const possiblePaths = [
    // System chromium (from which command)
    null, // Will try `which chromium`
    // Common Nix paths
    '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    // Common Linux paths
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    // Snap and flatpak
    '/snap/bin/chromium',
  ];

  // Try 'which chromium' first
  try {
    const chromiumFromWhich = execSync('which chromium 2>/dev/null').toString().trim();
    if (chromiumFromWhich && fs.existsSync(chromiumFromWhich)) {
      console.log(`[PDF] Found chromium via 'which': ${chromiumFromWhich}`);
      return chromiumFromWhich;
    }
  } catch {
    // Ignore - which command failed
  }

  // Try other paths
  for (const chromPath of possiblePaths) {
    if (chromPath && fs.existsSync(chromPath)) {
      console.log(`[PDF] Found chromium at: ${chromPath}`);
      return chromPath;
    }
  }

  // Return undefined to let Puppeteer use its bundled Chromium
  console.log('[PDF] No system chromium found, will use Puppeteer bundled Chromium');
  return undefined;
}

// Convert all images in HTML to base64 data URLs for PDF.co compatibility
async function convertAllImagesToBase64(html: string, baseUrl: string): Promise<string> {
  let processedHtml = html;
  
  // Regular expression to match all img tags with src attribute
  const imgRegex = /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
  
  // Collect all matches first
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(html)) !== null) {
    matches.push(match);
  }
  
  console.log(`[PDF.co] Found ${matches.length} image(s) to process`);
  
  // Helper function to try fetching an image with multiple fallback URLs
  async function tryFetchImage(urls: string[]): Promise<{ buffer: Buffer; mimeType: string } | null> {
    for (const url of urls) {
      try {
        console.log(`[PDF.co] Trying to fetch: ${url}`);
        const response = await fetch(url, { 
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(10000)
        });
        
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const contentType = response.headers.get('content-type');
          const mimeType = (contentType && contentType.startsWith('image/')) 
            ? contentType.split(';')[0] 
            : getMimeTypeFromExtension(url);
          console.log(`[PDF.co] Successfully fetched from: ${url}`);
          return { buffer, mimeType };
        }
      } catch (err) {
        console.log(`[PDF.co] Failed to fetch ${url}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    return null;
  }
  
  // Helper to extract relative path from URL containing attached_assets
  const extractAttachedAssetsPath = (url: string): string | null => {
    const pathMatch = url.match(/\/?(attached_assets\/[^\s"']+)/);
    return pathMatch ? pathMatch[1] : null;
  };
  
  for (const match of matches) {
    const [fullMatch, beforeSrc, src, afterSrc] = match;
    
    try {
      // Skip if already base64
      if (src.startsWith('data:')) {
        console.log(`[PDF.co] Image already base64, skipping`);
        continue;
      }
      
      let imageBuffer: Buffer | null = null;
      let mimeType = 'image/png';
      
      // Case 1: Absolute URL (http:// or https://) - CHECK THIS FIRST
      if (src.startsWith('http://') || src.startsWith('https://')) {
        // Check if this URL contains attached_assets - try to read locally first
        const localPath = extractAttachedAssetsPath(src);
        if (localPath) {
          const absolutePath = path.resolve(process.cwd(), localPath);
          if (fs.existsSync(absolutePath)) {
            imageBuffer = fs.readFileSync(absolutePath);
            mimeType = getMimeTypeFromExtension(absolutePath);
            console.log(`[PDF.co] Converted URL with attached_assets to local file: ${absolutePath}`);
          } else {
            // Try fetching from the original URL
            console.log(`[PDF.co] Local file not found for URL, fetching remotely: ${src}`);
            const result = await tryFetchImage([src]);
            if (result) {
              imageBuffer = result.buffer;
              mimeType = result.mimeType;
            }
          }
        } else {
          // Regular remote URL - just fetch it
          const result = await tryFetchImage([src]);
          if (result) {
            imageBuffer = result.buffer;
            mimeType = result.mimeType;
          }
        }
        
        if (!imageBuffer) {
          console.warn(`[PDF.co] Failed to process remote image, removing: ${src}`);
          processedHtml = processedHtml.replace(fullMatch, '');
          continue;
        }
      }
      // Case 2: Local file path starting with attached_assets/ (no leading slash)
      else if (src.startsWith('attached_assets/')) {
        const absolutePath = path.resolve(process.cwd(), src);
        if (fs.existsSync(absolutePath)) {
          imageBuffer = fs.readFileSync(absolutePath);
          mimeType = getMimeTypeFromExtension(absolutePath);
          console.log(`[PDF.co] Converted local path to base64: ${absolutePath}`);
        } else {
          console.warn(`[PDF.co] Local file not found, removing: ${absolutePath}`);
          processedHtml = processedHtml.replace(fullMatch, '');
          continue;
        }
      }
      // Case 3: Relative URL starting with / (including /attached_assets/...)
      else if (src.startsWith('/')) {
        const localPath = path.resolve(process.cwd(), src.slice(1));
        if (fs.existsSync(localPath)) {
          imageBuffer = fs.readFileSync(localPath);
          mimeType = getMimeTypeFromExtension(localPath);
          console.log(`[PDF.co] Converted relative path to base64: ${localPath}`);
        } else {
          // Try to fetch from server
          const absoluteUrl = baseUrl + src;
          const result = await tryFetchImage([absoluteUrl]);
          if (result) {
            imageBuffer = result.buffer;
            mimeType = result.mimeType;
          } else {
            console.warn(`[PDF.co] Could not fetch relative URL, removing: ${src}`);
            processedHtml = processedHtml.replace(fullMatch, '');
            continue;
          }
        }
      }
      
      // Convert to base64 and replace in HTML
      if (imageBuffer) {
        const base64 = imageBuffer.toString('base64');
        const dataUrl = `data:${mimeType};base64,${base64}`;
        const newImgTag = `<img${beforeSrc}src="${dataUrl}"${afterSrc}>`;
        processedHtml = processedHtml.replace(fullMatch, newImgTag);
        console.log(`[PDF.co] Replaced image with base64 (${Math.round(base64.length / 1024)}KB)`);
      }
    } catch (error) {
      console.error(`[PDF.co] Error processing image ${src}:`, error);
      // Remove broken image to avoid broken icon in PDF
      processedHtml = processedHtml.replace(fullMatch, '');
    }
  }
  
  return processedHtml;
}

// Generate PDF using PDF.co API
async function generatePDFWithPdfCo(
  renderedHtml: string,
  apiKey: string
): Promise<Buffer> {
  console.log('[PDF.co] Starting PDF generation via PDF.co API...');
  
  try {
    // Get base URL for relative paths
    const baseUrl = getBaseUrl();
    
    // Convert all images to base64 before sending to PDF.co
    console.log('[PDF.co] Converting images to base64...');
    const htmlWithBase64Images = await convertAllImagesToBase64(renderedHtml, baseUrl);
    console.log(`[PDF.co] HTML prepared, length: ${htmlWithBase64Images.length} chars`);
    
    // PDF.co HTML to PDF endpoint
    const response = await fetch('https://api.pdf.co/v1/pdf/convert/from/html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        html: htmlWithBase64Images,
        name: 'quotation.pdf',
        margins: '20mm 15mm 20mm 15mm', // top right bottom left
        paperSize: 'A4',
        orientation: 'Portrait',
        printBackground: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PDF.co] API error:', response.status, errorText);
      throw new Error(`PDF.co API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (result.error) {
      console.error('[PDF.co] API returned error:', result.message);
      throw new Error(`PDF.co error: ${result.message}`);
    }

    // PDF.co returns a URL to the generated PDF, we need to download it
    const pdfUrl = result.url;
    console.log('[PDF.co] PDF generated, downloading from:', pdfUrl);

    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF from PDF.co: ${pdfResponse.status}`);
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    console.log(`[PDF.co] PDF downloaded successfully, size: ${pdfBuffer.length} bytes`);
    
    return pdfBuffer;
  } catch (error) {
    console.error('[PDF.co] Error generating PDF:', error);
    throw error;
  }
}

// Generate PDF using Puppeteer (local Chromium)
async function generatePDFWithPuppeteer(
  renderedHtml: string
): Promise<Buffer> {
  console.log('[PDF] Starting PDF generation with Puppeteer...');

  // Find Chromium executable path (may return undefined to use bundled)
  const chromiumPath = await findChromiumPath();

  // Launch options
  const launchOptions: any = {
    headless: true,
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
  };

  // Only set executablePath if we found a system chromium
  if (chromiumPath) {
    launchOptions.executablePath = chromiumPath;
    console.log(`[PDF] Using system Chromium: ${chromiumPath}`);
  } else {
    console.log('[PDF] Using Puppeteer bundled Chromium');
  }

  let browser;
  try {
    console.log('[PDF] Launching browser...');
    browser = await puppeteer.launch(launchOptions);
    console.log('[PDF] Browser launched successfully');

    const page = await browser.newPage();
    console.log('[PDF] Page created, setting content...');
    
    await page.setContent(renderedHtml, { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('[PDF] Content set, generating PDF...');
    
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

    console.log(`[PDF] PDF generated successfully, size: ${pdfBuffer.length} bytes`);
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('[PDF] Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('[PDF] Browser closed');
    }
  }
}

// PDF generation options
export interface PdfGenerationOptions {
  method: 'puppeteer' | 'pdfco';
  pdfcoApiKey?: string;
}

// Main function: Generate PDF from quotation template HTML with merged data
// Supports two methods: 'puppeteer' (local Chromium) or 'pdfco' (PDF.co API)
export async function generateQuotationPDF(
  templateHtml: string,
  recipientData: Record<string, any>,
  options?: PdfGenerationOptions
): Promise<Buffer> {
  console.log('[PDF] Starting PDF generation...');
  
  // Get base URL for converting relative image paths
  const baseUrl = getBaseUrl();
  console.log(`[PDF] Base URL for images: ${baseUrl}`);
  
  // Convert relative image URLs to absolute URLs
  const htmlWithAbsoluteUrls = convertRelativeUrlsToAbsolute(templateHtml, baseUrl);
  
  // Replace {field} and {{field}} placeholders with actual data
  const renderedHtml = mergeVariables(htmlWithAbsoluteUrls, recipientData);
  console.log(`[PDF] Rendered HTML length: ${renderedHtml.length} chars`);

  // Choose PDF generation method based on options
  const method = options?.method || 'puppeteer';
  console.log(`[PDF] Using generation method: ${method}`);

  if (method === 'pdfco' && options?.pdfcoApiKey) {
    // Use PDF.co API
    return generatePDFWithPdfCo(renderedHtml, options.pdfcoApiKey);
  } else {
    // Default to Puppeteer (local Chromium)
    return generatePDFWithPuppeteer(renderedHtml);
  }
}

export async function sendCampaignEmail(data: CampaignEmailData): Promise<void> {
  const { recipientEmail, recipientName, customData, subject, body, smtpConfig, quotationTemplateHtml, fileAttachments, pdfOptions } = data;

  // Merge customData into subject and body
  const mergedData = {
    name: recipientName || '',
    email: recipientEmail,
    ...customData,
  };

  // Replace {field} and {{field}} placeholders with actual data
  const renderedSubject = mergeVariables(subject, mergedData);
  let renderedBody = mergeVariables(body, mergedData);

  // Extract all images (base64 + local files) and convert to inline CID attachments
  const { processedHtml, inlineAttachments } = extractAndConvertImagesToInline(renderedBody);
  renderedBody = processedHtml;
  
  if (inlineAttachments.length > 0) {
    console.log(`[Email] Converted ${inlineAttachments.length} image(s) to CID attachments`);
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
      const pdfBuffer = await generateQuotationPDF(quotationTemplateHtml, mergedData, pdfOptions);
      attachments.push({
        filename: `Bao_Gia_${recipientName || 'KhachHang'}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
      console.log(`[Email] PDF attachment generated successfully`);
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
