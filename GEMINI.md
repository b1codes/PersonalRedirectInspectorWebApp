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

### Technical Stack
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **UI Library:** Material UI (MUI) v5
- **Icons:** MUI Icons
- **Deployment:** GitHub Pages (via `gh-pages`)

---

## Building and Running

### Prerequisites
- Node.js (Latest LTS recommended)
- npm

### Key Commands
- `npm install`: Install project dependencies.
- `npm run dev`: Start the local development server (typically at `http://localhost:5173`).
- `npm run build`: Run TypeScript checks and build the production-ready application.
- `npm run preview`: Locally preview the production build.
- `npm run deploy`: Build and deploy the application to GitHub Pages.

---

## Development Conventions

### Architecture
- **Entry Point:** `index.tsx` contains the main `App` component and core state logic (history management, URL parsing, `localStorage` persistence).
- **Components:** Located in `src/components/`, focusing on modular UI elements (Header, Cards, Data Blocks).
- **Types:** Centralized in `src/types.ts` for consistent data structures across the app.
- **Hooks:** Custom hooks like `useCopyToClipboard.ts` are used for reusable logic.

### Coding Style & Patterns
- **Functional Components:** All components are written as functional components with React Hooks.
- **State Management:** Uses React `useState` and `useEffect` for local state, synchronized with `localStorage`.
- **Styling:** Primarily uses MUI's `sx` prop and styled components for layout and styling.
- **URL Handling:** Relies on the standard `URL` and `URLSearchParams` browser APIs for robust parsing.

### Contribution Guidelines
- Ensure all new features or fixes include appropriate TypeScript definitions.
- Maintain accessibility by using ARIA labels and semantic HTML, as seen in existing components (e.g., `RedirectCard`).
- Verify changes by running `npm run build` to catch any TypeScript or build-time errors.
