# 🔧 Hướng dẫn khắc phục lỗi kết nối Database

## ❌ Vấn đề hiện tại

```
Error: password authentication failed for user "toanclm_wfahub"
```

## ✅ Các bước khắc phục

### Bước 1: Kiểm tra PostgreSQL Server đang chạy

```bash
sudo systemctl status postgresql
```

Nếu không chạy:
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

### Bước 2: Đăng nhập PostgreSQL với user postgres

```bash
sudo -u postgres psql
```

---

### Bước 3: Kiểm tra user đã tồn tại chưa

```sql
-- List tất cả users
\du

-- Hoặc
SELECT usename FROM pg_user;
```

**Nếu user `toanclm_wfahub` chưa có**, tạo mới:

```sql
CREATE USER toanclm_wfahub WITH PASSWORD 'LWkjca7vk5$H*y9h';
```

**Nếu user đã có nhưng password sai**, đổi password:

```sql
ALTER USER toanclm_wfahub WITH PASSWORD 'LWkjca7vk5$H*y9h';
```

---

### Bước 4: Kiểm tra database đã tồn tại chưa

```sql
-- List tất cả databases
\l

-- Hoặc
SELECT datname FROM pg_database;
```

**Nếu database `toanclm_wfahub` chưa có**, tạo mới:

```sql
CREATE DATABASE toanclm_wfahub OWNER toanclm_wfahub;
```

---

### Bước 5: Grant quyền cho user

```sql
-- Kết nối vào database
\c toanclm_wfahub

-- Grant tất cả quyền
GRANT ALL PRIVILEGES ON DATABASE toanclm_wfahub TO toanclm_wfahub;
GRANT ALL ON SCHEMA public TO toanclm_wfahub;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO toanclm_wfahub;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO toanclm_wfahub;

-- Cho phép tạo tables mới
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO toanclm_wfahub;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO toanclm_wfahub;

-- Thoát psql
\q
```

---

### Bước 6: Cấu hình cho phép kết nối từ xa

#### A. Chỉnh sửa `postgresql.conf`

```bash
# Tìm file config
sudo find / -name postgresql.conf 2>/dev/null

# Hoặc thường ở:
sudo nano /etc/postgresql/14/main/postgresql.conf
# hoặc
sudo nano /var/lib/pgsql/14/data/postgresql.conf
```

Tìm và sửa dòng:
```
listen_addresses = '*'
```

Bỏ comment (xóa dấu `#` ở đầu) nếu cần.

#### B. Chỉnh sửa `pg_hba.conf`

```bash
# Tìm file
sudo find / -name pg_hba.conf 2>/dev/null

# Hoặc:
sudo nano /etc/postgresql/14/main/pg_hba.conf
# hoặc
sudo nano /var/lib/pgsql/14/data/pg_hba.conf
```

**Thêm các dòng sau vào cuối file:**

```
# TYPE  DATABASE            USER                ADDRESS                 METHOD

# Cho phép kết nối local
local   toanclm_wfahub      toanclm_wfahub                              md5

# Cho phép kết nối từ localhost
host    toanclm_wfahub      toanclm_wfahub      127.0.0.1/32            md5

# Cho phép kết nối từ mọi IP (hoặc thay bằng IP cụ thể của Replit)
host    toanclm_wfahub      toanclm_wfahub      0.0.0.0/0               md5
host    all                 all                 0.0.0.0/0               md5
```

**Lưu ý bảo mật:** Nếu muốn an toàn hơn, chỉ cho phép IP cụ thể thay vì `0.0.0.0/0`

---

### Bước 7: Kiểm tra Firewall

```bash
# Ubuntu/Debian - UFW
sudo ufw allow 5432/tcp
sudo ufw reload
sudo ufw status

# CentOS/RHEL - Firewalld
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

---

### Bước 8: Restart PostgreSQL

```bash
sudo systemctl restart postgresql
sudo systemctl status postgresql
```

---

### Bước 9: Test kết nối từ local

Trước khi test từ Replit, test từ server local:

```bash
# Test từ localhost
psql -h localhost -U toanclm_wfahub -d toanclm_wfahub

# Test từ IP external
psql -h 103.138.88.63 -U toanclm_wfahub -d toanclm_wfahub
```

Nhập password: `LWkjca7vk5$H*y9h`

Nếu kết nối thành công, bạn sẽ thấy prompt:
```
toanclm_wfahub=>
```

Thử query:
```sql
SELECT version();
\dt
```

Thoát:
```sql
\q
```

---

### Bước 10: Test từ Replit

Sau khi đã test thành công từ local, quay lại Replit và báo cho tôi biết.

---

## 🔍 Debug bổ sung

### Kiểm tra PostgreSQL logs

```bash
# Ubuntu/Debian
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# CentOS/RHEL
sudo tail -f /var/lib/pgsql/14/data/log/postgresql-*.log
```

Quan sát logs khi có connection attempt để thấy chi tiết lỗi.

---

## 📞 Checklist tổng hợp

- [ ] PostgreSQL service đang chạy
- [ ] User `toanclm_wfahub` đã được tạo
- [ ] Password đã được set đúng: `LWkjca7vk5$H*y9h`
- [ ] Database `toanclm_wfahub` đã được tạo
- [ ] User đã được GRANT đầy đủ quyền
- [ ] `postgresql.conf` có `listen_addresses = '*'`
- [ ] `pg_hba.conf` cho phép kết nối từ xa
- [ ] Firewall cho phép port 5432
- [ ] PostgreSQL đã được restart
- [ ] Test connection từ local thành công

---

## 💡 Lưu ý

1. **Password có ký tự đặc biệt:** Khi nhập trong SQL, không cần encode. Chỉ cần encode trong DATABASE_URL.

2. **Nếu vẫn lỗi authentication:**
   - Thử xóa user và tạo lại:
     ```sql
     DROP USER toanclm_wfahub;
     CREATE USER toanclm_wfahub WITH PASSWORD 'LWkjca7vk5$H*y9h';
     ```

3. **Kiểm tra authentication method trong pg_hba.conf:**
   - `md5`: Yêu cầu password (khuyến nghị)
   - `trust`: Không yêu cầu password (không an toàn)
   - `peer`: Chỉ cho local connections

---

Sau khi hoàn thành các bước trên, hãy cho tôi biết kết quả! 🚀
