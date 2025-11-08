# WFA Hub - Workflow Automation Platform

## Overview

WFA Hub is a Vietnamese-language web application providing ready-made automation templates for business users. It empowers non-coders to execute workflows such as email sending, quotation generation, and approval management. Built with React, Express, and PostgreSQL, the platform emphasizes a clean, productivity-focused design inspired by Linear.app and Framer Dashboard. The project's vision is to deliver a comprehensive workflow automation solution, including robust quotation management and an administrative panel for system oversight, catering to the Vietnamese market with localized features.

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
**Authentication & Session Management:** Username/Password Authentication (Passport Local Strategy), bcrypt hashing, PostgreSQL-backed sessions.
**API Design:** RESTful, `/api` prefix, authentication middleware, centralized error handling, sanitized responses.
**Data Layer:** `IStorage` abstraction, type-safe schema with Drizzle and Zod, JSONB for flexible configuration, automatic timestamps.
**Key Design Decisions:** Separation of concerns, session-based authentication, credit-based usage, template-driven workflow execution. SMTP passwords and other sensitive data are encrypted using AES-256-GCM.

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