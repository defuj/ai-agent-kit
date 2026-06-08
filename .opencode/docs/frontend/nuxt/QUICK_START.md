# 🚀 Frontend Developer Agent - Quick Start

Panduan cepat untuk mulai menggunakan Frontend Developer Agent.

---

## ✅ Instalasi Selesai!

Agent Frontend Developer telah diinstall dengan lengkap:

```
.opencode/
├── agents/
│   ├── frontend-developer.md     # Agent definition (773 lines)
│   ├── README.md                  # User guide lengkap (505 lines)
│   ├── WORKFLOWS.md               # 8 workflow examples (758 lines)
│   ├── CHEATSHEET.md             # Quick reference (621 lines)
│   └── QUICK_START.md            # File ini
└── config.json                    # OpenCode configuration
```

**Total: 2,687 lines** dokumentasi dan konfigurasi profesional!

---

## 🎯 Cara Menggunakan (3 Langkah)

### 1️⃣ Aktivasi Agent

Di terminal OpenCode, ketik:

```bash
@frontend-developer Hello! Tolong analyze project structure ini.
```

### 2️⃣ Agent Akan Load Skills

Agent otomatis akan load skills yang dibutuhkan:

```
✓ coding-standards
✓ frontend-patterns
✓ impeccable
✓ web-design-guidelines
```

### 3️⃣ Mulai Development!

```bash
@frontend-developer Buat component Button dengan:
- 5 variants (primary, secondary, success, error, ghost)
- 3 sizes (sm, md, lg)
- Loading state
- Icon support
- Accessible (ARIA + keyboard)
- File: app/components/ui/Button.vue
```

**That's it!** Agent akan:

- Membuat component dengan TypeScript strict mode
- Implement accessibility standards
- Add proper error handling
- Follow Nuxt 4 best practices
- Include usage examples

---

## 📚 Dokumentasi Tersedia

### 1. **README.md** - Panduan Lengkap

- Penjelasan semua skills
- 5 contoh penggunaan konkret
- Tips & best practices
- Troubleshooting guide
- Advanced usage
- Memory management

**Baca ini:** Untuk memahami capabilities lengkap agent.

### 2. **WORKFLOWS.md** - 8 Workflow Examples

- ✅ Membuat Component Library
- ✅ Performance Optimization
- ✅ Implementasi Design Figma
- ✅ Form dengan Validation
- ✅ Testing Integration
- ✅ Dark Mode Implementation
- ✅ Progressive Enhancement
- ✅ Analytics Integration

**Baca ini:** Untuk workflow step-by-step pada skenario umum.

### 3. **CHEATSHEET.md** - Quick Reference

- Quick commands
- Common patterns
- Code snippets
- Keyboard shortcuts
- Emergency commands
- Pro tips

**Baca ini:** Keep this open saat coding!

### 4. **frontend-developer.md** - Agent Definition

- Core identity & responsibilities
- Technical skills integration
- Memory management system
- Working methodology
- Quality standards
- Framework expertise

**Baca ini:** Untuk memahami bagaimana agent bekerja internally.

---

## 💡 Contoh Use Cases

### Use Case 1: Buat Komponen Baru

```bash
@frontend-developer Buat MarketCard component untuk display:
- Market name + description
- Current odds
- Volume traded
- End date countdown
- "Place Bet" button

Gunakan Nuxt UI Card sebagai base.
```

### Use Case 2: Fix Performance Issue

```bash
@frontend-developer Dashboard page lemot saat render 500+ markets.
Load skill `frontend-patterns` dan optimize.
```

### Use Case 3: Implement Design

```bash
@frontend-developer Implement hero section dengan aesthetic bold & futuristic:
- Large gradient text
- Animated background (particles atau geometric)
- Glassmorphism card
- Smooth scroll indicators

[Attach Figma screenshot]
```

### Use Case 4: Add Accessibility

```bash
@frontend-developer Load skill `web-design-guidelines` dan audit
app/components/Modal.vue untuk accessibility issues. Fix all issues.
```

### Use Case 5: Review Code

```bash
@frontend-developer Review app/pages/markets/create.vue untuk:
- Performance issues
- Accessibility compliance
- Security concerns
- Best practices violations

Provide actionable fixes.
```

---

## 🎨 Skills Reference

Agent punya akses ke 10+ skills dari repository Anda:

### Core Skills (Auto-loaded)

- **coding-standards** - Universal best practices
- **frontend-patterns** - Vue/Nuxt patterns
- **impeccable** - Design intelligence (typography, color, layout, motion, critique)
- **web-design-guidelines** - UI/UX compliance

### Contextual Skills (On-demand)

- **nuxt-ui** - Nuxt UI components
- **vercel-composition-patterns** - Advanced composition patterns
- **building-components** - Component library creation
- **security-review** - Security best practices
- **tdd-workflow** - Test-driven development

### How to Load Skills Manually

```bash
@frontend-developer Load skill `nuxt-ui` untuk help me build complex form
```

---

## 🔧 Konfigurasi

Agent sudah dikonfigurasi di `.opencode/config.json`:

```json
{
  "agent": {
    "frontend": {
      "description": "Expert frontend developer",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-20250514",
      "temperature": 0.4,
      "permission": {
        "edit": "allow",
        "bash": { "npm *": "allow", "git status": "allow" },
        "skill": { "*": "allow" }
      }
    }
  }
}
```

**Customize** jika perlu:

- Change `mode` to `"primary"` untuk make it default agent
- Adjust `temperature` (0.0-1.0) untuk control creativity
- Modify `permission` untuk restrict/allow actions

---

## 🎯 Best Practices

### 1. Berikan Konteks yang Jelas

```bash
# ❌ Kurang jelas
@frontend-developer Buat form

# ✅ Jelas dan spesifik
@frontend-developer Buat LoginForm dengan:
- Email + password fields
- Remember me checkbox
- Validation dengan Zod
- Loading state
- Error handling
- Social login buttons
```

### 2. Iterasi Bertahap

```bash
# Step 1: Basic
@frontend-developer Buat basic Button component

# Step 2: Enhance
@frontend-developer Add ripple effect dan loading state

# Step 3: Polish
@frontend-developer Add accessibility dan improve animations
```

### 3. Leverage Memory

```bash
# Agent akan remember dalam session
@frontend-developer Analyze project structure

# Later in session (agent sudah tau struktur)
@frontend-developer Buat component serupa dengan MarketCard tapi untuk UserProfile
```

### 4. Request Reviews

```bash
@frontend-developer Review implementation yang baru dibuat,
ada yang bisa diimprove?
```

### 5. Specify Framework/Library

```bash
@frontend-developer Dengan Vue 3 Composition API, buat composable useAuth
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Agent Tidak Load Skill

**Solusi:**

```bash
@frontend-developer Load skill `nuxt-ui` explicitly dan help me
```

### Issue 2: Agent Pakai Pattern yang Salah

**Solusi:**

```bash
@frontend-developer Kita pakai Pinia untuk state, bukan Vuex.
Please update approach.
```

### Issue 3: Agent Skip Accessibility

**Solusi:**

```bash
@frontend-developer CRITICAL: Ensure WCAG 2.1 AA compliance
```

### Issue 4: Output Terlalu Verbose

**Solusi:**

```bash
@frontend-developer Same task tapi less explanation, more code
```

---

## 📊 Quality Checklist

Agent akan ensure:

- ✅ TypeScript strict mode (no `any` types)
- ✅ Immutability (spread operators, no mutations)
- ✅ Accessibility (ARIA, keyboard, semantic HTML)
- ✅ Error handling (loading, error, empty states)
- ✅ Performance (memoization, lazy loading)
- ✅ Responsive design (mobile-first)
- ✅ SSR compatible (Nuxt 4)
- ✅ Clean code (readable, maintainable)

---

## 🎓 Learning Resources

### Recommended Reading Order

1. **Start here:** QUICK_START.md (this file)
2. **Next:** README.md (comprehensive guide)
3. **Then:** CHEATSHEET.md (bookmark this!)
4. **When needed:** WORKFLOWS.md (specific scenarios)
5. **Advanced:** frontend-developer.md (agent internals)

### External Resources

- OpenCode Docs: https://opencode.ai/docs/agents
- Skills Guide: https://opencode.ai/docs/skills
- Nuxt 4 Docs: https://nuxt.com/docs
- Vue 3 Docs: https://vuejs.org/

---

## 🎉 You're Ready!

Mulai dengan command sederhana:

```bash
@frontend-developer Analyze project structure dan suggest
3 komponen yang bisa kita improve untuk better performance.
```

Agent akan:

1. Scan project files
2. Load relevant skills (`frontend-patterns`)
3. Analyze components
4. Provide specific recommendations
5. Offer to implement improvements

---

## 💬 Get Help

Jika stuck, tanya agent:

```bash
@frontend-developer How do I [question]?

# Contoh:
@frontend-developer How do I implement dark mode dengan smooth transitions?
@frontend-developer How do I optimize large list rendering?
@frontend-developer How do I add TypeScript to existing component?
```

Agent akan explain dan provide code examples.

---

## 🔄 Update Agent

Untuk update agent configuration:

1. Edit `.opencode/agents/frontend-developer.md`
2. Modify sections as needed
3. Save file
4. Reload OpenCode atau start new session

Changes akan langsung aktif di session berikutnya.

---

## 🌟 Pro Tips

1. **Use @mentions** untuk invoke agent di middle of conversation
2. **Load skills explicitly** untuk specialized tasks
3. **Ask for alternatives** jika approach tidak sesuai
4. **Request reviews** sebelum commit changes
5. **Leverage memory** - agent remembers context dalam session
6. **Be specific** - more context = better results
7. **Iterate** - start simple, enhance progressively

---

## 📞 Support

- **Documentation Issues?** Check README.md
- **Workflow Questions?** Check WORKFLOWS.md
- **Quick Reference?** Check CHEATSHEET.md
- **Agent Behavior?** Check frontend-developer.md

Atau tanya langsung:

```bash
@frontend-developer I need help with [specific issue]
```

---

## 🎁 What's Included

### Files Created

- ✅ **frontend-developer.md** - Full agent definition (773 lines)
- ✅ **README.md** - Complete user guide (505 lines)
- ✅ **WORKFLOWS.md** - 8 detailed workflows (758 lines)
- ✅ **CHEATSHEET.md** - Quick reference (621 lines)
- ✅ **QUICK_START.md** - This guide
- ✅ **config.json** - OpenCode configuration

### Skills Integrated

- ✅ 5 core skills (auto-loaded)
- ✅ 5+ contextual skills (on-demand)
- ✅ Comprehensive skill loading strategy
- ✅ Memory management system

### Features

- ✅ Framework expertise (Nuxt, Vue)
- ✅ Design thinking & aesthetics
- ✅ Performance optimization
- ✅ Accessibility compliance
- ✅ Security best practices
- ✅ Testing integration
- ✅ Code quality standards

---

## 🚀 Next Steps

### Immediate (Now)

```bash
# Test agent
@frontend-developer Hello! Analyze this Nuxt 4 project structure.
```

### Short-term (Today)

- Read README.md untuk understand full capabilities
- Try 2-3 examples dari WORKFLOWS.md
- Bookmark CHEATSHEET.md

### Long-term (This Week)

- Integrate agent ke daily workflow
- Customize agent definition untuk team needs
- Create custom workflows untuk project-specific tasks
- Share dengan team members

---

## 💪 Ready to Build!

Your Frontend Developer Agent is fully configured and ready to help you:

✨ Build beautiful, accessible components  
⚡ Optimize performance  
🎨 Implement stunning designs  
🧪 Write comprehensive tests  
🔒 Ensure security  
♿ Guarantee accessibility

**Start coding with confidence!**

```bash
@frontend-developer Let's build something amazing! 🚀
```

---

**Created with ❤️ for exceptional frontend development**

_Version 1.0.0 - April 2026_
