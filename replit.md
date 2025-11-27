# WFA Hub - Workflow Automation Platform

## Overview

WFA Hub is a Vietnamese-language web application providing ready-made automation templates for business users. It empowers non-coders to execute workflows such as email sending, quotation generation, and approval management. Built with React, Express, and PostgreSQL, the platform emphasizes a clean, productivity-focused design inspired by Linear.app and Framer Dashboard. The project's vision is to deliver a comprehensive workflow automation solution, including robust quotation management and an administrative panel for system oversight, catering to the Vietnamese market with localized features.

## Recent Changes

**November 27, 2025:**
- **Policy Pages System**: Implemented public policy pages with admin management
  - New `policyPages` table for storing policy content (title, slug, content, isPublished)
  - Public endpoint `GET /api/policies/:slug` for viewing published policies
  - Admin endpoints for CRUD operations at `/api/admin/policies`
  - Public policy viewer at `/policy/:slug` - accessible without authentication, no sidebar
  - Admin management page at `/admin/policies` with TipTap rich text editor
  - Added "Trang chính sách" menu item to Admin Panel sidebar
  - Footer links added to Landing page: "Điều khoản sử dụng", "Chính sách bảo mật", "Liên hệ"
  - SEO-friendly slug-based URLs for public access

**November 25, 2025:**
- **Campaign Detail HTML Rendering Fix**: Fixed email body display in campaign detail page
  - Changed from plain text display to proper HTML rendering using `dangerouslySetInnerHTML`
  - Email content now displays with formatting (bold, italic, lists, etc.) instead of raw HTML tags
  - Added Tailwind Typography (`prose`) classes for better HTML content styling
  - Location: `bulk-campaign-detail.tsx` "Chi tiết thư" section
- **TipTap Rich Text Editor Integration**: Extended TipTap editor to Quotation Templates and Email Templates pages
  - Both `/quotation-templates` and `/email-templates` now use full-featured rich text editor
  - Shared TipTap extensions: StarterKit (includes Bold, Italic, Underline, Headings, Lists, etc.), Table support with resizable columns, Text alignment, Image paste, Color and TextStyle
  - Fixed duplicate extensions issue: Removed explicit Underline and Dropcursor imports (already included in StarterKit)
  - Created default system settings entry to ensure all user menu items visible by default
  - Tab-based UI on both pages: Editor tab for rich text editing, Preview tab for HTML preview
  - Toolbar buttons: Bold, Italic, Underline, Headings (H1-H6), Text alignment (left/center/right/justify), Lists (bullet/numbered), Tables, Images, Colors
  - Test user created: tiptaptest@example.com / Test123456 (admin, verified)
- **System-Wide User Menu Visibility Control**: Implemented database-backed menu visibility management for admins
  - New `systemSettings` table with `userMenuVisibility` JSONB field for storing system-wide menu preferences
  - Admin API endpoints: `GET/PUT /api/admin/system-settings` for managing user menu visibility
  - `UserMenuSettings` component allows admins to control which menu items ALL regular users can see
  - Settings button (gear icon) in Admin Panel header opens dialog to toggle 8 user menu items
  - Menu filtering in sidebar: fetches system settings and hides disabled items in user view
  - Default: All menus visible; admin view always shows all menus regardless of settings
  - Replaces localStorage-based approach with centralized database configuration
- **Admin Menu Customization**: Implemented localStorage-based admin menu visibility preferences
  - `useAdminMenuPreferences()` hook manages admin's own menu preferences locally
  - `AdminMenuSettings` component (not exposed in UI) allows admin to customize their own admin panel menu
- **SMTP Config UX**: Simplified password tooltip from App Password explanation to "Mật khẩu email của bạn."
- **Bug Fix**: Corrected duplicate campaign navigation route from `/bulk-campaign-wizard?campaignId=` to `/bulk-campaigns/new?draftId=`

**November 24, 2025:**
- **Campaign Duplication Feature**: Implemented "Sử dụng lại" (Duplicate Campaign) functionality
  - Backend: Added `duplicateBulkCampaign()` storage method and `POST /api/bulk-campaigns/:id/duplicate` endpoint
  - Duplication logic: Copies all campaign data (email subject, body, configuration), recipients (reset to pending status), and attachments
  - Name versioning: Automatically increments version number (e.g., "Campaign v1" → "Campaign v2") or appends " - Copy"
  - New campaign created as draft with reset statistics (sentCount=0, failedCount=0, openedCount=0)
  - Frontend: Added "Sử dụng lại" button with Copy icon on campaign detail page
  - User experience: After duplication, automatically redirects to wizard step 1 with the new campaign for editing

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

**Technology Stack:** React 18 (TypeScript), Wouter, TanStack Query, Vite.
**UI Framework:** shadcn/ui (Radix UI primitives), Tailwind CSS, Class Variance Authority (CVA).
**Design System:** Custom HSL-based theming (light/dark modes), Inter and JetBrains Mono fonts, consistent spacing, and full Vietnamese language support.
**Key Design Decisions:** Component-based architecture, centralized theme, responsive mobile-first design, path aliases. Recent enhancements include TipTap editor for rich text editing with superior table and image paste support, and streamlined inline SMTP configuration.

### Backend

**Technology Stack:** Express.js (TypeScript, ESM), Drizzle ORM, Neon Serverless PostgreSQL.
**Authentication & Session Management:** Email-based authentication with verification (Passport Local Strategy), bcrypt hashing, PostgreSQL-backed sessions. New users must verify their email via a time-limited token (24-hour expiry) before login. Password reset functionality via email with 24-hour token expiry.
**API Design:** RESTful, `/api` prefix, authentication middleware, centralized error handling, sanitized responses.
**Data Layer:** `IStorage` abstraction, type-safe schema with Drizzle and Zod, JSONB for flexible configuration, automatic timestamps.
**Key Design Decisions:** Separation of concerns, session-based authentication, credit-based usage, template-driven workflow execution. SMTP passwords and other sensitive data are encrypted using AES-256-GCM. System emails (verification, password reset) use admin-configured "system default" SMTP.

### Database Schema

**Core Tables:**
- `users`: User profiles, roles, and credit balances.
- `templates`: Automation workflow definitions, bilingual names, credit cost, JSONB input schemas.
- `executionLogs`: Workflow history and status tracking.
- `sessions`: Express session storage.
- `customers`: Multi-tenant customer data.
- `quotations`, `quotationItems`: Quotation management.
- `priceLists`, `serviceCatalog`: Service catalog for quotations with import capabilities and unit extraction.
- `bulkCampaigns`, `campaignRecipients`, `campaignAttachments`: Bulk email campaign management, including status, recipient tracking, and PDF attachments.
- `quotationTemplates`, `emailTemplates`, `smtpConfigs`, `storageConfigs`, `userSettings`: Supporting configuration tables.

**Schema Design Decisions:** UUID primary keys, JSONB for flexible data, indexed session expiration, type-safe schema exports.

### UI/UX Decisions

- Modern, premium aesthetics with a gradient color system (cyan-500 to blue-600).
- Enhanced visual elements: gradient backgrounds, sparkle effects, dramatic hover effects, glassmorphism.
- Improved typography, spacing, smooth micro-interactions, and animations.
- Role-Based Access Control (RBAC) with 'admin' and 'user' roles and an Admin View Toggle.
- Dedicated Admin Panel for user, template, and analytics management.
- Vietnamese currency (VND) formatting.

## External Dependencies

**Core Services:**
- **Neon Serverless PostgreSQL:** Managed database.
- **Replit Deployments:** Hosting platform.
- **Puppeteer:** Used for server-side PDF generation from HTML templates.

**Key NPM Packages:**
- `@neondatabase/serverless`: PostgreSQL client.
- `drizzle-orm` & `drizzle-kit`: ORM and migration tools.
- `passport` & `passport-local`: Authentication.
- `bcryptjs`: Password hashing.
- `@tanstack/react-query`: Server state management.
- `@radix-ui/*` components: Accessible UI primitives.
- `react-hook-form` & `@hookform/resolvers`: Form handling.
- `xlsx`: Excel/CSV file parsing.
- `multer`: File upload middleware.
- `nodemailer`: Email sending.
- `@tiptap/*`: Rich text editor for content creation.
- `uuid`: For generating UUIDs.