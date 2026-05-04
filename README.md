# ServiceOps Command Center

> ⚠️ **This is a scaffold only. Not production-ready. Do not deploy.**

A GHL-integrated work order and field operations SaaS — built first for Showtime Pool Service, designed to become a white-label Jobber-style add-on for local service businesses using GoHighLevel.

## What This Is
ServiceOps Command Center handles the **operations layer** after a lead is qualified, booked, or won inside GHL. It is not a CRM replacement.

GHL handles: CRM, conversations, forms, pipelines, calendars, SMS/email.
ServiceOps handles: work orders, property profiles, technician jobs, checklists, photos, notes, completion reports.

## How to Install (Future)
```bash
npm install
cp .env.example .env
# Fill in .env values
npm run dev
```

## How to Run (Future)
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run typecheck  # TypeScript check
npm run lint       # Lint check
```

## Folder Structure
```
serviceops-ghl-workorders/
├── CLAUDE.md               # Claude Code instructions
├── MEMORY.md               # Project memory index
├── PRODUCT_BRIEF.md        # Product overview
├── ROADMAP.md              # Phase-by-phase roadmap
├── src/                    # Application source
│   ├── app/                # Next.js App Router pages + API
│   ├── components/         # React components
│   ├── lib/                # Utilities, GHL client, auth, DB
│   ├── types/              # TypeScript type definitions
│   ├── config/             # App configuration
│   └── styles/             # Global styles
├── docs/                   # Architecture and product docs
├── specs/                  # Feature specifications
├── database-blueprint/     # Schema design docs
├── integration-blueprint/  # GHL integration docs
├── workflow-blueprint/     # Business workflow docs
├── app-blueprint/          # UI page blueprints
├── prompts/                # Claude Code prompt library
├── memory/                 # Detailed memory files
├── qa/                     # QA checklists and test plans
├── scripts/                # Utility scripts
└── .claude/                # Claude Code agents, skills, rules
```

## How Claude Code Should Be Used
1. Always read `CLAUDE.md` and `MEMORY.md` first
2. Check the relevant `docs/` and `specs/` files before building
3. Use agents in `.claude/agents/` for specialized tasks
4. Use skills in `.claude/skills/` for implementation guidance
5. Never skip documentation — update `memory/` after decisions
6. Follow the build order in `ROADMAP.md`

## ⚠️ Important Warning
This scaffold is **not production-ready**. All TypeScript files are placeholders. No database is connected. No GHL credentials are wired. No authentication is implemented. Follow the phased roadmap before attempting to deploy.
