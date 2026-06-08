# Frontend Developer Agent - Example Workflows

Contoh-contoh workflow konkret untuk berbagai skenario development.

---

## 🎨 Workflow 1: Membuat Component Library

### Scenario

Anda ingin membuat design system dengan reusable components.

### Step-by-step

**Step 1: Inisialisasi**

```
@frontend-developer Kita akan buat component library untuk project ini.
Framework: Nuxt 4 + TypeScript
Design system: Custom dengan Tailwind CSS
Components yang dibutuhkan:
- Button (5 variants, 3 sizes)
- Input (text, email, password, search)
- Card (dengan header, body, footer slots)
- Modal (dengan backdrop, close button)
- Dropdown (dengan keyboard navigation)

Load skill `building-components` dan buatkan structure folder yang optimal.
```

**Step 2: Design Tokens**

```
@frontend-developer Sebelum buat components, define design tokens dulu:

Colors:
- Primary: Blue (#3b82f6)
- Secondary: Purple (#8b5cf6)
- Success: Green (#10b981)
- Error: Red (#ef4444)
- Warning: Yellow (#f59e0b)

Typography:
- Display: "Space Grotesk"
- Body: "Inter"

Spacing scale: 4px base (4, 8, 12, 16, 24, 32, 48, 64)

Buat CSS variables di app/assets/styles/design-tokens.css
```

**Step 3: Component Creation**

```
@frontend-developer Buat Button component di app/components/ui/Button.vue dengan:

Props:
- variant: 'primary' | 'secondary' | 'success' | 'error' | 'ghost'
- size: 'sm' | 'md' | 'lg'
- disabled: boolean
- loading: boolean
- fullWidth: boolean
- leftIcon: Component (optional)
- rightIcon: Component (optional)

Features:
- Ripple effect on click
- Focus visible state
- Loading spinner
- Disabled state dengan opacity
- Accessible (ARIA labels, keyboard support)

Gunakan design tokens yang sudah dibuat.
```

**Step 4: Documentation**

```
@frontend-developer Buat storybook-style documentation di:
app/pages/components/button.vue

Include:
- All variants showcase
- All sizes showcase
- Interactive playground
- Props table
- Code examples
- Accessibility notes
```

---

## ⚡ Workflow 2: Performance Optimization

### Scenario

Dashboard dengan 500+ items terasa lambat saat scroll dan filter.

### Step-by-step

**Step 1: Performance Audit**

```
@frontend-developer Load skill `frontend-patterns` dan analyze:

Files:
- app/pages/dashboard.vue
- app/components/MarketList.vue
- app/components/MarketCard.vue

Cari:
- Unnecessary re-renders
- Missing memoization
- Large bundle imports
- N+1 rendering patterns
- Unoptimized data fetching
```

**Step 2: Implement Virtualization**

```
@frontend-developer MarketList render 500+ items. Implement virtualization:

- Gunakan @tanstack/vue-virtual atau library serupa
- Hanya render visible items + overscan
- Maintain scroll position
- Support dynamic heights
- Preserve keyboard navigation

Update app/components/MarketList.vue
```

**Step 3: Optimize Re-renders**

```
@frontend-developer Optimize re-renders di MarketCard:

Current issue: Every card re-renders saat user filter/sort

Solutions:
- Isolate expensive subcomponents and pass minimal reactive props
- Stabilize data flow with computed values and avoid unnecessary watchers
- Move filter logic to parent
- Use key prop correctly

Implement changes.
```

**Step 4: Bundle Optimization**

```
@frontend-developer Analyze bundle dan optimize:

1. Check import statements - avoid barrel imports
2. Lazy load heavy components (charts, editors)
3. Code split routes
4. Defer non-critical third-party scripts

Generate bundle analysis report dan implement optimizations.
```

**Step 5: Data Fetching**

```
@frontend-developer Optimize data fetching pattern:

Current: Sequential fetches causing waterfall
New: Parallel fetches dengan Promise.all

Also implement:
- Request deduplication dengan useSWR
- Optimistic updates
- Stale-while-revalidate
- Proper error boundaries
```

---

## 🎯 Workflow 3: Implementasi Design Figma

### Scenario

Designer memberikan Figma file untuk landing page baru.

### Step-by-step

**Step 1: Design Analysis**

```
@frontend-developer Analyze Figma design (attach screenshot atau link):

[Drag & drop Figma screenshot ke terminal]

Identify:
- Color palette dan typography
- Spacing system
- Component patterns
- Animation opportunities
- Responsive breakpoints

Load skill `impeccable` untuk design analysis.
```

**Step 2: Setup Structure**

```
@frontend-developer Based on design, setup page structure:

Create:
- app/pages/landing.vue (main page)
- app/components/landing/Hero.vue
- app/components/landing/Features.vue
- app/components/landing/Testimonials.vue
- app/components/landing/CTA.vue
- app/components/landing/Footer.vue

Extract design tokens ke CSS variables.
```

**Step 3: Implement Hero Section**

```
@frontend-developer Implement Hero section dengan:

Layout:
- Full viewport height
- Text left, visual right (desktop)
- Stacked (mobile)

Typography:
- H1: 72px bold dengan gradient text
- Subtitle: 24px regular
- CTA buttons: Primary + Secondary

Animations:
- Text fade-in from bottom (stagger 100ms)
- Visual fade-in from right
- Parallax background effect
- Smooth scroll to sections

Ensure responsive dan accessible.
```

**Step 4: Interactive Elements**

```
@frontend-developer Add micro-interactions:

Buttons:
- Hover: Scale 1.05 + shadow increase
- Active: Scale 0.98
- Ripple effect on click

Cards:
- Hover: Lift effect (translate + shadow)
- Focus: Visible outline
- Tilt on mouse move (subtle 3D effect)

Navigation:
- Sticky header on scroll
- Active section indicator
- Smooth scroll to anchors
```

**Step 5: Performance Check**

```
@frontend-developer Before shipping, verify:

✓ Images optimized (use <NuxtImg>)
✓ Fonts preloaded
✓ Animations use transform/opacity only
✓ No layout shift (CLS)
✓ Lazy load below-fold content
✓ Critical CSS inlined

Run Lighthouse audit dan fix issues.
```

---

## 🔐 Workflow 4: Form dengan Validation

### Scenario

Complex form untuk create market prediction.

### Step-by-step

**Step 1: Schema Definition**

```
@frontend-developer Setup form validation dengan Zod:

Fields:
- title: string (required, 5-200 chars)
- description: string (required, 20-2000 chars)
- category: enum (required, dari predefined list)
- endDate: datetime (required, future date)
- options: array of strings (min 2, max 10 options)
- tags: array of strings (optional, max 5)

Create schema di app/schemas/market.schema.ts
```

**Step 2: Form Component**

```
@frontend-developer Build form di app/components/forms/CreateMarketForm.vue:

Features:
- Real-time validation (onChange)
- Error messages below each field
- Submit disabled until valid
- Loading state during submission
- Success/error toast notifications

Use Nuxt UI form components sebagai base.
Load skill `security-review` untuk validation best practices.
```

**Step 3: Field Components**

```
@frontend-developer Create custom field components:

1. TextInput.vue
   - Label + input + error message
   - Character counter
   - Helper text support
   - Icon support (left/right)

2. SelectInput.vue
   - Custom styled select
   - Search functionality
   - Keyboard navigation
   - Multiple selection support

3. DateTimePicker.vue
   - Calendar popup
   - Time picker
   - Min/max date constraints
   - Timezone aware

4. TagInput.vue
   - Add tags with Enter
   - Remove tags with backspace
   - Max tags limit
   - Duplicate prevention
```

**Step 4: Submit Handler**

```
@frontend-developer Implement submit logic:

async function handleSubmit() {
  // 1. Validate form
  const validated = await schema.parseAsync(formData)

  // 2. Optimistic update
  addMarketOptimistic(validated)

  // 3. API call
  try {
    const result = await $fetch('/api/markets', {
      method: 'POST',
      body: validated
    })

    // 4. Success handling
    toast.success('Market created!')
    router.push(`/markets/${result.id}`)

  } catch (error) {
    // 5. Error handling
    revertOptimisticUpdate()
    handleApiError(error)
  }
}

Include proper error handling dan loading states.
```

**Step 5: Accessibility**

```
@frontend-developer Ensure form accessibility:

✓ All inputs have labels
✓ Error messages associated with inputs (aria-describedby)
✓ Focus management (focus first error on submit)
✓ Keyboard navigation works
✓ Screen reader announcements
✓ Required fields marked (aria-required)
✓ Fieldset for related inputs

Test dengan keyboard only dan screen reader.
```

---

## 🧪 Workflow 5: Testing Integration

### Scenario

Add comprehensive tests untuk critical user flow.

### Step-by-step

**Step 1: Test Setup**

```
@frontend-developer Load skill `tdd-workflow` dan setup testing:

Install:
- @nuxt/test-utils
- @vue/test-utils
- vitest
- @testing-library/vue

Create test file structure:
- tests/unit/components/
- tests/integration/pages/
- tests/e2e/flows/

Setup test config di vitest.config.ts
```

**Step 2: Component Tests**

```
@frontend-developer Write unit tests untuk Button component:

Test cases:
✓ Renders with correct variant classes
✓ Calls onClick when clicked
✓ Shows loading spinner when loading=true
✓ Disabled state prevents clicks
✓ Keyboard (Enter/Space) triggers onClick
✓ Icon slots render correctly
✓ Ripple effect applies

Target: 80%+ coverage
```

**Step 3: Integration Tests**

```
@frontend-developer Write integration test untuk CreateMarketForm:

Test flow:
1. Form renders with empty fields
2. Fill title → no error
3. Fill invalid description (too short) → error shown
4. Fix description → error clears
5. Select category → dropdown works
6. Add tags → tag chips appear
7. Submit form → loading state → success redirect

Mock API calls dengan MSW.
```

**Step 4: E2E Tests**

```
@frontend-developer Setup Playwright E2E test untuk user journey:

Scenario: "User creates and bets on market"

Steps:
1. Navigate to /markets/create
2. Fill form with valid data
3. Submit and verify redirect to market page
4. Click "Place Bet" button
5. Select outcome and amount
6. Confirm bet
7. Verify bet appears in "My Bets"

Include visual regression testing.
```

---

## 🎭 Workflow 6: Dark Mode Implementation

### Scenario

Add dark mode support dengan smooth transition.

### Step-by-step

**Step 1: Setup Theme System**

```
@frontend-developer Setup theme system dengan CSS variables:

Create app/assets/styles/themes.css:

:root {
  /* Light theme */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
}

[data-theme="dark"] {
  /* Dark theme */
  --color-bg-primary: #111827;
  --color-bg-secondary: #1f2937;
  --color-text-primary: #f9fafb;
  --color-text-secondary: #9ca3af;
  --color-border: #374151;
}

Ensure all components use CSS variables.
```

**Step 2: Theme Toggle Component**

```
@frontend-developer Create ThemeToggle.vue component:

Features:
- Sun icon (light mode)
- Moon icon (dark mode)
- Smooth icon transition
- Persist preference (localStorage)
- Sync across tabs (storage event)
- Respect system preference (prefers-color-scheme)
- No flash on page load

Add to navigation bar.
```

**Step 3: Theme Composable**

```
@frontend-developer Create useTheme composable:

export function useTheme() {
  const theme = ref<'light' | 'dark'>('light')

  const setTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme
    document.documentElement.dataset.theme = newTheme
    localStorage.setItem('theme', newTheme)
  }

  const toggleTheme = () => {
    setTheme(theme.value === 'light' ? 'dark' : 'light')
  }

  // Initialize from localStorage or system preference
  onMounted(() => {
    const saved = localStorage.getItem('theme')
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    setTheme((saved as any) || system)
  })

  return { theme, setTheme, toggleTheme }
}
```

**Step 4: Update Components**

```
@frontend-developer Update all components untuk support dark mode:

Priority components:
1. Button (hover states, disabled states)
2. Card (borders, shadows)
3. Input (focus states, placeholders)
4. Modal (backdrop, close button)
5. Dropdown (hover, active states)

Ensure proper contrast ratios in both themes (WCAG AA).
```

**Step 5: Smooth Transitions**

```
@frontend-developer Add smooth theme transitions:

CSS:
* {
  transition:
    background-color 200ms ease,
    border-color 200ms ease,
    color 200ms ease;
}

Exceptions (no transition):
- Animations (keep them snappy)
- Interactive elements (buttons, links)
- Transform/translate properties

Test transitions don't cause jank.
```

---

## 🚀 Workflow 7: Progressive Enhancement

### Scenario

Ensure app works tanpa JavaScript (SSR + hydration).

### Step-by-step

**Step 1: SSR Audit**

```
@frontend-developer Audit SSR compatibility:

Check:
✓ No direct access to window/document in <script setup>
✓ Use process.client for browser-only code
✓ useFetch for data (not mounted + fetch)
✓ No localStorage in server context
✓ Proper error handling for missing APIs

Scan all components dan fix issues.
```

**Step 2: Progressive Forms**

```
@frontend-developer Make forms work tanpa JS:

1. Use native form submission
2. Add action="/api/markets/create" method="POST"
3. Server handles form data
4. Redirect to result page
5. Enhance dengan JS (preventDefault, fetch, optimistic updates)

This way form works even if JS fails to load.
```

**Step 3: Lazy Hydration**

```
@frontend-developer Implement lazy hydration untuk non-critical components:

Components to defer:
- Marketing sections (testimonials, features)
- Footer
- Non-interactive content
- Below-fold elements

Use:
- <ClientOnly> for truly optional components
- Intersection Observer untuk lazy hydration
- requestIdleCallback untuk low priority hydration
```

---

## 📊 Workflow 8: Analytics Integration

### Scenario

Add analytics tracking untuk user behavior.

### Step-by-step

**Step 1: Setup Analytics**

```
@frontend-developer Setup analytics dengan privacy-first approach:

Tools:
- Plausible Analytics (GDPR compliant)
- Custom event tracking
- Page view tracking
- Error tracking

Create app/plugins/analytics.client.ts
```

**Step 2: Event Tracking**

```
@frontend-developer Create useAnalytics composable:

Events to track:
- market_viewed (marketId, category)
- bet_placed (marketId, amount, outcome)
- search_performed (query, resultsCount)
- filter_applied (filterType, value)
- share_clicked (marketId, platform)

Usage:
const { track } = useAnalytics()
track('market_viewed', { marketId: 123, category: 'sports' })
```

**Step 3: Performance Monitoring**

```
@frontend-developer Track web vitals:

Metrics:
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- TTFB (Time to First Byte)

Send to analytics untuk monitoring.
```

---

## 💡 Tips Umum untuk Semua Workflows

### 1. Iterative Approach

Jangan minta semua sekaligus. Break down menjadi small tasks.

### 2. Review Checkpoints

Setelah setiap major step, minta agent review:

```
@frontend-developer Review yang sudah dibuat, ada yang bisa diimprove?
```

### 3. Ask for Alternatives

Jika tidak puas dengan approach:

```
@frontend-developer Ada alternative approach yang lebih simple/performant?
```

### 4. Documentation

Selalu minta dokumentasi:

```
@frontend-developer Tambahkan JSDoc comments dan usage examples
```

### 5. Accessibility First

Selalu remind accessibility:

```
@frontend-developer CRITICAL: Ensure WCAG 2.1 AA compliance
```

---

**Happy Building! 🎉**

Workflows ini bisa dicustomize sesuai kebutuhan project Anda.
