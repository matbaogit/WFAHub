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
- **Replit Auth** integration using OpenID Connect (OIDC)
- **Passport.js** strategy for authentication flow
- **PostgreSQL-backed sessions** using connect-pg-simple
- Session storage with 1-week TTL

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
   - Stores Replit OIDC user information (id, email, name, profile image)
   - Credits system (default 100) for usage tracking
   - Soft integration with Replit Auth user data

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
- **Replit Auth (OIDC)** - Authentication service using OpenID Connect protocol
- **Replit Deployments** - Hosting platform with automatic HTTPS and domain management

**Key NPM Packages:**
- **@neondatabase/serverless** - PostgreSQL client with WebSocket support
- **drizzle-orm** & **drizzle-kit** - ORM and migration tools
- **passport** & **openid-client** - Authentication infrastructure
- **@tanstack/react-query** - Server state management
- **@radix-ui/** components - Accessible UI primitives
- **react-hook-form** & **@hookform/resolvers** - Form handling with Zod validation

**Development Tools:**
- **@replit/vite-plugin-*** - Development experience enhancements (error overlay, dev banner, cartographer)
- **tsx** - TypeScript execution for development
- **esbuild** - Production bundling for server code

**Design Rationale:**
- Neon Serverless chosen for PostgreSQL with minimal ops overhead and WebSocket support
- Replit Auth provides zero-config authentication for Replit deployments
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
- Integrated Replit Auth (OIDC) for user authentication
- Implemented session-based auth with PostgreSQL session storage
- Created API endpoints:
  - GET /api/auth/user - User profile and session validation
  - GET /api/templates - Active template list
  - POST /api/execute - Workflow execution with credit deduction
  - GET /api/logs - Execution history with template enrichment
- Added comprehensive error handling and logging

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
  - Login flow via Replit Auth (OIDC)
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

## Production Status

✅ **MVP Complete** - All core features implemented and tested:
- User authentication via Replit Auth
- 5 ready-made workflow templates (Email, Quotation, Reminder, Leave Approval, Contract)
- Credit-based execution system (100 credits default)
- Execution logs with complete history
- Vietnamese language interface throughout
- Modern Linear/Framer-inspired UI with blue (#1E88E5) theme
- Comprehensive error handling and retry logic
- Responsive design with collapsible sidebar navigation

**Ready for deployment** - Application is stable, tested, and production-ready.