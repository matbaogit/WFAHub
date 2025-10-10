# WFA Hub Design Guidelines - Premium Edition

## Design Approach
**Hybrid System**: Linear's productivity focus + Notion's refined aesthetics + Vietnamese design sensibility
- Premium business tool prioritizing efficiency with visual sophistication
- Vibrant gradient accents creating energy without distraction
- Micro-interactions adding delight to every workflow
- Professional SaaS polish with Vietnamese market appeal

## Core Design Elements

### A. Color Palette

**Primary Gradient System:**
- Gradient Primary: `#0EA5E9 → #2563EB` (cyan-500 to blue-600)
- Solid Primary: `#0EA5E9` (primary actions)
- Solid Secondary: `#2563EB` (accents, hover states)

**Background Layers:**
- Base: `#FAFBFC` (subtle warm off-white)
- Surface: `#FFFFFF` (cards, elevated elements)
- Overlay: `#F8FAFC` (secondary surfaces)

**Neutral Scale:**
- Text Primary: `#0F172A` (slate-900)
- Text Secondary: `#475569` (slate-600)
- Text Tertiary: `#94A3B8` (slate-400)
- Borders Light: `#E2E8F0` (slate-200)
- Borders Medium: `#CBD5E1` (slate-300)

**Status Colors:**
- Success: `#10B981` with gradient `#10B981 → #059669`
- Warning: `#F59E0B` with gradient `#F59E0B → #D97706`
- Error: `#EF4444` with gradient `#EF4444 → #DC2626`

**Dark Mode:**
- Background: `#0F172A`
- Surface: `#1E293B`
- Surface Elevated: `#334155`
- Borders: `#475569`

### B. Typography

**Font Stack:**
- Primary: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
- Monospace: `'JetBrains Mono', 'Courier New', monospace`

**Hierarchy:**
- Display/Hero: `text-5xl` (48px), `font-bold`, `tracking-tight`, `leading-tight`
- H1: `text-4xl` (36px), `font-bold`, `tracking-tight`
- H2: `text-2xl` (24px), `font-semibold`, `leading-snug`
- H3: `text-xl` (20px), `font-semibold`
- Body Large: `text-lg` (18px), `font-normal`, `leading-relaxed`
- Body: `text-base` (16px), `leading-relaxed`
- Small: `text-sm` (14px)
- Micro: `text-xs` (12px), `font-medium`, `tracking-wide`, `uppercase`

**Vietnamese Optimization:**
- Line-height: `1.7` for body text (accommodates diacritics)
- Letter-spacing: Normal (avoid tight tracking)

### C. Layout System

**Spacing Scale:** `2, 3, 4, 6, 8, 12, 16, 20, 24, 32`

**Common Patterns:**
- Card padding: `p-8` (32px) for premium feel
- Section spacing: `space-y-12` (48px vertical rhythm)
- Grid gaps: `gap-8` (32px breathing room)
- Component spacing: `gap-4` (16px internal)

**Containers:**
- Sidebar: `w-72` (288px, more spacious)
- Main content: `max-w-7xl mx-auto px-8`
- Modal: `max-w-3xl`
- Form max-width: `max-w-lg`

**Grid Systems:**
- Features: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`
- Stats: `grid-cols-2 lg:grid-cols-4 gap-6`

### D. Component Library

**Navigation Bar:**
- Height: `h-16` (64px)
- Background: `backdrop-blur-xl bg-white/80` (glass effect)
- Border: `border-b border-slate-200/50`
- Sticky positioning with smooth shadow on scroll

**Sidebar:**
- Background: `bg-white` with `shadow-xl shadow-slate-200/50`
- Active item: Gradient background `from-cyan-500/10 to-blue-600/10` with `border-l-4 border-blue-600`
- Hover: `bg-slate-50` with smooth scale `scale-[1.02]`
- Icons: `24px` with gradient fills on active

**Premium Feature Cards:**
- Background: `bg-white`
- Border: `border border-slate-200`
- Shadow: `shadow-lg shadow-slate-200/50`
- Hover: `shadow-2xl shadow-slate-300/50 -translate-y-2` (dramatic lift)
- Corner: `rounded-2xl` (16px)
- Icon container: `w-16 h-16` gradient background `bg-gradient-to-br from-cyan-500 to-blue-600`
- Title: `text-xl font-semibold text-slate-900`
- Description: `text-slate-600 leading-relaxed`
- CTA: Full-width gradient button

**Gradient Buttons:**
- Primary: `bg-gradient-to-r from-cyan-500 to-blue-600 text-white`
- Hover: `from-cyan-600 to-blue-700 shadow-lg shadow-blue-500/50 scale-105`
- Height: `h-12` (48px for premium touch)
- Padding: `px-8`
- Rounded: `rounded-xl`

**Modals:**
- Backdrop: `bg-slate-900/50 backdrop-blur-md`
- Container: `bg-white rounded-3xl shadow-2xl`
- Header: `border-b border-slate-200 pb-6`
- Content padding: `p-8`

**Form Inputs:**
- Height: `h-12` (48px)
- Border: `border-2 border-slate-200`
- Focus: `ring-4 ring-blue-500/20 border-blue-500`
- Rounded: `rounded-xl`
- Background: `bg-white` with subtle `hover:bg-slate-50`

**Credit Display Badge:**
- Gradient border with `bg-gradient-to-r from-cyan-500 to-blue-600 p-[2px]`
- Inner white background with padding
- Monospace numbers with gradient text
- Pulse animation on credit changes

**Tables:**
- Header: `bg-gradient-to-r from-slate-50 to-slate-100`
- Row hover: `bg-cyan-50/30` with smooth transition
- Borders: `border-slate-200`
- Cell padding: `px-8 py-5` (generous)

### E. Animations & Polish

**Micro-interactions:**
- Card hover: `transition-all duration-300 ease-out`
- Button press: `active:scale-95 duration-100`
- Modal enter: `opacity-0 scale-95 → opacity-100 scale-100` (250ms)
- Success state: Green checkmark with bounce (`animate-bounce` once)
- Loading: Gradient spinner with rotation
- Credit change: Number count animation with color pulse

**Elevation System:**
- Level 1: `shadow-md shadow-slate-200/50`
- Level 2: `shadow-lg shadow-slate-300/50`
- Level 3: `shadow-2xl shadow-slate-400/50`

**Gradient Effects:**
- Text gradients: `bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent`
- Border gradients: Wrapper technique with `p-[1px]` gradient container
- Background accents: Subtle gradient overlays at `opacity-5` on sections

## Special Features

**Dashboard Layout:**
- No hero section (direct to functionality)
- Stats grid at top with gradient accent cards
- Feature cards in masonry-style grid
- Recent activity timeline with gradient indicators

**Vietnamese UI Excellence:**
- All interface text in Vietnamese
- Proper spacing for diacritical marks
- Cultural color preferences (blue symbolizes trust/stability)

**Premium Touches:**
- Glassmorphism on navigation
- Gradient overlays on hover states
- Smooth number count animations for credits
- Skeleton loaders with shimmer effect
- Toast notifications with icons and gradient accents

**Responsive Strategy:**
- Mobile: Single column, bottom navigation, simplified cards
- Tablet: Two-column grid, sidebar collapses to icons
- Desktop: Full experience with three-column layouts