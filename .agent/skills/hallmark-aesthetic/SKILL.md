---
name: hallmark-aesthetic
description: "Anti-AI-slop design skill combining Nutlope's Hallmark slop-gates, Refero Styles DNA locks, and Webflow-tier Framer Motion architecture."
risk: unknown
source: user-custom
date_added: "2026-05-25"
---

# Hallmark Aesthetic Engine

You are executing the **Hallmark Aesthetic** skill. This skill is a strict compiler for frontend requests. Your goal is to completely eradicate "AI UI Slop"—generic, predictable, default-styled web interfaces. 

By merging Nutlope's Hallmark philosophy, Refero.design's aesthetic DNA locking, and Webflow's high-tier motion architecture, you will build frontends that look like they were crafted by a top-tier design agency.

**Crucial Mandate:** For React/Next.js environments, you **MUST** use `framer-motion` for all layout transitions and scroll effects.

---

## The Four Verbs

When the user invokes this skill, they may use one of four verbs. If no verb is specified, default to **build**.

1. **build**: Pick a macrostructure, apply the anti-slop rule-set, enforce `DESIGN.md`, and run the slop test before handing back.
2. **audit <target>**: Score existing code against the anti-patterns below. Generate a punch list, but make no edits.
3. **redesign <target>**: Throw out the structure, keep copy + IA + brand, but rebuild with an entirely different visual fingerprint.
4. **study <screenshot | URL>**: Extract the **DNA** from a design. Refuse pixel-clones. Emit a portable `DESIGN.md` capturing the essence (colors, typography, spacing rhythm).

---

## Phase 1: The Refero Dimension (DNA Lock)

Before writing any component code, you MUST establish the aesthetic DNA.
Generate or update a `DESIGN.md` file (or `design-system/MASTER.md`) containing:

- **Aesthetic Direction**: e.g., "Midnight Command Center", "Pixar Storyboard on Cream", "Architectural Blueprint".
- **Typography**: 1 display font, 1 restrained body font. (NO Inter, Roboto, Arial).
- **Color Anchor**: One dominant tone, one accent, one neutral system. Define specific hex codes/CSS variables.
- **Micro-interaction Logic**: How do buttons feel? (e.g., "Magnetic snap on hover with 0.2s ease-out").

You are forbidden from hallucinating random Tailwind color classes (like `bg-blue-500` or `text-gray-400`) that deviate from this locked DNA.

---

## Phase 2: The Webflow Dimension (Motion Architecture)

Static pages are slop. You must implement fluid, Webflow-tier motion using **Framer Motion** (if React/Next.js) or **GSAP** (if vanilla).

1. **Scroll-Driven Narratives**: Use `useScroll` and `useTransform` to bind element opacity, scale, or y-axis movement to the user's scroll position.
2. **Staggered Reveals**: Never reveal a list or grid of items simultaneously. Use `variants`, `staggerChildren`, and `delayChildren` to create a cascading entrance.
3. **Layout Animations**: Use the `<motion.div layoutId="xyz">` prop to smoothly animate elements between different DOM positions or states.
4. **Magnetic/Organic Hovers**: Buttons and cards should have slight scale (`whileHover={{ scale: 1.02 }}`) and active states (`whileTap={{ scale: 0.98 }}`).

---

## Phase 3: The Hallmark Dimension (Slop-Test Gates)

Before outputting the final code, run this mental self-critique. If the design fails ANY of these gates, **rebuild it**.

### Anti-Patterns (Immediate Failure)
❌ Symmetrical, evenly-spaced 3-column feature grids (The most common AI slop).
❌ Generic purple-to-blue or pink-to-orange Tailwind gradients (`bg-gradient-to-r from-purple-500 to-blue-500`).
❌ System fonts (Inter, San Francisco, Roboto).
❌ Centered hero text with a generic "Get Started" button below it.
❌ Default `shadow-md` or `rounded-lg` on every card.

### Pro-Patterns (Required)
✅ **Asymmetry & Overlap**: Break the grid intentionally. Let images overlap text boundaries.
✅ **Intentional Density**: Either use extreme, severe whitespace (Minimalism) or high-density packed information (Bento boxes/Command Centers).
✅ **Texture**: Introduce subtle noise overlays (`mix-blend-mode`), grain, or complex gradient meshes.
✅ **Custom Borders**: Use 1px borders with very low opacity (`border-white/10`) for sleek, dark-mode glassmorphism.

---

## Output Format

1. **Design DNA Summary**: Briefly state the aesthetic direction and the 2 fonts chosen.
2. **Slop-Test Report**: Explicitly state how this design avoids generic AI tropes (e.g., "I avoided the standard 3-column feature grid by using an asymmetric bento layout").
3. **Implementation**: Output the fully working code, with Framer Motion logic heavily integrated.

Never apologize. Never explain basic React concepts. Just deliver the highest tier of web design possible.
