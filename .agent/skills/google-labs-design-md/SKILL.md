---
name: google-labs-design-md
description: A format specification and toolkit for describing visual identities to coding agents. DESIGN.md gives agents a persistent, structured understanding of a design system.
---

# Google Labs DESIGN.md

This skill provides support for the `DESIGN.md` format, which combines machine-readable design tokens (YAML) with human-readable design rationale (Markdown).

## Core Capabilities

1.  **Understand Design Systems**: I can read and interpret `DESIGN.md` files to generate consistent UI components that follow your brand's colors, typography, and spacing.
2.  **Validation**: Use `npx @google/design.md lint <file>` to check for structural correctness, broken token references, and accessibility (WCAG contrast ratios).
3.  **Comparison**: Use `npx @google/design.md diff <before> <after>` to detect token-level and prose regressions between design versions.
4.  **Export**: Use `npx @google/design.md export --format <tailwind|dtcg> <file>` to convert tokens to Tailwind theme configs or W3C Design Tokens.
5.  **Specification**: Use `npx @google/design.md spec` to output the full format specification.

## How to use DESIGN.md

Create a `DESIGN.md` file in your project root with the following structure:

```md
---
name: My Brand
colors:
  primary: "#1A1C1E"
  secondary: "#6C7278"
typography:
  h1:
    fontFamily: Inter
    fontSize: 2.5rem
---

## Overview
A clean, modern professional aesthetic.

## Colors
- **Primary (#1A1C1E):** Core text and headlines.
- **Secondary (#6C7278):** Supporting elements and borders.
```

## Additional Skills Included
- **tdd**: Test-Driven Development guidelines.
- **agent-dx-cli-scale**: Evaluation of CLI tools for AI friendliness.
- **typed-service-contracts**: Guidelines for building typed service contracts.
- **ink**: Design components/logic related to the Ink system (if applicable).
