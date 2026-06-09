#!/bin/bash
# Generate template/ directory from current project files for npm publish
# Usage: bash scripts/generate-template.sh
#
# This copies .opencode/ (agents, commands, skills, etc.) into template/
# so it can be shipped with the npm package. The template/ directory is
# gitignored — it's generated fresh before each publish.

set -euo pipefail

echo "→ Generating template/ for npm publish..."

# Clean slate
rm -rf template
mkdir -p template

# Copy .opencode/ — exclude node_modules (they get installed in target project)
echo "  Copying .opencode/ → template/.opencode/ ..."
mkdir -p template/.opencode
for dir in agents commands contexts docs hooks instructions plugins rules skills; do
  if [ -d ".opencode/$dir" ]; then
    cp -r ".opencode/$dir" "template/.opencode/$dir"
  fi
done

# Copy .opencode dotfiles
for f in .gitignore .agents.md; do
  if [ -f ".opencode/$f" ]; then
    cp ".opencode/$f" "template/.opencode/$f"
  fi
done

# Copy package.json (needed for `npm install` in target project)
if [ -f ".opencode/package.json" ]; then
  cp ".opencode/package.json" "template/.opencode/package.json"
fi

# Copy config files
echo "  Copying config files..."
cp opencode.json template/opencode.json
cp opencode.example.json template/opencode.example.json 2>/dev/null || true

# Count
echo ""
echo "  ✓ template/ generated!"
echo "    $(find template -type f | wc -l | tr -d ' ') files"
