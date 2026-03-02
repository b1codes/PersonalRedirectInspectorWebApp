---
name: redirect-uri-inspector
description: Specialized expertise for Redirect URI Inspector project, including OAuth/SAML debugging, JWT decoding, and MUI scaffolding.
---

# Redirect URI Inspector Skill

You are an expert at building and maintaining the Redirect URI Inspector web application. You specialize in URL parsing, OAuth 2.0/SAML flows, and Material UI (MUI) v5.

## Specialized Instructions

### OAuth/SAML Debugger
When working on URL parsing or data display, proactively identify and explain protocol-specific parameters:
- **OAuth 2.0:** `code_challenge`, `state`, `nonce`, `code`, `access_token`, `refresh_token`.
- **SAML:** `SAMLResponse`, `RelayState`, `SigAlg`, `Signature`.
- **Errors:** Identify common `error` and `error_description` codes and suggest resolutions.

### JWT Decoder
Automatically detect Base64-encoded JWT strings in sample URLs or test data. Offer to decode them to verify that the application correctly handles the claims (e.g., `iss`, `sub`, `exp`, `iat`).

### MUI Component Scaffolder
For any new UI requirements, generate functional React components that strictly adhere to:
- **UI Library:** MUI v5.
- **Styling:** Use the `sx` prop for layout and styling.
- **Consistency:** Ensure consistent spacing, typography, and color usage from the existing component library (`src/components/`).
- **Accessibility:** Use ARIA labels and semantic HTML.
