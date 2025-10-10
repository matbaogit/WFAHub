# WFA Hub Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from **Linear.app** and **Framer Dashboard** aesthetics
- Focus on productivity and workflow efficiency
- Clean, uncluttered interface prioritizing content over decoration
- Subtle sophistication through refined details and smooth interactions
- Professional business tool with modern SaaS polish

## Core Design Elements

### A. Color Palette

**Primary Colors:**
- Primary Blue: `#1E88E5` (brand color for CTAs, active states, links)
- Background: `#FFFFFF` (pure white for main areas)
- Surface: `#F8F9FA` (off-white for cards and elevated surfaces)

**Neutral Scale:**
- Text Primary: `#0F172A` (slate-900 for headings)
- Text Secondary: `#475569` (slate-600 for descriptions)
- Text Tertiary: `#94A3B8` (slate-400 for metadata)
- Borders: `#E2E8F0` (slate-200 for dividers)

**Status Colors:**
- Success: `#10B981` (green-500)
- Warning: `#F59E0B` (amber-500)
- Error: `#EF4444` (red-500)
- Info: `#3B82F6` (blue-500)

**Dark Mode (if implemented):**
- Background: `#0F172A`
- Surface: `#1E293B`
- Borders: `#334155`

### B. Typography

**Font Family:**
- Primary: `'Inter', -apple-system, system-ui, sans-serif`
- Monospace (for credits/numbers): `'JetBrains Mono', monospace`

**Type Scale:**
- Hero/H1: `text-4xl` (36px), font-bold, tracking-tight
- H2/Section: `text-2xl` (24px), font-semibold
- H3/Card Title: `text-lg` (18px), font-semibold
- Body: `text-base` (16px), font-normal
- Small/Meta: `text-sm` (14px), font-normal
- Tiny/Labels: `text-xs` (12px), font-medium, uppercase, tracking-wide

**Vietnamese Language:**
- All UI text in Vietnamese: "Đăng nhập", "Chạy ngay", "Lịch sử sử dụng"
- Ensure proper line-height (1.6) for Vietnamese characters with diacritics

### C. Layout System

**Spacing Primitives:**
- Use Tailwind units: `2, 3, 4, 6, 8, 12, 16, 24` (consistent rhythm)
- Card padding: `p-6` (24px)
- Section spacing: `space-y-8` (32px between sections)
- Grid gaps: `gap-6` (24px between cards)

**Container Widths:**
- Sidebar: `w-64` (256px fixed)
- Main content: `max-w-7xl mx-auto px-6`
- Modal: `max-w-2xl` (672px)
- Form inputs: `max-w-md` (448px for optimal readability)

**Responsive Grid:**
- Feature cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Dashboard stats: `grid-cols-2 lg:grid-cols-4 gap-4`

### D. Component Library

**Navigation:**
- Top navbar: 64px height, sticky, white background, border-b
- Sidebar: Full-height, white background, subtle shadow, icons + labels
- User avatar: 40px circle, dropdown on click

**Feature Cards:**
- White background, rounded-2xl (16px), shadow-sm on hover: shadow-md
- Icon: 48px circle, gradient background (blue-500 to blue-600)
- Title: text-lg font-semibold
- Description: text-sm text-slate-600, 2 lines max with ellipsis
- CTA button: "Chạy ngay" - full width, primary blue

**Modals:**
- Overlay: bg-black/50 backdrop-blur-sm
- Content: rounded-2xl, max-w-2xl, white background, shadow-2xl
- Header: text-xl font-semibold, border-b pb-4
- Form spacing: space-y-4
- Actions: flex justify-end gap-3 (Cancel outline, Execute primary)

**Form Inputs:**
- Height: h-11 (44px for touch-friendly)
- Border: border border-slate-300, focus:ring-2 focus:ring-blue-500
- Rounded: rounded-lg (8px)
- File upload: Dashed border, dropzone with icon and text

**Buttons:**
- Primary: bg-blue-600 text-white, hover:bg-blue-700, rounded-lg px-6 h-11
- Secondary: bg-slate-100 text-slate-900, hover:bg-slate-200
- Outline: border-2 border-slate-300, hover:border-slate-400
- Icon buttons: 40px square, rounded-lg, hover:bg-slate-100

**Tables (Usage Logs):**
- Striped rows (even: bg-slate-50)
- Column headers: text-xs uppercase text-slate-500 font-medium
- Cell padding: px-6 py-4
- Sortable icons on hover

**Credits Display:**
- Badge style: inline-flex items-center gap-2
- Monospace font for numbers
- Icon: wallet/coin graphic
- Top-up button: outline style next to balance

### E. Animations & Interactions

**Transitions (Framer Motion inspired):**
- Modal enter: scale(0.95) → scale(1), opacity 0 → 1, 200ms ease-out
- Card hover: translateY(0) → translateY(-4px), shadow transition
- Button press: scale(1) → scale(0.98), 100ms
- Page transitions: Fade + slide up (20px), 300ms

**Micro-interactions:**
- Success state: Checkmark with bounce animation
- Credit deduction: Number count-down animation
- Loading states: Spinner (blue-600), 1s rotation
- Toast notifications: Slide in from top-right, auto-dismiss 3s

**Hover States:**
- Cards: Lift effect (shadow-md) + subtle border color
- Buttons: Brightness increase + scale(1.02)
- Links: Underline on hover, color shift to blue-700
- Sidebar items: bg-slate-100 rounded-lg

## Key Principles

1. **Information Hierarchy**: Clear visual weight through size, color, and spacing
2. **Whitespace**: Generous breathing room - don't cram components
3. **Consistency**: Reuse spacing, colors, and component patterns
4. **Accessibility**: WCAG AA contrast ratios, keyboard navigation, focus states
5. **Performance**: Optimize images, lazy load modals, debounce API calls
6. **Responsive**: Mobile-first approach, tablet (md:), desktop (lg:) breakpoints

## Special Considerations

**No Hero Section**: This is a dashboard app - jump straight to functionality
**Vietnamese UI**: All labels, buttons, errors in Vietnamese - no mixed languages
**Credit System**: Prominent display, smooth deduction animation, clear pricing
**Mock Data Ready**: Structure for easy API integration (use consistent data shapes)