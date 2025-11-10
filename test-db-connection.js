#!/usr/bin/env node

/**
 * WFA Hub - Test Database Connection
 * 
 * Script này test kết nối trực tiếp đến PostgreSQL database
 * để debug lỗi authentication
 */

import pg from 'pg';

const { Client } = pg;

console.log('\n🔍 Testing Database Connection...\n');
console.log('='.repeat(60));

// Load DATABASE_URL từ environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('❌ DATABASE_URL không được set trong environment variables');
  console.log('   Vui lòng cập nhật Replit Secrets');
  process.exit(1);
}

console.log('\n📋 Connection Info:');
console.log('   URL:', databaseUrl.replace(/:[^:@]+@/, ':***@')); // Hide password

// Parse URL để hiển thị chi tiết
try {
  const url = new URL(databaseUrl);
  console.log('   Host:', url.hostname);
  console.log('   Port:', url.port);
  console.log('   Database:', url.pathname.substring(1));
  console.log('   Username:', url.username);
  console.log('   Password:', url.password ? '***' + url.password.slice(-4) : 'N/A');
  console.log('   SSL Mode:', url.searchParams.get('sslmode') || 'default');
} catch (e) {
  console.log('   (Không parse được URL)');
}

console.log('\n🔄 Attempting to connect...\n');

const client = new Client({
  connectionString: databaseUrl,
});

client.connect()
  .then(() => {
    console.log('✅ Kết nối thành công!\n');
    
    // Test query
    return client.query('SELECT version(), current_database(), current_user');
  })
  .then((result) => {
    console.log('📊 Database Info:');
    console.log('   PostgreSQL Version:', result.rows[0].version.split(' ')[1]);
    console.log('   Current Database:', result.rows[0].current_database);
    console.log('   Current User:', result.rows[0].current_user);
    console.log('\n');
    
    // Check tables
    return client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
  })
  .then((result) => {
    console.log('📁 Tables trong database:');
    if (result.rows.length === 0) {
      console.log('   (Chưa có table nào - database mới)');
    } else {
      result.rows.forEach(row => {
        console.log('   -', row.table_name);
      });
    }
    console.log('\n');
    console.log('='.repeat(60));
    console.log('✅ Test hoàn tất - Database connection OK!\n');
    
    client.end();
    process.exit(0);
  })
  .catch((error) => {
    console.log('❌ Lỗi kết nối:\n');
    console.log('   Error:', error.message);
    console.log('\n');
    
    if (error.message.includes('password authentication failed')) {
      console.log('💡 Gợi ý:');
      console.log('   1. Kiểm tra username/password có đúng không');
      console.log('   2. Đảm bảo user đã được tạo trên PostgreSQL server');
      console.log('   3. Kiểm tra pg_hba.conf cho phép kết nối từ Replit');
      console.log('   4. Nếu password có ký tự đặc biệt, đảm bảo đã encode:');
      console.log('      $ → %24, * → %2A, @ → %40, # → %23');
    } else if (error.message.includes('does not support SSL')) {
      console.log('💡 Gợi ý:');
      console.log('   Thêm ?sslmode=disable vào cuối DATABASE_URL');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('💡 Gợi ý:');
      console.log('   Database chưa được tạo trên server');
      console.log('   Chạy: CREATE DATABASE toanclm_wfahub;');
    }
    console.log('\n');
    
    client.end();
    process.exit(1);
  });
