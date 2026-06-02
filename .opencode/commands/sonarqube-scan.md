# SonarQube Scan

Comprehensive SonarQube quality scan with automated fix delegation:

1. **Project Selection**: Ask user which SonarQube project to scan (question tool)

2. **Scan Mode** (default: full):
   - `full`: Issues + Security Hotspots + Duplications + Coverage + Dependencies + Quality Gate
   - `quick`: Issues only
   - `pr`: Issues + Security Hotspots on changed files

3. **Execute Full Scan**:
   - `search_my_sonarqube_projects` — list available projects
   - `get_quality_gate_status` — check overall quality gate
   - `get_component_measures` — get baseline metrics (ncloc, coverage, tech debt)
   - `search_sonar_issues_in_projects` — collect bugs, vulnerabilities, code smells
   - `search_security_hotspots` — collect security hotspots
   - `search_duplicated_files` + `get_duplications` — find code duplications
   - `search_files_by_coverage` + `get_file_coverage_details` — find low-coverage files
   - `search_dependency_risks` — find vulnerable dependencies

4. **Categorize Findings**:
   - Blocker/Critical: high priority (block merge)
   - Major: medium priority (should fix soon)
   - Minor/Info: low priority (nice to have)

5. **Create TODOs** (using `todowrite`):
   - Format: `SQ-{SEVERITY}-{NUMBER}: Fix [type] at [file:line] — [description]`
   - Priority: high for Blocker/Critical, medium for Major, low for Minor/Info

6. **Delegate Fixes** (by file type):
   - `*.vue`, Nuxt `*.ts` → `@frontend-nuxt`
   - `*.tsx`, Next.js `*.ts` → `@frontend-react`
   - Backend `*.ts`, `*.js` → `@backend`
   - `*.php` (CI3) → `@ci3`
   - `*.php` (Laravel) → `@laravel`
   - `*.kt`, `*.xml` (Android) → `@android`
   - `*.dart` (Flutter) → `@flutter`
   - DB queries → `@database`
   - Dependency vulns → `@devops` or `@backend`
   - Security hotspots → `@security-reviewer`

7. **Generate Report**:
   - Quality gate status
   - Summary by severity (table)
   - Summary by category (table)
   - Delegation status (table)
   - Recommendations

8. **Re-scan** (after fixes):
   - Re-run `search_sonar_issues_in_projects` for affected files
   - Verify issue count decreased
   - Update TODOs to completed

## Command Options

- `--project <key>` — target SonarQube project key
- `--severity <level>` — filter by severity (blocker, critical, major, minor, info)
- `--quick` — issues only, skip coverage/dependencies
- `--rescan` — re-verify previously delegated fixes

## SonarQube MCP Toolsets Required

The SonarQube MCP server needs these toolsets enabled via `SONARQUBE_TOOLSETS`:
`issues,security-hotspots,duplications,coverage,dependency-risks,quality-gates,measures,projects,rules`
