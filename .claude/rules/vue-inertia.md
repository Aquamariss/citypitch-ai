---
description: Vue 3 Composition API + Inertia + TypeScript frontend conventions
alwaysApply: true
---

# Vue + Inertia

## Must use

- Vue 3 with `<script setup lang="ts">` and Composition API
- TypeScript for page and component code
- Inertia.js for UI data from Laravel (props / forms / visits)
- TailwindCSS for styling

## Must not

- Options API for new components or pages
- Blade as the primary UI for new features (Blade layout shell for Inertia is fine)
- Extra REST/JSON API endpoints only to feed the SPA UI — pass data through Inertia
- Falling back to Blade feature pages or a separate SPA when Inertia/Vue are not installed — ask to install the stack instead

## Controller shape (Inertia)

```
Form Request → Controller
                 ├─ Service / Repository (domain + data)
                 └─ Inertia::render(...) | redirect()
```

Keep controllers thin; business logic stays in services (see service-layer rule). Controllers own the Inertia response — never services or repositories.
