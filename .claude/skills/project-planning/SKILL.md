---
description: Use when planning new modules, phases, roadmap items, or feature requirements. This skill guides Claude through structured planning before any code is written.
---

# Skill: Project Planning

## When to Use
- Starting a new build phase
- Planning a new module
- Reviewing roadmap and priorities
- Writing a feature spec
- After a major decision that changes direction

## Steps Claude Should Follow

1. **Read context first**
   - Read CLAUDE.md
   - Read MEMORY.md
   - Read relevant docs/ files
   - Read relevant specs/ files

2. **Confirm current state**
   - What phase are we in?
   - What has been completed?
   - What is next?

3. **Plan the module/phase**
   - Define what will be built
   - Define what will NOT be built
   - Identify dependencies
   - Identify risks
   - Write or update spec in specs/

4. **Document decisions**
   - Update memory/product-decisions.md if applicable
   - Update MEMORY.md if state changed
   - Update ROADMAP.md if phase changed

5. **Confirm before proceeding**
   - Present plan to user
   - Wait for confirmation before starting to code

## Output Checklist
- [ ] Plan clearly defines scope
- [ ] Plan defines what is NOT included
- [ ] Dependencies identified
- [ ] Relevant spec file updated
- [ ] MEMORY.md updated if needed

## Mistakes to Avoid
- Starting to code before planning is confirmed
- Expanding scope without explicit approval
- Skipping spec creation for a new feature
- Ignoring existing memory and doc files
