# GEMINI.md

## Project Overview
**Redirect URI Inspector** is a client-side web application designed to help developers inspect and parse data passed via URLs, such as query parameters and URL fragments (hashes). It is particularly useful for debugging OAuth 2.0 flows, SAML assertions, and other redirect-based integrations.

### Core Features
- **URL Parsing:** Automatically extracts query parameters and fragments from the current or a specified URL.
- **Automated Inspection:** Monitors the browser's URL and logs changes.
- **Manual Inspection:** Allows users to input any URL for immediate analysis.
- **Default Monitored URL:** Users can set a persistent URL to be inspected if the application's own URL is "plain" (no params/fragment).
- **History Tracking:** Stores a history of unique inspected URLs in `localStorage`.
- **Data Export:** Provides "Copy to Clipboard" functionality for full URLs, parsed query parameters (as JSON), and fragments.

### Monorepo Architecture
The project is organized as a monorepo with three core workspaces:
1. **/frontend:** React 18, TypeScript, Vite SPA, MUI v5. Migrated to `pnpm`.
2. **/backend:** AWS Lambda function handler (`lambda-redirect-handler.ts`) in TypeScript.
3. **/infra:** Pre-configured directory for infrastructure-as-code files.

---

## Building and Running

### Prerequisites
- Node.js (Latest LTS recommended)
- pnpm (v11 recommended)

### Key Commands (from repository root)
- `pnpm install`: Install dependencies for all workspaces.
- `pnpm dev`: Start the frontend development server (typically at `http://localhost:5173`).
- `pnpm build`: Run TypeScript checks and build the production-ready frontend bundle.
- `pnpm preview`: Locally preview the production build.
- `pnpm deploy`: Build and deploy the frontend application to GitHub Pages.
- `pnpm backend:build`: Compile and typecheck backend/Lambda code.

---

## Development Conventions

### Frontend Architecture
- **Entry Point:** `frontend/index.tsx` contains the main `App` component and core state logic (history management, URL parsing, `localStorage` persistence).
- **Components:** Located in `frontend/src/components/`, focusing on modular UI elements (Header, Cards, Data Blocks).
- **Types:** Centralized in `frontend/src/types.ts` for consistent data structures across the app.
- **Hooks:** Custom hooks like `frontend/src/useCopyToClipboard.ts` are used for reusable logic.
- **Vite Alias:** The `@` path alias resolves to `/frontend/` root.

### Coding Style & Patterns
- **Functional Components:** All components are written as functional components with React Hooks.
- **State Management:** Uses React `useState` and `useEffect` for local state, synchronized with `localStorage`.
- **Styling:** Primarily uses MUI's `sx` prop and styled components for layout and styling.
- **URL Handling:** Relies on the standard `URL` and `URLSearchParams` browser APIs for robust parsing.

### Contribution Guidelines
- Ensure all new features or fixes include appropriate TypeScript definitions.
- Maintain accessibility by using ARIA labels and semantic HTML, as seen in existing components (e.g., `RedirectCard`).
- Verify changes by running `pnpm build` in root to catch any TypeScript or build-time errors.
- Ensure all CI workflow checks pass before merging pull requests. Refer to `.github/DEVELOPER_AGENTS.md` for guidelines if you are an AI coding assistant.
