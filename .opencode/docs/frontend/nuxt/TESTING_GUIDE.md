# Frontend Developer Agent - Testing Guide

Panduan untuk testing dan validasi Frontend Developer Agent.

## Daftar Isi

1. [Pre-Testing Checklist](#pre-testing-checklist)
2. [Basic Functionality Tests](#basic-functionality-tests)
3. [MCP Integration Tests](#mcp-integration-tests)
4. [Skills Integration Tests](#skills-integration-tests)
5. [Advanced Scenarios](#advanced-scenarios)
6. [Troubleshooting](#troubleshooting)

---

## Pre-Testing Checklist

Sebelum mulai testing, pastikan:

### 1. Configuration Files

```bash
# Check agent configuration
cat .opencode/config.json

# Verify MCP servers configured
# Expected: nuxt, nuxt-ui, playwright enabled
```

### 2. Documentation Files

```bash
# List agent documentation
ls -la .opencode/agents/

# Expected files:
# - frontend-developer.md (agent definition)
# - README.md (user guide)
# - WORKFLOWS.md (workflow examples)
# - CHEATSHEET.md (quick reference)
# - QUICK_START.md (getting started)
# - MCP_GUIDE.md (MCP integration)
# - EXAMPLES.md (practical examples)
# - TESTING_GUIDE.md (this file)
```

### 3. Environment Setup

```bash
# Check .env.example has Figma token placeholder
grep FIGMA .env.example

# Verify project structure
ls -la app/
ls -la server/
ls -la shared/
```

### 4. Skills Available

```bash
# Global skills
ls ~/.opencode/skills/

# Additional skills
ls ~/.agents/skills/ 2>/dev/null || echo "No additional skills"

# Expected core skills:
# - coding-standards
# - frontend-patterns
# - impeccable
# - nuxt-ui
# - web-design-guidelines
```

---

## Basic Functionality Tests

### Test 1: Agent Activation

**Command:**

```
@frontend Hello! Introduce yourself and list your capabilities.
```

**Expected Response:**

- ✅ Agent responds dengan identity sebagai frontend expert
- ✅ Mentions Nuxt.js & Nuxt UI specialization
- ✅ Lists core capabilities (component dev, accessibility, performance, etc.)
- ✅ Mentions MCP integration
- ✅ Professional tone, concise

**Pass Criteria:**

- Response < 500 words
- Mentions at least 5 core capabilities
- Explains MCP integration briefly

---

### Test 2: File Reading & Analysis

**Command:**

```
@frontend Analyze struktur project ini. Apa framework yang digunakan?
```

**Expected Response:**

- ✅ Identifies Nuxt 4 framework
- ✅ Lists key directories (app/, server/, shared/)
- ✅ Identifies package.json dependencies
- ✅ Notes testing setup (Vitest, Playwright)
- ✅ Identifies UI framework (Nuxt UI)

**Pass Criteria:**

- Correctly identifies all major frameworks
- Provides directory structure overview
- Notes important configuration files

---

### Test 3: Simple Component Creation

**Command:**

```
@frontend Create simple Button component dengan props:
- label (string)
- variant (primary | secondary)
- disabled (boolean)

Gunakan TypeScript dan Nuxt UI.
```

**Expected Output:**

- ✅ File: `app/components/Button.vue` or `app/components/common/Button.vue`
- ✅ Uses `<script setup lang="ts">`
- ✅ TypeScript interface untuk props
- ✅ Uses Nuxt UI `<UButton>` if applicable
- ✅ Proper default values
- ✅ Accessible attributes

**Pass Criteria:**

```vue
<!-- Expected structure -->
<script setup lang="ts">
interface Props {
  label: string
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  disabled: false,
})
</script>

<template>
  <UButton :variant="variant" :disabled="disabled">
    {{ label }}
  </UButton>
</template>
```

---

## MCP Integration Tests

### Test 4: Nuxt Documentation Query

**Command:**

```
@frontend Bagaimana cara implement server-side data fetching di Nuxt 4?
Gunakan Nuxt MCP untuk check documentation.
```

**Expected Behavior:**

- ✅ Agent queries Nuxt MCP server
- ✅ Retrieves latest Nuxt 4 documentation
- ✅ Explains `useFetch` and `useAsyncData`
- ✅ Provides code example
- ✅ Mentions SSR considerations

**Pass Criteria:**

- Response includes MCP query confirmation
- Code examples use Nuxt 4 patterns (not Nuxt 2/3)
- Explains difference between `useFetch` and `useAsyncData`
- Includes TypeScript typing

---

### Test 5: Nuxt UI Component Discovery

**Command:**

```
@frontend Apa component terbaik dari Nuxt UI untuk membuat notification system?
Check Nuxt UI MCP untuk options available.
```

**Expected Behavior:**

- ✅ Queries Nuxt UI MCP
- ✅ Lists available notification components
- ✅ Compares `<UNotification>`, `<UToast>`, `<UAlert>`
- ✅ Provides recommendation dengan reasoning
- ✅ Shows implementation example

**Pass Criteria:**

- Lists multiple relevant components
- Explains use cases for each
- Provides working code example
- Includes props documentation

---

### Test 6: Playwright Testing

**Command:**

```
@frontend Create E2E test untuk login page menggunakan Playwright.
Path: /login
Test scenario: success login dengan valid credentials.
```

**Expected Behavior:**

- ✅ Uses Playwright MCP if available
- ✅ Creates test file in correct location
- ✅ Includes proper test structure
- ✅ Has assertions untuk success state
- ✅ Includes error scenarios

**Expected Output:**

```typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="email"]', 'user@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Welcome')
  })
})
```

---

## Skills Integration Tests

### Test 7: Coding Standards Skill

**Command:**

```
@frontend Review code quality untuk file app/components/UserCard.vue
Load skill coding-standards untuk check best practices.
```

**Expected Behavior:**

- ✅ Loads `coding-standards` skill
- ✅ Checks TypeScript strict mode compliance
- ✅ Verifies no `any` types
- ✅ Checks component composition
- ✅ Reviews naming conventions
- ✅ Provides detailed feedback

**Pass Criteria:**

- Explicitly mentions loading coding-standards skill
- Provides categorized feedback (critical/warning/info)
- Includes code examples for fixes
- References specific coding standards

---

### Test 8: Accessibility Review Skill

**Command:**

```
@frontend Review accessibility untuk Modal component.
Load skill web-design-guidelines untuk WCAG 2.1 compliance.
```

**Expected Behavior:**

- ✅ Loads `web-design-guidelines` skill
- ✅ Checks semantic HTML
- ✅ Verifies ARIA attributes
- ✅ Tests keyboard navigation
- ✅ Checks color contrast
- ✅ Provides WCAG compliance report

**Expected Report Structure:**

```markdown
# Accessibility Audit

## WCAG 2.1 Level AA Compliance

### Issues Found

1. ❌ Missing role="dialog"
2. ⚠️ Low color contrast (3.2:1, needs 4.5:1)

### Recommendations

[Detailed fixes with code examples]

### After Fixes

✅ All criteria met
```

---

### Test 9: Frontend Patterns Skill

**Command:**

```
@frontend Implement data fetching dengan error handling untuk /api/products.
Load skill frontend-patterns untuk best practices.
```

**Expected Behavior:**

- ✅ Loads `frontend-patterns` skill
- ✅ Uses Nuxt 4 composables (`useFetch`)
- ✅ Implements loading states
- ✅ Adds error boundaries
- ✅ Includes retry mechanism
- ✅ Proper TypeScript typing

---

### Test 10: Multiple Skills Integration

**Command:**

```
@frontend Create ProductCard component dengan requirements:
- Accessible (WCAG 2.1)
- Optimized performance
- Clean code standards
- Uses Nuxt UI components

Load relevant skills: web-design-guidelines, coding-standards, frontend-patterns, nuxt-ui
```

**Expected Behavior:**

- ✅ Loads all 4 mentioned skills
- ✅ Applies patterns from each skill
- ✅ Creates comprehensive component
- ✅ Includes tests
- ✅ Provides documentation

**Pass Criteria:**

- Component meets all requirements
- Code follows all loaded skill patterns
- Includes accessibility features
- Performance optimized (lazy loading, etc.)
- Clean, typed code

---

## Advanced Scenarios

### Test 11: Complex Feature Implementation

**Scenario:** Multi-step form dengan validation, file upload, auto-save

**Command:**

```
@frontend Implement user profile update form dengan:
1. Multi-step wizard (3 steps: Personal, Contact, Preferences)
2. Zod validation per step
3. Avatar upload dengan preview
4. Auto-save draft ke localStorage
5. Progress indicator
6. Nuxt UI components

Load skills: frontend-patterns, nuxt-ui, coding-standards
```

**Expected Deliverables:**

- ✅ Form component dengan proper structure
- ✅ Zod schemas untuk validation
- ✅ Step navigation logic
- ✅ File upload handling
- ✅ Auto-save composable
- ✅ Progress component
- ✅ Comprehensive tests

**Validation Checklist:**

- [ ] All steps implemented
- [ ] Validation works per step
- [ ] File upload with preview
- [ ] Auto-save functionality
- [ ] Progress indicator accurate
- [ ] Uses Nuxt UI components
- [ ] TypeScript strict mode
- [ ] Accessible
- [ ] Tests cover all scenarios

---

### Test 12: Performance Optimization

**Scenario:** Optimize slow product listing page

**Command:**

```
@frontend Optimize /products page yang load 500+ products:
- Current FCP: 3.5s
- Target FCP: < 1.5s
- Target Lighthouse: 90+

Analyze dan implement optimizations.
Load skill: frontend-patterns
```

**Expected Actions:**

1. ✅ Analyze current implementation
2. ✅ Identify bottlenecks
3. ✅ Implement lazy loading
4. ✅ Add image optimization
5. ✅ Use virtual scrolling
6. ✅ Code splitting
7. ✅ Measure improvements

**Expected Report:**

```markdown
# Performance Optimization Report

## Before

- Bundle size: 500KB
- FCP: 3.5s
- Lighthouse: 65

## Optimizations Applied

1. Lazy load images with NuxtImg
2. Virtual scrolling for product list
3. Code splitting for heavy components
4. Implement route-level caching

## After

- Bundle size: 200KB (-60%)
- FCP: 1.2s (-66%)
- Lighthouse: 94 (+45%)

## Code Changes

[Detailed diff with explanations]
```

---

### Test 13: Bug Diagnosis & Fix

**Scenario:** Hydration mismatch error

**Command:**

```
@frontend Fix hydration error:
"Hydration completed but contains mismatches"

Error di app/pages/index.vue line 45.
Component menampilkan timestamp dengan new Date().toLocaleString()
```

**Expected Process:**

1. ✅ Analyze error cause
2. ✅ Explain SSR/CSR difference
3. ✅ Provide multiple fix options
4. ✅ Recommend best approach
5. ✅ Implement fix
6. ✅ Add preventive measures

**Expected Fix:**

```vue
<!-- Option 1: Client-only rendering -->
<ClientOnly fallback="Loading...">
  <p>{{ new Date().toLocaleString() }}</p>
</ClientOnly>

<!-- Option 2: Use ISO format (recommended) -->
<script setup lang="ts">
const timestamp = new Date().toISOString()
</script>
<template>
  <p>{{ timestamp }}</p>
</template>
```

---

### Test 14: Full Feature Development

**Scenario:** Complete shopping cart implementation

**Command:**

```
@frontend Implement complete shopping cart feature:

Requirements:
1. Pinia store untuk state management
2. Add/remove items dengan optimistic updates
3. Quantity adjustment
4. Total calculation dengan tax
5. Persist to localStorage
6. Sync across browser tabs
7. Cart sidebar component (Nuxt UI)
8. Checkout button integration
9. Unit tests untuk store
10. E2E tests untuk user flow

Load relevant skills dan MCP servers as needed.
```

**Expected Deliverables:**

1. ✅ `app/stores/cart.ts` - Pinia store
2. ✅ `app/components/cart/CartSidebar.vue` - UI component
3. ✅ `app/composables/useCart.ts` - Composable
4. ✅ `tests/unit/stores/cart.spec.ts` - Unit tests
5. ✅ `tests/e2e/cart.spec.ts` - E2E tests
6. ✅ Documentation dalam README atau comments

**Validation:**

- [ ] All 10 requirements met
- [ ] Store properly typed
- [ ] Optimistic updates work
- [ ] LocalStorage persistence
- [ ] Tab sync via BroadcastChannel
- [ ] UI uses Nuxt UI components
- [ ] Unit test coverage 80%+
- [ ] E2E tests cover critical paths
- [ ] Code follows standards
- [ ] Accessible

---

## Edge Cases & Error Handling

### Test 15: Invalid Request Handling

**Command:**

```
@frontend asdfghjkl
```

**Expected Behavior:**

- ✅ Asks for clarification politely
- ✅ Suggests what user might mean
- ✅ Doesn't proceed without clear instruction

---

### Test 16: Out of Scope Request

**Command:**

```
@frontend Setup PostgreSQL database dengan Docker
```

**Expected Behavior:**

- ✅ Politely declines (out of frontend scope)
- ✅ Suggests appropriate alternative (backend agent, if available)
- ✅ Offers related frontend help (e.g., API integration)

---

### Test 17: Ambiguous Requirements

**Command:**

```
@frontend Create form
```

**Expected Behavior:**

- ✅ Asks clarifying questions:
  - What fields needed?
  - Validation requirements?
  - Submit endpoint?
  - UI preferences?
- ✅ Doesn't make assumptions
- ✅ Waits for complete requirements

---

## Troubleshooting

### Issue: Agent tidak respond

**Debug Steps:**

```bash
# 1. Check agent configuration
cat .opencode/config.json | grep -A 20 '"frontend"'

# 2. Verify agent definition file exists
ls -la .opencode/agents/frontend-developer.md

# 3. Check OpenCode logs (if available)
# Look for errors related to agent initialization
```

**Solutions:**

- Restart OpenCode session
- Verify JSON syntax in config.json
- Check file permissions

---

### Issue: MCP servers tidak available

**Debug Steps:**

```bash
# Check MCP configuration
cat .opencode/config.json | grep -A 5 '"mcp"'

# Verify internet connection (for remote MCP)
curl -I https://nuxt.com/mcp

# Test Playwright installation (for stdio MCP)
npx @modelcontextprotocol/server-playwright --version
```

**Solutions:**

- Enable MCP servers: `"enabled": true`
- Check internet connection
- Install missing npm packages
- Verify environment variables (Figma token)

---

### Issue: Skills tidak load

**Debug Steps:**

```bash
# Check skills directories
ls ~/.opencode/skills/
ls ~/.agents/skills/

# Verify skill files exist
ls ~/.opencode/skills/coding-standards/SKILL.md
```

**Solutions:**

- Install missing skills
- Check file permissions
- Verify skill directory structure
- Explicitly mention skill in prompt

---

### Issue: Agent terlalu verbose

**Solutions:**

- Add constraint: `(concise)` in prompt
- Request specific format: "Show only code"
- Adjust temperature in config (lower = less creative)

---

### Issue: Wrong framework patterns

**Example:** Agent menggunakan pattern yang tidak sesuai Nuxt/Vue

**Solutions:**

- Explicitly mention: "Use Nuxt 4 patterns"
- Reference Nuxt MCP: "Check Nuxt MCP documentation"
- Load Nuxt-specific skills: "Load skill frontend-patterns"

---

## Performance Benchmarks

### Expected Response Times

| Task Type           | Expected Time |
| ------------------- | ------------- |
| Simple query        | < 5 seconds   |
| Component creation  | 10-30 seconds |
| Code review         | 20-60 seconds |
| Complex feature     | 1-5 minutes   |
| Full implementation | 5-15 minutes  |

### MCP Query Times

| MCP Server | Typical Response |
| ---------- | ---------------- |
| Nuxt       | 1-3 seconds      |
| Nuxt UI    | 1-3 seconds      |
| Playwright | 2-5 seconds      |
| Figma      | 3-7 seconds      |

---

## Testing Report Template

Setelah menjalankan tests, gunakan template ini untuk dokumentasi:

```markdown
# Frontend Developer Agent - Testing Report

**Date:** YYYY-MM-DD
**Tester:** [Your Name]
**Version:** 1.0.0

## Test Summary

| Category            | Tests Run | Passed | Failed | Notes        |
| ------------------- | --------- | ------ | ------ | ------------ |
| Basic Functionality | 3         | 3      | 0      | ✅ All pass  |
| MCP Integration     | 3         | 3      | 0      | ✅ All pass  |
| Skills Integration  | 4         | 4      | 0      | ✅ All pass  |
| Advanced Scenarios  | 4         | 3      | 1      | ⚠️ See notes |
| Edge Cases          | 3         | 3      | 0      | ✅ All pass  |

**Overall: 16/17 Tests Passed (94%)**

## Failed Tests Details

### Test 14: Full Feature Development

**Status:** ❌ Failed
**Reason:** E2E tests not generated
**Fix Required:** Add explicit request for E2E tests
**Severity:** Medium

## Recommendations

1. [List improvements needed]
2. [Configuration adjustments]
3. [Documentation updates]

## Next Steps

- [ ] Fix failed tests
- [ ] Re-run failed tests
- [ ] Document edge cases found
- [ ] Update agent prompt if needed
```

---

## Continuous Testing

### Daily Smoke Tests

Run these daily untuk ensure agent health:

```bash
# Test 1: Agent activation
@frontend Hello

# Test 2: Simple component
@frontend Create Button component

# Test 3: MCP query
@frontend Check Nuxt docs untuk useFetch
```

### Weekly Comprehensive Tests

Run full test suite weekly:

- All basic functionality tests
- All MCP integration tests
- At least 2 advanced scenarios
- Document results

### Monthly Review

- Review all test results
- Update testing guide based on findings
- Add new test cases for new features
- Archive test reports

---

## Feedback Loop

### Reporting Issues

If you find issues:

1. **Document:**
   - Exact command used
   - Expected vs actual behavior
   - Error messages (if any)
   - Screenshots (if applicable)

2. **Report Format:**

   ```markdown
   ## Issue Report

   **Type:** [Bug/Enhancement/Documentation]
   **Severity:** [Critical/High/Medium/Low]

   **Command:**
   ```

   @frontend [your command]

   ```

   **Expected:**
   [What should happen]

   **Actual:**
   [What actually happened]

   **Environment:**
   - OpenCode version: X.Y.Z
   - Node version: X.Y.Z
   - OS: macOS/Linux/Windows
   ```

3. **Share with Team:**
   - Add to project issues
   - Discuss in team meeting
   - Update documentation

---

## Success Criteria

Agent is considered **production-ready** when:

- ✅ All basic functionality tests pass
- ✅ All MCP integrations work
- ✅ Core skills load correctly
- ✅ 90%+ advanced scenarios pass
- ✅ Edge cases handled gracefully
- ✅ Response times meet benchmarks
- ✅ Code quality meets standards
- ✅ Documentation complete
- ✅ Team trained on usage

---

**Good luck with testing! 🧪**

Questions? Check:

- `README.md` for overview
- `MCP_GUIDE.md` for MCP details
- `EXAMPLES.md` for usage examples
