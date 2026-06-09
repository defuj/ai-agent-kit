import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const PKG_NAME = 'opencode-agent-kit';

function check(condition, passMsg, failMsg) {
  if (condition) {
    console.log(`  ✓ ${passMsg}`);
    return true;
  }
  console.log(`  ✗ ${failMsg}`);
  return false;
}

function warn(msg) {
  console.log(`  ⚠ ${msg}`);
}

export async function doctor(options) {
  const targetDir = options.dir || process.cwd();
  const { fix } = options;

  console.log(`\n  ${PKG_NAME} doctor`);
  console.log(`  ${'─'.repeat(50)}`);
  console.log(`  Target: ${targetDir}\n`);

  let allGood = true;

  // 1. Check Node.js version
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  allGood &= check(
    major >= 18,
    `Node.js ${nodeVersion} (>= 18)`,
    `Node.js ${nodeVersion} — need >= 18`,
  );

  // 2. Check package.json exists
  const pkgPath = join(targetDir, 'package.json');
  allGood &= check(
    existsSync(pkgPath),
    'package.json found',
    'package.json not found',
  );

  // 3. Check opencode.json
  const configPath = join(targetDir, 'opencode.json');
  const hasConfig = existsSync(configPath);
  allGood &= check(hasConfig, 'opencode.json found', 'opencode.json not found');

  if (hasConfig) {
    try {
      JSON.parse(readFileSync(configPath, 'utf-8'));
      check(true, 'opencode.json is valid JSON', '');
    } catch {
      allGood = false;
      console.log('  ✗ opencode.json is not valid JSON');
    }
  }

  // 4. Check .opencode directory
  const opencodeDir = join(targetDir, '.opencode');
  const hasOpencode = existsSync(opencodeDir);
  allGood &= check(hasOpencode, '.opencode/ directory found', '.opencode/ directory not found');

  if (hasOpencode) {
    // 4a. Check agents
    const agentsDir = join(opencodeDir, 'agents');
    check(
      existsSync(agentsDir),
      '.opencode/agents/ found',
      '.opencode/agents/ missing',
    );

    // 4b. Check instructions
    const instrDir = join(opencodeDir, 'instructions');
    check(
      existsSync(instrDir),
      '.opencode/instructions/ found',
      '.opencode/instructions/ missing',
    );

    // 4c. Check skills
    const skillsDir = join(opencodeDir, 'skills');
    check(
      existsSync(skillsDir),
      '.opencode/skills/ found',
      '.opencode/skills/ missing',
    );

    // 4d. Count agents
    if (existsSync(agentsDir)) {
      const agents = readdirSync(agentsDir).filter(f => f.endsWith('.md'));
      check(
        agents.length >= 10,
        `${agents.length} agent prompts found (expected 14)`,
        `Only ${agents.length} agent prompts found (expected 14)`,
      );
    }

    // 4e. Check kit-version
    const versionFile = join(opencodeDir, '.kit-version');
    if (existsSync(versionFile)) {
      const installedVersion = readFileSync(versionFile, 'utf-8').trim();
      try {
        const latest = execSync(`npm view ${PKG_NAME} version`, {
          encoding: 'utf-8',
          timeout: 5000,
        }).trim();
        if (installedVersion !== latest) {
          warn(`Kit v${installedVersion} installed, v${latest} available`);
          if (fix) {
            console.log('     → Run `npx opencode-agent-kit upgrade` to update');
          }
        } else {
          check(true, `Kit version v${installedVersion} (up to date)`, '');
        }
      } catch {
        warn('Could not check latest version (npm registry unreachable)');
      }
    } else {
      warn('.kit-version not found');
    }
  }

  // 5. Check .gitignore
  const gitignorePath = join(targetDir, '.gitignore');
  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, 'utf-8');
    check(
      content.includes('.opencode') || content.includes('opencode.json'),
      '.gitignore covers .opencode/ files',
      '.gitignore may not cover .opencode/ files',
    );
  } else {
    warn('.gitignore not found');
    if (fix) {
      console.log('     → Run `opencode-agent-kit init` to create one');
    }
  }

  // 6. Check global agentmemory
  try {
    execSync('agentmemory --version', { stdio: 'pipe', timeout: 3000 });
    check(true, 'agentmemory (global) is installed', '');
  } catch {
    warn('agentmemory not installed globally');
    if (fix) {
      console.log('     → Run: npm install -g @agentmemory/agentmemory');
    }
  }

  // Summary
  console.log(`\n  ${'─'.repeat(50)}`);
  if (allGood) {
    console.log(`\n  ✅ All checks passed. Your setup looks good!\n`);
  } else {
    console.log(`\n  ⚠  Some checks failed. Review the issues above.\n`);
    if (!fix) {
      console.log(`  Tip: Run with --fix to enable actionable suggestions.\n`);
    }
  }
}
