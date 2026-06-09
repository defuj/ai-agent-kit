# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in opencode-agent-kit, please follow responsible disclosure.

**Do NOT** report security issues via public GitHub issues.

Instead, report via one of these channels:

1. **Email**: Send details to the repository owner via GitHub
2. **GitHub Security Advisory**: If available for this repo, use the "Report a vulnerability" link under the Security tab

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Triage**: Within 5 business days
- **Fix**: Timeline depends on severity

## Security Best Practices for Users

### Agent Configuration

Template configurations in `opencode.json` include security-aware defaults:

- `.env`, `.env.*` files are **denied** from read by default
- Bash permissions start at **ask** (prompt for approval) in the example config
- Sensitive MCP servers (SonarQube, Postman) require API keys via environment variables

### Recommendations

1. **Never** hardcode API keys or tokens in agent prompts or skills
2. **Review** bash permissions in your `opencode.json` — restrict to specific commands where possible
3. **Use environment variables** for MCP server credentials
4. **Review** custom skills and agent prompts before adding them to your configuration
5. **Keep the kit updated**: Run `npx opencode-agent-kit upgrade` regularly

## Scope

This policy covers the opencode-agent-kit package itself — the CLI, template configurations, and shipping agent prompts/skills. It does **not** cover:

- Third-party MCP servers (Figma, Stitch, Postman, etc.)
- The OpenCode CLI itself
- Applications built using this agent kit
