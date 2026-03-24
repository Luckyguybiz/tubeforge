# Final Decision: AI Thumbnails — Brand Colors & Style Tab Removal

**Task:** изменить цвета на наши тут /ai-thumbnails и убрать все стиль вкладки они не нужны
**Date:** 2026-03-24
**Status:** APPROVED — Ready for execution
**Decision round:** 3 (Final)

---

## 1. Decision Summary

**APPROVED for execution.** All team leads have issued conditional approval. No open blockers remain — residual risks are documented as post-deploy verification items only.

### CEO Request (verbatim)
> изменить цвета на наши тут https://tubeforge.co/ai-thumbnails и убрать все стиль вкладки они не нужны

### Scope
1. **Remove style tabs** — Delete `StyleId` type, `STYLE_KEYS` array, `chipStyle` function, style state, and style chips JSX from `AiThumbnailsPage.tsx`. Hardcode `'realistic'` as the default style on both client and server.
2. **Brand colors** — The page already uses LIME `#BFFF00` accent (lines 13-19 of `AiThumbnailsPage.tsx`). Verify these are the intended "наши" (our) brand colors for this page. No change needed if LIME is correct; if CEO means TubeForge indigo `#6366f1`, swap accordingly.

---

## 2. Team Lead Sign-offs

| Role | Lead | Status | Notes |
|------|------|--------|-------|
| Development | Dev Lead Макс | Conditional Approve | Blockers accepted: remove all dead `StyleId`/`STYLE_KEYS`/state/JSX, hardcode `'realistic'` on client+server |
| Design | Дизайнер Павел | Conditional Approve | Visual regression diff post-deploy |
| QA/QC | QA Кямран | Conditional Approve | Dead code removal, server-side default, brand color verification in both themes |
| DevSecOps | Щит | Conditional Approve | Server-side API route must default to `'realistic'` when no `style` param |
| DevSecOps | Vault | Conditional Approve | Same as Щит — server-side default |
| Operations | DevOps Антон | Conditional Approve | Will run `npm run build && pm2 restart tubeforge` post-merge |
| Planning | PM Сергей | Conditional Approve | All leads aligned, residual risks are post-deploy only |

---

## 3. Required Code Changes

### 3.1 Client-side: `src/views/AiThumbnails/AiThumbnailsPage.tsx`

| # | Change | Priority |
|---|--------|----------|
| C1 | Delete `type StyleId` declaration (line 22) | CRITICAL |
| C2 | Delete `STYLE_KEYS` array (lines 34-41) | CRITICAL |
| C3 | Delete `chipStyle` memoized function (lines 343-363) | CRITICAL |
| C4 | Remove `style` state: `const [style, setStyle] = useState<StyleId>('realistic')` | CRITICAL |
| C5 | Remove style chips JSX rendering block (lines 718-731) | CRITICAL |
| C6 | Remove `aithumbs.section.style` section label from left panel | CRITICAL |
| C7 | Hardcode `style: 'realistic'` in the generate mutation call | CRITICAL |
| C8 | Verify LIME `#BFFF00` accent constants are retained (lines 13-19) | HIGH |

### 3.2 Server-side: API route for AI thumbnails generation

| # | Change | Priority |
|---|--------|----------|
| S1 | Default `style` parameter to `'realistic'` when not provided in request | HIGH |
| S2 | Remove style validation against the full style list (optional, LOW) | LOW |

### 3.3 Locale files: `src/locales/{en,es,kk,ru}.json`

| # | Change | Priority |
|---|--------|----------|
| L1 | Remove `aithumbs.style.*` keys (realistic, anime, cinematic, 3d, minimalist, popart) | MEDIUM |
| L2 | Remove `aithumbs.section.style` key | MEDIUM |

---

## 4. Execution Plan

### Step 1: Code changes (Dev Lead Макс — implementation branch)
1. Remove all `StyleId`-related dead code from `AiThumbnailsPage.tsx` (C1-C7)
2. Hardcode `'realistic'` in generate mutation call (C7)
3. Add server-side default `style = 'realistic'` fallback (S1)
4. Clean up locale files (L1-L2)
5. Verify LIME accent colors are retained (C8)

### Step 2: QA verification (QA Кямран)
1. Run `npm run build` — confirm no TypeScript errors
2. Run lint — confirm no unused imports/variables from removed code
3. Manual smoke test on `/ai-thumbnails`:
   - Style tabs are NOT visible
   - Generation works with default realistic style
   - LIME `#BFFF00` accent is present on interactive elements
   - Both light and dark themes render correctly

### Step 3: Deploy (DevOps Антон)
```bash
cd /home/ubuntu/tubeforge-next && npm run build && pm2 restart tubeforge
```

### Step 4: Post-deploy verification
1. Visual regression diff — compare before/after screenshots
2. Orphaned API route check — confirm `/api/trpc/aiThumbnails.generate` accepts requests without `style` param
3. Monitor error logs for 30 minutes post-deploy

---

## 5. Residual Risks (Post-deploy only, NOT blockers)

| # | Risk | Mitigation | Owner |
|---|------|------------|-------|
| R1 | Visual regression in dark/light theme after style tab removal | Post-deploy screenshot comparison | Дизайнер Павел |
| R2 | Orphaned style-related code in other files | Grep for `StyleId`, `STYLE_KEYS`, `style.*realistic` post-merge | Dev Lead Макс |
| R3 | API callers sending non-realistic style values | Server defaults to `'realistic'`, no error thrown | DevSecOps Щит |

---

## 6. What is NOT changing

- No backend API changes to generation logic (fal.ai / DALL-E 3 pipeline unchanged)
- No changes to other pages or global theme
- No changes to plan limits or rate limiting
- No changes to prompt input, voice input, YT URL linking, photo upload, or CTR analysis
- Scanner animation, placeholder text, and other G1-G5 spec items from `ai-thumbnails-upgrade-spec.md` are **separate tasks** and not in scope for this CEO request

---

## 7. Rollback Plan

If issues are detected post-deploy:
1. Revert the merge commit on `main`
2. Redeploy: `npm run build && pm2 restart tubeforge`
3. Estimated rollback time: < 5 minutes

---

## 8. Final Approval

**Decision: PROCEED WITH EXECUTION**

All conditional approvals resolved. No new remediation subtasks opened. Residual risks are post-deploy verification items only.

Next action: Dev Lead Макс executes code changes per Section 3, followed by QA lint/build verification, then merge to main and deploy.
