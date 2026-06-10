---
name: sonarqube-triage
description: "SonarQube Quality Triage: MCP tool usage (issues, security-hotspots, quality-gates, duplications, coverage, measures), issue severity classification (Blocker/Critical/Major/Minor/Info), categorization by type (bug, vulnerability, code smell, security hotspot, debt), TODO creation format per issue, fix delegation routing (by file type to correct agent), re-scan verification workflow, quality gate assessment, coverage analysis."
---

# SonarQube Triage Skill

This skill defines the standard operating procedure for triaging SonarQube scan results — from MCP tool invocation through issue classification, TODO creation, fix delegation, and verification.

## 1. SonarQube MCP Tools Reference

### Issues Toolset
| Tool | Purpose | Parameters (Key) |
|------|---------|-------------------|
| `search_sonar_issues_in_projects` | Search bugs, vulnerabilities, code smells | `projectKeys`, `severities`, `types`, `resolved`, `ps`, `p` |
| `change_sonar_issue_status` | Transition issue lifecycle | `issue`, `status` (ACCEPT/WONT_FIX/FALSE_POSITIVE/TO_REVIEW) |
| `get_issue` | Single issue detail | `issue` (issue key) |

### Security Hotspots Toolset
| Tool | Purpose | Parameters (Key) |
|------|---------|-------------------|
| `search_security_hotspots` | Find hotspots needing review | `projectKey`, `status`, `resolution`, `ps`, `p` |
| `change_security_hotspot_review_status` | Update hotspot status | `hotspot`, `status` (TO_REVIEW/REVIEWED/FIXED/SAFE) |

### Duplications Toolset
| Tool | Purpose | Parameters (Key) |
|------|---------|-------------------|
| `search_duplicated_files` | Find files with duplication | `projectKey`, `ps`, `p` |
| `get_duplications` | Get duplication blocks for a file | `key` (file key), `project` |

### Coverage Toolset
| Tool | Purpose | Parameters (Key) |
|------|---------|-------------------|
| `search_files_by_coverage` | Files below coverage threshold | `projectKey`, `coverageThreshold`, `ps`, `p` |
| `get_file_coverage_details` | Per-file coverage breakdown | `componentKey`, `project` |

### Dependency Risks Toolset
| Tool | Purpose | Parameters (Key) |
|------|---------|-------------------|
| `search_dependency_risks` | Vulnerable/outdated deps | `projectKey`, `ps`, `p` |

### Quality Gates Toolset
| Tool | Purpose | Parameters (Key) |
|------|---------|-------------------|
| `get_quality_gate_status` | Overall gate PASS/FAIL | `projectKey` |

### Measures Toolset
| Tool | Purpose | Parameters (Key) |
|------|---------|-------------------|
| `get_component_measures` | Quantitative metrics | `component`, `metricKeys` (comma-separated), `project` |

### Projects Toolset
| Tool | Purpose | Parameters (Key) |
|------|---------|-------------------|
| `search_my_sonarqube_projects` | List accessible projects | _(none)_ |

### Analysis Toolset
| Tool | Purpose | Parameters (Key) |
|------|---------|-------------------|
| `get_analysis` | Analysis metadata | `project`, `branch` |

## 2. Issue Severity Classification

| Severity | Priority | Merge Block | Response SLA | Color Code |
|----------|----------|-------------|--------------|------------|
| **Blocker** | P0 — Immediate | YES — blocks merge | Fix within 1 hour | 🔴 Red |
| **Critical** | P1 — High | YES — blocks merge | Fix within 4 hours | 🟠 Orange |
| **Major** | P2 — Medium | NO — strong recommend | Fix within 1 sprint | 🟡 Yellow |
| **Minor** | P3 — Low | NO | Backlog / next sprint | 🔵 Blue |
| **Info** | P4 — Optional | NO | Triage as time permits | ⚪ Gray |

### Severity-to-Action Mapping

```
Blocker  -> MUST FIX before any merge. Escalate to IT Leader if no subagent available.
Critical -> MUST FIX before merge. Delegate immediately.
Major    -> SHOULD FIX. Create TODO with medium priority.
Minor    -> COULD FIX. Create TODO with low priority.
Info     -> Log and deprioritise unless it compounds with other findings.
```

## 3. Categorization by Type

| Type | SonarQube Internal Key | Description | Delegation Target |
|------|------------------------|-------------|-------------------|
| **Bug** | `BUG` | Runtime error, logic flaw, null pointer, resource leak | Domain subagent by file type |
| **Vulnerability** | `VULNERABILITY` | Security weakness (SQLi, XSS, CSRF, injection) | `@security-reviewer` or domain subagent |
| **Code Smell** | `CODE_SMELL` | Maintainability debt, readability, complexity | Domain subagent by file type |
| **Security Hotspot** | `SECURITY_HOTSPOT` | Sensitive code needing security review (not confirmed vuln) | `@security-reviewer` |
| **Debt (Technical)** | _(derived from measures)_ | Estimated effort to fix all code smells | Aggregated in report |
| **Duplication** | _(duplications tool)_ | Repeated code blocks across files | Domain subagent by file type |
| **Low Coverage** | _(coverage tool)_ | Insufficient test coverage | Domain subagent by file type |
| **Dependency Risk** | _(dependency tool)_ | Outdated/vulnerable packages | `@devops` or `@backend` |

### Type-to-TODO Tag Mapping

| Type | TODO Tag | Icon |
|------|----------|------|
| Bug | `type:bug` | 🐛 |
| Vulnerability | `type:vulnerability` | 🛡️ |
| Code Smell | `type:code-smell` | 🧹 |
| Security Hotspot | `type:security-hotspot` | 🔒 |
| Duplication | `type:duplication` | 📋 |
| Coverage Gap | `type:coverage` | 📊 |
| Dependency Risk | `type:dependency` | 📦 |

## 4. TODO Creation Format Per Issue

Each SonarQube finding generates a structured TODO using `todowrite` with this canonical format:

```
SQ-{SEVERITY}-{NNN}: Fix [{type}] at {file}:{line} — {short message}
```

### Format Rules

- **Prefix**: `SQ-` followed by severity abbreviation (`BLK`, `CRIT`, `MAJ`, `MIN`, `INFO`)
- **Number**: Zero-padded 3-digit sequential (001, 002...)
- **Type**: Short label in square brackets (Bug, Vulnerability, CodeSmell, Hotspot, Duplication, Coverage, Dependency)
- **Location**: `{file}:{line}` for single-line issues; `{file}` for file-scoped issues
- **Message**: Truncated first ~80 chars of the SonarQube issue message
- **Priority**: Mapped from severity (high/medium/low)

### Examples

```
SQ-BLK-001: Fix [Bug] at src/auth/login.ts:42 — NullPointerException when user object is null → priority: high
SQ-CRIT-001: Fix [Vulnerability] at src/api/users.ts:88 — SQL injection via concatenated query → priority: high
SQ-MAJ-001: Fix [CodeSmell] at src/components/Table.vue:310 — Cognitive complexity 22 > allowed 15 → priority: medium
SQ-MIN-001: Fix [CodeSmell] at src/utils/format.ts:15 — Unused function parameter 'options' → priority: low
SQ-INFO-001: Fix [CodeSmell] at src/config.ts:1 — Missing file header comment → priority: low
```

### Security Hotspot TODO Format

```
SQ-HOTSPOT-001: Review [Hotspot] at {file}:{line} — {short message} → priority: high
```

### Duplication TODO Format

```
SQ-DUP-001: Refactor [Duplication] in {file} — {n} blocks duplicated across {files} → priority: medium
```

### Coverage TODO Format

```
SQ-COV-001: Improve [Coverage] in {file}.ts — current: {n}%, target: 80%+ → priority: medium
```

### Dependency TODO Format

```
SQ-DEP-001: Update [Dependency] — {package} ({version}) has {n} known vulnerabilities → priority: high
```

### Full `todowrite` Arguments

| Field | Value |
|-------|-------|
| `name` | `SQ-{SEVERITY}-{NNN}` |
| `description` | Full multiline description including file path, line number, SonarQube rule key, and original message |
| `priority` | `high` for Blocker/Critical, `medium` for Major, `low` for Minor/Info |
| `tags` | Always include `sonarqube`, `sq-{severity-lower}`, and `type:{categorization}` |

## 5. Fix Delegation Routing (by File Type)

Route each TODO to the correct subagent based on file extension and technology context.

### Lookup Table

| File Pattern | Technology Context | Subagent | Notes |
|---|---|---|---|
| `*.vue` | Nuxt/Vue | `@frontend-nuxt` | Components, pages, layouts, composables |
| `*.ts` in `app/` or Nuxt project | Nuxt/TypeScript | `@frontend-nuxt` | Includes composables, middleware, plugins, stores |
| `*.tsx`, `*.jsx` | React/Next.js | `@frontend-react` | Components, pages, hooks |
| `*.ts` in Next.js project | Next.js/TypeScript | `@frontend-react` | API routes, utils, config |
| `*.controller.ts`, `*.route.ts`, `*.middleware.ts`, `*.dto.ts` | Node.js backend | `@backend` | Express/NestJS controller layer |
| `*.service.ts`, `*.repository.ts` | Node.js backend | `@backend` | Business logic, data access |
| `*.php` (CI3 — `application/`, `system/`) | CodeIgniter 3 | `@ci3` | Models, controllers, views, helpers |
| `*.php` (Laravel — `app/`, `resources/`) | Laravel | `@laravel` | Eloquent models, controllers, jobs |
| `*.kt` | Android/Kotlin | `@android` | Activities, fragments, ViewModels, Compose |
| `*.xml` (Android — `res/layout/`, `AndroidManifest.xml`) | Android | `@android` | Layouts, resources, manifest |
| `*.dart` | Flutter/Dart | `@flutter` | Widgets, models, services, providers |
| `*.sql`, SQL migration files | Database | `@database` | Queries, migrations, seeders |
| `*.py` | Python | `@python` or `@backend` | Python/Django/Flask code |
| `*.java` (Spring Boot) | Spring Boot | `@springboot` | Controllers, services, entities, config |
| `Dockerfile`, `docker-compose.yml` | Docker | `@devops` | Container configuration |
| `package.json`, `pom.xml`, `build.gradle` | Dependency risks | `@devops` or `@backend` | Outdated/vulnerable packages |
| `*.yml`, `*.yaml` (CI/CD) | CI/CD pipelines | `@devops` | GitHub Actions, GitLab CI, Jenkins |
| Security hotspots (any file) | Security | `@security-reviewer` | Must always route here |
| Multiple file types | Cross-cutting | `@it-leader` | Escalate if uncertain |

### Delegation Protocol

When delegating, use this structured message:

```
@{subagent} Task SQ-{SEVERITY}-{NNN}: Fix SonarQube {type}

Issue:
- SonarQube Issue Key: {key}
- Type: {BUG|VULNERABILITY|CODE_SMELL|SECURITY_HOTSPOT}
- Severity: {blocker|critical|major|minor|info}
- File: {file_path}:{line}
- Message: "{original_message}"
- Rule: {rule_key} — {rule_description}

Context:
- {2-3 lines of surrounding code context}
- {relevant architectural patterns}

Requirements:
- {specific fix instructions}
- Do NOT introduce new SonarQube issues
- Maintain existing coding style

Expected:
- Modified file: {file_path}
- Verification: re-scan should show issue resolved
```

## 6. Re-Scan Verification Workflow

After subagents report fixes applied, execute the verification loop:

### Phase 1: Re-Scan

```
1. search_sonar_issues_in_projects
   - projectKeys: {project_key}
   - Focus on previously-affected files (filter by file path if MCP supports)
2. search_security_hotspots (if applicable)
3. get_quality_gate_status — check updated gate state
```

### Phase 2: Compare Results

| Previous State | Current State | Action |
|----------------|---------------|--------|
| Issue present | Issue absent | Mark TODO as `completed`, close in SonarQube |
| Issue present | Same issue severity | Re-delegate to subagent with additional context |
| Issue present | Downgraded severity | Note improvement, re-delegate if still actionable |
| Issue present | New issue on same file | Flag regression, alert subagent |

### Phase 3: Status Update

```
For each TODO SQ-{SEVERITY}-{NNN}:
  If re-scan shows issue RESOLVED  -> todowrite update: status = completed
  If re-scan shows issue PRESENT   -> todowrite update: status = in_progress, add re-scan note
  If re-scan shows issue INTRODUCED -> create new TODO, flag to subagent
```

### Phase 4: Issue Lifecycle Transition

```
After verification:
- Change SonarQube issue status to ACCEPT (if verified fixed)
- Or change to FALSE_POSITIVE (if determined invalid)
- Or change to WONT_FIX (if accepted permanently)
- Or keep TO_REVIEW for security hotspots pending review
```

## 7. Quality Gate Assessment

### Gate Polling

Use `get_quality_gate_status` to retrieve:

| Field | Meaning |
|-------|---------|
| `status` | `OK` (PASSED) or `ERROR` (FAILED) |
| `conditions` | Array of gate conditions with metric, operator, value, status |

### Common Quality Gate Conditions

| Metric Key | Condition | Typical Threshold |
|------------|-----------|-------------------|
| `new_coverage` | `<` | 80% |
| `new_duplicated_lines_density` | `>` | 3% |
| `new_code_smells` | `>` | 0 |
| `new_vulnerabilities` | `>` | 0 |
| `new_bugs` | `>` | 0 |
| `new_security_hotspots_reviewed` | `<` | 100% |
| `coverage` | `<` | 80% |
| `duplicated_lines_density` | `>` | 3% |
| `code_smells` | `>` | 0 (soft) |
| `security_rating` | `>` | 1 (A) |
| `reliability_rating` | `>` | 1 (A) |
| `maintainability_rating` | `>` | 1 (A) |

### Assessment Report Template

```
## Quality Gate Assessment

### Overall Status
- Quality Gate: {PASSED ✅ | FAILED ❌}
- Date: {ISO datetime}

### Failing Conditions
| Condition | Metric | Actual | Threshold | Status |
|-----------|--------|--------|-----------|--------|
| {n} | {metric_key} | {value} | {operator} {threshold} | ❌ FAIL |

### Passing Conditions
| Condition | Metric | Actual | Threshold | Status |
|-----------|--------|--------|-----------|--------|
| {n} | {metric_key} | {value} | {operator} {threshold} | ✅ PASS |

### Summary
- **{n} conditions** of {total} failing
- **Merge blocked**: {YES | NO}
- **Required fixes**: {list of conditions to resolve to pass gate}
```

### Gate Resolution Path

```
For each FAILING condition:
1. Identify root cause (via issues search filtered by relevant type)
2. Create TODOs for all contributing issues
3. Delegate to appropriate subagents
4. After fixes applied, re-poll `get_quality_gate_status`
5. Repeat until ALL conditions pass OR exception granted by IT Leader
```

## 8. Coverage Analysis

### Coverage Retrieval

```
Step 1: get_component_measures
  - component: {project_key}
  - metricKeys: coverage, line_coverage, branch_coverage, uncovered_lines, uncovered_conditions

Step 2: search_files_by_coverage
  - projectKey: {project_key}
  - coverageThreshold: 80 (or project-specific target)

Step 3: For each low-coverage file:
  get_file_coverage_details
    - componentKey: {file_key}
    - project: {project_key}
```

### Coverage Metrics Reference

| Metric Key | Description | Target |
|------------|-------------|--------|
| `coverage` | Overall line + branch coverage | ≥ 80% |
| `line_coverage` | Lines covered / total lines | ≥ 80% |
| `branch_coverage` | Branches covered / total branches | ≥ 80% |
| `uncovered_lines` | Lines not covered by tests | 0 (ideal) |
| `uncovered_conditions` | Branches not tested | 0 (ideal) |
| `lines_to_cover` | Total lines eligible for coverage | — |
| `new_coverage` | Coverage on new/changed code | ≥ 80% |

### Coverage Triage Decision Tree

```
Is file coverage < 80%?
├─ YES → Is it a critical file (auth, payment, API, security)?
│        ├─ YES → SQ-COV-XXX: priority high — delegate to domain subagent
│        └─ NO  → SQ-COV-XXX: priority medium — delegate to domain subagent
└─ NO  → Check uncovered lines/conditions
         └─ Any critical paths uncovered?
              ├─ YES → SQ-COV-XXX: priority medium
              └─ NO  → Log in coverage report, no TODO needed
```

### Coverage Improvement TODO Format

```
SQ-COV-{NNN}: Improve [Coverage] in {file}
- Current coverage: {n}%
- Target: 80%+
- Uncovered lines: {list of line numbers}
- Uncovered conditions: {condition locations}
- Test framework: {jest|pytest|phpunit|flutter_test|kotlin_test}
- Priority: {high|medium|low}
```

## 9. YAML Frontmatter Reference

This document's frontmatter fields:

```yaml
name: sonarqube-triage
description: >-
  SonarQube Quality Triage: MCP tool usage (issues, security-hotspots,
  quality-gates, duplications, coverage, measures), issue severity classification
  (Blocker/Critical/Major/Minor/Info), categorization by type (bug, vulnerability,
  code smell, security hotspot, debt), TODO creation format per issue, fix delegation
  routing (by file type to correct agent), re-scan verification workflow, quality gate
  assessment, coverage analysis.
```

### Extending This Skill

To extend, add a new section following the pattern:

1. **Section header** (`## {N}. {Title}`)
2. **Reference tables** where applicable
3. **Decision trees** or **flow diagrams** (ASCII art)
4. **Canonical format** for any TODOs or messages produced
5. **Examples** showing real usage patterns
