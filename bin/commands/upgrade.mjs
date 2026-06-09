import { execSync } from 'child_process';
import { readFileSync } from 'fs';
const PKG_NAME = 'opencode-agent-kit';

/**
 * Get the currently installed version from package.json
 */
function getCurrentVersion() {
  const pkgPath = new globalThis.URL('../../package.json', import.meta.url);
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  return pkg.version;
}

/**
 * Get the latest available version from npm
 */
function getLatestVersion() {
  try {
    return execSync(`npm view ${PKG_NAME} version`, {
      encoding: 'utf-8',
      timeout: 10000,
    }).trim();
  } catch {
    return null;
  }
}

export async function upgrade(options) {
  const { verbose } = options;

  console.log(`\n  ${PKG_NAME} upgrade`);
  console.log(`  ${'─'.repeat(50)}\n`);

  const current = getCurrentVersion();
  console.log(`  Current version: v${current}`);

  console.log(`  Checking npm registry...`);
  const latest = getLatestVersion();

  if (!latest) {
    console.error(`  \n  ✗ Could not reach npm registry.`);
    console.error(`    Check your internet connection and try again.`);
    process.exit(1);
  }

  console.log(`  Latest version:  v${latest}`);

  if (current === latest) {
    console.log(`\n  ✓ You're up to date (v${current}).\n`);
    return;
  }

  console.log(`\n  → Upgrading from v${current} to v${latest}...`);
  try {
    execSync(`npm install -g ${PKG_NAME}@latest`, {
      stdio: verbose ? 'inherit' : 'pipe',
      timeout: 60000,
    });
    console.log(`  ✓ Upgraded to v${latest}\n`);
  } catch (err) {
    console.error(`  ✗ Upgrade failed: ${err.message}`);
    console.error(`    Try: npm install -g ${PKG_NAME}@latest`);
    process.exit(1);
  }
}
