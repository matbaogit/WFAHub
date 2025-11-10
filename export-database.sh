#!/bin/bash

###############################################################################
# WFA Hub - Export Database Script
# 
# Script này export toàn bộ schema và data từ database hiện tại
# thành file SQL để import vào PostgreSQL server mới
###############################################################################

echo "======================================================================"
echo "  WFA Hub - Database Export"
echo "======================================================================"
echo ""

# Load environment variables từ .env nếu có
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Kiểm tra DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Lỗi: DATABASE_URL không được set"
    echo "   Vui lòng chạy: node export-env.js trước"
    exit 1
fi

# Tạo thư mục backups nếu chưa có
BACKUP_DIR="./database-backups"
mkdir -p "$BACKUP_DIR"

# Tên file backup với timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/wfahub_backup_$TIMESTAMP.sql"

echo "📦 Đang export database..."
echo "   Source: $DATABASE_URL"
echo "   Destination: $BACKUP_FILE"
echo ""

# Export database sử dụng pg_dump
# --clean: Thêm lệnh DROP trước CREATE
# --if-exists: Thêm IF EXISTS vào lệnh DROP
# --no-owner: Không set ownership
# --no-acl: Không set permissions
pg_dump "$DATABASE_URL" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    --file="$BACKUP_FILE"

# Kiểm tra kết quả
if [ $? -eq 0 ]; then
    # Nén file backup
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    # Lấy kích thước file
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    
    echo ""
    echo "======================================================================"
    echo "✅ Export database thành công!"
    echo "======================================================================"
    echo ""
    echo "📁 File backup: $BACKUP_FILE"
    echo "📊 Kích thước: $SIZE"
    echo ""
    echo "🔄 Bước tiếp theo:"
    echo "   1. Copy file $BACKUP_FILE sang server mới"
    echo "   2. Chạy script import-database.sh trên server mới"
    echo ""
    echo "💡 Hoặc import trực tiếp:"
    echo "   gunzip -c $BACKUP_FILE | psql <NEW_DATABASE_URL>"
    echo ""
else
    echo ""
    echo "======================================================================"
    echo "❌ Export database thất bại!"
    echo "======================================================================"
    echo ""
    echo "Vui lòng kiểm tra:"
    echo "  - DATABASE_URL có đúng không"
    echo "  - pg_dump đã được cài đặt chưa (sudo apt install postgresql-client)"
    echo "  - Network connection đến database server"
    echo ""
    exit 1
fi
