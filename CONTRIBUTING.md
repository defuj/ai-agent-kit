# Contributing to opencode-agent-kit

First off, thank you for considering contributing! Every contribution — whether it's a bug report, feature suggestion, documentation fix, or pull request — makes this project better.

## Code of Conduct

This project follows a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold its standards.

## How to Contribute

### 1. Reporting Bugs

Open a [GitHub Issue](https://github.com/defuj/opencode-agent-kit/issues/new?template=bug_report.md).

Include:
- A clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node.js version, OpenCode version)
- Screenshots or logs if relevant

### 2. Suggesting Features

Open a [Feature Request](https://github.com/defuj/opencode-agent-kit/issues/new?template=feature_request.md).

Include:
- A clear, descriptive title
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

### 3. Improving Documentation

Documentation is in the `README.md`, `AGENTS.md`, `.opencode/docs/`, and individual skill/agent files. Submit a PR with your improvements.

### 4. Submitting Pull Requests

#### Getting Started

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/opencode-agent-kit.git
cd opencode-agent-kit
npm install
```

#### Development Workflow

1. **Create a branch** from `main` with a descriptive name:
   ```bash
   git checkout -b feat/add-something
   git checkout -b fix/something-broken
   git checkout -b docs/improve-readme
   ```

2. **Make your changes** following project conventions:
   - Keep changes focused — one feature/fix per PR
   - Write/update tests for new functionality
   - Run `npm test` before committing
   - Format with Prettier: `npx prettier --write .`

3. **Commit** with a descriptive message:
   ```bash
   git commit -m "feat: add XYZ feature"
   git commit -m "fix: resolve ABC issue"
   git commit -m "docs: update README with XYZ"
   ```

   Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `perf`, `ci`

4. **Push and open a PR**:
   ```bash
   git push origin feat/add-something
   ```
   Then open a PR against `main` on GitHub.

#### PR Checklist

Before submitting, ensure:

- [ ] Code compiles/works correctly
- [ ] Tests pass (`npm test`)
- [ ] New tests are added for new functionality
- [ ] Documentation is updated (README, agent prompts, skills)
- [ ] CHANGELOG.md is updated under `[Unreleased]`
- [ ] Changes are backwards-compatible (or migration path is documented)

### 5. Adding New Agent Configurations

To add a new agent to the kit:

1. Create the agent prompt file in `template/.opencode/agents/<name>.md`
2. Add the agent to `template/opencode.json` under `agent` section
3. Create relevant skills in `template/.opencode/skills/<name>/SKILL.md`
4. Create commands in `template/.opencode/commands/<name>/`
5. Update `README.md` and `AGENTS.md` with the new agent
6. Update `CHANGELOG.md`

### 6. Adding New Skills

Skills go in `.opencode/skills/<skill-name>/SKILL.md` (or `template/.opencode/skills/` for shipped skills).

Each skill should have:
- YAML frontmatter (name, description, version, author)
- Clear trigger conditions
- Step-by-step instructions
- Examples
- Pitfalls/troubleshooting section

## Project Structure

```
opencode-agent-kit/
├── bin/                    # CLI commands (init, upgrade, doctor, uninstall)
├── template/               # Template files for `opencode-agent-kit init`
│   ├── opencode.json       # Main agent configuration (shipped to users)
│   ├── opencode.example.json # Per-model config example
│   └── .opencode/          # Full template structure
├── tests/                  # Test suite
├── schema/                 # JSON schemas
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── CODE_OF_CONDUCT.md
├── LICENSE
├── package.json
└── README.md
```

## Questions?

Open a [Discussion](https://github.com/defuj/opencode-agent-kit/discussions) or [Issue](https://github.com/defuj/opencode-agent-kit/issues).

Thank you for helping make opencode-agent-kit better!
