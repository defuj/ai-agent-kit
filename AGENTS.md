# Agent Kit — OpenCode Agent System

This is the Agent Kit: a portable meta-project containing OpenCode agent configurations, skills, rules, and commands for a multi-stack development agent system. It covers Nuxt/Vue frontend, React/Next.js frontend, Node.js backend, Laravel, CodeIgniter 3, mobile (Android + Flutter), and supporting roles (design, review, database, devops, SEO). There is no actual application source code — all content is configuration and documentation for AI agent orchestration.

## Project Structure

- `.opencode/config.json` — Main OpenCode configuration with MCP servers and 12 agent definitions
- `.opencode/agents/` — Custom agent prompts:
  - **Primary**: `it-leader` (orchestrator)
  - **Web Frontend**: `nuxt-frontend-developer`, `react-frontend-developer`
  - **Backend**: `node-backend-developer`, `code-igniter-3-fullstack`, `laravel-advanced`
  - **Mobile**: `android-developer`, `flutter-developer`
  - **Support**: `ui-ux-designer`, `code-reviewer`, `database-specialist`, `devops-specialist`, `seo-specialist`
- `.opencode/instructions/INSTRUCTIONS.md` — Core instructions loaded into all agents
- `.opencode/skills/` — 61 skill playbooks (coding-standards, flutter, android-jetpack-compose, 10 flutter skills, 9 dart skills, firebase-basics, nuxt-ui, frontend-design, security-review, etc.)
- `.opencode/rules/` — Scoped rules (common/, typescript/, python/, android/, flutter/, mobile/)
- `.opencode/commands/` — Custom slash commands (plan, tdd, code-review, security, android-build, flutter-build, flutter-test, gpc-release, etc.)
- `.opencode/contexts/` — Context files (dev, review, research modes)

## Key Architecture

- **Primary Agent**: `leader` (IT Leader) orchestrates via Task tool to subagents
- **Subagents** (12 total): `frontend-nuxt`, `frontend-react`, `backend`, `ci3`, `laravel`, `android`, `flutter`, `designer`, `reviewer`, `database`, `devops`, `seo`
- **MCP Servers**: Nuxt docs, Nuxt UI docs, Playwright, Postman (enabled); Figma, Stitch (disabled)
- **Built-in Agents Available**: `@planner`, `@explore`, `@scout`, `@general`, `@code-reviewer`, `@security-reviewer`, `@e2e-runner`, `@build-error-resolver`, `@refactor-cleaner`

## Mobile Development

### Android (`@android`)
- Stack: Kotlin, Jetpack Compose, Material Design 3, Gradle KTS, Hilt, Room, MVVM/Clean Architecture
- Skills: android-jetpack-compose, edge-to-edge, navigation-3, firebase-basics, play-billing, camera1-to-camerax, r8-analyzer, migrate-xml-views-to-jetpack-compose
- GPC (Google Play Console) integration: gpc-setup, gpc-release-flow, gpc-preflight, gpc-vitals-monitoring, gpc-metadata-sync, gpc-monetization, gpc-ci-integration
- Commands: `/android-build`, `/android-test`, `/gpc-release`

### Flutter (`@flutter`)
- Stack: Dart, Flutter SDK, Material Design 3, Cupertino, Bloc/Riverpod, GoRouter, Dio, Clean Architecture
- Skills: flutter (patterns), 10 Flutter task skills, 9 Dart task skills, firebase-basics
- Commands: `/flutter-build`, `/flutter-test`

## No Build/Lint/Test Commands

This project has no application code. Build, lint, or test commands from `package.json` or other tooling configs are NOT relevant here. All validation is structural (valid JSON/YAML/Markdown).

## Installation as NPM Package

This project is also available as `opencode-agent-kit` on npm for easy installation into any project:

```bash
npx opencode-agent-kit init
```

See `README.md` for full setup instructions.
