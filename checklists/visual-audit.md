# Visual Audit Checklist — Veyra OS

This checklist is utilized by the **VLM UI Reviewer** and frontend agents to ensure web interfaces comply with elite modern styling, responsive breakpoints, and grid layouts.

---

## 1. Spacing and Alignment (Grid System)
- [ ] **Baseline Grid**: All vertical elements are aligned to a strict 4px/8px baseline grid (spacing, padding, margins).
- [ ] **Horizontal Grid**: Component columns align perfectly with the page container layout (12-column grid on desktop, 4-column on mobile).
- [ ] **Flex/Grid Gaps**: Elements do not suffer from uneven distribution or overlapping bounds.
- [ ] **Container Padding**: Edge padding is consistent (e.g., 16px on mobile, 24px on tablet, 32px on desktop).

---

## 2. Responsive Breakpoints
- [ ] **Desktop Viewport (1440px)**: Content scales elegantly. No massive horizontal blank spaces or giant oversized buttons.
- [ ] **Tablet Viewport (768px)**: Grid shifts smoothly. Navigation menus compress (hamburger menus used if necessary).
- [ ] **Mobile Viewport (375px)**: No horizontal scrolling (critical). Elements stack vertically. Buttons are easily tappable (min 44x44px).
- [ ] **Text Reflow**: Headlines reflow cleanly without breaking words in half or overlapping lines.

---

## 3. Z-Index and Layer Collisions
- [ ] **Overlap Checks**: Sticky headers, modals, dropdowns, and buttons hover perfectly over other elements.
- [ ] **Z-Index Boundaries**: Ensure headers have higher z-index than content, modals higher than headers, and dropdowns higher than surrounding fields.
- [ ] **Shadow Layering**: Elements with elevations use subtle, smooth gradients or box-shadows to demarcate layers, not harsh black outlines.

---

## 4. Typography & Visual Hierarchy
- [ ] **Line Heights**: Font sizes have proportional line-heights (e.g., body text has min 1.5 line-height) to prevent text clipping.
- [ ] **Contrast**: Text color vs background color meets WCAG AA standards (min 4.5:1 ratio for regular text, 3:1 for large text).
- [ ] **Header Weight**: Heading elements (`h1`, `h2`, `h3`) are visually distinctive from body copy and follow a logical size hierarchy.

---

## 5. Visual Consistency (Premium Aesthetics)
- [ ] **Color Harmony**: Gradients are smooth and follow a strict HSL/RGB palette. No plain default browser primary colors.
- [ ] **Micro-animations**: Interactive elements (buttons, links, cards) have subtle micro-hover scaling or border-color transition timings (e.g., `transition: all 0.2s ease`).
- [ ] **Component Consistency**: Rounded corners (border-radii), button heights, and input styles are consistent across all views.
