# Frontend Developer Agent - User Guide

Panduan lengkap untuk menggunakan Frontend Developer Agent di OpenCode.

## 📚 Complete Documentation

- **[README.md](./README.md)** - User guide (you are here)
- **[QUICK_START.md](./QUICK_START.md)** - Getting started in 5 minutes
- **[EXAMPLES.md](./EXAMPLES.md)** - 50+ practical examples
- **[WORKFLOWS.md](./WORKFLOWS.md)** - 8 detailed workflows
- **[CHEATSHEET.md](./CHEATSHEET.md)** - Quick reference
- **[MCP_GUIDE.md](./MCP_GUIDE.md)** - MCP integration guide
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing & validation
- **[SUMMARY.md](./SUMMARY.md)** - Installation summary

## 📋 Daftar Isi

1. [Cara Menggunakan Agent](#cara-menggunakan-agent)
2. [Skills yang Terintegrasi](#skills-yang-terintegrasi)
3. [Contoh Penggunaan](#contoh-penggunaan)
4. [Tips & Best Practices](#tips--best-practices)
5. [Troubleshooting](#troubleshooting)

---

## Cara Menggunakan Agent

### Metode 1: Menggunakan @mention (Recommended)

Dalam OpenCode, Anda bisa langsung memanggil agent dengan `@` mention:

```
@frontend-developer bantu aku buat komponen Card yang reusable
```

### Metode 2: Mengaktifkan sebagai Primary Agent

Edit `opencode.json` untuk menjadikan ini primary agent:

```json
{
  "agent": {
    "frontend": {
      "prompt": "{file:.opencode/agents/frontend-developer.md}",
      "mode": "primary"
    }
  }
}
```

Kemudian gunakan Tab key untuk switch ke agent ini.

---

## Skills yang Terintegrasi

Agent ini mengintegrasikan 10+ skills dari repository Anda:

### Core Skills (Auto-load)

Agent akan otomatis load skills ini saat session dimulai:

1. **`coding-standards`**
   - Universal coding best practices
   - TypeScript/JavaScript standards
   - Error handling patterns
   - File organization

2. **`frontend-patterns`**
   - Vue/Nuxt component patterns
   - Composable patterns
   - State management
   - Performance optimization
   - Form handling

3. **`impeccable`**
   - Impeccable design intelligence
   - Design critique, audit, and polish
   - Typography and color systems
   - Layout, motion, and interaction
   - 23 sub-commands (craft, shape, critique, etc.)

4. **`web-design-guidelines`**
   - UI/UX compliance
   - Accessibility audit
   - Design best practices
   - Interface guidelines

### Contextual Skills (Load on-demand)

Agent akan load skills ini sesuai kebutuhan:

- **`nuxt-ui`** - Saat bekerja dengan Nuxt UI components
- **`vercel-composition-patterns`** - Untuk refactoring komponen kompleks
- **`building-components`** - Saat membuat component library
- **`security-review`** - Untuk user input dan authentication
- **`tdd-workflow`** - Saat menulis tests

---

## Contoh Penggunaan

### 1. Membuat Komponen Baru

```
@frontend-developer Buat komponen MarketCard untuk menampilkan:
- Nama market
- Status (active/closed/resolved)
- Volume trading
- Tanggal berakhir
- Tombol untuk bet

Gunakan Nuxt UI dan pastikan accessible.
```

Agent akan:

1. Load skill `nuxt-ui` dan `building-components`
2. Membuat komponen dengan TypeScript strict mode
3. Implementasi accessibility (ARIA labels, keyboard navigation)
4. Tambahkan loading states dan error handling
5. Gunakan design system yang konsisten

### 2. Optimasi Performance

```
@frontend-developer Review komponen MarketList.vue, kayaknya lemot saat render 100+ items. Bisa dioptimasi?
```

Agent akan:

1. Load skill `frontend-patterns`
2. Analisis performance bottlenecks
3. Suggest virtualization untuk long lists
4. Implementasi memoization
5. Optimize re-renders

### 3. Implementasi Design

```
@frontend-developer Bikin landing page dengan aesthetic futuristic,
bold colors, dan smooth animations. Pakai gradient meshes dan
geometric patterns.
```

Agent akan:

1. Load skill `impeccable`
2. Choose distinctive fonts (bukan Inter/Roboto)
3. Create cohesive color palette
4. Implement purposeful animations
5. Add atmospheric backgrounds

### 4. Refactoring Komponen

```
@frontend-developer Komponen UserProfile ini terlalu complex, ada 15 props dan banyak conditional rendering. Bisa direfactor?
```

Agent akan:

1. Load skill `vercel-composition-patterns`
2. Extract compound components
3. Use composition over props
4. Improve maintainability
5. Preserve functionality

### 5. Accessibility Audit

```
@frontend-developer Check accessibility untuk form di pages/create-market.vue
```

Agent akan:

1. Load skill `web-design-guidelines`
2. Check semantic HTML
3. Verify keyboard navigation
4. Check ARIA labels
5. Test color contrast
6. Provide actionable fixes

---

## Tips & Best Practices

### 1. Berikan Konteks yang Cukup

❌ **Kurang baik:**

```
Buat komponen button
```

✅ **Lebih baik:**

```
Buat komponen Button dengan:
- Variants: primary, secondary, ghost
- Sizes: sm, md, lg
- Support icon (leading dan trailing)
- Loading state
- Disabled state
- Full width option

Gunakan Nuxt UI sebagai base dan pastikan accessible.
```

### 2. Spesifikasikan Stack Nuxt/Vue

Agent ini fokus ke Nuxt/Vue. Sebutkan konteks stack dengan jelas:

```
@frontend-developer Buat composable useMarketData dengan Vue 3
```

### 3. Minta Penjelasan

Agent akan explain trade-offs dan decisions:

```
@frontend-developer Explain kenapa kamu pakai computed di sini vs watch
```

### 4. Iterasi Bertahap

Mulai simple, lalu improve:

```
# Step 1
@frontend-developer Buat basic MarketCard component

# Step 2 (setelah review)
@frontend-developer Tambahkan animation saat hover dan loading skeleton

# Step 3
@frontend-developer Add share dan bookmark functionality
```

### 5. Leverage Memory Management

Agent akan remember context dalam session:

```
# Message 1
@frontend-developer Analyze struktur project ini

# Message 5 (agent sudah tau struktur)
Buat komponen serupa dengan UserCard tapi untuk Market
```

---

## Memory Management

### Apa yang Agent Ingat

✅ **Selama Session:**

- Project structure dan patterns
- Your coding preferences
- Design system tokens
- Recent changes
- Architecture decisions

❌ **Tidak Diingat:**

- Temporary debug code
- Failed experiments
- Session sebelumnya (kecuali disebutkan)

### Cara Memaksimalkan Context

**Untuk task besar, guide the agent:**

```markdown
@frontend-developer Kita akan implement feature "Market Discovery".

Phase 1: Buat komponen MarketGrid untuk display markets
Phase 2: Add filtering (status, category, date range)  
Phase 3: Implement search dengan semantic similarity
Phase 4: Add sorting options

Mulai dari Phase 1 dulu.
```

**Agent akan track progress:**

```yaml
Session Context:
  current_phase: 'Phase 1'
  completed_components: ['MarketGrid']
  next_steps: ['Add filtering']
```

---

## Troubleshooting

### Agent tidak load skill yang dibutuhkan

**Solusi:** Minta explicitly

```
@frontend-developer Load skill `nuxt-ui` and help me build a form
```

### Agent pakai pattern yang tidak sesuai project

**Solusi:** Specify project patterns

```
@frontend-developer Kita pakai Pinia untuk state management, bukan Zustand.
Update approach kamu.
```

### Agent terlalu verbose

**Solusi:** Minta concise

```
@frontend-developer Same task tapi less explanation, more code
```

### Agent skip accessibility

**Solusi:** Remind explicitly

```
@frontend-developer IMPORTANT: Ensure WCAG 2.1 compliance untuk semua komponen
```

### Performance concerns tidak addressed

**Solusi:** Trigger performance review

```
@frontend-developer Load `frontend-patterns` and review for performance
```

---

## Advanced Usage

### Custom Workflow

Anda bisa create custom workflow file:

**.opencode/workflows/create-component.md**

```markdown
# Component Creation Workflow

1. Load skills: `building-components`, `web-design-guidelines`
2. Create component file with TypeScript
3. Add props interface
4. Implement render logic
5. Add accessibility attributes
6. Create usage example
7. Add to exports
```

Kemudian:

```
@frontend-developer Follow workflow di .opencode/workflows/create-component.md untuk buat SearchBar component
```

### Team Collaboration

Share agent config dengan team (tanpa auto-commit oleh agent):

```bash
# Commit hanya saat Anda memang meminta commit
git add .opencode/agents/frontend-developer.md
git commit -m "Add frontend developer agent config"
git push

# Team members bisa langsung pakai
@frontend-developer ...
```

### Integration dengan CI/CD

Agent bisa review PR sebelum merge:

```bash
# .github/workflows/frontend-review.yml
- name: Frontend Review
  run: |
    opencode "@frontend-developer Review changes in this PR for:
    - Performance issues
    - Accessibility compliance
    - Code quality
    - Best practices"
```

---

## Keyboard Shortcuts

Untuk primary agent mode:

- `Tab` - Switch between agents
- `Ctrl+P` - List available actions
- `/` - Run commands (e.g., `/undo`, `/redo`)
- `@` - Mention agents/files

---

## Maintenance

### Update Agent Skills

Ketika ada skill baru:

1. Check skill availability:

```bash
ls ~/.opencode/skills
ls ~/.agents/skills
```

2. Update agent file untuk include skill baru di section "Contextual Skills"

3. Test integration:

```
@frontend-developer Load skill `new-skill-name` dan explain kapan harus dipakai
```

### Version Control

Track perubahan agent config:

```bash
# See changes
git diff .opencode/agents/frontend-developer.md

# Update
git add .opencode/agents/frontend-developer.md
git commit -m "Update frontend agent: add new skill integration"
```

---

## Resources

### Related Files

- Agent definition: `.opencode/agents/frontend-developer.md`
- Project guidelines: `CLAUDE.md`
- Skills directory: `~/.opencode/skills/`, `~/.agents/skills/`

### Documentation

- OpenCode Agents: https://opencode.ai/docs/agents
- OpenCode Skills: https://opencode.ai/docs/skills
- OpenCode Config: https://opencode.ai/docs/config

### Community

- OpenCode Discord: https://opencode.ai/discord
- GitHub Issues: https://github.com/anomalyco/opencode/issues

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND DEVELOPER AGENT - Quick Reference                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ACTIVATE:                                                    │
│   @frontend-developer [your request]                        │
│                                                              │
│ COMMON TASKS:                                                │
│   • Build component        → Specify props, behavior, style │
│   • Optimize performance   → Mention specific bottleneck    │
│   • Implement design       → Describe aesthetic direction   │
│   • Refactor code          → Explain current issues         │
│   • Review accessibility   → Point to specific files        │
│                                                              │
│ LOADED SKILLS:                                               │
│   ✓ coding-standards       ✓ frontend-patterns              │
│   ✓ impeccable             ✓ web-design-guidelines          │
│                                                              │
│ CONTEXTUAL SKILLS:                                           │
│   • nuxt-ui                • vercel-composition-patterns    │
│   • building-components    • security-review                │
│   • tdd-workflow                                            │
│                                                              │
│ QUALITY STANDARDS:                                           │
│   ☑ TypeScript strict mode ☑ Accessibility (WCAG 2.1)       │
│   ☑ Immutability           ☑ Performance optimized          │
│   ☑ Error handling         ☑ Responsive design              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**Happy coding! 🚀**

Jika ada pertanyaan atau butuh bantuan, mention `@frontend-developer` di OpenCode Anda.
