Before delivering UI code:
Visual Quality:
- [ ] No emojis as icons (SVG only)
- [ ] All icons from consistent set (Heroicons/Lucide)
- [ ] Hover states don't cause layout shift
- [ ] 4px/8px baseline grid followed

Interaction:
- [ ] All clickable elements have cursor: pointer
- [ ] Transitions smooth (150-300ms, cubic-bezier)
- [ ] Focus states visible for keyboard navigation
- [ ] Loading states use skeleton screens

Accessibility:
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] prefers-reduced-motion respected
- [ ] ARIA labels on interactive elements
- [ ] Tab order is logical

Responsive:
- [ ] Works at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Touch targets >= 44px