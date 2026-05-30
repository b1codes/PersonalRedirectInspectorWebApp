# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Commands should be run from the repository root:

```bash
pnpm install       # Install dependencies for all workspaces
pnpm dev           # Start frontend dev server
pnpm build         # TypeScript check + production build for frontend
pnpm preview       # Preview production build locally
pnpm deploy        # Build and deploy frontend to GitHub Pages
pnpm backend:build # Compile backend Lambda code
```

To run commands inside specific packages:
```bash
# Frontend (pnpm)
cd frontend
pnpm dev
pnpm build

# Backend (pnpm)
cd backend
pnpm build
```

There is no test suite in this project. Use `pnpm build` to catch TypeScript and build-time errors.

## Architecture

This is a **monorepo** containing three subdirectories:
1. `frontend/` — Purely client-side React + TypeScript + Vite app. All state is stored in `localStorage`; there is no backend on the `main` branch (a full-stack AWS version exists on the `aws-deployment` branch).
2. `backend/` — AWS Lambda function written in TypeScript for cloud saving option (e.g. AWS + DynamoDB).
3. `infra/` — Location for infrastructure-as-code files.

### Frontend Details
- **Entry point:** `frontend/index.tsx` contains the `App` component, all core state, and the `ReactDOM.createRoot` call.
- **`frontend/src/` structure:**
  - `types.ts` — shared `RedirectData` and `KeyValue` interfaces
  - `useCopyToClipboard.ts` — custom hook for clipboard operations
  - `components/` — React UI components (AppHeader, RedirectCard, DataBlock, ParamsGrid, HeaderBanner)
- **Routing/base path:** Vite is configured with `base: './'`. The `@` alias resolves to the `/frontend/` root.

### Backend Details
- **Entry point:** `backend/lambda-redirect-handler.ts` contains the Lambda function handler that processes requests and saves logs to a DynamoDB table.
