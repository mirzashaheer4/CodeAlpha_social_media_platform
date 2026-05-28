# Design System: Nocturne

This design system is built for a premium, high-fidelity dark social media experience ("Nocturne"). The UI leverages glassmorphism, soft glow elevation, and modern geometry.

---

## Brand & Visual Identity
- **Personality:** Immersive, tech-forward, sophisticated, sleek.
- **Theme Color Mode:** Dark (`#0f0f17` obsidian background).
- **Core Aesthetics:** Translucent frosted glass card overlays, glowing ambient accent focus rings, organic avatar curves, and ultra-crisp geometric font pairings.

---

## Design Tokens

### 1. Colors
```yaml
background: '#0f0f17'              # Obsidian primary canvas
surface: '#13131b'                 # Standard cards/containers base
surface-dim: '#13131b'
surface-bright: '#393841'
surface-container-lowest: '#0d0d15'
surface-container-low: '#1b1b23'
surface-container: '#1f1f27'
surface-container-high: '#292932'
surface-container-highest: '#34343d'
on-surface: '#e4e1ed'              # Soft slate white for text body
on-surface-variant: '#c7c4d7'      # Muted silver white for descriptions
outline: '#908fa0'                 # Soft borders
outline-variant: '#464554'

# Accent Colors
primary: '#6366f1'                 # Indigo-500 (Vibrant indigo for highlights & actions)
on-primary: '#ffffff'
primary-container: '#8083ff'
on-primary-container: '#0d0096'

# Auxiliary Colors
error: '#ffb4ab'
on-error: '#690005'
error-container: '#93000a'
on-error-container: '#ffdad6'
```

### 2. Glassmorphic Surface Elevations
Elevation is simulated using progressive tonal opacity and background blurs instead of drop shadows.

- **Level 1 Surface (Cards, Composers, Input Blocks):**
  - Background: `rgba(255, 255, 255, 0.05)`
  - Backdrop Blur: `blur(12px)`
  - Border: `1px solid rgba(255, 255, 255, 0.1)`
- **Level 2 Surface (Modals, Dropdowns, Float overlays):**
  - Background: `rgba(255, 255, 255, 0.08)`
  - Backdrop Blur: `blur(24px)`
  - Border: `1px solid rgba(255, 255, 255, 0.15)`
  - Glow Shadow: `0 8px 32px 0 rgba(99, 102, 241, 0.05)` (subtle ambient glow)

### 3. Typography
- **Google Fonts Pairing URL:** `https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Inter:wght@400;500&display=swap`
- **Headings & Usernames:** `Outfit` (weights: 500, 600, 700)
- **Body & Inputs:** `Inter` (weights: 400, 500)

```yaml
display-lg:
  fontFamily: Outfit
  fontSize: 48px
  fontWeight: '700'
  lineHeight: 56px
  letterSpacing: -0.02em
headline-lg:
  fontFamily: Outfit
  fontSize: 32px
  fontWeight: '600'
  lineHeight: 40px
  letterSpacing: -0.01em
headline-md:
  fontFamily: Outfit
  fontSize: 24px
  fontWeight: '600'
  lineHeight: 32px
body-lg:
  fontFamily: Inter
  fontSize: 18px
  fontWeight: '400'
  lineHeight: 28px
body-md:
  fontFamily: Inter
  fontSize: 16px
  fontWeight: '400'
  lineHeight: 24px
body-sm:
  fontFamily: Inter
  fontSize: 14px
  fontWeight: '400'
  lineHeight: 20px
label-md:
  fontFamily: Inter
  fontSize: 14px
  fontWeight: '600'
  lineHeight: 16px
  letterSpacing: 0.05em
caption:
  fontFamily: Inter
  fontSize: 12px
  fontWeight: '400'
  lineHeight: 16px
```

### 4. Shapes & Roundness
- **sm:** `0.25rem` (4px) - mini tags, status items
- **DEFAULT (md):** `0.5rem` (8px) - buttons, inputs
- **lg:** `1rem` (16px) - standard post/comment cards
- **xl:** `1.5rem` (24px) - modal overlays, profile grids
- **full:** `9999px` - circular avatar boundaries, fully rounded buttons

### 5. Spacing Rhythm (8px Base)
- **xs:** `4px`
- **sm:** `8px`
- **md:** `16px` (Standard inner card padding)
- **lg:** `24px` (Card gaps, vertical divisions)
- **xl:** `40px` (Section paddings)
- **container-max:** `1280px`
- **margin-mobile:** `16px`
- **margin-desktop:** `32px`

---

## Styling Enforcement & Hard Rules
1. **The DESIGN.md Enforcement Rule:** Every color, spacing, radius, border, and blur value used in the CSS files MUST map to these custom properties. Contradictory values are strictly forbidden.
2. **Typography Rules:** Outfit is strictly bound to titles, action elements, and usernames. Inter handles narrative feeds, comments text, input keys, and logs labels.
3. **Glass Border Integrity:** Card elements must retain a crisp `1px` white translucent border with backdrop-filter.
