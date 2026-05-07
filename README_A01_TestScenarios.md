# A01 Test Scenarios UI – Quick Guide

## Overview
This exercise extends the **csbridge‑mock‑data‑generator** UI with a dedicated section for generating test cases for the **A01** ADT event.  A lightweight React component (`TestScenarios.tsx`) presents a checklist of seven validation scenarios and a **Generate Tests** button.  The component is imported and displayed in `App.tsx` right after the existing data‑generation UI.

## What Was Added
1. **`src/TestScenarios.tsx`** – a self‑contained React component:
   - Defines the seven A01 test scenarios.
   - Renders a responsive checkbox grid using the existing CSS classes.
   - Handles selection state and a placeholder `handleGenerate` that logs the chosen tests.
2. **`src/App.tsx`** – updated to:
   - Import `TestScenarios`.
   - Insert a new card section titled **“🧪 Test Scenarios for A01 Event”**.
   - Re‑use the same design system (cards, sections, animations) for visual consistency.
3. No changes to the data‑generation logic – the new UI is purely for test‑scenario selection.

## How to Run / Verify
1. **Install dependencies** (if not already done):
   ```bash
   npm ci
   ```
2. **Start the development server**:
   ```bash
   npm run dev
   ```
3. Open the app (usually `http://localhost:5173`).
4. After configuring a database connection and generating data, scroll down – you will see the new **Test Scenarios** card.
5. Select one or more checkboxes and click **Generate Tests**.  A console log and alert confirm the selection.

## Short Execution Plan (Step‑by‑Step)
1. **Create component** – `TestScenarios.tsx` with scenario list and UI.
2. **Import component** in `App.tsx`.
3. **Insert UI section** after the data‑generation section (single `<section>` block).
4. **Run the app** to confirm the UI appears and behaves as expected.
5. (Optional) Extend `handleGenerate` to call real test‑generation APIs.

## Design & Styling Notes
- Re‑uses existing CSS variables, card styles, and the `checkbox-grid` layout for a cohesive look.
- All UI elements inherit the app’s dark‑mode‑friendly palette, shadows, and micro‑animations.
- No additional dependencies were introduced – pure React + existing styles.

---
**Result:** Users can now conveniently pick A01 validation scenarios and trigger test generation directly from the mock‑data generator UI.
