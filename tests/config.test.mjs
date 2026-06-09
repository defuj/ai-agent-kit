import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = join(__dirname, '..');
const TEMPLATE_DIR = join(PKG_ROOT, 'template');
const hasTemplate = existsSync(TEMPLATE_DIR);

// ---------------------------------------------------------------------------
// Source-of-truth config tests — read from the actual project files
// These always work because the files are tracked in git
// ---------------------------------------------------------------------------

describe('source opencode.json (project root)', () => {
  const configPath = join(PKG_ROOT, 'opencode.json');

  it('exists and is valid JSON', () => {
    expect(existsSync(configPath)).toBe(true);
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(config.$schema).toBeDefined();
  });

  it('has permission section', () => {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(config.permission).toBeDefined();
    expect(config.permission.read).toBeDefined();
    expect(config.permission.edit).toBe('allow');
  });

  it('has instructions array', () => {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(Array.isArray(config.instructions)).toBe(true);
    expect(config.instructions.length).toBeGreaterThanOrEqual(3);
  });

  it('has MCP servers', () => {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(config.mcp).toBeDefined();
    expect(config.mcp).toHaveProperty('nuxt');
    expect(config.mcp).toHaveProperty('nuxt-ui');
    expect(config.mcp).toHaveProperty('playwright');
    expect(config.mcp).toHaveProperty('agentmemory');
  });

  it('has all 13+ agents with leader as primary', () => {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(config.agent).toBeDefined();
    expect(config.agent.leader.mode).toBe('primary');
    const subagents = Object.entries(config.agent).filter(
      ([_k, v]) => v.mode === 'subagent',
    );
    expect(subagents.length).toBeGreaterThanOrEqual(12);
  });

  it('has valid permissions for all agents', () => {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    const validValues = ['allow', 'deny', 'ask'];
    for (const [name, agent] of Object.entries(config.agent)) {
      if (agent.permission?.edit) {
        expect(validValues).toContain(agent.permission.edit);
      }
      if (agent.permission?.webfetch) {
        expect(validValues).toContain(agent.permission.webfetch);
      }
    }
  });

  it('MCP servers have correct types', () => {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    const { mcp } = config;
    expect(mcp.nuxt.type).toBe('remote');
    expect(mcp['nuxt-ui'].type).toBe('remote');
    expect(mcp.playwright.type).toBe('stdio');
    expect(mcp.agentmemory.type).toBe('local');
  });
});

describe('source .opencode/agent prompts', () => {
  const agentsDir = join(PKG_ROOT, '.opencode', 'agents');

  it('has at least 10 agent prompts', () => {
    expect(existsSync(agentsDir)).toBe(true);
    const agents = readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    expect(agents.length).toBeGreaterThanOrEqual(10);
  });

  it('it-leader.md has correct structure', () => {
    const content = readFileSync(join(agentsDir, 'it-leader.md'), 'utf-8');
    expect(content).toContain('IT Leader');
    expect(content).toContain('# IT Leader Agent');
  });

  it('all agent prompts start with a heading', () => {
    const agents = readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    for (const agent of agents) {
      const content = readFileSync(join(agentsDir, agent), 'utf-8');
      expect(content.startsWith('#')).toBe(true);
    }
  });
});

describe('source opencode.example.json', () => {
  it('exists and has model overrides', () => {
    const example = JSON.parse(
      readFileSync(join(PKG_ROOT, 'opencode.example.json'), 'utf-8'),
    );
    expect(example.agent.leader.mode).toBe('primary');
    expect(example.agent.leader.model).toBeDefined();
    expect(example.agent['frontend-nuxt'].model).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Template config tests — these only run when template/ exists on disk
// (template/ is gitignored and generated fresh before npm publish)
// ---------------------------------------------------------------------------

describe('template opencode.json', () => {
  const templateConfig = hasTemplate
    ? JSON.parse(readFileSync(join(TEMPLATE_DIR, 'opencode.json'), 'utf-8'))
    : null;

  it('exists locally (skip if not)', () => {
    if (!hasTemplate) {
      console.warn('  ⚠  template/ not found locally. Run: bash scripts/generate-template.sh');
    }
  });

  it('matches source config structure', () => {
    if (!templateConfig) return;
    expect(templateConfig.agent).toBeDefined();
    expect(templateConfig.agent.leader.mode).toBe('primary');
    expect(templateConfig.mcp).toHaveProperty('nuxt');
    expect(templateConfig.mcp).toHaveProperty('playwright');
  });

  it('has all expected agents', () => {
    if (!templateConfig) return;
    const expectedAgents = [
      'leader', 'frontend-nuxt', 'frontend-react', 'backend',
      'ci3', 'laravel', 'designer', 'reviewer', 'database',
      'devops', 'seo', 'android', 'flutter',
    ];
    for (const name of expectedAgents) {
      expect(templateConfig.agent).toHaveProperty(name);
    }
  });

  it('template should NOT have per-agent model set (inherit from primary)', () => {
    if (!templateConfig) return;
    expect(templateConfig.agent.leader.model).toBeUndefined();
    expect(templateConfig.agent['frontend-nuxt'].model).toBeUndefined();
  });

  it('template uses secure bash defaults ("*": "ask")', () => {
    if (!templateConfig) return;
    const bashPerms = templateConfig.agent.leader.permission?.bash;
    if (bashPerms) {
      expect(bashPerms['*']).toBe('ask');
    }
  });
});

describe('template opencode.example.json', () => {
  const examplePath = join(TEMPLATE_DIR, 'opencode.example.json');

  it('has model overrides (unlike template)', () => {
    if (!hasTemplate) return;
    const example = JSON.parse(readFileSync(examplePath, 'utf-8'));
    expect(example.agent.leader.model).toBeDefined();
    expect(example.agent['frontend-nuxt'].model).toBeDefined();
  });

  it('has agents defined', () => {
    if (!hasTemplate) return;
    const example = JSON.parse(readFileSync(examplePath, 'utf-8'));
    const agentKeys = Object.keys(example.agent);
    expect(agentKeys.length).toBeGreaterThanOrEqual(12);
  });
});
