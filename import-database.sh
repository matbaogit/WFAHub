#!/bin/bash

###############################################################################
# WFA Hub - Import Database Script
# 
# Script này import database từ file SQL dump vào PostgreSQL server mới
###############################################################################

echo "======================================================================"
echo "  WFA Hub - Database Import"
echo "======================================================================"
echo ""

# Kiểm tra arguments
if [ $# -eq 0 ]; then
    echo "❌ Lỗi: Thiếu file SQL dump"
    echo ""
    echo "Cách dùng:"
    echo "  ./import-database.sh <backup-file.sql.gz>"
    echo ""
    echo "Ví dụ:"
    echo "  ./import-database.sh ./database-backups/wfahub_backup_20241110_045500.sql.gz"
    echo ""
    exit 1
fi

BACKUP_FILE=$1

# Kiểm tra file có tồn tại không
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Lỗi: File không tồn tại: $BACKUP_FILE"
    exit 1
fi

# Load environment variables từ .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Kiểm tra DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Lỗi: DATABASE_URL không được set"
    echo ""
    echo "Vui lòng:"
    echo "  1. Tạo file .env với DATABASE_URL mới"
    echo "  2. Hoặc set environment variable: export DATABASE_URL=postgresql://..."
    echo ""
    exit 1
fi

echo "📦 Thông tin import:"
echo "   Source file: $BACKUP_FILE"
echo "   Target DB: $DATABASE_URL"
echo ""

# Xác nhận từ user
read -p "⚠️  Bạn có chắc muốn import database? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Đã hủy import"
    exit 0
fi

echo ""
echo "🔄 Đang import database..."
echo ""

# Import database
if [[ $BACKUP_FILE == *.gz ]]; then
    # File đã nén - giải nén và pipe vào psql
    gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
else
    # File chưa nén - import trực tiếp
    psql "$DATABASE_URL" < "$BACKUP_FILE"
fi

# Kiểm tra kết quả
if [ $? -eq 0 ]; then
    echo ""
    echo "======================================================================"
    echo "✅ Import database thành công!"
    echo "======================================================================"
    echo ""
    echo "🔄 Bước tiếp theo:"
    echo "   1. Verify data: psql \"$DATABASE_URL\" -c '\\dt'"
    echo "   2. Test application: npm run dev"
    echo "   3. Run migrations nếu cần: npm run db:push"
    echo ""
else
    echo ""
    echo "======================================================================"
    echo "❌ Import database thất bại!"
    echo "======================================================================"
    echo ""
    echo "Vui lòng kiểm tra:"
    echo "  - DATABASE_URL có đúng không"
    echo "  - User có quyền CREATE TABLE không"
    echo "  - Database đã tồn tại chưa"
    echo "  - psql đã được cài đặt chưa"
    echo ""
    exit 1
fi
