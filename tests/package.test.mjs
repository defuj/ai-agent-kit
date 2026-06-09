import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// Package structure tests
// ---------------------------------------------------------------------------

describe('package structure', () => {
  const requiredFiles = [
    'package.json',
    'LICENSE',
    'CHANGELOG.md',
    'CONTRIBUTING.md',
    'SECURITY.md',
    'CODE_OF_CONDUCT.md',
    'README.md',
    'AGENTS.md',
    'bin/init.mjs',
    'bin/commands/init.mjs',
    'bin/commands/upgrade.mjs',
    'bin/commands/doctor.mjs',
    'bin/commands/uninstall.mjs',
    '.editorconfig',
    '.prettierrc',
    '.eslintrc.json',
    '.gitignore',
    'schema/opencode-config.schema.json',
  ];

  for (const file of requiredFiles) {
    it(`${file} exists`, () => {
      expect(existsSync(join(PKG_ROOT, file))).toBe(true);
    });
  }
});

describe('package.json', () => {
  const pkg = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf-8'));

  it('has valid name and version', () => {
    expect(pkg.name).toBe('opencode-agent-kit');
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('has valid bin entry', () => {
    expect(pkg.bin['opencode-agent-kit']).toBe('./bin/init.mjs');
  });

  it('has required dependencies', () => {
    expect(pkg.dependencies).toHaveProperty('commander');
    expect(pkg.dependencies).toHaveProperty('fs-extra');
  });

  it('has node >= 18 engine', () => {
    expect(pkg.engines.node).toBe('>=18');
  });

  it('has MIT license', () => {
    expect(pkg.license).toBe('MIT');
  });

  it('is public', () => {
    expect(pkg.publishConfig.access).toBe('public');
  });
});

describe('template structure', () => {
  const templateDir = join(PKG_ROOT, 'template');
  const hasTemplate = existsSync(templateDir);

  it('template directory exists (generate with: npm run generate-template)', () => {
    // template/ is gitignored — exists locally or in CI after generation
    // This is a soft check: just inform if missing
    if (!hasTemplate) {
      console.warn('  ⚠  template/ not found locally. Run: bash scripts/generate-template.sh');
    }
  });

  it('template opencode.json is valid JSON with all 13 agents', () => {
    if (!hasTemplate) return; // skip
    const config = JSON.parse(readFileSync(join(templateDir, 'opencode.json'), 'utf-8'));
    expect(config.agent).toBeDefined();
    const agentKeys = Object.keys(config.agent);
    expect(agentKeys.length).toBeGreaterThanOrEqual(13);
  });

  it('template has .opencode directory with essential structure', () => {
    if (!hasTemplate) return;
    const opencodeDir = join(templateDir, '.opencode');
    expect(existsSync(opencodeDir)).toBe(true);
    expect(existsSync(join(opencodeDir, 'agents'))).toBe(true);
    expect(existsSync(join(opencodeDir, 'instructions'))).toBe(true);
  });

  it('template has at least 10 agent prompts', () => {
    if (!hasTemplate) return;
    const agentsDir = join(templateDir, '.opencode', 'agents');
    if (existsSync(agentsDir)) {
      const agents = readdirSync(agentsDir).filter(f => f.endsWith('.md'));
      expect(agents.length).toBeGreaterThanOrEqual(10);
    }
  });
});

describe('foundation files content', () => {
  it('LICENSE contains MIT', () => {
    const content = readFileSync(join(PKG_ROOT, 'LICENSE'), 'utf-8');
    expect(content).toContain('MIT License');
  });

  it('CHANGELOG.md contains version headers', () => {
    const content = readFileSync(join(PKG_ROOT, 'CHANGELOG.md'), 'utf-8');
    expect(content).toContain('## [1.0.0]');
    expect(content).toContain('## [1.0.19]');
    expect(content).toContain('## [1.1.0]');
  });

  it('SECURITY.md contains supported versions', () => {
    const content = readFileSync(join(PKG_ROOT, 'SECURITY.md'), 'utf-8');
    expect(content).toContain('Supported Versions');
  });

  it('CONTRIBUTING.md references CODE_OF_CONDUCT.md', () => {
    const content = readFileSync(join(PKG_ROOT, 'CONTRIBUTING.md'), 'utf-8');
    expect(content).toContain('CODE_OF_CONDUCT');
  });
});

describe('config schema', () => {
  const schema = JSON.parse(
    readFileSync(join(PKG_ROOT, 'schema', 'opencode-config.schema.json'), 'utf-8'),
  );

  it('schema file is valid JSON', () => {
    expect(schema.$id).toContain('opencode-config.schema.json');
    expect(schema.title).toBe('OpenCode Agent Kit Configuration');
  });

  it('schema defines Agent with required fields', () => {
    const agentDef = schema.definitions.Agent;
    expect(agentDef.required).toContain('mode');
    expect(agentDef.required).toContain('prompt');
  });
});

describe('CLI entry point', () => {
  it('bin/init.mjs exports commands', () => {
    const content = readFileSync(join(PKG_ROOT, 'bin', 'init.mjs'), 'utf-8');
    expect(content).toContain('init');
    expect(content).toContain('upgrade');
    expect(content).toContain('doctor');
    expect(content).toContain('uninstall');
  });
});

describe('template agent prompts', () => {
  const agentsDir = join(PKG_ROOT, 'template', '.opencode', 'agents');
  const hasTemplate = existsSync(join(PKG_ROOT, 'template'));

  it('it-leader has correct structure', () => {
    if (!hasTemplate) return;
    const content = readFileSync(join(agentsDir, 'it-leader.md'), 'utf-8');
    expect(content).toContain('IT Leader');
    expect(content).toContain('# IT Leader Agent');
  });

  it('all agent prompts start with a heading', () => {
    if (!hasTemplate) return;
    if (existsSync(agentsDir)) {
      const agents = readdirSync(agentsDir).filter(f => f.endsWith('.md'));
      for (const agent of agents) {
        const content = readFileSync(join(agentsDir, agent), 'utf-8');
        expect(content.startsWith('#')).toBe(true);
      }
    }
  });
});
