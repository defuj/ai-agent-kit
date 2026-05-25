<p align="center">
  <img src="assets/banner.png" alt="AI Agent System Banner" width="100%">
</p>

# Opencode Agent KIT (Software Developer) — Setup Guide

Panduan ini menjelaskan cara menggunakan agent di repo ini, termasuk skill yang perlu diinstall agar agent berjalan optimal.

---

## Instalasi Cepat (NPM Package)

**Cara termudah** — install ke project mana pun dengan satu perintah:

```bash
npx opencode-agent-kit init
```

Ini akan menyalin konfigurasi agent, skills, commands, dan rules ke project Anda.

Atau install global:

```bash
npm install -g opencode-agent-kit
cd /path/to/your-project
opencode-agent-kit init
```

---

## Gambaran Singkat

Repo ini berisi konfigurasi OpenCode untuk tim IT lengkap dengan arsitektur **Leader → Subagent**:

### Agent Config

- **Active config**: `.opencode/config.json`
- Agent prompts: `.opencode/agents/`
  - `it-leader.md` — IT Leader & Technical Project Manager (primary)
  - `nuxt-frontend-developer.md` — Frontend Developer (Nuxt/Vue) — `@frontend-nuxt`
  - `react-frontend-developer.md` — Frontend Developer (React/Next.js) — `@frontend-react`
  - `node-backend-developer.md` — Backend Developer (Node.js) — `@backend`
  - `laravel-advanced.md` — Backend Developer (Laravel) — `@laravel`
  - `code-igniter-3-fullstack.md` — Fullstack Developer (CodeIgniter 3) — `@ci3`
  - `ui-ux-designer.md` — UI/UX Designer — `@designer`
  - `code-reviewer.md` — Code Reviewer / QA — `@reviewer`
  - `database-specialist.md` — Database Specialist — `@database`
  - `devops-specialist.md` — DevOps / Infrastructure — `@devops`
  - `seo-specialist.md` — SEO Specialist — `@seo`
  - `android-developer.md` — Android Developer (Kotlin/Compose) — `@android`
  - `flutter-developer.md` — Flutter Developer (Dart) — `@flutter`
  - `nuxt-frontend-developer-mentor.md` — Nuxt mentor (standalone)
- Dokumentasi internal: `.opencode/agent-docs/`
  - Frontend Nuxt: `.opencode/agent-docs/frontend/nuxt/`
  - Frontend React: `.opencode/agent-docs/frontend/react/`
  - Backend Node: `.opencode/agent-docs/backend/node/`
- Skill lokal: `.opencode/skills/` (61 skill tersinkron)
- Contexts: `.opencode/contexts/` (dev, research, review)

Tim didesain untuk:

- **Frontend (Vue)**: Nuxt 4 + Nuxt UI + Vue 3 Composition API + TypeScript
- **Frontend (React)**: React 19 + Next.js 15 (App Router) + TypeScript + shadcn/ui
- **Backend**: Node.js + Express 5 + Prisma + PostgreSQL — atau — Laravel 10+ / CodeIgniter 3
- **Mobile**: Android (Kotlin + Jetpack Compose) — atau — Flutter (Dart)
- Workflow operasional tim (scope-safe, verification status, commit/PR policy)
- Mentoring terstruktur 30 hari untuk transisi ke stack Nuxt modern

## Prasyarat

- OpenCode CLI sudah terpasang
- Akses ke repository ini
- Node.js + npm/pnpm/yarn/bun sesuai kebutuhan proyek

## Integrasi dengan OpenCode Built-in Agents

OpenCode memiliki **built-in agents** yang sudah tersedia secara global. Project ini **tidak mendefinisikan ulang** agent yang sudah ada — melainkan fokus pada **specialized agents** untuk berbagai stack pengembangan.

### Built-in Agents (Global)

| Built-in Agent         | Model    | Fungsi                                                 | Usage                                      |
| ---------------------- | -------- | ------------------------------------------------------ | ------------------------------------------ |
| `planner`              | opus-4.5 | Detailed planning, architectural decisions             | `/plan` atau `@planner`                    |
| `architect`            | opus-4.5 | System design, scalability analysis                    | `@architect`                               |
| `code-reviewer`        | opus-4.5 | Quality, security, maintainability review              | `/code-review` atau `@code-reviewer`       |
| `security-reviewer`    | opus-4.5 | Vulnerability detection                                | `/security` atau `@security-reviewer`      |
| `tdd-guide`            | opus-4.5 | TDD workflow, 80%+ coverage enforcement                | `/tdd` atau `@tdd-guide`                   |
| `build-error-resolver` | opus-4.5 | Fix TypeScript/build errors                            | `/build-fix` atau `@build-error-resolver`  |
| `e2e-runner`           | opus-4.5 | Playwright E2E test generation & execution             | `/e2e` atau `@e2e-runner`                  |
| `refactor-cleaner`     | opus-4.5 | Dead code removal, consolidation                       | `/refactor-clean` atau `@refactor-cleaner` |
| `database-reviewer`    | opus-4.5 | PostgreSQL query optimization, Supabase best practices | `@database-reviewer`                       |

### Custom Agents (Project-specific)

Dibawah adalah **specialized agents** yang TIDAK tersedia di built-in OpenCode:

| Agent                 | File                          | Fungsi                                         | Ketika Dipakai             |
| --------------------- | ----------------------------- | ---------------------------------------------- | -------------------------- |
| **IT Leader**         | `it-leader.md`                | Orchestration, task decomposition, integration | Semua request besar        |
| **Frontend (Vue)**    | `nuxt-frontend-developer.md`  | Nuxt/Vue implementation + MCP integration      | Implementasi Vue/Nuxt      |
| **Frontend (React)**  | `react-frontend-developer.md` | React/Next.js implementation                   | Implementasi React/Next.js |
| **Backend (Node)**    | `node-backend-developer.md`   | Node/Express/Prisma implementation             | Implementasi Node.js API   |
| **Backend (Laravel)** | `laravel-advanced.md`         | Laravel full-stack (Blade, Livewire, API)      | Implementasi Laravel       |
| **Backend (CI3)**     | `code-igniter-3-fullstack.md` | CodeIgniter 3 MVC monolith                     | Implementasi CI3           |
| **Designer**          | `ui-ux-designer.md`           | Design system, Stitch, Figma, DESIGN.md        | Design tasks               |
| **Reviewer**          | `code-reviewer.md`            | Code quality, security audit, testing          | Review tasks               |
| **Database**          | `database-specialist.md`      | PostgreSQL, schema, Prisma, migrations         | Database tasks             |
| **DevOps**            | `devops-specialist.md`        | CI/CD, Docker, monitoring, infrastructure      | Deployment tasks           |
| **SEO**               | `seo-specialist.md`           | Meta tags, structured data, Core Web Vitals    | SEO optimization           |
| **Android**           | `android-developer.md`        | Kotlin, Jetpack Compose, Gradle, Play Store    | Android native development |
| **Flutter**           | `flutter-developer.md`        | Dart, Flutter SDK, Material 3, Firebase        | Cross-platform mobile      |

### Integrasi Workflow

```
User Request
    │
    ▼
┌─────────────────┐
│   IT Leader     │ ← Custom (orchestration)
│ (Primary)      │
└────────┬────────┘
         │
    ┌────┴────┬──────┬──────┬──────┬──────┬──────┐
    ▼         ▼      ▼      ▼      ▼      ▼      ▼
┌────────┐ ┌──────┐ ┌───┐ ┌────┐ ┌────┐ ┌────┐ ┌──────┐
│Frontend│ │Backend│ │Des│ │Rev │ │DB  │ │Dev │ │Mobile│
│Nuxt/React│ │Node/La│ │ign│ │iew │ │Spec│ │Ops │ │And/Fl│
│Custom  │ │Custom │ │Cus│ │Cus │ │Cus │ │Cus │ │Custom│
└───┬────┘ └──┬───┘ └───┘ └────┘ └────┘ └────┘ └──┬───┘
    │         │                                    │
    ▼         │                                    │
┌─────────┐   │                                    │
│Built-in │   │                                    │
│e2e-runner│  │                                    │
└─────────┘   │                                    │
              │                                    │
              ▼                                    │
         ┌────────┐                                │
         │Built-in│                                │
         │code-reviewer│                            │
         └────────┘                                │
              │                                    │
              ▼                                    ▼
         ┌──────────────────────────────────────────┐
         │        Integration Report                 │
         │     (IT Leader combines)                 │
         └──────────────────────────────────────────┘
```

### Built-in Commands Available

Setelah copy `.opencode/` ke project, command berikut tersedia:

```bash
# Planning & Architecture
/plan [feature description]          # Detailed implementation plan
/orchestrate [complex task]         # Multi-agent orchestration

# Review & Quality
/code-review [files]                 # Code quality review
/security [files]                     # Security audit
/refactor-clean [scope]              # Dead code cleanup

# Testing
/tdd [feature]                       # TDD workflow
/e2e [user flow]                     # Generate & run E2E tests
/test-coverage [scope]               # Analyze coverage

# Build & Errors
/build-fix [error message]           # Fix TypeScript/build errors

# Documentation
/update-docs [files]                 # Update documentation
/update-codemaps                     # Update code references

# Database
# (built-in database-reviewer bisa dipakai untuk query optimization)

# Mobile
/android-build [variant]              # Build Android (debug/release/bundle)
/android-test [type]                  # Run Android tests (unit/instrumented)
/flutter-build [target]               # Build Flutter (apk/appbundle/ios/web)
/flutter-test [type]                  # Run Flutter tests with coverage
/gpc-release [track]                  # Publish to Google Play (internal/alpha/beta/production)
```

## Cara Menggunakan Folder `.opencode`

### Di Project Baru (Rekomendasi — NPM Package)

Cara termudah adalah menggunakan npm package:

```bash
cd /path/to/your-project
npx opencode-agent-kit init
```

Ini akan mengcopy `opencode.json`, `.opencode/`, dan `AGENTS.md` secara otomatis.

### Manual Copy

Atau copy langsung dari repo ini:

```bash
cp -R .opencode/ /path/to/your-project/
```

Atau jika ingin hanya config:

```bash
cp .opencode/config.json /path/to/your-project/.opencode/config.json
```

### Konfigurasi yang Di-copy

| File/Folder                    | Apa yang Dicopy                 | Mandatory        |
| ------------------------------ | ------------------------------- | ---------------- |
| `config.json`                  | Agent definitions, MCP settings | Ya               |
| `agents/`                      | Custom agent prompts            | Ya               |
| `instructions/INSTRUCTIONS.md` | Global rules untuk semua agent  | Ya               |
| `skills/`                      | Domain-specific skills          | Direkomendasikan |
| `contexts/`                    | Project context                 | Opsional         |
| `commands/`                    | Custom slash commands           | Opsional         |
| `rules/`                       | Coding rules                    | Opsional         |
| `hooks/`                       | Automation hooks                | Opsional         |

### Integrasi dengan Global OpenCode

Project config ini **tidak perlu memodifikasi** konfigurasi global Anda. Cukup copy `.opencode/` ke project dan semua agent + commands akan tersedia.

Jika ingin tetap menggunakan agent dari konfigurasi global (bukan yang di project), cukup rename file di project:

```bash
mv .opencode/agents/code-reviewer.md .opencode/agents/code-reviewer-custom.md
```

### Override Built-in Agents

Jika ingin **customize** built-in agent untuk project ini, bisa dibuat agent dengan **nama yang sama** di `.opencode/agents/`. Priority: project-level agents override built-in.

Contoh override `code-reviewer` untuk fokus Nuxt:

```markdown
# .opencode/agents/code-reviewer.md

# Override built-in code-reviewer untuk Nuxt-specific review
```

## Agent yang Tersedia

Repo ini menyediakan 13 agent (12 terdaftar di `config.json` + 1 standalone mentor) dengan arsitektur **Leader → Subagent**:

| Agent                           | File                          | Mode        | Tujuan                                                                 |
| ------------------------------- | ----------------------------- | ----------- | ---------------------------------------------------------------------- |
| **IT Leader**                   | `it-leader.md`                | **primary** | Analisis requirement, arsitektur, pembagian tugas, delegasi, integrasi |
| Frontend Developer (Vue/Nuxt)   | `nuxt-frontend-developer.md`  | subagent    | Implementasi Vue/Nuxt (komponen, composable, Nuxt UI, E2E)             |
| Frontend Developer (React/Next) | `react-frontend-developer.md` | subagent    | Implementasi React/Next.js (Server Components, shadcn/ui, E2E)         |
| Backend Developer (Node.js)     | `node-backend-developer.md`   | subagent    | Implementasi Node.js API (Express, Prisma, DTO, auth)                  |
| Backend Developer (Laravel)     | `laravel-advanced.md`         | subagent    | Implementasi Laravel (Blade, Livewire, REST API, Service Layer)        |
| CodeIgniter 3 Fullstack         | `code-igniter-3-fullstack.md` | subagent    | Implementasi CI3 (MVC, REST API, JWT)                                  |
| UI/UX Designer                  | `ui-ux-designer.md`           | subagent    | Design system, Figma, Stitch, accessibility, DESIGN.md                 |
| Code Reviewer / QA              | `code-reviewer.md`            | subagent    | Code quality review, security audit, testing strategy, verification    |
| Database Specialist             | `database-specialist.md`      | subagent    | PostgreSQL schema, query optimization, Prisma, migrations              |
| DevOps / Infrastructure         | `devops-specialist.md`        | subagent    | CI/CD, deployment, Docker, monitoring, infrastructure                  |
| SEO Specialist                  | `seo-specialist.md`           | subagent    | Meta tags, structured data, Core Web Vitals, content optimization      |
| Android Developer               | `android-developer.md`        | subagent    | Kotlin, Jetpack Compose, Material 3, Gradle, Play Store                |
| Flutter Developer               | `flutter-developer.md`        | subagent    | Dart, Flutter SDK, Material 3, Firebase, cross-platform                |

### Cara Kerja

1. User memberikan requirement ke **IT Leader** (primary agent, otomatis aktif)
2. IT Leader menganalisis, merancang arsitektur, dan memecah menjadi task
3. IT Leader mendelegasikan task ke subagent yang sesuai
4. IT Leader mengintegrasikan hasil dari subagent dan melaporkan ke user

Untuk task kecil yang langsung tahu subagent-nya, bisa langsung mention subagent:

```text
@frontend-nuxt Tambahkan UButton "Simpan" di ProfileHeader.vue.
@frontend-react Buat server component ProductList dengan fetch dari API.
@backend Add endpoint POST /api/markets dengan DTO validation.
@laravel Buat halaman CRUD produk lengkap dengan Blade + Livewire.
@ci3 Buat REST API untuk produk dengan JWT auth.
@designer Review UX flow halaman checkout dan generate DESIGN.md.
@reviewer Audit security untuk authentication module.
@database Optimasi query untuk listing markets dengan pagination.
@devops Setup CI/CD pipeline untuk deployment ke Vercel.
@seo Implementasi meta tags dan structured data untuk halaman produk.
@android Buat halaman login dengan Jetpack Compose + ViewModel.
@flutter Buat screen product list dengan Bloc pattern.
```

## Model yang Direkomendasikan

Setiap agent bisa pakai model berbeda berdasarkan kompleksitas tugas. Subagent akan **inherit model dari primary** jika tidak diset. Berikut rekomendasi per agent:

| Agent         | Tugas                                     | Model Recommended            | Model Alternatif             | Alasan                                                              |
| ------------- | ----------------------------------------- | ---------------------------- | ---------------------------- | ------------------------------------------------------------------- |
| **IT Leader** | Orchestration, arsitektur, planning       | `opencode/claude-opus-4.7`   | `opencode/claude-opus-4.5`   | Butuh reasoning dalam, analisis kompleks, koordinasi multi-subagent |
| **Frontend**  | Implementasi komponen, halaman, logic     | `opencode/claude-sonnet-4.5` | `opencode/claude-sonnet-4.6` | Keseimbangan reasoning & efisiensi untuk coding                     |
| **Backend**   | API, DTO, controller, database ops        | `opencode/claude-sonnet-4.5` | `opencode/claude-sonnet-4.6` | Keseimbangan reasoning & efisiensi untuk coding                     |
| **Designer**  | Design system, eksplorasi visual, handoff | `opencode/claude-sonnet-4`   | `openai/gpt-5`               | Kreativitas dengan reasoning cukup                                  |
| **Reviewer**  | Security audit, code review detail        | `opencode/claude-opus-4.5`   | `openai/o3`                  | Analisis mendalam, deteksi pattern halus                            |
| **Database**  | Schema design, query optimization         | `opencode/claude-sonnet-4.5` | `opencode/claude-sonnet-4`   | Kebutuhan reasoning cukup, fokus precision                          |
| **DevOps**    | CI/CD config, scripts, monitoring         | `opencode/claude-haiku-4.5`  | `openai/gpt-4.1-mini`        | Task lebih straightforward, efisiensi tinggi                        |
| **Android**   | Kotlin, Compose, Gradle, Play Store       | `opencode/claude-sonnet-4.5` | `opencode/claude-haiku-4.5`  | Keseimbangan reasoning & efisiensi                                  |
| **Flutter**   | Dart, Flutter SDK, cross-platform         | `opencode/claude-sonnet-4.5` | `opencode/claude-haiku-4.5`  | Keseimbangan reasoning & efisiensi                                  |
| **SEO**       | Research, meta tags, structured data      | `openai/gpt-5.1-codex-mini`  | `openai/gpt-5-nano`          | Task lebih research-focused, tidak perlu deep coding                |

### Tier Model

| Tier                   | Model                                      | Use Case                                     |
| ---------------------- | ------------------------------------------ | -------------------------------------------- |
| **Tier 1** (Premium)   | `claude-opus-4.7`, `claude-opus-4.5`       | Orchestration, deep analysis, security audit |
| **Tier 2** (Balanced)  | `claude-sonnet-4.5/4.6`, `claude-sonnet-4` | Implementasi kompleks, design, database      |
| **Tier 3** (Efficient) | `claude-haiku-4.5`, `gpt-4.1-mini`         | Task langsung, scripts, config files         |
| **Tier 4** (Fast)      | `gpt-5-nano`, `gpt-5.1-codex-mini`         | Research, content, optimasi costs            |

### Cara Ganti Model

1. **Untuk semua agent** — set `model` di level primary agent (IT Leader)
2. **Per agent** — set `model` di config agent masing-masing
3. **Quick override** — pakai flag `--model` saat run opencode

Lihat `.opencode/config.example.json` untuk contoh konfigurasi lengkap per model.

## Skill yang Digunakan Agent

Skill tersimpan di `.opencode/skills/` (lokal dalam repo), jadi developer lain tidak perlu mencari skill satu per satu.

### Skill per Agent

| Agent                      | Skill Utama                                                                                                                                                                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IT Leader                  | coding-standards, backend-patterns, frontend-patterns                                                                                                                                                                                          |
| Frontend Developer (Vue)   | coding-standards, frontend-patterns, frontend-design, web-design-guidelines, nuxt-ui, tdd-workflow                                                                                                                                             |
| Frontend Developer (React) | coding-standards, frontend-patterns, frontend-design, web-design-guidelines, vercel-react-best-practices, vercel-composition-patterns, tdd-workflow                                                                                            |
| Backend Developer          | coding-standards, backend-patterns, postgres-patterns, security-review                                                                                                                                                                         |
| UI/UX Designer             | frontend-design, web-design-guidelines, building-components, nuxt-ui                                                                                                                                                                           |
| Code Reviewer / QA         | coding-standards, security-review, tdd-workflow, web-design-guidelines                                                                                                                                                                         |
| Database Specialist        | postgres-patterns, backend-patterns                                                                                                                                                                                                            |
| DevOps / Infrastructure    | backend-patterns, coding-standards                                                                                                                                                                                                             |
| SEO Specialist             | frontend-patterns, web-design-guidelines, nuxt-ui                                                                                                                                                                                              |
| **Android Developer**      | coding-standards, android-jetpack-compose, edge-to-edge, navigation-3, firebase-basics, play-billing, camera1-to-camerax, r8-analyzer, migrate-xml-views-to-jetpack-compose, gpc-setup, gpc-release-flow, gpc-preflight, gpc-vitals-monitoring |
| **Flutter Developer**      | coding-standards, flutter (patterns), 10 Flutter skills, 9 Dart skills, firebase-basics                                                                                                                                                        |

### Skill yang tidak perlu untuk operasional tim ini

Skill backend/lintas bahasa di bawah tidak diperlukan untuk stack utama Nuxt + Node.js:

- `springboot-*`, `java-*`, `jpa-patterns`
- `django-*`
- `golang-*`
- `python-*`
- `clickhouse-io`

Catatan: skill tersebut boleh tetap disimpan jika tim memang butuh multi-stack, tapi tidak wajib untuk stack utama.

### Skill lain yang tersedia di repo

- `configure-ecc` — installer untuk Everything Claude Code
- `continuous-learning` / `continuous-learning-v2` — pattern learning dari session
- `eval-harness` — formal evaluation framework
- `iterative-retrieval` — context retrieval pattern
- `strategic-compact` — manual context compaction
- `verification-loop` — verification cycle untuk agent
- `nutrient-document-processing` — document processing API
- `project-guidelines-example` — contoh panduan proyek

## Lokasi Skill

OpenCode membaca skill dari:

- `~/.opencode/skills/`
- `~/.agents/skills/`
- `.opencode/skills/` (lokal di repo ini)

Verifikasi cepat:

```bash
ls ~/.opencode/skills
ls ~/.agents/skills
ls .opencode/skills
```

Pastikan semua skill wajib tersedia.

## Cara Install Skill dari Folder `.opencode/skills/` Repo

Jika skill belum ada di mesin developer, copy dari repo ini ke direktori skill lokal:

```bash
mkdir -p ~/.opencode/skills
cp -R ./.opencode/skills/coding-standards ~/.opencode/skills/
cp -R ./.opencode/skills/frontend-patterns ~/.opencode/skills/
cp -R ./.opencode/skills/frontend-design ~/.opencode/skills/
cp -R ./.opencode/skills/web-design-guidelines ~/.opencode/skills/
cp -R ./.opencode/skills/nuxt-ui ~/.opencode/skills/
cp -R ./.opencode/skills/security-review ~/.opencode/skills/
cp -R ./.opencode/skills/tdd-workflow ~/.opencode/skills/
```

Opsional:

```bash
cp -R ./.opencode/skills/building-components ~/.opencode/skills/
cp -R ./.opencode/skills/vercel-composition-patterns ~/.opencode/skills/
```

### Mobile Skills

Jika mengerjakan mobile development, install juga skill berikut:

```bash
# Flutter patterns & task skills
cp -R ./.opencode/skills/flutter ~/.opencode/skills/
cp -R ./.opencode/skills/flutter-* ~/.opencode/skills/

# Dart task skills
cp -R ./.opencode/skills/dart-* ~/.opencode/skills/

# Android skills
cp -R ./.opencode/skills/jetpack-compose ~/.opencode/skills/

# Firebase (shared Android + Flutter)
cp -R ./.opencode/skills/firebase-basics ~/.opencode/skills/
```

## MCP yang Digunakan Agent

Dari `.opencode/config.json`, agent memakai MCP berikut:

| MCP          | Type   | Status   | Deskripsi                                            |
| ------------ | ------ | -------- | ---------------------------------------------------- |
| `nuxt`       | remote | enabled  | Dokumentasi Nuxt, blog, deployment guide             |
| `nuxt-ui`    | remote | enabled  | Dokumentasi & contoh komponen Nuxt UI                |
| `playwright` | stdio  | enabled  | Browser automation & E2E testing                     |
| `postman`    | remote | enabled  | Postman API management (collections, requests, docs) |
| `figma`      | stdio  | disabled | Akses Figma design file (opsional)                   |
| `stitch`     | remote | disabled | Google Stitch AI design generation (opsional)        |

Jika ingin pakai Figma MCP:

```bash
export FIGMA_ACCESS_TOKEN="your-token"
```

Jika ingin pakai Google Stitch MCP:

```bash
# Get API key from https://stitch.withgoogle.com/settings/api-keys
export STITCH_API_KEY="your-api-key"
```

## Setup Global Config OpenCode

Agar agent, skill, commands, dan rules tersedia di semua project, copy ke direktori global OpenCode.

### macOS & Linux/Ubuntu

Path global: `~/.opencode/`

```bash
# Buat direktori global jika belum ada
mkdir -p ~/.opencode/skills ~/.opencode/commands ~/.opencode/rules ~/.opencode/contexts

# Copy dari project ke global
cp -R .opencode/config.json ~/.opencode/opencode.json            # Config global
cp -R .opencode/skills/* ~/.opencode/skills/                      # Skills
cp -R .opencode/commands/* ~/.opencode/commands/                  # Commands
cp -R .opencode/rules/* ~/.opencode/rules/                        # Rules
cp -R .opencode/contexts/* ~/.opencode/contexts/                  # Contexts
```

### Windows (PowerShell)

Path global: `$env:USERPROFILE\.opencode\`

```powershell
# Buat direktori global jika belum ada
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.opencode\skills"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.opencode\commands"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.opencode\rules"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.opencode\contexts"

# Copy dari project ke global
Copy-Item -Recurse .opencode\config.json "$env:USERPROFILE\.opencode\opencode.json"
Copy-Item -Recurse .opencode\skills\* "$env:USERPROFILE\.opencode\skills\"
Copy-Item -Recurse .opencode\commands\* "$env:USERPROFILE\.opencode\commands\"
Copy-Item -Recurse .opencode\rules\* "$env:USERPROFILE\.opencode\rules\"
Copy-Item -Recurse .opencode\contexts\* "$env:USERPROFILE\.opencode\contexts\"
```

### Windows (Command Prompt)

```cmd
mkdir "%USERPROFILE%\.opencode\skills"
mkdir "%USERPROFILE%\.opencode\commands"
mkdir "%USERPROFILE%\.opencode\rules"
mkdir "%USERPROFILE%\.opencode\contexts"
copy /Y .opencode\config.json "%USERPROFILE%\.opencode\opencode.json"
xcopy /E /I /Y .opencode\skills "%USERPROFILE%\.opencode\skills\"
xcopy /E /I /Y .opencode\commands "%USERPROFILE%\.opencode\commands\"
xcopy /E /I /Y .opencode\rules "%USERPROFILE%\.opencode\rules\"
xcopy /E /I /Y .opencode\contexts "%USERPROFILE%\.opencode\contexts\"
```

### Verify Setup

```bash
opencode doctor                    # Cek status konfigurasi
ls ~/.opencode/                    # Cek direktori global (macOS/Linux)
```

### Priority Konfigurasi

```
User Session
    │
    ▼
Project-level config (.opencode/config.json)   ← Tertinggi
    │
    ▼
Global config (~/.opencode/opencode.json)
    │
    ▼
OpenCode defaults                               ← Terendah
```

Project config override global, global override defaults. Instructions digabungkan dari semua level.

## Cara Menggunakan Folder Pendukung

### `.opencode/contexts/`

Berisi konteks reusable proyek:

- `dev.md` — konteks development
- `research.md` — konteks riset
- `review.md` — konteks code review

Rujuk konteks ini saat membuat prompt supaya agent tidak keluar jalur. Update saat ada perubahan requirement produk/arsitektur.

Instal ke lokal jika ingin reuse context lintas repo:

```bash
mkdir -p ~/.opencode/contexts
cp -R ./.opencode/contexts/* ~/.opencode/contexts/
```

### `.opencode/commands/`, `.opencode/rules/`, `.opencode/hooks/`

Folder-folder ini ada di dalam `.opencode/` dan berisi:

- **`commands/`** — Command/prompt siap pakai (slash command internal tim)
- **`rules/`** — Aturan operasional/coding yang harus dipatuhi
- **`hooks/`** — Automasi lifecycle (pre-task/post-task, validasi)

Folder-folder ini **bukan** otomatis aktif. Developer perlu copy/sinkron ke environment lokal masing-masing jika diperlukan.

Instal commands:

```bash
mkdir -p ~/.opencode/commands
cp -R ./.opencode/commands/* ~/.opencode/commands/
```

Instal rules (ikuti README di `rules/` — copy per direktori, jangan di-flatten).

Hooks: aktifkan hanya jika environment lokal mendukung hook dependencies-nya. File `hooks/hooks.json` memanggil script via `CLAUDE_PLUGIN_ROOT`.

### Praktik Tim yang Disarankan

- Gunakan `commands/` untuk pekerjaan rutin.
- Gunakan `rules/` sebagai standar wajib saat implementasi dan review.
- Gunakan `contexts/` untuk prompt yang lebih presisi.
- Perlakukan `hooks/` sebagai konfigurasi bersama tim (perubahan perlu sinkronisasi).

## Cara Pakai

### Workflow Utama (via IT Leader)

IT Leader adalah **primary agent** — otomatis aktif saat session dimulai. Berikan requirement ke IT Leader:

```text
Buat fitur marketplace dengan halaman listing, detail, dan form create.
Backend API untuk CRUD markets dengan pagination dan filter.
Setup CI/CD pipeline dan optimasi SEO.
```

IT Leader akan:

1. Analisis requirement dan definisikan scope
2. Rancang arsitektur (data flow, API contract, component structure)
3. Pecah menjadi task dan delegasikan ke subagent yang sesuai
4. Integrasikan hasil dan laporkan status

### Direct Call ke Subagent (untuk task kecil)

Untuk task kecil yang sudah jelas subagent-nya, bisa langsung mention:

```text
@frontend-nuxt Tambahkan UButton "Simpan" di app/components/profile/ProfileHeader.vue.
Task tiny, minimal diff, jangan ubah file lain.
```

```text
@frontend-nuxt Implementasikan filter status di halaman markets.
Gunakan pola useApi yang sudah ada dan laporkan verification status.
```

```text
@backend Add endpoint POST /api/markets dengan DTO validation.
```

```text
@designer Buat design system untuk halaman produk dengan Nuxt UI.
```

```text
@reviewer Audit security untuk authentication module.
```

```text
@database Optimasi query untuk listing markets dengan pagination.
```

```text
@devops Setup CI/CD pipeline untuk deployment ke Vercel.
```

```text
@seo Implementasi meta tags dan structured data untuk halaman produk.
```

## Standar Output Agent

Agent ini dikonfigurasi untuk selalu melaporkan:

- perubahan yang dibuat
- file yang disentuh
- status verifikasi: `verified` / `partially_verified` / `not_verified`
- command manual jika verifikasi penuh tidak bisa dijalankan

## Kebijakan Operasional Penting

- Tidak commit kecuali diminta user
- Tidak buat PR kecuali diminta user
- Tidak push kecuali diminta user
- Tidak menyentuh file di luar scope request

Detail SOP tim ada di: `.opencode/agent-docs/frontend/nuxt/TEAM_OPERATING_GUIDE.md`

## Dokumentasi Lengkap

Dokumentasi agent tersedia di `.opencode/agent-docs/frontend/nuxt/`:

| Dokumen                   | Isi                                |
| ------------------------- | ---------------------------------- |
| `INDEX.md`                | Navigasi lengkap semua dokumentasi |
| `README.md`               | User guide lengkap                 |
| `QUICK_START.md`          | Mulai dalam 5 menit                |
| `EXAMPLES.md`             | 50+ contoh praktis                 |
| `API_PATTERNS.md`         | Panduan useApi composable          |
| `WORKFLOWS.md`            | 8 workflow detail                  |
| `CHEATSHEET.md`           | Quick reference                    |
| `MCP_GUIDE.md`            | Panduan integrasi MCP              |
| `TESTING_GUIDE.md`        | Testing & validasi                 |
| `TEAM_OPERATING_GUIDE.md` | SOP tim                            |
| `SUMMARY.md`              | Ringkasan instalasi                |
| `COMPLETION_REPORT.md`    | Laporan penyelesaian               |
| `README_AGENTS.md`        | Overview agent                     |
| `README_DOCS.md`          | Overview dokumentasi               |

### Dokumentasi Mentor

| Dokumen                          | Isi                     |
| -------------------------------- | ----------------------- |
| `MENTOR_CURRICULUM_30_DAYS.md`   | Roadmap belajar 30 hari |
| `MENTOR_CURRICULUM_CHECKLIST.md` | Checklist harian        |
| `MENTOR_WEEKLY_ASSIGNMENTS.md`   | Tugas mingguan + rubrik |

### Dokumentasi Backend

| Dokumen                               | Isi                 |
| ------------------------------------- | ------------------- |
| `backend/README.md`                   | Overview backend    |
| `backend/node/BACKEND_QUICK_START.md` | Quick start backend |
| `backend/node/BACKEND_PATTERNS.md`    | Pola backend        |

## Referensi Cepat

- Config aktif: `.opencode/config.json`
- Config contoh (model per agent): `.opencode/config.example.json`
- Prompt IT Leader (primary): `.opencode/agents/it-leader.md`
- Prompt frontend (Nuxt): `.opencode/agents/nuxt-frontend-developer.md`
- Prompt frontend (React): `.opencode/agents/react-frontend-developer.md`
- Prompt backend (Node): `.opencode/agents/node-backend-developer.md`
- Prompt backend (Laravel): `.opencode/agents/laravel-advanced.md`
- Prompt backend (CI3): `.opencode/agents/code-igniter-3-fullstack.md`
- Prompt designer subagent: `.opencode/agents/ui-ux-designer.md`
- Prompt reviewer subagent: `.opencode/agents/code-reviewer.md`
- Prompt database subagent: `.opencode/agents/database-specialist.md`
- Prompt devops subagent: `.opencode/agents/devops-specialist.md`
- Prompt seo subagent: `.opencode/agents/seo-specialist.md`
- Prompt android subagent: `.opencode/agents/android-developer.md`
- Prompt flutter subagent: `.opencode/agents/flutter-developer.md`
- Commands mobile: `.opencode/commands/android-build/`, `android-test/`, `flutter-build/`, `flutter-test/`, `gpc-release/`
- Rules mobile: `.opencode/rules/android/`, `flutter/`, `mobile/`
- Dokumentasi utama: `.opencode/agent-docs/frontend/nuxt/README.md`
- Quick start: `.opencode/agent-docs/frontend/nuxt/QUICK_START.md`
- Index dokumentasi: `.opencode/agent-docs/frontend/nuxt/INDEX.md`

## Troubleshooting Instalasi Skill

### 1) Skill tidak muncul saat dicek

**Gejala:** nama skill tidak terlihat saat `ls ~/.opencode/skills` atau `ls ~/.agents/skills`.

**Langkah perbaikan:**

1. Pastikan path home benar:

```bash
echo $HOME
```

2. Cek direktori skill:

```bash
ls ~/.opencode/skills
ls ~/.agents/skills
ls .opencode/skills
```

3. Jika belum ada, install/copy skill ke salah satu direktori tersebut.

### 2) Skill ada, tapi agent tidak memakainya

**Gejala:** agent tidak memuat skill yang seharusnya dipakai.

**Langkah perbaikan:**

1. Panggil skill secara eksplisit di prompt:

```text
@frontend Load skill `nuxt-ui` lalu implementasikan form ini.
```

2. Mulai session baru OpenCode setelah update skill/konfigurasi.
3. Pastikan nama skill persis sama dengan folder skill.

### 3) Permission command diblokir

**Gejala:** agent tidak bisa menjalankan command tertentu (test/build/lint).

**Langkah perbaikan:**

1. Cek policy di `.opencode/config.json` pada bagian `agent.frontend.permission`.
2. Izinkan command yang dibutuhkan (mis. `pnpm *`, `npm *`, atau command spesifik).
3. Jalankan ulang task; agent akan melaporkan `verification status` sesuai izin yang tersedia.

### 4) MCP tidak tersedia atau gagal dipakai

**Gejala:** lookup Nuxt/Nuxt UI docs tidak berjalan.

**Langkah perbaikan:**

1. Cek `mcp` di `.opencode/config.json` pastikan `enabled: true` untuk `nuxt` dan `nuxt-ui`.
2. Pastikan koneksi internet aktif (karena MCP Nuxt/Nuxt UI remote).
3. Untuk Figma MCP, pastikan token terpasang:

```bash
export FIGMA_ACCESS_TOKEN="your-token"
```

### 5) Output agent terlalu verbose atau terlalu luas

**Gejala:** perubahan melebar atau penjelasan terlalu panjang.

**Langkah perbaikan:**

Gunakan batasan langsung di prompt:

```text
Task tiny. Minimal diff. Ubah 1 file ini saja. Jawaban ringkas.
```

### 6) Konvensi proyek tidak diikuti

**Gejala:** style/pattern yang dipakai tidak sesuai kode existing.

**Langkah perbaikan:**

1. Sebutkan konvensi secara eksplisit di prompt (mis. "gunakan useApi", "jangan ubah naming").
2. Referensikan file contoh yang harus diikuti.
3. Minta agent melakukan revisi dengan scope sempit pada file terkait.
