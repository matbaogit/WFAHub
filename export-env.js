#!/usr/bin/env node

/**
 * WFA Hub - Export Environment Variables
 * 
 * Script này export các environment variables từ Replit secrets vào file .env
 * để chuẩn bị cho việc deploy lên server riêng
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n📦 WFA Hub - Export Environment Variables\n');
console.log('='.repeat(60));

// Danh sách các environment variables cần export
const envVars = [
  'DATABASE_URL',
  'PGHOST',
  'PGPORT',
  'PGUSER',
  'PGPASSWORD',
  'PGDATABASE',
  'SESSION_SECRET',
  'ENCRYPTION_KEY',
  'NODE_ENV',
  'PORT'
];

let envContent = `# WFA Hub - Environment Variables
# File được tạo tự động từ Replit secrets
# Ngày tạo: ${new Date().toLocaleString('vi-VN')}

`;

let foundCount = 0;
let missingVars = [];

envVars.forEach(varName => {
  const value = process.env[varName];
  
  if (value) {
    envContent += `${varName}=${value}\n`;
    foundCount++;
    console.log(`✅ ${varName}: Đã export`);
  } else {
    missingVars.push(varName);
    console.log(`⚠️  ${varName}: Không tìm thấy (bỏ qua)`);
  }
});

// Ghi file .env
const envPath = path.join(__dirname, '.env');
fs.writeFileSync(envPath, envContent, 'utf8');

console.log('\n' + '='.repeat(60));
console.log(`\n✅ Đã export ${foundCount}/${envVars.length} biến môi trường vào file .env`);

if (missingVars.length > 0) {
  console.log(`\n⚠️  Thiếu ${missingVars.length} biến:`);
  missingVars.forEach(v => console.log(`   - ${v}`));
  console.log('\n💡 Bạn có thể thêm thủ công vào file .env nếu cần');
}

console.log(`\n📁 File location: ${envPath}`);
console.log('\n🔒 Bảo mật file .env:');
console.log('   chmod 600 .env');
console.log('\n✅ Hoàn tất!\n');
