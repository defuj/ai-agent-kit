---
name: it-leader-orchestration
description: "Task decomposition, delegation protocol, and integration patterns for the IT Leader orchestrator agent"
version: 1.0.0
author: opencode-agent-kit
---

# IT Leader Orchestration

Use this skill when acting as the IT Leader (primary orchestrator) to break down complex requirements, delegate with clear contracts, and integrate subagent outputs.

## Phase 1: Requirements Analysis

Before any delegation, analyze the request:

1. **Identify stack** — Nuxt/Vue, React/Next, Node/Express, Laravel, CI3, Android, Flutter
2. **Define scope** — What's in scope, what's explicitly out of scope
3. **Identify dependencies** — Which tasks must be sequential vs parallel
4. **Risk assessment** — Auth, payments, PII, file upload → trigger `@security-reviewer`

## Phase 2: Task Decomposition

Break features into atomic tasks. Each task must be completable by ONE subagent.

### Task ID Convention
```
FE-001  → @frontend-nuxt or @frontend-react
BE-001  → @backend
CI-001  → @ci3
LA-001  → @laravel
DS-001  → @designer
DB-001  → @database
DO-001  → @devops
SEO-001 → @seo
AN-001  → @android
FL-001  → @flutter
SQ-001  → @sonarqube
RV-001  → @reviewer
```

### Task Card Format
```markdown
@{subagent} {ID}: {description}

Contract:
- Input: {API contracts, data models, existing patterns}
- Output: {files, behaviors, verification criteria}
- Constraints: {what NOT to do, files NOT to touch}
- Dependencies: {tasks that must complete first}
```

## Phase 3: Delegation Protocol

### Contract-First Rule
**Never delegate in parallel without a shared contract.** If two subagents need the same API schema, define it first and give both the same contract.

### Delegation Order
1. **Design first** — `@designer` before implementation when UX decisions are needed
2. **Database first** — `@database` when schema changes are needed
3. **Backend first** — API endpoints before frontend integration
4. **Frontend** — After backend contract is defined
5. **Review** — `@reviewer` or `@sonarqube` after implementation

### Prohibited Patterns
- ❌ Delegate 5 tasks simultaneously to 5 agents without contracts
- ❌ Let frontend and backend define the same API contract independently
- ❌ Skip security review on auth/payment flows
- ❌ Change requirements mid-delegation without re-contracting

## Phase 4: Integration & Verification

After all subagents complete:

1. **API contract alignment** — Frontend calls must match backend endpoints
2. **Data type compatibility** — TypeScript interfaces match DTOs
3. **Error handling consistency** — Both layers handle errors the same way
4. **Auth boundaries** — Protected routes enforced on both sides
5. **File path integrity** — No broken imports or missing files
6. **Test coverage** — At minimum: happy path + error path

### Integration Report Format
```markdown
## Integration Report
- {ID}: {verified / partially_verified / not_verified}
- API alignment: {pass/fail + notes}
- Type compatibility: {pass/fail + notes}
- Overall: {verified | partially_verified | not_verified}
```

## Phase 5: Operating Modes

### Fast Mode
- 1-2 subagents, minimal planning
- Direct delegation with short context
- Single integration check

### Balanced Mode (default)
- 2-4 subagents, medium complexity
- Full task breakdown
- API contract defined before parallel work
- Integration verification

### Thorough Mode
- 4+ subagents, cross-cutting features
- Architecture design document first
- Phased delegation (design → backend → frontend → review)
- Full integration testing
- Security review gate

## Pitfalls

- **Parallel schema drift**: Two subagents creating conflicting type definitions → Always define shared types in contract first
- **Silent scope creep**: Subagent adds features beyond task → Explicit "what NOT to do" in every delegation
- **Integration debt**: Subagents finish but don't connect → Reserve time for integration verification
- **Review bottleneck**: All code waiting for review → Trigger review per subagent, not all at end
