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

async function selectPlatform() {
  const rl = await import("readline/promises");
  const readline = rl.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`\n  ? Select platform to install:`);
  console.log(`    1) OpenCode (.opencode/)`);
  console.log(`    2) GitHub Copilot (.github/agents/)`);
  console.log(`    3) Both`);

  let answer;
  while (true) {
    answer = (await readline.question(`  ? Enter choice (1-3): `)).trim();
    if (["1", "2", "3"].includes(answer)) break;
    console.log(`  ✗ Invalid choice. Enter 1, 2, or 3.`);
  }

  readline.close();

  const choices = {
    1: "opencode",
    2: "copilot",
    3: "both",
  };
  return choices[answer];
}

function installOpencode(targetDir, force) {
  const opencodeDir = join(targetDir, ".opencode");
  const userConfigPath = join(targetDir, "opencode.json");

  if (existsSync(opencodeDir)) {
    console.log(`  ℹ  .opencode/ already exists (skipping)`);
    return;
  }

  console.log(`  \n  📁 Copying .opencode/ configuration...`);
  copyRecursive(join(TEMPLATE_DIR, ".opencode"), opencodeDir);

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

  const exampleSrc = join(TEMPLATE_DIR, "opencode.example.json");
  const exampleDest = join(targetDir, "opencode.example.json");
  if (existsSync(exampleSrc)) {
    console.log(`  📄 Copying opencode.example.json...`);
    copyFileSync(exampleSrc, exampleDest);
  }

  const pm = detectPackageManager(opencodeDir);
  console.log(`  📦 Installing .opencode/ dependencies with ${pm}...`);
  try {
    execSync(`${pm} install`, { cwd: opencodeDir, stdio: "pipe" });
  } catch (err) {
    console.error(`  ⚠  Dependency install failed: ${err.message}`);
    console.error(`    You can run "${pm} install" manually in .opencode/`);
  }
}

function installCopilot(targetDir) {
  const copilotDir = join(targetDir, ".github");
  const srcDir = join(TEMPLATE_DIR, ".github");

  if (!existsSync(srcDir)) return;

  if (existsSync(join(copilotDir, "agents"))) {
    console.log(`  ℹ  .github/agents/ already exists (skipping)`);
    return;
  }

  console.log(`  \n  📁 Copying .github/agents/ configuration...`);
  copyRecursive(join(srcDir, "agents"), join(copilotDir, "agents"));

  const hooksSrc = join(srcDir, "hooks");
  if (existsSync(hooksSrc)) {
    console.log(`  🔗 Copying hooks...`);
    copyRecursive(hooksSrc, join(copilotDir, "hooks"));
  }

  const workflowsSrc = join(srcDir, "workflows");
  if (existsSync(workflowsSrc)) {
    console.log(`  ⚙️  Copying setup workflow...`);
    copyRecursive(workflowsSrc, join(copilotDir, "workflows"));
  }
}

export async function init(options) {
  const targetDir = options.dir;
  const force = options.force;

  console.log(`\n  AI Agent KIT — init\n`);

  if (!existsSync(targetDir)) {
    console.error(`  ✗ Target directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  if (!existsSync(TEMPLATE_DIR)) {
    console.error(`  ✗ Template directory not found. Please reinstall.`);
    process.exit(1);
  }

  const platform = options.platform || (await selectPlatform());

  if (platform === "opencode" || platform === "both") {
    installOpencode(targetDir, force);
  }

  if (platform === "copilot" || platform === "both") {
    installCopilot(targetDir);
  }

  // Update .gitignore
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

  // Write .kit-version
  const pkgJson = JSON.parse(
    readFileSync(join(PKG_ROOT, "package.json"), "utf-8"),
  );
  const opencodeDir = join(targetDir, ".opencode");
  if (existsSync(opencodeDir)) {
    const versionFile = join(opencodeDir, ".kit-version");
    writeFileSync(versionFile, pkgJson.version + "\n", "utf-8");
  }

  // Done
  console.log(`\n  ✅ AI Agent KIT v${pkgJson.version} installed!\n`);
  console.log(`     Location: ${targetDir}`);
  console.log(`     Platform: ${platform}`);

  if (platform === "opencode" || platform === "both") {
    console.log(`     What you got (OpenCode):`);
    console.log(
      `       • opencode.json              — 13 agents config with MCP servers`,
    );
    console.log(`       • .opencode/agents           — 14 agent prompt files`);
    console.log(`       • .opencode/skills/          — 60+ skill playbooks`);
    console.log(`       • .opencode/commands/        — 35+ slash commands`);
    console.log(`       • .opencode/rules/           — Scoped coding rules`);
    console.log(
      `       • .opencode/contexts/        — Dev/review/research contexts`,
    );
    console.log(`       • .opencode/docs/            — Agent documentation`);
  }

  if (platform === "copilot" || platform === "both") {
    console.log(`     What you got (GitHub Copilot):`);
    console.log(`       • .github/agents/            — 13 agent profiles`);
    console.log(`       • .github/hooks/             — Session hooks`);
    console.log(`       • .github/workflows/         — Copilot setup steps`);
  }

  if (platform === "opencode" || platform === "both") {
    console.log(`\n     Next steps (OpenCode):`);
    console.log(`       cd ${targetDir}`);
    console.log(`       opencode`);
  }

  if (platform === "copilot" || platform === "both") {
    console.log(`\n     Next steps (GitHub Copilot):`);
    console.log(`       1. Open https://github.com/copilot/agents`);
    console.log(`       2. Select your repository and use @mention agents`);
  }
}
