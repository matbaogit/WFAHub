# WFA Hub - Workflow Automation Platform

## Overview

WFA Hub is a Vietnamese-language web application offering ready-made automation templates for business users. It enables non-coders to execute workflows like sending emails, creating quotations, and managing approvals. The platform is built with React, Express, and PostgreSQL, focusing on a clean, productivity-centric design inspired by Linear.app and Framer Dashboard. The project aims to provide a comprehensive workflow automation solution, including a robust quotation management system and an admin panel for system oversight.

## Recent Changes (October 2025)

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