# scrolltosco Design System

This document defines the design system for this project. **Follow these guidelines for all UI work.**

## Design Philosophy

- **Liquid Glass**: Frosted glass aesthetic with blur effects and soft transparency
- **Minimal**: Limited color palette, clean layouts, generous whitespace
- **Modern**: Soft corners (16-24px radius), subtle shadows, smooth transitions
- **Consistent**: Use design tokens, never hardcode colors or spacing

---

## Color Palette

### Primary Colors
| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Primary | `#3F9B61` | `bg-primary`, `text-primary` | Buttons, links, accents |
| Primary Light | `#4CAF73` | `bg-primary-light` | Hover states, gradients |
| Primary Dark | `#357F50` | `bg-primary-dark` | Active states, emphasis |

### Neutral Colors
| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Light | `#EFF7EF` | `bg-light`, `text-light` | Backgrounds, light surfaces |
| Dark | `#292D32` | `bg-dark`, `text-dark` | Text, dark surfaces |
| Muted | `#6B7280` | `text-muted` | Secondary text, placeholders |

### Usage Rules
- **NEVER** use colors outside this palette
- **NEVER** use pure black (`#000`) or pure white (`#FFF`) - use `#292D32` and `#EFF7EF`
- Use `text-dark` for primary text
- Use `text-muted` for secondary/helper text
- Use `text-primary` sparingly for emphasis

---

## Typography

**Font Family**: Inter (sans-serif)

### Scale
- **Heading 1**: `text-4xl font-semibold` (36px)
- **Heading 2**: `text-2xl font-semibold` (24px)
- **Heading 3**: `text-xl font-medium` (20px)
- **Body**: `text-base` (16px)
- **Small**: `text-sm` (14px)
- **Caption**: `text-xs text-muted` (12px)

### Rules
- Use `font-medium` (500) for emphasis, `font-semibold` (600) for headings
- **NEVER** use `font-bold` (700) - it's too heavy for this design
- Line height should be relaxed: use `leading-relaxed` for body text

---

## Spacing & Layout

### Border Radius
- **Small** (inputs, small cards): `rounded-[12px]` or `rounded-radius-sm`
- **Medium** (buttons, cards): `rounded-[16px]` or `rounded-radius-md`
- **Large** (modals, large cards): `rounded-[24px]` or `rounded-radius-lg`
- **XL** (hero sections): `rounded-[32px]` or `rounded-radius-xl`

### Spacing Scale
Use Tailwind's default scale with preference for:
- `p-4` (16px) - standard padding
- `p-6` (24px) - card padding
- `p-8` (32px) - section padding
- `gap-4` (16px) - standard gaps
- `gap-6` (24px) - larger gaps

### Rules
- **NEVER** use sharp corners (`rounded-none`)
- Minimum border radius is 12px for interactive elements
- Use generous padding - when in doubt, add more space

---

## Liquid Glass Effects

### Glass Card (Primary)
```jsx
<div className="glass p-6">
  {/* content */}
</div>
```
Use for: Main cards, modals, prominent containers

### Glass Subtle
```jsx
<div className="glass-subtle p-4">
  {/* content */}
</div>
```
Use for: Secondary cards, nested elements, hover states

### Glass Dark
```jsx
<div className="glass-dark p-6">
  {/* content */}
</div>
```
Use for: Dark sections, footers, contrast areas

### Custom Glass (when needed)
```jsx
<div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-[24px] shadow-soft">
  {/* content */}
</div>
```

---

## Components

### Buttons

**Primary Button**
```jsx
<button className="btn btn-primary">
  <Icon size={18} />
  Button Text
</button>
```

**Secondary Button (Glass)**
```jsx
<button className="btn btn-secondary">
  Button Text
</button>
```

**Ghost Button**
```jsx
<button className="btn btn-ghost">
  Button Text
</button>
```

### Inputs

```jsx
<input
  type="text"
  className="input"
  placeholder="Placeholder text"
/>
```

### Cards

```jsx
<div className="glass p-6 space-y-4">
  <h3 className="text-xl font-medium text-dark">Card Title</h3>
  <p className="text-muted">Card description text here.</p>
</div>
```

---

## Icons

**Use Lucide React for ALL icons.**

```jsx
import { Search, Menu, X, ChevronRight } from 'lucide-react';

// Standard size
<Search size={20} className="text-dark" />

// In buttons
<Search size={18} />

// Large/hero icons
<Search size={24} className="text-primary" />
```

### Icon Rules
- Default size: `20` for standalone, `18` for in buttons
- **NEVER** use other icon libraries
- Use `strokeWidth={1.5}` for a lighter feel if needed
- Icons inherit text color - use `text-primary`, `text-dark`, or `text-muted`

---

## Animations & Transitions

### Standard Transition
```jsx
className="transition-all duration-200 ease-out"
```

### Hover Effects
- Buttons: `hover:translate-y-[-1px]` with shadow increase
- Cards: `hover:shadow-lg` (subtle lift)
- Links: `hover:text-primary` color change

### Rules
- Keep animations subtle and fast (150-300ms)
- **NEVER** use bouncy or spring animations
- Use `ease-out` for most transitions

---

## Do's and Don'ts

### DO
- Use the glass classes for cards and containers
- Use generous spacing and padding
- Keep the UI minimal and clean
- Use Lucide icons consistently
- Use the primary green sparingly for emphasis

### DON'T
- Use colors outside the defined palette
- Use sharp corners on any element
- Use heavy font weights (bold)
- Add unnecessary decorative elements
- Use multiple accent colors
- Create busy or cluttered layouts

---

## Quick Reference

```jsx
// Glass card with content
<div className="glass p-6 space-y-4">
  <h2 className="text-2xl font-semibold text-dark">Title</h2>
  <p className="text-muted leading-relaxed">Description</p>
  <button className="btn btn-primary">
    <ArrowRight size={18} />
    Action
  </button>
</div>

// Input group
<div className="space-y-2">
  <label className="text-sm font-medium text-dark">Label</label>
  <input className="input" placeholder="Enter value..." />
</div>

// Icon button
<button className="btn btn-ghost p-3">
  <Menu size={20} />
</button>
```
