---
version: 1.0
name: "Rustzen Zen Blue Glass"
description: "Repository-owned shared visual semantics for the Rustzen public site and console"
---

## Overview

- This is the sole shared visual-semantic authority for `apps/site` and `apps/console`.
- Source identity: the shipped Zen Blue Glass site and console adapters at revision `ec6489255a26ff5eddd591ef34231e2837338555`.
- Approval: Daibin, 2026-07-25. Rights: repository-owned. Use the shared brand, safety, density, and component semantics; ignore stale route plans and historical implementation snapshots.
- Product behavior, routes, data, permissions, and API acceptance remain owned by application source and product contracts.

## Colors

- The shared brand scale runs from quiet blue-white surfaces to strong blue interactive emphasis. `brand-400` is for ambient and surface treatment; `brand-600` is the default accessible link and primary-action emphasis on light surfaces.
- Status semantics use `safe`, `caution`, and `danger`. Status labels and icons must accompany color; implementation-specific names such as success, warning, or destructive must map to these roles rather than define another palette.
- Site and console CSS are implementation adapters. Each adapter must bind the same semantic roles, while framework-only aliases may remain local.

## Typography

- Use the system SF/PingFang stack for interface and body text and the repository monospace stack for identifiers, keys, paths, and versions.
- Marketing display treatment may use the existing Atkinson fallback. Console body and controls remain compact and system-native.
- Use sentence case for actions and headings. Preserve product names, identifiers, and API paths exactly.

## Layout

- The public site owns responsive reading flow; the console owns a high-density shell, tables, forms, and persistent actions.
- Shells own page edges and global clipping, pages own task composition, panels own internal padding, and overlays own stacking and dismissal. Do not repeat the same spacing or scroll responsibility in parent and child.
- Use Flexbox for one-dimensional alignment and Grid for genuine row-and-column relationships. Long content and localized copy must wrap or scroll without hiding primary actions.

## Elevation & Depth

- Use the three Zen glass tiers for shared depth: navigation/shell, content panel, and subtle grouped surface. Border, blur, and shadow strength decrease through the tiers.
- Ambient gradients stay behind content and never reduce text contrast. Console dialogs use one shared overlay and panel composition.

## Shapes

- Controls use the compact shared radius, panels use the larger panel radius, and pills are reserved for tags, compact navigation, and status chips.
- Interactive targets retain visible focus and a practical target size; icon-only controls require an accessible name.

## Components

- Site `Button` owns primary, secondary, and ghost calls to action. `SafetyChip` owns safe, caution, and danger labels.
- Console `Badge` exposes the same safe, caution, and danger vocabulary. License and device status mapping has one owner and all table consumers reuse it.
- Console `DialogSurface` owns modal overlay, labeling, panel geometry, close affordance, and dismissal. Create, edit, and confirmation flows keep their business forms and actions local.
- The command palette is a specialized search overlay with its own input/list composition; it reuses shared overlay semantics but is not a form or confirmation dialog variant.
- Site and console components are not cross-framework source duplicates. Promote code to `packages/*` only after both applications have compatible live consumers.

## Naming & Placement

- Astro route files are lowercase and follow URL segments; Astro reusable component files use PascalCase.
- React/Next.js reusable component files use kebab-case and exported component symbols use PascalCase. Hooks use the `use-` filename prefix and `useX` symbols.
- Status roles use `safe`, `caution`, and `danger` everywhere. App-specific framework aliases must map to, not rename, those semantics.

## Do's and Don'ts

- Do link feature and application docs to this file instead of copying shared tokens or component semantics.
- Do verify the CSS adapter and at least one live consumer before claiming a semantic binding is current.
- Do not add a second design-system document, duplicated status mapping, or page-local modal shell.
- Do not treat a future route, generated output, or runtime screenshot as current product truth without source evidence.
