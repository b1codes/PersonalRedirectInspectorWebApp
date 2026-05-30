# Guidelines for AI Developer Agents

This repository is built to work seamlessly with both human developers and autonomous AI developer agents (such as Antigravity, Claude Code, Cursor, and Copilot). To ensure stability, clean code, and fast delivery, all AI agents MUST adhere to the following rules and operational guidelines.

---

## 1. Repository Architecture

We operate as a **monorepo** with a clean division of concerns:

- **`/frontend` (Vite, React 18, TypeScript, MUI v5):**
  - Managed using **`pnpm`** (v11).
  - Main entry point: `frontend/index.tsx`.
  - Core styling relies on Material-UI's (`MUI`) `sx` prop and styled components. Do not introduce raw styling utilities or separate UI frameworks unless explicitly requested.
  - Custom hooks (e.g. `frontend/src/useCopyToClipboard.ts`) and centralized types (`frontend/src/types.ts`) are preferred.
- **`/backend` (FastAPI, Python, Serverless Mangum):**
  - Provides optional cloud saving and multi-user isolation using Auth0 JWT authentication.
  - Target database is AWS DynamoDB.
- **`/infra` (Terraform):**
  - Contains HashiCorp Terraform configuration for standing up AWS resources (API Gateway, Lambda, DynamoDB).
  - Build script `infra/build.sh` handles packaging and building the FastAPI backend for deployment.

---

## 2. Coding Principles

- **Unified Codebase Strategy:** Do not diverge codebase branches to achieve different environments (e.g. AWS backend vs local). All environment-specific behaviors MUST be controlled dynamically using environment configuration files (Vite `.env.*` variables like `VITE_SAVE_TO_CLOUD`).
- **No Placeholders:** When writing code, do not use placeholder comments like `// TODO: Implement later`. Implement complete, functional, and self-contained logic.
- **Documentation Integrity:** Preserve all existing comments and docstrings in the codebase unless they are specifically being replaced.

---

## 3. Workflow Checklist for AI Agents

Before declaring a task as "done," you must verify the following:

1. **Verify Builds:**
   - Execute `pnpm build` in the repository root to trigger TypeScript compilation and static asset building. Ensure it finishes with exit code `0`.
2. **Backend Syntax & Validation:**
   - Ensure all modified Python code passes compilation checks: `python -m py_compile backend/app/*.py`.
   - Run code formatter/linter checks (`black` and `ruff check` on `/backend`).
3. **Terraform Formatting:**
   - If changing infrastructure, format your changes: `terraform fmt` in `infra/` and run `terraform validate`.
4. **Update Logs / Guidelines:**
   - Update `GEMINI.md` and `CLAUDE.md` to reflect any new commands, structure changes, or state guidelines.

---

## 4. GitHub Actions Workflows

This repo runs continuous integration on every pull request. Your contributions must pass:
- **`frontend-ci`**: Verifies that the React client compiles and type-checks successfully.
- **`backend-ci`**: Formats with `black`, lints with `ruff`, and compiles the FastAPI application.
- **`infra-ci`**: Validates Terraform files in `/infra`.
