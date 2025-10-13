# WFA Hub - Workflow Automation Platform

## Overview

WFA Hub is a Vietnamese-language web application that provides ready-made automation templates for business users. The platform allows users to execute workflows like sending emails, creating quotations, and managing approvals without any coding knowledge. Built with a modern stack featuring React, Express, and PostgreSQL, the application emphasizes a clean, productivity-focused design inspired by Linear.app and Framer Dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **React 18** with TypeScript for type-safe component development
- **Wouter** for lightweight client-side routing
- **TanStack Query (React Query)** for server state management and caching
- **Vite** as the build tool and development server

**UI Framework:**
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Class Variance Authority (CVA)** for component variant management

**Design System:**
- Custom color palette with HSL-based theming supporting both light and dark modes
- Typography using Inter font family with JetBrains Mono for monospaced content
- Consistent spacing, border radius (9px/6px/3px), and elevation patterns
- Vietnamese language support throughout the interface

**Key Design Decisions:**
- Component-based architecture with reusable UI primitives from Radix UI
- Centralized theme configuration through CSS custom properties
- Responsive design with mobile-first approach using Tailwind breakpoints
- Path aliases (`@/`, `@shared/`, `@assets/`) for clean import statements

### Backend Architecture

**Technology Stack:**
- **Express.js** for the HTTP server
- **TypeScript** with ESM modules for type safety and modern JavaScript
- **Drizzle ORM** for type-safe database operations
- **Neon Serverless PostgreSQL** for database hosting

**Authentication & Session Management:**
- **Username/Password Authentication** using Passport Local Strategy
- **bcrypt** password hashing (10 rounds) for security
- **Passport.js** for authentication flow management
- **PostgreSQL-backed sessions** using connect-pg-simple
- Session storage with 1-week TTL
- Sanitized API responses (passwordHash stripped from all user endpoints)

**API Design:**
- RESTful endpoints with `/api` prefix
- Authentication middleware protecting all routes except public pages
- Request/response logging with duration tracking
- Centralized error handling with appropriate HTTP status codes

**Data Layer:**
- Storage abstraction pattern (`IStorage` interface) for database operations
- Type-safe schema definitions using Drizzle and Zod validation
- JSONB fields for flexible template configuration storage
- Automatic timestamp tracking (createdAt, updatedAt)

**Key Design Decisions:**
- Separation of concerns with dedicated modules for database, auth, routes, and storage
- Session-based authentication over JWT for simpler implementation
- Credit-based system for usage tracking and limits
- Template-driven workflow execution with configurable input schemas

### Database Schema

**Core Tables:**

1. **users** - User profiles and credit balances
   - Username/password authentication (unique username, bcrypt hashed password)
   - User information (id, username, email, firstName, lastName, profileImageUrl)
   - Role-based access control (role: 'user' | 'admin')
   - Credits system (default 100) for usage tracking

2. **templates** - Automation workflow definitions
   - Bilingual naming (English/Vietnamese)
   - Icon references for UI display
   - Credit cost per execution
   - JSONB schema for dynamic input field definitions
   - Active/inactive status flag

3. **executionLogs** - Workflow execution history
   - Links users to templates with execution records
   - Stores input data and output results as JSONB
   - Status tracking (success/failed/processing)
   - Credit deduction records

4. **sessions** - Express session storage
   - Required for Replit Auth session management
   - PostgreSQL-backed with automatic expiration

**Schema Design Decisions:**
- UUID primary keys for all entities
- JSONB for flexible, schema-less data (template inputs, execution results)
- Indexed session expiration for efficient cleanup
- Type-safe schema exports using Drizzle Zod integration

### External Dependencies

**Core Services:**
- **Neon Serverless PostgreSQL** - Managed database with WebSocket support
- **Replit Deployments** - Hosting platform with automatic HTTPS and domain management

**Key NPM Packages:**
- **@neondatabase/serverless** - PostgreSQL client with WebSocket support
- **drizzle-orm** & **drizzle-kit** - ORM and migration tools
- **passport** & **passport-local** - Authentication infrastructure
- **bcryptjs** - Password hashing for security
- **@tanstack/react-query** - Server state management
- **@radix-ui/** components - Accessible UI primitives
- **react-hook-form** & **@hookform/resolvers** - Form handling with Zod validation

**Development Tools:**
- **@replit/vite-plugin-*** - Development experience enhancements (error overlay, dev banner, cartographer)
- **tsx** - TypeScript execution for development
- **esbuild** - Production bundling for server code

**Design Rationale:**
- Neon Serverless chosen for PostgreSQL with minimal ops overhead and WebSocket support
- Username/password auth for flexibility and control over user management
- bcrypt hashing ensures secure password storage
- React Query eliminates need for Redux/complex state management
- shadcn/ui provides customizable components without package lock-in
- Drizzle ORM offers better TypeScript integration than Prisma with lighter runtime

## Recent Changes

### Phase 1: Foundation (Completed)
- Created PostgreSQL database schema with Drizzle ORM (users, templates, executionLogs, sessions)
- Implemented type-safe storage layer with `IStorage` interface
- Seeded initial template data (5 workflow templates)
- Built design system with Linear/Framer inspiration (#1E88E5 primary blue)

### Phase 2: Authentication & Backend (Completed)
- Implemented username/password authentication with Passport Local Strategy
- bcrypt password hashing (10 rounds) for security
- Implemented session-based auth with PostgreSQL session storage
- Created API endpoints:
  - POST /api/auth/register - User registration with auto-login
  - POST /api/auth/login - Username/password login
  - POST /api/auth/logout - Session logout
  - GET /api/auth/user - User profile and session validation
  - GET /api/templates - Active template list
  - POST /api/execute - Workflow execution with credit deduction
  - GET /api/logs - Execution history with template enrichment
- Added comprehensive error handling and logging
- Security: sanitizeUser() helper strips passwordHash from all API responses

### Phase 3: Frontend & UX (Completed)
- Built all pages with Vietnamese language:
  - Landing page with hero and CTA
  - Dashboard with template cards and sidebar
  - Templates catalog page
  - Execution modal with dynamic inputs
  - Logs page with sortable history table
  - Account page with profile and credit management
- Implemented error states with retry functionality
- Added loading skeletons for all data fetching
- Configured proper data-testid attributes for testing

### Phase 4: Testing & Polish (Completed)
- Fixed QueryClientProvider wrapping issue in App.tsx
- Conducted comprehensive end-to-end testing:
  - Registration and login flow with username/password
  - Template execution with credit deduction
  - Log creation and display
  - Account page verification
  - Logout functionality
- Verified all Vietnamese translations
- Confirmed responsive layout and interactions

### Phase 5: Premium UI Redesign (Completed)
- Completely redesigned interface with modern, premium aesthetics
- Implemented gradient color system (cyan-500 to blue-600)
- Enhanced visual elements:
  - Landing page: Gradient backgrounds, improved hero section with sparkle effects
  - Template cards: Gradient icon containers, dramatic hover effects with lift animation
  - Sidebar: Gradient active states, premium credit badge with border gradient
  - Execution modal: Gradient headers, premium input styling with focus rings
  - Success states: Animated gradient backgrounds with glow effects
- Improved typography hierarchy and spacing throughout
- Added smooth micro-interactions and animations
- Implemented glassmorphism effects on navigation
- Comprehensive end-to-end testing confirmed all features working with new design

### Phase 6: Admin Panel & RBAC (Completed)
- Implemented Role-Based Access Control with 'admin' and 'user' roles
- Created comprehensive Admin Panel with dedicated routes:
  - **Admin Dashboard** (/admin) - System stats with 4 metric cards (users, executions, revenue, templates)
  - **Users Management** (/admin/users) - View/edit credits, promote/demote admin role
  - **Templates Management** (/admin/templates) - Toggle active/inactive, edit metadata, delete templates
  - **Analytics** - Stats API with aggregated metrics
- Security enhancements:
  - Admin middleware protecting all admin routes
  - Field whitelisting on PATCH endpoints (only credits, role, isActive, creditCost allowed)
  - Input validation: positive-only credits, role enum enforcement
  - AdminRoute component with auth guard and unauthorized UX
- UI/UX improvements:
  - Admin section in sidebar with orange gradient theme
  - Conditional rendering based on user role
  - Proper data-testid coverage for all admin elements
  - Smooth error handling with toast notifications
- E2E testing confirmed:
  - Admin user has full access to admin panel
  - Non-admin users properly blocked with redirect
  - All CRUD operations working correctly
  - Proper validation and error states

### Phase 7: Auth Migration & View Toggle (Completed)
- **Migrated from Replit Auth to Username/Password Authentication:**
  - Replaced OIDC authentication with Passport Local Strategy
  - Added `username` and `passwordHash` fields to users table
  - Implemented bcrypt password hashing (10 rounds)
  - Created user registration and login pages with gradient cyan-blue theme
  - Updated all authentication flows (register, login, logout)
  - Migrated existing users with default password "123456"
- **Security Hardening:**
  - Implemented `sanitizeUser()` helper to strip passwordHash from all API responses
  - Applied sanitization to all user-returning endpoints (register, login, get user, admin endpoints)
  - Ensured no sensitive fields leak to client
- **Admin View Toggle Feature:**
  - Created ViewModeContext for managing user/admin view state
  - Added toggle button in header for admin users (data-testid="button-toggle-view")
  - Conditional rendering of Admin Panel based on view mode
  - Admin users can switch between user and admin interfaces seamlessly
  - Maintains admin capabilities while allowing "user perspective" testing
- **Updated UI Components:**
  - Register page: username, password, confirm password, first name, last name, email
  - Login page: username and password inputs with gradient design
  - Logout functionality in both sidebar and account page
  - Landing page redirects to new login page instead of OIDC
- **E2E Testing Verified:**
  - User registration and login flow working correctly
  - Admin view toggle functioning as expected
  - All logout flows operational
  - No passwordHash leakage in API responses

### Phase 8: Quotation Management - Phase 1 Core Foundation (Completed)
- **Database Schema Expansion:**
  - Added 7 new tables: customers, quotations, quotationItems, quotationTemplates, emailTemplates, smtpConfigs, storageConfigs, userSettings
  - Encryption utilities (AES-256-GCM) for SMTP password security with ENCRYPTION_KEY in Replit Secrets
  - Multi-tenant architecture with userId foreign keys on all user-owned entities
  
- **Backend Implementation:**
  - Customer CRUD operations in storage layer with ownership validation
  - Quotation CRUD with auto-generated quotation numbers (QUO-YYYY-MM-NNNN format)
  - QuotationItem management with parent quotation relationship
  - API endpoints:
    - POST/GET/PATCH/DELETE /api/customers - Full customer management
    - POST/GET/PATCH/DELETE /api/quotations - Quotation lifecycle with items
  
- **Security Hardening (Critical Fixes):**
  - **Field Whitelisting:** Customer PATCH only allows name, email, phone, address, company, taxCode, notes
  - **Server-side Totals:** Quotation POST/PATCH compute subtotal, VAT, totals from items (never trust client)
  - **Cross-tenant Protection:** Customer ownership validated before quotation create/update
  - **Ownership Guards:** All endpoints verify userId before allowing access/modifications
  - **Input Validation:** Item data validated (name, quantity, unitPrice) before processing
  
- **Frontend Pages:**
  - Customer Management (/customers):
    - List view with search, create/edit dialog, delete confirmation
    - Form fields: name, email, phone, address, company, taxCode, notes
    - Real-time React Query cache invalidation
  - Quotation Management (/quotations):
    - List view with status badges (draft/sent/accepted/rejected/expired)
    - Create/edit dialog with dynamic item rows
    - Auto-calculated subtotals, discount, VAT (10%), totals
    - Customer selection dropdown from user's customers
    - Vietnamese currency formatting (VND)
  
- **UI/UX Enhancements:**
  - Sidebar navigation updated with "Báo Giá" and "Khách Hàng" menu items
  - Gradient design consistency with existing premium UI
  - Loading skeletons for all async operations
  - Toast notifications for success/error states
  - Proper data-testid attributes for testing
  
- **Architecture Verified:**
  - Tenant isolation enforced across all quotation/customer operations
  - Server-driven financial calculations prevent tampering
  - Type-safe schema alignment between frontend and backend
  - No security vulnerabilities in cross-tenant access or data modification

## Production Status

✅ **MVP Complete + Admin Panel + Quotation Management (Phase 1)** - All core features implemented and tested:
- **Username/Password Authentication** with secure bcrypt hashing
- 5 ready-made workflow templates (Email, Quotation, Reminder, Leave Approval, Contract)
- Credit-based execution system (100 credits default)
- Execution logs with complete history
- **Quotation Management System:**
  - Customer database with full CRUD operations
  - Quotation creation with line items and auto-calculations
  - Server-side financial validation and totals computation
  - Cross-tenant security with ownership validation
  - Vietnamese currency (VND) formatting
- Vietnamese language interface throughout
- Modern Linear/Framer-inspired UI with gradient design system
- **Role-Based Access Control (Admin/User)**
- **Full-featured Admin Panel** for system management
- **Admin View Toggle** - Admins can switch between user and admin interfaces
- Comprehensive error handling and retry logic
- Responsive design with collapsible sidebar navigation
- Production-grade security: bcrypt hashing, field whitelisting, tenant isolation, sanitized responses

**Phase 1 Complete** - Customer & quotation CRUD fully functional with security hardening verified. Ready for Phase 2 (Templates & Email) implementation.