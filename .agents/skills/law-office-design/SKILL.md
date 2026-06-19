---
name: law-office-design
description: >-
  Use when the user asks about UI design, visual style, color tokens, layout patterns,
  or component design for the law office management application.
  Includes the project palette, reusable component patterns, spacing and card styles,
  and rules for light/dark mode and accessibility.
---

# Law Office Design System

This skill captures the UI/UX design language for the office management app.
Use it when building or reviewing pages, components, or modals in this project.

## Core Palette

- Primary background: `bg-white` / `dark:bg-slate-900`
- Surface cards and panels: `bg-white` / `dark:bg-slate-900`
- Borders: `border-slate-100` / `dark:border-slate-800`
- Text: `text-slate-900` / `dark:text-white`
- Secondary text: `text-slate-500` / `dark:text-slate-400`
- Accent success: `text-green-700` / `dark:text-green-400`, `bg-green-100` / `dark:bg-green-900/30`
- Accent warning/attention: `text-amber-700` / `dark:text-amber-400`, `bg-amber-100` / `dark:bg-amber-900/30`
- Danger actions: `text-red-600` / `dark:text-red-400`, `bg-red-50` / `dark:bg-red-900/30`
- Accent button / highlight: `bg-slate-100` / `dark:bg-slate-600`, `hover:bg-slate-200` / `dark:hover:bg-slate-800`

## Layout and Surface Patterns

- Page sections should use rounded cards with shadow and border:
  - `rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 transition-colors`
- Larger containers should use `rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900`
- Use consistent spacing:
  - outer sections: `p-6`, `space-y-6`
  - inner form groups: `grid gap-2`
- For sections with filters or actions, prefer a row background:
  - `flex items-center space-x-2 bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800`

## Typography and Status

- Headings: `text-3xl font-bold tracking-tight text-slate-900 dark:text-white`
- Supporting text: `text-sm text-slate-500 dark:text-slate-400`
- Status pills: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`
  - Success: `bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400`
  - Active/info: `bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400`
  - Neutral: `bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400`

## Inputs and Controls

- Use rounded inputs with neutral borders:
  - `flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors`
- Focus states should use `focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300`
- Search inputs should include icon padding and use placeholder text token:
  - `pl-8 placeholder:text-slate-400`
- Buttons should use accessible focus rings and consistent token styling:
  - neutral button: `inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2`

## Table and Pagination

- Table wrapper: `rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden`
- Table header: `bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800`
- Row hover state: `hover:bg-slate-50/50 dark:hover:bg-slate-800/50`
- Pagination buttons: `relative inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700`

## Modals and Overlays

- Backdrop: `fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200`
- Modal content: `bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors`
- Modal header: `flex justify-between items-center p-6 pb-4 border-b border-slate-100 dark:border-slate-800`
- Modal footer buttons should use the same button pattern as page actions, with a neutral cancel button and a strong confirm button.

## UX Rules

- Use toasts for feedback and avoid browser `alert()` or `prompt()`.
- Prefer reusable components for lists, modals, and selection flows.
- When selecting a related entity, ask the user whether a searchable modal is preferable to a native select.
- Keep the UI sober, professional, and corporate; avoid bright or saturated decorative colors.

## When to use this skill

Use this skill whenever the conversation is about:

- adapting UI colors or theme to the project
- choosing Tailwind classes for pages or components
- designing screens for clients, processes, payments, or dashboards
- applying consistent light/dark styling across the app

Always align component styling with the law office aesthetic: deep navy, slate neutrals, subtle green success, gold/emerald accents when needed, and calm surfaces.
