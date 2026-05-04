# Manual Test Plan

## Instructions
Complete this plan before each phase release.
Check off each item manually or via automated test.

## Phase 1: Dashboard Shell
- [ ] Navigation renders on desktop
- [ ] Navigation renders on mobile
- [ ] All placeholder pages load without error
- [ ] No TypeScript errors
- [ ] No console errors in browser

## Phase 2: Work Orders
- [ ] Create work order successfully
- [ ] Status changes work correctly
- [ ] Assign technician works
- [ ] Work order links to property
- [ ] Validation rejects invalid input

## Phase 4: Technician Mobile
- [ ] Today's jobs load on iPhone
- [ ] Today's jobs load on Android
- [ ] Checklist items can be checked
- [ ] Notes can be entered
- [ ] Complete button works
- [ ] Estimate flag button works

## Phase 5: GHL Webhooks
- [ ] Webhook endpoint accepts POST
- [ ] Invalid signature returns 401
- [ ] Valid payload creates work order
- [ ] Duplicate payload is idempotent
