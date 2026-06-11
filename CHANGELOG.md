# Changelog

All notable changes to the **opencode-agent-kit** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2025-06-09

### Added

- **17 new agents** — @python, @rust, @swift, @dotnet, @angular, @cpp, @ai-agent (total 31 agents)
- **91 new skills from ECC** — total 201 skills, covering Python/ML, Rust, Swift, C++, C#/.NET, Angular, AI agent engineering, cross-cutting workflows
- **Full agent infrastructure** — prompts, config, permissions, skill references for all new agents

### Changed

- Agent count: 14 → **21**
- Skills count: 74 → **201**
- Template files: 380 → **~450**

---

## [1.1.1] - 2025-06-09

### Added

- **74 skill playbooks** (was 61) — 13 new agent-specific skills + agentmemory linked to all 14 agents
- **Skill-to-agent mapping** — 127 explicit skill references across all agent prompts
- **Cross-stack optional skills** — 15 skills available on-demand for django, golang, python, springboot, java stacks

### Changed

- **Global install** — multi-OS instructions (macOS/Linux, Windows PowerShell, CMD)
- **Path resolution** — 3-tier fallback for template discovery (npx, global, local dev)
- **SonarQube agent** — registered in config, MCP enabled, permissions added

---

## [1.1.0] - 2025-06-09

### Added

- **Foundation files**: LICENSE (MIT), CHANGELOG.md, CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md
- **CI/CD pipeline**: GitHub Actions workflow for automated testing + npm publish
- **GitHub templates**: Issue templates (bug report, feature request) + PR template
- **Developer tooling**: `.editorconfig`, `.prettierrc`, `.eslintrc.json` for consistent code quality
- **JSON Schema**: `schema/opencode-config.schema.json` for validating agent configurations
- **CLI upgrade command**: `opencode-agent-kit upgrade` — self-update with version check
- **CLI doctor command**: `opencode-agent-kit doctor` — diagnose common setup issues
- **CLI uninstall command**: `opencode-agent-kit uninstall` — clean removal
- **Unit tests**: Test suite for init, merge logic, config helpers, and CLI commands (Vitest)
- **Polish output**: Color-coded console output with spinners and structured feedback in CLI
- **Bash permission hardening**: Template `opencode.json` now uses `"*": "ask"` by default instead of `"*": "allow"`

### Security

- Added SECURITY.md with responsible disclosure policy
- Permission model in template config now defaults to ask for unrestricted bash access

---

## [1.0.19] - 2025-06-08

### Added

- SonarQube quality agent (`@sonarqube`) with full MCP integration
- SonarQube scan command `/sonarqube-scan` with quick/full/PR modes
- SonarQube quality gate checks and issue triage workflow
- agentmemory integration with 53 MCP tools for persistent cross-session memory
- `.kit-version` tracking for automated update checks
- Postman MCP server for API management
- Smart JSON merge strategy in init command (agents, MCP, permissions, instructions)

### Fixed

- Template directory resolution when installed globally via npm
- Gitignore entries for `.opencode/*` and `data/`

---

## [1.0.0] - 2025-06-06

### Added

- Initial release of opencode-agent-kit
- 13 specialized AI agents orchestrated by IT Leader
- Multi-stack support: Nuxt/Vue, React/Next.js, Node.js/Express, Laravel, CodeIgniter 3, Android (Kotlin/Compose), Flutter (Dart)
- 60+ skill playbooks across all stacks
- 30+ custom slash commands (plan, tdd, code-review, security, build, android/flutter commands)
- 8 MCP servers (Nuxt, Nuxt UI, Playwright, Postman, Figma, Stitch, SonarQube, agentmemory)
- Impeccable design intelligence system
- agentmemory persistent cross-session memory
- One-command `npx opencode-agent-kit init` installation
- Smart config merging for existing OpenCode projects
- Comprehensive docs for Nuxt, React, Flutter, Android stacks
- 30-day mentor curriculum for Nuxt transition
