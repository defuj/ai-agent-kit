import { existsSync, readFileSync, unlinkSync, rmSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline/promises';

const PKG_NAME = 'opencode-agent-kit';

export async function uninstall(options) {
  const targetDir = options.dir || process.cwd();
  const force = options.force;

  console.log(`\n  ${PKG_NAME} uninstall`);
  console.log(`  ${'─'.repeat(50)}`);
  console.log(`  Target: ${targetDir}\n`);

  if (!force) {
    const readline = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await readline.question(
      `  ⚠  This will remove .opencode/ and opencode.json from\n      ${targetDir}\n\n  ? Continue? [y/N] `,
    );
    readline.close();
    if (answer.toLowerCase() !== 'y') {
      console.log(`  ✗ Aborted.\n`);
      process.exit(0);
    }
  }

  // Remove .opencode/
  const opencodeDir = join(targetDir, '.opencode');
  if (existsSync(opencodeDir)) {
    console.log(`  Removing .opencode/ ...`);
    rmSync(opencodeDir, { recursive: true, force: true });
    console.log(`  ✓ .opencode/ removed`);
  } else {
    console.log(`  - .opencode/ not found, skipping`);
  }

  // Remove opencode.json
  const configPath = join(targetDir, 'opencode.json');
  if (existsSync(configPath)) {
    console.log(`  Removing opencode.json ...`);
    unlinkSync(configPath);
    console.log(`  ✓ opencode.json removed`);
  } else {
    console.log(`  - opencode.json not found, skipping`);
  }

  // Remove opencode.example.json
  const examplePath = join(targetDir, 'opencode.example.json');
  if (existsSync(examplePath)) {
    console.log(`  Removing opencode.example.json ...`);
    unlinkSync(examplePath);
    console.log(`  ✓ opencode.example.json removed`);
  }

  // Clean up .gitignore entries (remove lines containing these patterns)
  const gitignorePath = join(targetDir, '.gitignore');
  if (existsSync(gitignorePath)) {
    const entriesToRemove = ['.opencode/', 'opencode.json', 'opencode.example.json'];
    const content = readFileSync(gitignorePath, 'utf-8');
    const lines = content.split('\n').filter(line => {
      return !entriesToRemove.some(e => line.trim().startsWith(e));
    });
    const newContent = lines.join('\n');
    if (newContent !== content) {
      // Write back without these entries
      const { writeFileSync } = await import('fs');
      writeFileSync(gitignorePath, newContent, 'utf-8');
      console.log(`  ✓ .gitignore cleaned`);
    }
  }

  // Clean .kit-version
  const versionFile = join(opencodeDir, '.kit-version');
  if (existsSync(versionFile)) {
    unlinkSync(versionFile);
  }

  console.log(`\n  ✅ opencode-agent-kit has been removed from ${targetDir}\n`);
}
