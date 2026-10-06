# StudyMate AI — UI improvements

## Where the UI comes from

StudyMate’s frontend is **React 18 + Vite + React Router**, with **Axios** and **react-markdown**. There is **no** Tailwind, shadcn/ui, MUI, Bootstrap, or other component library.

Visual styling lives in one hand-authored file: `frontend/src/index.css` (CSS variables + shared class names). There is no third-party UI template; the original look was a custom “cream paper + indigo + amber” theme using **Fraunces** and **Inter** from Google Fonts, with emoji in dashboard feature titles.

Existing screenshots under `/workspace/screenshots/` (and `media/ui-polish/*_before.png`) reflect that earlier look.

## What changed

**Visual direction:** cool mist backgrounds, deep teal brand, charcoal ink, soft gold accents — avoiding purple/indigo gradients, cream+terracotta serif defaults, and Inter/system body fonts.

| Area | Change |
|------|--------|
| Design tokens | New CSS variables (`--brand`, `--mist`, `--warm`, fonts, radius, shadow) |
| Typography | **Sora** (display/brand) + **Karla** (UI body) |
| Auth (Login/Register) | Full-bleed atmospheric hero; **StudyMate AI** as the dominant brand signal; form as the interaction surface; staggered enter motions |
| App shell | Light sticky navbar with logo mark; shorter nav labels; page enter animation |
| Dashboard | Clearer progress / tools sections; removed emoji; feature kickers; hover motion on stats & tools |
| Shared pages | Chat, quiz, flashcards, etc. inherit the new tokens (surfaces, focus rings, buttons) |
| Motion | Nav fade-in, auth brand/form rise, page enter, feature hover accent |

Layout still uses the existing class names and React patterns (`useState` / `useEffect`); no `useMemo`/`useCallback` added.

## How to review

```bash
cd frontend
npm install
npm run dev
```

1. Open **http://localhost:5173/login** — brand-first composition, responsive split → stack.
2. Open **/register** — same shell, signup form.
3. Sign in (needs backend + MongoDB) and check **Dashboard**, then **AI Chat** or another tool for spacing and mobile width (~375px).

### Demo media

| File | What it shows |
|------|----------------|
| [`media/ui-polish/login_before.png`](../media/ui-polish/login_before.png) | Prior login card on cream |
| [`media/ui-polish/dashboard_before.png`](../media/ui-polish/dashboard_before.png) | Prior indigo dashboard + emoji cards |
| [`media/ui-polish/chat_before.png`](../media/ui-polish/chat_before.png) | Prior chat UI |
| [`media/ui-polish/login_after.png`](../media/ui-polish/login_after.png) | New brand-first login |
| [`media/ui-polish/login_after_mobile.png`](../media/ui-polish/login_after_mobile.png) | Login at mobile width |
| [`media/ui-polish/register_after.png`](../media/ui-polish/register_after.png) | New register composition |

Branch: `cursor/ui-polish-93ef`  
PR: https://github.com/Naitik-bhardwaj/StudyMate-AI/pull/1
