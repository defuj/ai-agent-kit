# React Frontend Developer Agent — Panduan Lengkap

Dokumentasi lengkap untuk React Frontend Developer Agent (`@frontend-react`).

## Daftar Isi

- [Tentang Agent](#tentang-agent)
- [Cara Aktivasi](#cara-aktivasi)
- [Stack yang Didukung](#stack-yang-didukung)
- [Skills](#skills)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Tips & Best Practices](#tips--best-practices)
- [Referensi Lanjutan](#referensi-lanjutan)

## Tentang Agent

React Frontend Developer Agent adalah subagent spesialis untuk pengembangan frontend menggunakan **React.js / Next.js / Vite**. Agent ini dipanggil oleh IT Leader (`leader`) ketika project membutuhkan frontend berbasis React.

**Stack utama:**
- React 19 + TypeScript strict
- Next.js 15 (App Router) — Server Components, Server Actions, Route Handlers
- Vite + React plugin
- Tailwind CSS v4
- shadcn/ui component library
- TanStack Query (data fetching)
- Zustand (state management)
- React Hook Form + Zod (form validation)
- Framer Motion (animations)

## Cara Aktivasi

### Via IT Leader (Recommended)

IT Leader akan otomatis mendelegasikan task ke `@frontend-react` ketika project menggunakan React/Next.js.

### Manual

```
@frontend-react [deskripsi task]
```

## Skills

### Auto-loaded Skills

Setiap session, agent akan load:
1. `coding-standards` — Universal coding standards
2. `frontend-patterns` — React/Next.js patterns
3. `impeccable` — Impeccable design intelligence
4. `web-design-guidelines` — UI/UX compliance

### Contextual Skills (load sesuai kebutuhan)

- `shadcn-ui` — shadcn/ui components
- `vercel-react-best-practices` — React performance optimization
- `vercel-composition-patterns` — Component composition patterns
- `building-components` — Component library creation
- `security-review` — Auth/user input security
- `tdd-workflow` — Test-driven development

## Contoh Penggunaan

### 1. Build Component

```
@frontend-react Buat ProductCard component:
- Props: product (name, price, image, rating)
- Variants: default, loading, error
- Responsive: mobile-first
- Animasi: hover scale
- Accessibility: ARIA labels
```

### 2. Setup Data Fetching

```
@frontend-react Setup TanStack Query untuk products page:
- GET /api/products — list with pagination
- GET /api/products/[id] — single product
- POST /api/products — create
- Handle loading, error, empty states
```

### 3. Implement Form

```
@frontend-react Buat CreateProduct form:
- Fields: name, description, price, category
- Validation: Zod schema
- Submit: Server Action
- States: idle, submitting, success, error
```

### 4. Server Component

```
@frontend-react Buat ProductList sebagai Server Component:
- Fetch langsung dari database
- Search params untuk filter
- Streaming dengan Suspense
- Revalidation periodik
```

### 5. Performance Optimization

```
@frontend-react Load `vercel-react-best-practices` dan audit:
- Bundle size
- Re-render patterns
- Image optimization
- Code splitting
```

## Tips & Best Practices

### Server Components First

Gunakan Server Components secara default. Tambah `'use client'` hanya ketika membutuhkan:
- Browser APIs (localStorage, event handlers)
- useState / useEffect
- onClick / onChange
- Custom hooks dengan browser APIs

### Data Fetching

- **Server Components**: `fetch()` langsung dengan `next.revalidate`
- **Client Components**: TanStack Query untuk caching & refetch
- **Mutations**: Server Actions (Next.js) atau TanStack Query mutations

### State Management

- **Server State**: Server Components + TanStack Query
- **Client State**: Zustand untuk global state
- **Form State**: React Hook Form
- **URL State**: useSearchParams / useParams

### Component Patterns

- Gunakan shadcn/ui components sebagai base
- Custom components via composition
- Props interface dengan TypeScript strict
- Gunakan React.memo hanya untuk expensive renders

### Accessibility

- Semantic HTML elements
- ARIA labels untuk interactive elements
- Keyboard navigation
- Color contrast WCAG 2.1 AA
- Focus management untuk modals

## Referensi Lanjutan

| Dokumen | Deskripsi |
|---------|-----------|
| [QUICK_START.md](./QUICK_START.md) | Mulai dalam 5 menit |
| [CHEATSHEET.md](./CHEATSHEET.md) | Quick commands reference |
| [API_PATTERNS.md](./API_PATTERNS.md) | Data fetching patterns |
| [INDEX.md](./INDEX.md) | Full documentation index |
