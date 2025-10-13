# WFA Hub - Workflow Automation Platform

## Overview

WFA Hub is a Vietnamese-language web application offering ready-made automation templates for business users. It enables non-coders to execute workflows like sending emails, creating quotations, and managing approvals. The platform is built with React, Express, and PostgreSQL, focusing on a clean, productivity-centric design inspired by Linear.app and Framer Dashboard. The project aims to provide a comprehensive workflow automation solution, including a robust quotation management system and an admin panel for system oversight.

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

**Development Tools:**
- `@replit/vite-plugin-*`: Replit development enhancements.
- `tsx`: TypeScript execution.
- `esbuild`: Server code bundling.