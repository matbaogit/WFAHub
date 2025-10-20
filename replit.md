# WFA Hub - Workflow Automation Platform

## Overview

WFA Hub is a Vietnamese-language web application offering ready-made automation templates for business users. It enables non-coders to execute workflows like sending emails, creating quotations, and managing approvals. The platform is built with React, Express, and PostgreSQL, focusing on a clean, productivity-centric design inspired by Linear.app and Framer Dashboard. The project aims to provide a comprehensive workflow automation solution, including a robust quotation management system and an admin panel for system oversight.

## Recent Changes (October 2025)

**Bulk Email Campaign Module - Complete UI Improvements (October 20, 2025)**
- **Wizard Step 2 Enhancement**: Quotation template selection with dropdown + auto-preview
  - Changed from card selection to Select dropdown for better UX
  - Preview automatically displays selected template's HTML content (read-only)
  - Full HTML rendering in scrollable preview section
- **Wizard Step 3 Enhancement**: Email template dropdown with auto-fill
  - Added optional email template selector (Select dropdown)
  - Auto-fills emailSubject and emailBody when template selected
  - Preview shows filled content (HTML if starts with '<', plain text otherwise)
- **Wizard Step 4 - SMTP Validation**: Alert notification if SMTP not configured
  - Query `/api/smtp-config` to check if user has SMTP setup
  - Show red Alert with link "Cấu hình SMTP ngay" opening /smtp-config in new tab
  - Prevents campaign creation without valid SMTP config
- **SMTP Config Page - Test Email Feature**: Dialog for testing SMTP with recipient input
  - Added "Test Email" button opens dialog with email input field
  - User enters recipient email → sends test email via new endpoint
  - Backend endpoint POST `/api/smtp-config/test` with nodemailer integration
  - Verifies SMTP connection, sends formatted test email with config info
  - Enhanced error handling with specific SMTP error messages
- **Templates Page - Bulk Campaign Shortcut**: "Gửi báo giá" template now navigates to wizard
  - Template card "Chạy ngay" button checks if template is "Gửi báo giá"
  - Instead of opening execution modal → navigate directly to `/bulk-campaigns`
  - Streamlined flow: Templates → Bulk Campaigns wizard
- **Sidebar Navigation**: "Gửi Báo Giá" link now clickable, navigates to `/bulk-campaigns` list
- **Remaining Work**: Email sending service with queue system, PDF generation per recipient, merge customData into quotation templates, SMTP integration with rate limiting

**Previous Work - Bulk Email Campaign Module - Complete Vietnamese Localization (October 20, 2025)**
- **Complete Vietnamese UI**: All bulk campaign pages fully Vietnamese-ized
- **Database Schema Enhancement**: Extended bulk campaign tables with tracking & template integration
- **Tracking Pixel Implementation**: Public endpoint GET `/api/track/open/:campaignId/:recipientId`
- **4-Step Campaign Wizard** (`/bulk-campaigns/new`): Excel/CSV upload, template selection, email composition, review & send
- **Campaign Detail Page** (`/bulk-campaigns/:id`): Stats dashboard, progress chart, email preview, recipient table, CSV export
- **Frontend List Page** (`/bulk-campaigns`): Stats cards, clickable rows, status badges, delete confirmation

**Service Catalog Module - Refactored UI (October 16, 2025)**
- **Streamlined 2-Tab Interface**:
  - **Bảng Giá (Price Lists)** - Default tab with dual-view system:
    - **List View**: Grid layout showing all price lists as cards (package icon, name, description, service count badge)
    - **Detail View**: Click any price list card → view its catalog with full search/filter/CRUD capabilities
    - Seamless navigation with back button to return to list view
  - **Import Dịch Vụ (Import Services)** - Multi-step import workflow unchanged
- **Price List Management**: Full CRUD operations with individual price lists
- **Multi-Step Import Workflow**:
  - Step 1: Select existing price list or create new one with name/description
  - Step 2: Upload CSV/Excel and map columns
- **Enhanced Unit Extraction**: Improved regex to extract only unit keywords (tháng, năm, ngày, etc.) from price strings like "49.000 đ/tháng" → "tháng"
- **Price Format Detection**: Supports both dot (1.000.000) and comma (1,000,000) formats
- **Catalog Detail View** (per price list):
  - Search by name and description
  - Category filtering
  - Bulk delete operations
  - Service table with VND formatting
- **Data Migration**: Existing 242 catalog items migrated to "Default Price List"
- **Backend**: Uses `xlsx` for file parsing, `multer` for uploads, cascade delete from price lists to services

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

**Technology Stack:** React 18 (TypeScript), Wouter, TanStack Query, Vite.
**UI Framework:** shadcn/ui (Radix UI primitives), Tailwind CSS, Class Variance Authority (CVA).
**Design System:** Custom HSL-based theming (light/dark modes), Inter and JetBrains Mono fonts, consistent spacing, and Vietnamese language support.
**Key Design Decisions:** Component-based architecture, centralized theme, responsive mobile-first design, path aliases.

### Backend

**Technology Stack:** Express.js (TypeScript, ESM), Drizzle ORM, Neon Serverless PostgreSQL.
**Authentication & Session Management:** Username/Password Authentication (Passport Local Strategy), bcrypt hashing, PostgreSQL-backed sessions (1-week TTL).
**API Design:** RESTful, `/api` prefix, authentication middleware, centralized error handling, sanitized responses.
**Data Layer:** `IStorage` abstraction, type-safe schema with Drizzle and Zod, JSONB for flexible configuration, automatic timestamps.
**Key Design Decisions:** Separation of concerns, session-based auth, credit-based usage, template-driven workflow execution.

### Database Schema

**Core Tables:**
- `users`: User profiles, roles (`user`/`admin`), and credit balances.
- `templates`: Automation workflow definitions, bilingual names, credit cost, JSONB input schemas.
- `executionLogs`: Workflow history, linking users to templates, JSONB input/output, status tracking.
- `sessions`: Express session storage.
- `customers`: Multi-tenant customer data with ownership validation.
- `quotations`: Quotation details, auto-generated numbers, status, and associated items.
- `quotationItems`: Line items for quotations.
- `priceLists`: Multiple price lists with name, description, user ownership. One-to-many relationship with service catalog.
- `serviceCatalog`: Service catalog for quotations with name, description, unitPrice, unit, category, priceListId (FK to priceLists). Supports CSV/Excel import with intelligent price parsing and unit extraction. Cascade delete when price list is removed.
- `bulkCampaigns`: Bulk email campaigns with name, subject, body, status (draft/scheduled/sending/completed/failed), recipient counts, credit estimation, and scheduling support. Foreign key to users.
- `campaignRecipients`: Individual recipients for bulk campaigns with email, name, status tracking (pending/sent/failed), and error logging. Foreign key to bulkCampaigns with cascade delete.
- `campaignAttachments`: PDF attachments for campaigns with filename, originalName, fileSize, mimeType, and filePath. Foreign key to bulkCampaigns with cascade delete.
- `quotationTemplates`, `emailTemplates`, `smtpConfigs`, `storageConfigs`, `userSettings`: Supporting tables for future features.

**Schema Design Decisions:** UUID primary keys, JSONB for flexible data, indexed session expiration, type-safe schema exports. Encryption (AES-256-GCM) for sensitive data like SMTP passwords.

### UI/UX Decisions

- Modern, premium aesthetics with a gradient color system (cyan-500 to blue-600).
- Enhanced visual elements: gradient backgrounds, sparkle effects, dramatic hover effects, glassmorphism.
- Improved typography and spacing, smooth micro-interactions and animations.
- Role-Based Access Control (RBAC) with 'admin' and 'user' roles.
- Dedicated Admin Panel for user, template, and analytics management.
- Admin View Toggle to switch between user and admin interfaces.
- Vietnamese currency (VND) formatting for financial data.

## External Dependencies

**Core Services:**
- **Neon Serverless PostgreSQL:** Managed database with WebSocket support.
- **Replit Deployments:** Hosting platform.

**Key NPM Packages:**
- `@neondatabase/serverless`: PostgreSQL client.
- `drizzle-orm` & `drizzle-kit`: ORM and migration tools.
- `passport` & `passport-local`: Authentication.
- `bcryptjs`: Password hashing.
- `@tanstack/react-query`: Server state management.
- `@radix-ui/*` components: Accessible UI primitives.
- `react-hook-form` & `@hookform/resolvers`: Form handling.
- `xlsx`: Excel/CSV file parsing for service catalog import.
- `multer`: File upload middleware for handling CSV/Excel uploads.

**Development Tools:**
- `@replit/vite-plugin-*`: Replit development enhancements.
- `tsx`: TypeScript execution.
- `esbuild`: Server code bundling.