#!/usr/bin/env node

import { Command } from 'commander';
import { init } from './commands/init.mjs';

const program = new Command();

program
  .name('agent-kit')
  .description('AI Agent KIT — install agent system for OpenCode & GitHub Copilot')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize .opencode/ configuration in current project')
  .option('-f, --force', 'Overwrite existing files without prompt')
  .option('-d, --dir <path>', 'Target project directory', process.cwd())
  .option('--skip-install', 'Skip npm/bun install step in .opencode/')
  .action(init);

program.parse();
