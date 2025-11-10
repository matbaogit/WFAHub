#!/usr/bin/env node

/**
 * WFA Hub - Secrets Generator
 * 
 * Script này tạo SESSION_SECRET và ENCRYPTION_KEY ngẫu nhiên
 * để sử dụng trong file .env
 * 
 * Cách sử dụng:
 *   node generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 WFA Hub - Secrets Generator\n');
console.log('='.repeat(60));

// Generate SESSION_SECRET (64 characters hex = 32 bytes)
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('\n📝 SESSION_SECRET:');
console.log(sessionSecret);

// Generate ENCRYPTION_KEY (64 characters hex = 32 bytes)
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('\n🔑 ENCRYPTION_KEY:');
console.log(encryptionKey);

console.log('\n' + '='.repeat(60));
console.log('\n✅ Secrets đã được tạo thành công!');
console.log('\n📋 Copy 2 secrets trên vào file .env của bạn:');
console.log('\n   SESSION_SECRET=' + sessionSecret);
console.log('   ENCRYPTION_KEY=' + encryptionKey);
console.log('\n⚠️  LƯU Ý:');
console.log('   - Không share secrets này công khai');
console.log('   - Backup file .env vào nơi an toàn');
console.log('   - Trên production: chmod 600 .env\n');
