## gstack

This project uses gstack for AI-assisted work in Codex.

Use `/gstack-browse` for all web browsing, page inspection, screenshots, and UI flow checks.

This machine currently uses the prefixed gstack command set. Prefer `/gstack-*` commands such as:
- `/gstack-office-hours`
- `/gstack-plan-ceo-review`
- `/gstack-plan-eng-review`
- `/gstack-review`
- `/gstack-browse`
- `/gstack-qa`
- `/gstack-ship`
- `/gstack-cso`

If the local gstack install is later switched to no-prefix mode, update these command names accordingly.

## Skill routing

When the user's request matches an available gstack skill, invoke it instead of handling the task as a generic freeform request.

Key routing rules:
- Product ideas, brainstorming, feature framing -> `/gstack-office-hours`
- Strategy, scope, prioritization -> `/gstack-plan-ceo-review`
- Architecture, implementation planning, edge cases -> `/gstack-plan-eng-review`
- End-to-end reviewed planning flow -> `/gstack-autoplan`
- Bugs, failures, unclear regressions -> `/gstack-investigate`
- Code review, diff review, pre-merge checks -> `/gstack-review`
- Browser validation, screenshots, interactive flow checks -> `/gstack-browse`
- QA, regression testing, site behavior verification -> `/gstack-qa` or `/gstack-qa-only`
- Security review -> `/gstack-cso`
- Shipping, PR prep, release checks -> `/gstack-ship` or `/gstack-land-and-deploy`
- Save working context -> `/gstack-context-save`
- Resume prior context -> `/gstack-context-restore`

Default workflow:
`idea -> /gstack-office-hours -> /gstack-plan-ceo-review or /gstack-plan-eng-review -> implement -> /gstack-review -> /gstack-qa or /gstack-browse -> /gstack-ship`
