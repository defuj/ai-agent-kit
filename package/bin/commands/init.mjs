import {
  readFileSync,
  existsSync,
  copyFileSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  appendFileSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = join(__dirname, "..", "..");
const TEMPLATE_DIR = join(PKG_ROOT, "template");

function copyRecursive(src, dest) {
  if (!existsSync(src)) return;
  const entries = readdirSync(src, { withFileTypes: true });
  mkdirSync(dest, { recursive: true });
  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function detectPackageManager(cwd) {
  if (existsSync(join(cwd, "bun.lock"))) return "bun";
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

function mergeJson(target, source, strategy = {}) {
  const merged = JSON.parse(JSON.stringify(target));

  for (const [key, value] of Object.entries(source)) {
    if (!(key in merged)) {
      merged[key] = JSON.parse(JSON.stringify(value));
      continue;
    }

    const rule = strategy[key] || "default";

    if (rule === "keep-target") {
      // Keep user's existing value
      continue;
    }

    if (rule === "source-wins") {
      merged[key] = JSON.parse(JSON.stringify(value));
      continue;
    }

    if (rule === "merge-agents") {
      merged[key] = merged[key] || {};
      for (const [agentKey, agentVal] of Object.entries(value)) {
        if (!(agentKey in merged[key])) {
          merged[key][agentKey] = JSON.parse(JSON.stringify(agentVal));
        }
        // else: keep user's existing agent (unless --force)
      }
      continue;
    }

    if (rule === "merge-mcp") {
      merged[key] = merged[key] || {};
      for (const [mcpKey, mcpVal] of Object.entries(value)) {
        if (!(mcpKey in merged[key])) {
          merged[key][mcpKey] = JSON.parse(JSON.stringify(mcpVal));
        }
      }
      continue;
    }

    if (rule === "merge-instructions") {
      const existing = merged[key] || [];
      const srcArr = Array.isArray(value) ? value : [value];
      for (const item of srcArr) {
        if (!existing.includes(item)) {
          existing.push(item);
        }
      }
      merged[key] = existing;
      continue;
    }

    if (rule === "merge-permissions") {
      merged[key] = merged[key] || {};
      for (const [permKey, permVal] of Object.entries(value)) {
        if (!(permKey in merged[key])) {
          merged[key][permKey] = JSON.parse(JSON.stringify(permVal));
        }
      }
      continue;
    }

    // default: source wins for top-level, but merge nested objects
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      typeof merged[key] === "object" &&
      merged[key] !== null &&
      !Array.isArray(merged[key])
    ) {
      merged[key] = { ...merged[key], ...value };
    } else {
      merged[key] = value;
    }
  }

  return merged;
}

function mergeOencodeConfig(templateConfigPath, userConfigPath, force) {
  const templateConfig = JSON.parse(readFileSync(templateConfigPath, "utf-8"));
  const userConfig = existsSync(userConfigPath)
    ? JSON.parse(readFileSync(userConfigPath, "utf-8"))
    : {};

  const strategy = {
    $schema: "source-wins",
    formatter: "keep-target",
    permission: "keep-target",
    instructions: "merge-instructions",
    mcp: "merge-mcp",
    agent: force ? "source-wins" : "merge-agents",
    plugin: "merge-instructions",
  };

  const merged = mergeJson(userConfig, templateConfig, strategy);
  return merged;
}

export async function init(options) {
  const targetDir = options.dir;
  const force = options.force;
  const skipInstall = options.skipInstall;

  console.log(`\n  agent-kit init`);

  // 1. Validate target
  if (!existsSync(targetDir)) {
    console.error(`  ✗ Target directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  // 2. Check if .opencode already exists
  const opencodeDir = join(targetDir, ".opencode");
  const userConfigPath = join(targetDir, "opencode.json");

  if (existsSync(opencodeDir) && !force) {
    console.log(`  \n  ⚠  .opencode/ already exists in ${targetDir}`);
    const rl = await import("readline/promises");
    const readline = rl.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const answer = await readline.question(
      `  ? Overwrite existing files? [y/N] `,
    );
    readline.close();
    if (answer.toLowerCase() !== "y") {
      console.log(`  ✗ Aborted.`);
      process.exit(0);
    }
  }

  // 3. Validate template exists
  if (!existsSync(TEMPLATE_DIR)) {
    console.error(`  ✗ Template directory not found at ${TEMPLATE_DIR}`);
    console.error(`    This is a bug. Please reinstall the package.`);
    process.exit(1);
  }

  // 4. Copy .opencode/ from template
  console.log(`  \n  📁 Copying .opencode/ configuration...`);
  copyRecursive(join(TEMPLATE_DIR, ".opencode"), opencodeDir);

  // 5. Merge opencode.json
  const templateConfigPath = join(TEMPLATE_DIR, "opencode.json");
  if (existsSync(templateConfigPath)) {
    console.log(`  📝 Merging opencode.json...`);
    const merged = mergeOencodeConfig(
      templateConfigPath,
      userConfigPath,
      force,
    );
    writeFileSync(
      userConfigPath,
      JSON.stringify(merged, null, 2) + "\n",
      "utf-8",
    );
  }

  // 6. Copy opencode.example.json
  const exampleSrc = join(TEMPLATE_DIR, "opencode.example.json");
  const exampleDest = join(targetDir, "opencode.example.json");
  if (existsSync(exampleSrc)) {
    console.log(`  📄 Copying opencode.example.json...`);
    copyFileSync(exampleSrc, exampleDest);
  }

  // 7. Install dependencies
  if (!skipInstall) {
    const pm = detectPackageManager(opencodeDir);
    console.log(`  📦 Installing .opencode/ dependencies with ${pm}...`);
    try {
      execSync(`${pm} install`, { cwd: opencodeDir, stdio: "pipe" });
    } catch (err) {
      console.error(`  ⚠  Dependency install failed: ${err.message}`);
      console.error(`    You can run "${pm} install" manually in .opencode/`);
    }
  }

  // 8. Update .gitignore
  const gitignorePath = join(targetDir, ".gitignore");
  const gitignoreEntries = [
    ".opencode/*",
    "opencode.json",
    "opencode.example.json",
  ];
  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, gitignoreEntries.join("\n") + "\n", "utf-8");
    console.log(`  📄 Created .gitignore...`);
  } else {
    const gitignoreContent = readFileSync(gitignorePath, "utf-8");
    let appended = false;
    for (const entry of gitignoreEntries) {
      if (!gitignoreContent.includes(entry)) {
        appendFileSync(gitignorePath, entry + "\n", "utf-8");
        appended = true;
      }
    }
    if (appended) {
      console.log(`  📄 Updated .gitignore...`);
    }
  }

  // 9. Done
  console.log(`\n  ✅ agent-kit installed!\n`);
  console.log(`     Location: ${targetDir}`);
  console.log(`     What you got:`);
  console.log(`       • opencode.json              — 13 agents config with MCP servers`);
  console.log(`       • opencode.example.json      — Example config for reference`);
  console.log(`       • .opencode/agents    — 14 agent prompt files`);
  console.log(`       • .opencode/skills/    — 60+ skill playbooks`);
  console.log(`       • .opencode/commands/  — 35+ slash commands`);
  console.log(`       • .opencode/rules/     — Scoped coding rules`);
  console.log(`       • .opencode/contexts/  — Dev/review/research contexts`);
  console.log(`       • .opencode/docs/— Agent documentation`);
  console.log(`\n     Next steps:`);
  console.log(`       cd ${targetDir}`);
  console.log(`       opencode\n`);
}
