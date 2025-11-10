# 🚀 Hướng dẫn Deploy WFA Hub lên Server riêng

Tài liệu này hướng dẫn chi tiết cách deploy ứng dụng WFA Hub lên server VPS/dedicated server của bạn.

## 📋 Yêu cầu hệ thống

### Phần mềm bắt buộc
- **Node.js**: 18.x hoặc cao hơn
- **PostgreSQL**: 14.x hoặc cao hơn  
- **npm**: 9.x hoặc cao hơn
- **Git**: Để clone repository

### Cấu hình server khuyến nghị
- **RAM**: Tối thiểu 2GB (Puppeteer cần nhiều RAM)
- **CPU**: 2 cores
- **Storage**: 10GB trống
- **OS**: Ubuntu 20.04/22.04, Debian 11, hoặc CentOS 8

---

## 📦 Bước 1: Cài đặt phần mềm

### Ubuntu/Debian

```bash
# Cập nhật package list
sudo apt update && sudo apt upgrade -y

# Cài Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Cài các dependencies cho Puppeteer
sudo apt-get install -y \
  chromium-browser \
  libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 \
  libasound2 libpangocairo-1.0-0 libatk1.0-0 \
  libatk-bridge2.0-0 libgtk-3-0 libgbm1

# Kiểm tra versions
node --version   # v18.x.x
npm --version    # 9.x.x
psql --version   # 14.x
```

### CentOS/RHEL

```bash
# Cài Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Cài PostgreSQL
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Cài dependencies cho Puppeteer
sudo yum install -y \
  chromium \
  liberation-fonts \
  nss atk cups-libs gtk3 \
  libXScrnSaver alsa-lib
```

---

## 🗄️ Bước 2: Setup PostgreSQL Database

### 2.1. Tạo Database và User

```bash
# Đăng nhập PostgreSQL
sudo -u postgres psql

# Chạy các lệnh SQL sau:
```

```sql
-- Tạo user
CREATE USER wfahub_user WITH PASSWORD 'your_secure_password_here';

-- Tạo database
CREATE DATABASE wfahub OWNER wfahub_user;

-- Kết nối vào database
\c wfahub

-- Grant quyền cho user
GRANT ALL PRIVILEGES ON DATABASE wfahub TO wfahub_user;
GRANT ALL ON SCHEMA public TO wfahub_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wfahub_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO wfahub_user;

-- Cho phép user tạo tables trong tương lai
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO wfahub_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO wfahub_user;

-- Thoát psql
\q
```

### 2.2. Cho phép kết nối từ localhost (nếu cần)

Chỉnh sửa file `pg_hba.conf`:

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Thêm dòng sau (nếu chưa có):
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   wfahub          wfahub_user                             md5
host    wfahub          wfahub_user     127.0.0.1/32            md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

---

## 📥 Bước 3: Clone Code từ Git

```bash
# Tạo thư mục cho app
sudo mkdir -p /var/www
cd /var/www

# Clone repository
sudo git clone <your-git-repo-url> wfahub
cd wfahub

# Phân quyền cho user hiện tại
sudo chown -R $USER:$USER /var/www/wfahub
```

---

## 🔐 Bước 4: Cấu hình Environment Variables

### 4.1. Tạo Secrets

```bash
# Chạy script tạo secrets
node generate-secrets.js
```

Script sẽ in ra `SESSION_SECRET` và `ENCRYPTION_KEY`. **Lưu lại** 2 giá trị này.

### 4.2. Tạo file .env

```bash
# Copy template
cp .env.example .env

# Chỉnh sửa file .env
nano .env
```

Điền các giá trị sau vào file `.env`:

```bash
# Database (thay your_secure_password_here bằng password bạn đã tạo ở Bước 2)
DATABASE_URL=postgresql://wfahub_user:your_secure_password_here@localhost:5432/wfahub
PGHOST=localhost
PGPORT=5432
PGUSER=wfahub_user
PGPASSWORD=your_secure_password_here
PGDATABASE=wfahub

# Secrets (copy từ output của generate-secrets.js)
SESSION_SECRET=<paste-session-secret-here>
ENCRYPTION_KEY=<paste-encryption-key-here>

# App config
NODE_ENV=production
PORT=5000
```

### 4.3. Bảo mật file .env

```bash
# Chỉ owner mới đọc được
chmod 600 .env

# Kiểm tra
ls -la .env
# Kết quả: -rw------- 1 user user 1234 Nov 10 10:00 .env
```

---

## 🔨 Bước 5: Build và Deploy

### 5.1. Install Dependencies

```bash
npm install
```

### 5.2. Push Database Schema

```bash
# Tạo tables trong database
npm run db:push
```

Nếu gặp lỗi, dùng:
```bash
npm run db:push -- --force
```

### 5.3. Build Frontend

```bash
npm run build
```

---

## 🚀 Bước 6: Chạy Application

### Cách 1: PM2 (Khuyến nghị cho Production)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start app
pm2 start npm --name "wfahub" -- run dev

# Xem logs
pm2 logs wfahub

# Restart app
pm2 restart wfahub

# Stop app
pm2 stop wfahub

# Enable auto-start khi reboot
pm2 startup
# Copy và chạy lệnh mà PM2 suggest

# Save PM2 process list
pm2 save
```

### Cách 2: Systemd Service

Tạo file `/etc/systemd/system/wfahub.service`:

```bash
sudo nano /etc/systemd/system/wfahub.service
```

Nội dung:

```ini
[Unit]
Description=WFA Hub - Workflow Automation Platform
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/wfahub
Environment="NODE_ENV=production"
EnvironmentFile=/var/www/wfahub/.env
ExecStart=/usr/bin/npm run dev
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Khởi động service:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start
sudo systemctl enable wfahub

# Start service
sudo systemctl start wfahub

# Kiểm tra status
sudo systemctl status wfahub

# Xem logs
sudo journalctl -u wfahub -f
```

---

## 🌐 Bước 7: Nginx Reverse Proxy (Optional nhưng khuyến nghị)

### 7.1. Cài Nginx

```bash
sudo apt install -y nginx
```

### 7.2. Cấu hình Virtual Host

Tạo file `/etc/nginx/sites-available/wfahub`:

```bash
sudo nano /etc/nginx/sites-available/wfahub
```

Nội dung:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS (nếu có SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Tăng timeout cho PDF generation
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    proxy_read_timeout 300;
    send_timeout 300;
}
```

### 7.3. Enable site

```bash
# Tạo symlink
sudo ln -s /etc/nginx/sites-available/wfahub /etc/nginx/sites-enabled/

# Kiểm tra config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 7.4. SSL với Let's Encrypt (Khuyến nghị)

```bash
# Cài Certbot
sudo apt install -y certbot python3-certbot-nginx

# Lấy SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew đã được setup tự động
```

---

## ✅ Bước 8: Kiểm tra & Hoàn tất

### 8.1. Test Application

```bash
# Truy cập app
curl http://localhost:5000

# Hoặc mở browser
# http://your-server-ip:5000
# hoặc http://yourdomain.com (nếu dùng Nginx)
```

### 8.2. Tạo Admin User đầu tiên

Truy cập app qua browser và đăng ký tài khoản đầu tiên. Sau đó set role admin:

```bash
# Kết nối database
sudo -u postgres psql wfahub

# Update user đầu tiên thành admin
UPDATE users SET role = 'admin' WHERE id = (SELECT id FROM users ORDER BY "createdAt" LIMIT 1);

# Kiểm tra
SELECT id, username, email, role FROM users;

\q
```

### 8.3. Test các tính năng

- ✅ Login/Register
- ✅ Tạo Price List & Import Services
- ✅ Tạo Quotation Template
- ✅ Tạo Email Template  
- ✅ Cấu hình SMTP (qua UI popup)
- ✅ Tạo và gửi Bulk Campaign
- ✅ Verify PDF generation
- ✅ Check uploaded images

---

## 🔥 Firewall Configuration

### Ubuntu (UFW)

```bash
# Allow SSH (nếu chưa có)
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Nếu không dùng Nginx, allow port 5000
# sudo ufw allow 5000/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 📊 Monitoring & Logs

### PM2 Logs
```bash
pm2 logs wfahub
pm2 monit
```

### Systemd Logs
```bash
sudo journalctl -u wfahub -f
sudo journalctl -u wfahub --since today
```

### Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Application Logs
```bash
# Nếu app ghi log ra file
tail -f /var/www/wfahub/logs/app.log
```

---

## 🔄 Update Application

```bash
cd /var/www/wfahub

# Pull latest code
git pull origin main

# Install new dependencies (nếu có)
npm install

# Push DB changes (nếu có)
npm run db:push

# Rebuild frontend
npm run build

# Restart app
pm2 restart wfahub
# hoặc
sudo systemctl restart wfahub
```

---

## 🛡️ Security Checklist

- [ ] File `.env` có permission 600
- [ ] PostgreSQL chỉ listen localhost (nếu DB cùng server)
- [ ] Firewall đã cấu hình đúng
- [ ] SSH key-based auth (disable password login)
- [ ] SSL certificate đã cài (Let's Encrypt)
- [ ] Regular backups cho database
- [ ] Update OS security patches thường xuyên
- [ ] Strong password cho PostgreSQL
- [ ] Session secret và encryption key đủ mạnh

---

## 💾 Backup Strategy

### Database Backup

```bash
# Tạo script backup
sudo nano /usr/local/bin/backup-wfahub.sh
```

Nội dung:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/wfahub"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U wfahub_user wfahub | gzip > $BACKUP_DIR/wfahub_db_$DATE.sql.gz

# Backup uploaded files
tar -czf $BACKUP_DIR/wfahub_files_$DATE.tar.gz /var/www/wfahub/attached_assets/

# Giữ lại 7 ngày backup
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Phân quyền
sudo chmod +x /usr/local/bin/backup-wfahub.sh

# Test backup
sudo /usr/local/bin/backup-wfahub.sh

# Setup cron job (chạy hàng ngày lúc 2AM)
sudo crontab -e

# Thêm dòng:
0 2 * * * /usr/local/bin/backup-wfahub.sh >> /var/log/wfahub-backup.log 2>&1
```

---

## 🆘 Troubleshooting

### App không start

```bash
# Kiểm tra logs
pm2 logs wfahub --lines 100

# Kiểm tra database connection
psql -U wfahub_user -d wfahub -h localhost
```

### Puppeteer lỗi

```bash
# Set executable path trong .env
echo 'PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser' >> .env

# Hoặc cài thêm dependencies
sudo apt install -y libgbm1 libnss3 libnspr4 libasound2
```

### Permission errors

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/wfahub

# Fix .env permission
chmod 600 /var/www/wfahub/.env
```

### Port đã được dùng

```bash
# Check port 5000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>
```

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Application logs
2. Database connection
3. Environment variables
4. File permissions
5. Firewall settings

---

**Chúc bạn deploy thành công! 🎉**
