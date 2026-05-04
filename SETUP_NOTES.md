# Setup Notes — ServiceOps Scaffold

## What Was Created
This scaffold includes:
- Complete folder structure for a Next.js + TypeScript + Tailwind project
- Claude Code agents (main agents + sub-agents) in `.claude/agents/`
- Claude Code skills in `.claude/skills/`
- Claude Code rules in `.claude/rules/`
- TypeScript type placeholders in `src/types/`
- Config placeholders in `src/config/`
- Documentation system in `docs/`
- Feature specs in `specs/`
- Database schemas in `database-blueprint/`
- GHL integration docs in `integration-blueprint/`
- Workflow docs in `workflow-blueprint/`
- UI blueprints in `app-blueprint/`
- QA checklists in `qa/`
- Memory files in `memory/`
- Prompt library in `prompts/`
- Utility scripts in `scripts/`

## How to Open in Claude Code
```bash
cd serviceops-ghl-workorders
claude
```
Then read CLAUDE.md and MEMORY.md first before anything else.

## Suggested First Next Prompt
Read `NEXT_PROMPT.md` for the recommended next Claude Code prompt.

## How to Zip Manually (if zip script fails)
```bash
cd ..
zip -r serviceops-ghl-workorders-scaffold.zip serviceops-ghl-workorders/
```
Or on Windows:
```powershell
Compress-Archive -Path serviceops-ghl-workorders -DestinationPath serviceops-ghl-workorders-scaffold.zip
```

## Important Notes
- No production logic exists yet — all files are scaffolds/placeholders
- Do not deploy anything from this scaffold
- Follow the phased roadmap in ROADMAP.md
- Always read CLAUDE.md before starting a new build session
