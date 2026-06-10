---
name: code-review-workflow
description: >-
  Systematic code review process (scope → read → analyze → report → verify),
  severity classification (critical/high/medium/low), security checklist (auth,
  injection, XSS, CSRF, secrets), TypeScript/React/Vue specific code smells,
  performance review patterns, API contract review, accessibility checklist
  (WCAG 2.1 AA), testing quality assessment, and structured review output format.
  Skill khusus untuk @reviewer — Code Reviewer/QA Engineer.
version: 1.0.0
author: opencode-agent-kit
metadata:
  target_agent: reviewer
  stack:
    - TypeScript
    - React 19 / Next.js 15
    - Vue 3 / Nuxt 4
    - Node.js / Express
    - Prisma / PostgreSQL
    - Tailwind CSS
    - Vitest / Playwright
  topics:
    - code-review
    - security-audit
    - accessibility
    - performance-review
    - api-contract-review
    - testing-quality
    - code-smells
    - wcag-compliance
---

# Code Review Workflow Skill

Skill untuk agent `@reviewer` — Code Reviewer/QA Engineer. Berisi systematic code review process, severity classification, security checklist, framework-specific code smells, performance review patterns, API contract review, accessibility checklist (WCAG 2.1 AA), testing quality assessment, dan structured review output format.

**Stack:** TypeScript · React 19/Next.js 15 · Vue 3/Nuxt 4 · Node.js/Express · Prisma/PostgreSQL · Vitest/Playwright

---

## 1. Systematic Code Review Process

Ikuti 5 fase bertahap: **Scope → Read → Analyze → Report → Verify**.

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  SCOPE  │ →  │  READ   │ →  │ ANALYZE │ →  │ REPORT  │ →  │ VERIFY  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### Fase 1: Scope (Tentukan Lingkup Review)

| Aktivitas | Deskripsi |
|-----------|-----------|
| Tentukan mode | `fast` (single file), `balanced` (1-2 subagents), `thorough` (full audit) |
| Identifikasi area | Frontend (Vue/React), Backend (Node), Database (Prisma), API contracts |
| Prioritaskan risiko | Security-impacting changes, auth boundaries, data mutations |
| Kumpulkan konteks | PR description, acceptance criteria, related issues, stack details |

**Output:** Daftar file yang akan direview + fokus area + mode review.

### Fase 2: Read (Baca Kode Secara Sistematis)

1. **Baca struktur file** — pahami alur dari high level (imports, exports, component tree).
2. **Baca entry points** — controller/handler/page function signatures.
3. **Baca business logic** — conditional branches, loops, data mutations.
4. **Baca error paths** — try/catch blocks, error boundaries, fallback values.
5. **Baca test files** — coverage, edge cases, assertion quality.

> **Jangan** membaca line-by-line dari atas ke bawah tanpa konteks. Baca dengan tujuan: "Apa yang dilakukan kode ini? Apa yang bisa salah?"

### Fase 3: Analyze (Evaluasi Berdasarkan Checklist)

Gunakan checklist di bawah sesuai area review:
- [Code Quality Checklist](#2-code-quality-checklist)
- [Security Checklist](#3-security-checklist)
- [TypeScript/React/Vue Code Smells](#5-typescriptreactvue-code-smells)
- [Performance Review Patterns](#6-performance-review-patterns)
- [API Contract Review](#7-api-contract-review)
- [Accessibility Checklist (WCAG 2.1 AA)](#8-accessibility-checklist-wcag-21-aa)
- [Testing Quality Assessment](#9-testing-quality-assessment)

### Fase 4: Report (Dokumentasikan Temuan)

Gunakan format output terstruktur (lihat [Review Output Format](#10-review-output-format)).

**Aturan pelaporan:**
- Satu issue per baris tabel — jangan menggabungkan multiple issues.
- Sertakan file path dan line number yang presisi.
- Berikan `suggestion` yang actionable, bukan kritik abstrak.
- Pisahkan severity dengan jelas (critical → low).

### Fase 5: Verify (Verifikasi Perbaikan)

Setelah fix didelegasikan ke subagent:

1. **Re-review** file yang diubah — pastikan fix benar dan tidak introduce regression.
2. **Check test results** — pastikan test baru lulus dan coverage terpenuhi.
3. **Verify no new issues** — pastikan fix tidak menimbulkan masalah baru.
4. **Update status** — `verified` / `partially_verified` / `not_verified`.

---

## 2. Severity Classification

| Severity | Definition | Action | Response Time |
|----------|------------|--------|---------------|
| **Critical** | Security vulnerability, data loss risk, production break, auth bypass, exposed secrets | Must fix before merge — block PR | Immediate |
| **High** | Significant bug, accessibility blocker, broken functionality, missing validation, performance regression | Should fix before merge | Within 24h |
| **Medium** | Code quality issue, missing error handling, test gap, minor accessibility issue, missing documentation | Should fix soon | Within sprint |
| **Low** | Style inconsistency, minor optimization, naming suggestion, formatting gap, documentation enhancement | Nice to have | Backlog |

### Escalation Rules

- **Critical** — eskalasi ke user segera. Gunakan question tool dengan opsi: "Block PR", "Fix with override", "Discuss approach".
- **High** — tunda merge hingga resolved. Bisa didelegasikan ke subagent tanpa eskalasi user.
- **Medium/Low** — dokumentasikan di report, delegasikan ke subagent jika waktu memungkinkan.

---

## 3. Security Checklist

### Authentication & Authorization

- [ ] All protected routes require valid authentication (JWT/session/cookie)
- [ ] Token validation includes expiration, signature, issuer checks
- [ ] Authorization checks verify resource ownership (user can only access own data)
- [ ] Role/permission-based access control enforced on all admin endpoints
- [ ] Password policies enforced (min length, complexity, hashing with bcrypt/argon2)
- [ ] MFA considered for sensitive operations
- [ ] Session management: secure cookie flags (HttpOnly, Secure, SameSite), rotation
- [ ] Rate limiting on auth endpoints (login, register, password reset)
- [ ] Account lockout on repeated failed attempts

### Injection Prevention

- [ ] SQL injection: parameterized queries (Prisma), no raw SQL concatenation
- [ ] NoSQL injection: input sanitization for MongoDB queries
- [ ] Command injection: avoid `exec()`, `spawn()` with unsanitized input
- [ ] LDAP/XML injection: sanitize or avoid
- [ ] Template injection: no user input in template rendering (Server-Side Template Injection)
- [ ] ORM/query builder injection: validate sort/filter parameters

### XSS Prevention

- [ ] Output encoding on all user-generated content (React: JSX auto-escapes; Vue: `{{ }}` auto-escapes)
- [ ] `dangerouslySetInnerHTML` / `v-html` usage reviewed and justified — never with unsanitized user input
- [ ] Content Security Policy (CSP) headers configured
- [ ] Rich text content sanitized (DOMPurify, sanitize-html)
- [ ] URL validation for user-provided links (no `javascript:` protocol)
- [ ] Event handler injection prevented (no inline `on*` attributes from user input)
- [ ] JSON serialization protects against XSS (no unescaped `<script>` tags)

### CSRF Prevention

- [ ] CSRF tokens on all state-changing requests (POST/PUT/PATCH/DELETE)
- [ ] SameSite cookie attribute set (`Lax` or `Strict`)
- [ ] Custom header validation for API requests (e.g., `X-Requested-With: XMLHttpRequest`)
- [ ] GET requests are side-effect free
- [ ] Double-submit cookie pattern or synchronizer token pattern applied

### Secrets & Sensitive Data

- [ ] No hardcoded secrets, API keys, passwords, or tokens in source code
- [ ] Environment variables used for all configuration
- [ ] `.env` files in `.gitignore` — never committed
- [ ] No secrets in logs, error messages, or API responses
- [ ] Secret rotation strategy documented
- [ ] Encryption at rest for PII (Personally Identifiable Information)
- [ ] HTTPS enforced in production (HSTS headers)
- [ ] Sensitive data masked in logs (credit cards, SSN, tokens)

### Additional Security

- [ ] File uploads validated: type (MIME), size limit, content scan, path traversal prevention
- [ ] CORS configured correctly (whitelist origins, not `*`)
- [ ] Security headers configured (Helmet or equivalent)
- [ ] Error messages do not leak stack traces or internal details (production)
- [ ] Input validation at API boundary (Zod, class-validator, DTO)
- [ ] Prototype pollution prevention (safe object merge/clone)
- [ ] Dependency vulnerabilities checked (npm audit, Snyk, Dependabot)

---

## 4. Code Quality Checklist

### Structure & Readability

- [ ] Code is readable and self-documenting
- [ ] Functions are small, single-purpose (SRP)
- [ ] Variable/function names are descriptive and consistent
- [ ] No code duplication (DRY principle)
- [ ] No dead code, commented-out code, or unused imports
- [ ] Complex logic has explanatory comments ("why" not "what")
- [ ] Consistent indentation and formatting
- [ ] File size is reasonable (< 300 lines per file preferred)

### Error Handling

- [ ] All async operations have error handling (try/catch, .catch())
- [ ] Error messages are user-friendly in UI, technical in logs
- [ ] Error boundaries implemented in React (componentDidCatch / error boundaries)
- [ ] Vue error handling via errorCaptured hook or Nuxt error handling
- [ ] Proper HTTP status codes returned (4xx for client, 5xx for server)
- [ ] Graceful degradation for failed API calls

### TypeScript

- [ ] `strict: true` in tsconfig — no `any`, implicit `any`, or `strictNullChecks` disabled
- [ ] Explicit return types on functions (especially public/exported)
- [ ] Generics used where appropriate (not `unknown` or `any` casts)
- [ ] No type assertions (`as`) without justification — use type guards
- [ ] Discriminated unions for complex state
- [ ] Proper null/undefined handling (optional chaining, nullish coalescing)

---

## 5. TypeScript/React/Vue Code Smells

### TypeScript Code Smells

| Smell | Problem | Fix |
|-------|---------|-----|
| `as any` / `as unknown as X` | Bypasses type system entirely | Use proper types, type guards, or zod validation |
| `// @ts-ignore` or `// @ts-expect-error` without reason | Silences real errors | Fix the underlying type issue |
| Overly broad types (`object`, `{}`, `Record<string, any>`) | No type safety | Define exact interfaces |
| Nested `Promise<Promise<T>>` | Type pollution | Flatten with `await` or `.flat()` |
| `any` in function parameters | Defeats type checking | Use union types or generics |
| Missing `satisfies` operator | Missed type validation | Use `satisfies` for complex object types |
| Non-null assertion (`!`) without guard | Runtime crash risk | Add runtime check or use optional chaining |
| Overloaded function types with many signatures | Hard to read and maintain | Use union types or conditional types |

### React (Next.js 15 / React 19) Code Smells

| Smell | Problem | Fix |
|-------|---------|-----|
| `useEffect` for derived state | Unnecessary re-renders | Compute state directly or use `useMemo` |
| `useEffect` without dependencies | Infinite loops, missing cleanup | Specify deps array, add cleanup function |
| Missing key on list items | Broken reconciliation, re-render issues | Use stable unique `key` (not index) |
| Prop drilling (3+ levels) | Tight coupling, hard to maintain | Use Context, Zustand, or composition |
| `useState` for complex nested objects | Mutation bugs | Use `useImmer`, immutable updates, or split state |
| `forwardRef` in React 19 | Deprecated | Use `ref` as a regular prop |
| Missing `'use client'` on interactive components | Hydration mismatch in Next.js App Router | Add `'use client'` directive |
| Server Component fetching without error boundary | Unhandled errors | Wrap in error boundary or try/catch |
| `useCallback` on every function | Premature optimization | Only when passed as prop to memoized child |
| Large `useMemo` dependencies array | Hard to reason about | Split computation or memoize sub-values |
| Inline styles / CSS-in-JS without design tokens | Inconsistent styling | Use Tailwind classes or design system tokens |
| Missing Suspense boundaries | Poor loading UX | Wrap data-fetching components in `<Suspense>` |
| Overusing `useContext` for global state | Performance issues (re-render entire tree) | Use Zustand, Jotai, or selective context splitting |

### Vue 3 (Nuxt 4) Code Smells

| Smell | Problem | Fix |
|-------|---------|-----|
| `watch` on primitive value without `deep: true` needed | Missed nested changes | Use `deep: true` or `watchEffect` |
| `v-for` without `:key` | Broken list rendering, performance issues | Always provide unique `:key` |
| `v-if` + `v-for` on same element | Vue 3 warns — renders both | Use computed filter or separate wrapper |
| Mutating props directly | Breeds bugs and confusion | Use emit events, v-model, or computed setter |
| `provide/inject` for everything | Hard to trace data flow | Use Pinia for global state |
| `reactive()` for primitives | Useless, creates unnecessary wrapper | Use `ref()` |
| Missing `<NuxtPage>` | Page transitions break | Include `<NuxtPage>` in layouts |
| `asyncData` without error handling | Unhandled promise rejection | Wrap in try/catch, use `.catch()` |
| Direct DOM manipulation in composables | Nuxt SSR hydration mismatch | Use `onMounted` or `nextTick` |
| `useFetch` without `key` | Duplicate requests, caching issues | Provide explicit key or use unique URL |
| Huge single-file components (> 400 lines) | Hard to read, maintain, test | Split into composables or child components |
| Overusing `defineEmits` with many events | Component contract unclear | Group related events or use typed emits |
| Multiple `v-model` without naming conflicts | Confusing templates | Use named v-models (`v-model:name`) |

---

## 6. Performance Review Patterns

### Frontend Performance

| Pattern | What to Check | Fix |
|---------|---------------|-----|
| Bundle size | Large imports (moment.js → date-fns, lodash tree-shaking) | Use `next/dynamic` / Nuxt `lazy` / dynamic imports |
| Component re-renders | Unnecessary re-renders (parent re-renders child without memo) | `React.memo`, `useMemo`, `useCallback`; Vue `computed`, `shallowRef` |
| Image optimization | Unoptimized images, missing dimensions, lazy loading | Use `next/image` / `<NuxtImg>`, lazy loading, responsive sizes |
| List rendering | Large lists without virtualization | Use `react-window` / `vue-virtual-scroller` / TanStack Virtual |
| CSS performance | Unused CSS, complex selectors, runtime CSS-in-JS | PurgeCSS, Tailwind JIT, utility-first classes |
| State management | Over-fetching, unnecessary context subscriptions | Select state slices, use atomic stores (Zustand, Pinia) |
| Code splitting | Single large bundle for all routes | Route-based code splitting, dynamic imports for heavy components |
| Font loading | Render-blocking font loading | `font-display: swap`, preload critical fonts |

### Backend Performance

| Pattern | What to Check | Fix |
|---------|---------------|-----|
| N+1 queries | Loop with individual queries inside | Use Prisma `include`/`select`, eager loading, batch queries |
| Missing indexes | Queries scanning full tables | Add database indexes on filtered/joined columns |
| Large payloads | Returning full objects when only subset needed | Projection (select only needed fields), pagination |
| Inefficient pagination | `OFFSET` with large page numbers | Use cursor-based pagination (keyset pagination) |
| Unoptimized joins | Joining unrelated tables | Review relation structure, use lazy loading where appropriate |
| No caching | Repeated identical queries | Implement Redis/in-memory cache with TTL |
| Synchronous blocking | Expensive sync operations in request cycle | Use async/await, background jobs (Bull, RabbitMQ) |
| Missing connection pooling | Multiple DB connection creations | Use Prisma connection pool, proper pool size |

### Database Query Review

```sql
-- BAD: N+1 pattern
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { userId: user.id } });
}

-- GOOD: Eager loading
const users = await prisma.user.findMany({
  include: { posts: true }
});
```

```sql
-- BAD: OFFSET pagination for large datasets
SELECT * FROM posts ORDER BY created_at DESC OFFSET 10000 LIMIT 20;

-- GOOD: Cursor-based pagination
SELECT * FROM posts WHERE created_at < :cursor ORDER BY created_at DESC LIMIT 20;
```

---

## 7. API Contract Review

### Request Validation

- [ ] Request body validated with schema (Zod, class-validator, Joi)
- [ ] Required fields have clear error messages
- [ ] Type coercion prevented — explicit parsing from query/params/body
- [ ] Pagination parameters validated (page, limit within bounds)
- [ ] Sort/filter parameters whitelisted (no arbitrary field injection)

### Response Contract

- [ ] Consistent response envelope (e.g., `{ data, meta, error }`)
- [ ] HTTP status codes semantically correct (200, 201, 204, 400, 401, 403, 404, 422, 500)
- [ ] Error responses include `message` and optional `code`/`details`
- [ ] Response DTOs transform internal models (no exposing DB fields like `passwordHash`)
- [ ] `null` vs `undefined` handled consistently in responses
- [ ] Dates formatted consistently (ISO 8601 UTC)

### API Contract Checklist

| Check | Description |
|-------|-------------|
| Method correctness | GET for reads, POST for creates, PUT/PATCH for updates, DELETE for deletes |
| URL naming | RESTful plural nouns (`/api/users`, `/api/posts/:id/comments`) |
| Versioning | `/api/v1/` prefix or header-based versioning |
| Idempotency | PUT/DELETE are idempotent; POST is not |
| Rate limiting | Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` |
| CORS | Proper origin, method, and header configuration |
| Content-Type | `application/json` consistently, accept header validation |
| Auth header | `Authorization: Bearer <token>` consistently |

### Common API Contract Violations

| Violation | Example | Fix |
|-----------|---------|-----|
| Inconsistent error shape | `{ error: "msg" }` vs `{ message: "msg" }` | Standardize error envelope |
| Leaking internal IDs | Returning `mongoId` or `_id` directly | Use response DTOs/transformers |
| Missing pagination meta | Returning array without total/count | Add `{ data, meta: { total, page, limit } }` |
| Non-RESTful mutations | `GET /api/users/delete/1` | Use `DELETE /api/users/:id` |
| No input validation error details | `400 Bad Request` without details | Return validation errors with field info |

---

## 8. Accessibility Checklist (WCAG 2.1 AA)

### Perceivable

- [ ] **1.1.1 Non-text Content** — All images have meaningful `alt` text; decorative images have `alt=""`
- [ ] **1.2.1 Audio-only/Video-only** — Captions or transcripts for multimedia
- [ ] **1.3.1 Info and Relationships** — Semantic HTML (`<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<header>`, `<footer>`)
- [ ] **1.3.2 Meaningful Sequence** — Content presented in logical DOM order
- [ ] **1.3.3 Sensory Characteristics** — Instructions don't rely on shape, size, or location alone
- [ ] **1.3.4 Orientation** — Content not locked to portrait/landscape only
- [ ] **1.3.5 Identify Input Purpose** — Autocomplete attributes on form fields (`autocomplete="email"`, etc.)
- [ ] **1.4.1 Use of Color** — Color alone not used to convey information (add icons, text, patterns)
- [ ] **1.4.3 Contrast (Minimum)** — Text contrast ratio ≥ 4.5:1; large text ≥ 3:1
- [ ] **1.4.4 Resize Text** — Text can zoom up to 200% without loss of content/functionality
- [ ] **1.4.5 Images of Text** — Text used instead of images of text (except logos)
- [ ] **1.4.10 Reflow** — Content responsive without horizontal scrolling at 320px width
- [ ] **1.4.11 Non-text Contrast** — UI components and graphical objects ≥ 3:1 contrast
- [ ] **1.4.12 Text Spacing** — No loss of content when text spacing overridden
- [ ] **1.4.13 Content on Hover/Focus** — Tooltips/dropdowns dismissible without moving pointer

### Operable

- [ ] **2.1.1 Keyboard** — All functionality operable via keyboard (Tab, Enter, Space, Arrow keys)
- [ ] **2.1.2 No Keyboard Trap** — Focus can move away from any component
- [ ] **2.1.4 Character Key Shortcuts** — Single-key shortcuts can be turned off or remapped
- [ ] **2.2.1 Timing Adjustable** — Time limits can be extended, turned off, or adjusted
- [ ] **2.2.2 Pause, Stop, Hide** — Auto-updating/moving content can be paused
- [ ] **2.3.1 Three Flashes** — No content flashes more than 3 times per second
- [ ] **2.4.1 Bypass Blocks** — Skip-to-content link available
- [ ] **2.4.2 Page Titled** — Descriptive `<title>` per page
- [ ] **2.4.3 Focus Order** — Tab order follows logical reading order
- [ ] **2.4.4 Link Purpose (In Context)** — Link text describes destination (not "click here")
- [ ] **2.4.5 Multiple Ways** — More than one way to find content (search, sitemap, navigation)
- [ ] **2.4.6 Headings and Labels** — Descriptive headings and form labels
- [ ] **2.4.7 Focus Visible** — Visible focus indicator on all interactive elements (outline, ring)
- [ ] **2.5.1 Pointer Gestures** — All functionality available via single-point activation (not path-based)
- [ ] **2.5.2 Pointer Cancellation** — No down-event executes action (use click, not mousedown)
- [ ] **2.5.3 Label in Name** — Accessible name matches visible text label
- [ ] **2.5.4 Motion Actuation** — Functionality not dependent on device motion (shake, tilt)
- [ ] **2.5.7 Dragging Movements** — Alternative single-point activation for drag operations (WCAG 2.2)
- [ ] **2.5.8 Target Size** — Interactive targets ≥ 24x24px (WCAG 2.2)

### Understandable

- [ ] **3.1.1 Language of Page** — `lang` attribute on `<html>` element
- [ ] **3.1.2 Language of Parts** — Language changes within content marked with `lang` attribute
- [ ] **3.2.1 On Focus** — No unexpected context change when element receives focus
- [ ] **3.2.2 On Input** — No unexpected context change on input (no auto-submit)
- [ ] **3.2.3 Consistent Navigation** — Navigation repeated across pages in same relative order
- [ ] **3.2.4 Consistent Identification** — Same components identified consistently (icons, labels)
- [ ] **3.3.1 Error Identification** — Input errors described clearly (which field, what's wrong)
- [ ] **3.3.2 Labels or Instructions** — Form inputs have associated labels and instructions
- [ ] **3.3.3 Error Suggestion** — Suggestions provided for fixing input errors
- [ ] **3.3.4 Error Prevention (Legal/Financial)** — Reversible, checked, or confirmed submissions

### Robust

- [ ] **4.1.1 Parsing** — No duplicate IDs, properly nested elements (legacy — HTML5 handles this)
- [ ] **4.1.2 Name, Role, Value** — Custom interactive elements have proper ARIA roles, states, and properties
- [ ] **4.1.3 Status Messages** — Dynamic content changes announced by screen readers (`aria-live`, `role="alert"`)

### Framework-Specific A11y Checks

#### React

| Check | Implementation |
|-------|---------------|
| `aria-*` attributes | Always use kebab-case (React auto-converts) |
| Dynamic focus management | `useRef` + `.focus()` on route change, modal open, error display |
| Live regions | `aria-live="polite"` on toast/notification components |
| Form validation errors | `aria-describedby` linking input to error message |
| Skip link | `<a href="#main-content">Skip to content</a>` at top |

#### Vue

| Check | Implementation |
|-------|---------------|
| `v-bind` for aria | `:aria-label="label"` or `aria-label="Static text"` |
| Focus management | Template refs + `$nextTick` + `.focus()` |
| Live regions | `aria-live` binding on dynamic regions |
| Form errors | `aria-describedby` with `:id` binding |
| Teleport | `<Teleport to="body">` for modals/toasts (proper DOM order) |

### Color & Contrast Quick Reference

| Element | Required Ratio | Example |
|---------|---------------|---------|
| Normal text (< 18px) | ≥ 4.5:1 | #666 on #fff = 5.2:1 ✓ |
| Large text (≥ 18px bold / ≥ 24px) | ≥ 3:1 | #999 on #fff = 2.7:1 ✗ |
| UI components (borders, icons) | ≥ 3:1 | Button border, focus ring |
| Input placeholder | ≥ 4.5:1 (text) or exempt (if clearly placeholder) | #bbb on #fff = 1.9:1 ✗ |

---

## 9. Testing Quality Assessment

### Coverage Requirements

| Test Type | Target | What It Covers |
|-----------|--------|----------------|
| Unit tests | ≥ 80% for business logic | Individual functions, composables, utils |
| Integration tests | All API endpoints | Request/response, middleware, DB interaction |
| E2E tests | Critical user flows | Auth flow, CRUD operations, form submission |

### Test Quality Criteria

| Criterion | Pass | Fail |
|-----------|------|------|
| **Deterministic** | Same result every run, order-independent | Flaky (timeout, race condition, shared state) |
| **Isolated** | No test depends on another | Tests share DB state without cleanup |
| **Fast** | Unit: < 100ms, Integration: < 500ms, E2E: < 10s | Test includes unnecessary delays (`setTimeout`, `wait`) |
| **Readable** | Clear AAA (Arrange-Act-Assert) structure | Giant beforeEach, no comments, magic numbers |
| **Maintainable** | Easy to update when code changes | Tightly coupled to implementation details |
| **Edge Cases** | Null/undefined, empty arrays, max length, auth errors | Only happy path tested |
| **Error Paths** | 4xx, 5xx, network failure, timeout | Only success path tested |
| **Realistic Data** | Accurate mock data reflecting production patterns | Lorem ipsum, unrealistic in production |

### Testing Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Testing implementation details | Breaks on refactor | Test behavior/contract, not internal calls |
| Over-mocking | Tests pass but code breaks in production | Mock at boundaries (API, DB, filesystem) |
| Snapshot-heavy tests | Large snapshots, meaningless failures | Limit snapshots to critical UI; use specific assertions |
| No negations | Missed edge cases | Test: "should NOT do X when Y" |
| `describe/it` nesting > 3 levels | Hard to read | Flatten test structure |
| Test logic in `beforeEach` | Hidden state, hard to debug | Use factory functions for test setup |
| Time-dependent tests without mocking | Flaky on CI (timezone, clock skew) | Use `vi.useFakeTimers()` / `jest.useFakeTimers()` |
| Missing accessibility assertions | A11y regression | Use `@testing-library/jest-dom` matchers, `vitest-axe`, `axe-core` |

### Testing Stack Reference

| Stack | Unit | Integration | E2E | A11y |
|-------|------|-------------|-----|------|
| React (Next.js) | Vitest + React Testing Library | Vitest + MSW | Playwright | axe-core, vitest-axe |
| Vue (Nuxt) | Vitest + Vue Test Utils | Vitest + MSW | Playwright | axe-core, vitest-axe |
| Node (Express) | Vitest | Supertest + Vitest | — | — |

### Accessibility Test Patterns

```typescript
// React: A11y test example
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'vitest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

```typescript
// Vue: A11y test example
import { mount } from '@vue/test-utils';
import { axe, toHaveNoViolations } from 'vitest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const wrapper = mount(MyComponent);
  const results = await axe(wrapper.element);
  expect(results).toHaveNoViolations();
});
```

---

## 10. Review Output Format

### Format for Simple Tasks (single file / fast mode)

```
## Review Summary
- File: {file path}
- Lines reviewed: {count}
- Overall assessment: {pass / needs changes / major issues}
- Review mode: fast

## Issues Found

| Severity | Location | Issue | Suggestion |
|----------|----------|-------|------------|
| {critical/high/medium/low} | `{file}:{line}` | {description} | {fix recommendation} |

## Verification Status
- Code quality: {pass/fail}
- Security: {pass/fail}
- Performance: {pass/fail}
- Accessibility: {pass/fail / N/A}

## Recommendations
- {actionable suggestions}
```

### Format for Complex Tasks (feature / full audit)

```
## Review Scope
- Files reviewed: {count}
- Subagents involved: {list}
- Review mode: {fast/balanced/thorough}
- Review areas: {list}

## Code Quality Assessment
- Readability: {pass/fail + notes}
- Maintainability: {pass/fail + notes}
- Standards compliance: {pass/fail + notes}

## Security Assessment
- Input validation: {pass/fail + notes}
- Auth boundaries: {pass/fail + notes}
- Secret handling: {pass/fail + notes}
- XSS/CSRF prevention: {pass/fail + notes}
- SQL injection prevention: {pass/fail + notes}

## Performance Assessment
- Query efficiency: {pass/fail + notes}
- Bundle size: {pass/fail + notes}
- Render performance: {pass/fail + notes}

## Accessibility Assessment
- WCAG 2.1 AA compliance: {pass/fail + notes}
- Keyboard navigation: {pass/fail + notes}
- Screen reader support: {pass/fail + notes}

## Testing Assessment
- Unit test coverage: {percentage + notes}
- Integration test coverage: {notes}
- E2E test coverage: {notes}
- Test quality: {pass/fail + notes}

## Issues Found

| Severity | File | Line | Category | Issue | Suggestion |
|----------|------|------|----------|-------|------------|
| {severity} | `{path}` | {line} | {code-quality/security/perf/a11y/testing} | {description} | {recommendation} |

## Delegation
{fix tasks delegated to appropriate subagents}

---

*(After fixes are applied)*

## Re-Review Status
- Previously critical issues: {resolved/pending}
- Previously high issues: {resolved/pending}
- New issues: {count + description}

## Overall Status
- Verification: {verified | partially_verified | not_verified}
- Ready for merge: {yes/no + conditions}
- Follow-up: {remaining items}
```

### Output Rules

1. **One issue per row** — jangan menggabungkan multiple issues dalam satu baris tabel.
2. **Presisi lokasi** — sertakan `{file}:{line}` untuk setiap issue. Untuk range, gunakan `{file}:{start}-{end}`.
3. **Severity order** — urutkan issues dari Critical → Low.
4. **Category tagging** — gunakan kategori: `code-quality`, `security`, `perf`, `a11y`, `testing`, `api-contract`.
5. **Actionable suggestions** — setiap issue harus punya suggestion yang bisa langsung dieksekusi.
6. **No empty sections** — jika suatu area tidak direview, gunakan `N/A`.

---

## 11. Review Mode Configuration

### Fast Mode (Single File / Quick Check)

**Use when:** Single file edit, small PR (< 50 lines), quick security check, urgent hotfix review.

**Process:**
1. Read the changed file (or diff)
2. Run security checklist (fast — auth, injection, secrets)
3. Run code quality checklist (fast — naming, DRY, error handling)
4. Report findings with severity
5. No delegation needed (fix directly or flag)

**Time estimate:** 2–5 minutes

### Balanced Mode (Default — Typical Feature)

**Use when:** Feature PR involving 1–2 subagents, common review requests.

**Process:**
1. Scope review (files, areas, risk)
2. Read all changed files systematically
3. Run full security + code quality checklist
4. Run relevant framework-specific smell detection (React/Vue)
5. Run performance patterns review
6. Run API contract review (if backend involved)
7. Run accessibility checklist (if frontend involved)
8. Run testing quality assessment
9. Compile report with delegation plan
10. Verify fixes after delegation

**Time estimate:** 15–30 minutes

### Thorough Mode (Full Audit / Release Review)

**Use when:** Major features, release candidates, refactors, security-sensitive changes, pre-production audit.

**Process:**
Same as Balanced + additionally:
- Full WCAG 2.1 AA audit (all criteria checked)
- Full security review (all sub-items checked)
- Performance profiling review (bundle analysis, query analysis)
- Testing quality deep dive (coverage reports, test structure)
- API contract full review (all endpoints documented)
- Dependency vulnerability scan (review npm audit output)
- Architectural review (data flow, component hierarchy)
- Standards compliance (TypeScript strict, naming conventions, lint rules)
- Documentation completeness (README, API docs, migration guides)

**Time estimate:** 1–3 hours

---

## 12. Quick Reference Cards

### Security Quick Card (5-Minute Scan)

```
□ Auth: Protected routes require valid tokens?
□ Injection: No raw SQL / unsanitized inputs?
□ XSS: No dangerouslySetInnerHTML / v-html?
□ CSRF: Tokens on state-changing requests?
□ Secrets: No hardcoded keys/passwords?
□ Validation: Input validated at API boundary?
```

### A11y Quick Card (5-Minute Scan)

```
□ Alt text on all images?
□ Semantic HTML (nav, main, section)?
□ Keyboard navigable (Tab through all interactive)?
□ Focus visible (outline on all interactive)?
□ Color contrast ≥ 4.5:1 for text?
□ Form labels associated with inputs?
□ Skip-to-content link present?
```

### Performance Quick Card (5-Minute Scan)

```
□ No N+1 queries?
□ Images optimized (lazy, responsive)?
□ Bundle splitting for routes?
□ List virtualization for large lists?
□ DB queries indexed?
□ Pagination for large datasets?
□ Caching strategy evident?
```

---

## 13. Delegation Best Practices

Saat mendelegasikan fix ke subagent (`@frontend-nuxt`, `@frontend-react`, `@backend`):

1. **Be Specific** — Reference exact file paths, line numbers, and the issue found.
2. **Explain the Why** — Don't just say "fix this" — explain why it's a problem (security, perf, a11y).
3. **Provide the Fix Pattern** — Show the expected pattern, not just the problem description.
4. **Set Boundaries** — State what NOT to change (unrelated code, config, architecture).
5. **Define Success** — Specify what "fixed" looks like (test passing, security check, a11y violation resolved).
6. **Prioritize** — Order fixes by severity (critical → high → medium → low).

### Delegation Template

```markdown
## Fix Request: {issue title}

### Issue
- **Severity:** {critical/high/medium/low}
- **File:** `{path}:{line}`
- **Category:** {security/code-quality/perf/a11y/testing/api}
- **Description:** {what's wrong}

### Why It Matters
{explain impact — security risk, user experience, maintainability}

### Suggested Fix
{pattern or code snippet showing expected implementation}

### Success Criteria
- {criterion 1}
- {criterion 2}

### Boundaries
- Do NOT change: {files/logic to leave alone}
