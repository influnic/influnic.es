# Influnic Gantt Builder

Static, dependency-free editor at `gantt.html`, linked from `orgchart.html`.
Serve this repository as static files. No build step or backend is required.

## Features

- Task and milestone editor: inclusive start/end dates, owner, effort (shown as Esfuerzo),
  progress, color, notes and finish-to-start dependencies.
- Drag to move tasks; resize either end; keyboard-accessible editing through
  task names or focused bars (Enter/Space). Reorder tasks with the row arrows.
- Day/week/month scales, zoom, fit, today marker and weekend shading.
- Dependencies are visual: overlapping dates are flagged, without automatic
  rescheduling. Durations use calendar days, including weekends.
- Undo/redo (up to 60 changes), sample project, printing via browser/PDF.
- PNG export of the full Gantt, including off-screen rows/dates, title,
  task details, dependencies, progress, milestones and weekend shading.
  Uses the current scale/zoom; large plans are downscaled to 16,000 pixels
  per dimension and 32 megapixels. Rendering runs locally with Canvas.
- JSON, CSV and PNG downloads use the project name (for example,
  `Plan de implantación.png`). Invalid filename characters are replaced with
  underscores; blank names fall back to `Mi proyecto`.
- The effort field retains the `group` JSON/CSV key for compatibility with
  existing files and local saves.
- Explicit save/recover in localStorage under `influnic-gantt-builder-state`.
  It does not share the OrgChart storage key. Reload shows a recovery prompt
  in the status area; it does not automatically open a saved plan.
- All project data stays in the browser until the user exports a file.

## JSON

Schema version 1: `version`, `project`, `scale` (`day`, `week`, `month`),
`zoom` (0.35–3), and `tasks`. Each task contains `id`, `name`, `start`, `end`,
`progress`, `owner`, `group`, `color`, `dependencies` (array of task IDs),
`milestone` (boolean) and `notes`.

## CSV

UTF-8 with BOM, comma separated, all fields quoted and quotes escaped by
repetition. Imports also accept semicolon separated CSV and CRLF or LF.
Multiline notes and non-ASCII text are supported.

```csv
id,name,start,end,progress,owner,group,color,dependencies,milestone,notes,project
scope,Definir alcance,2026-10-15,2026-10-16,100,Kevin,Diseño,#7c3aed,,false,,Mi proyecto
launch,Lanzamiento,2026-10-19,2026-10-19,0,Kevin,Entrega,#0891b2,scope,true,,Mi proyecto
```

Only `name`, `start` and `end` headers are required. Missing IDs are generated
as `task-1`, `task-2`, etc. Dependency IDs use `|` as separator. Dates are
`YYYY-MM-DD`; progress is a number from 0 to 100; milestones use `true`/`false`
(or `1`/`0`). Milestones must start and end on the same day. CSV preserves all
task data and project name; view scale/zoom are stored only in JSON/local save.
Export the sample project for a complete template.

Imports are validated before replacing the current plan: up to 500 tasks,
5 MB file size, 10-year overall span, dates between 1900 and 2199, unique IDs,
existing dependency IDs, no cycles, valid progress and chronological dates.
Invalid imports leave the current project intact.

## Browser checks

With Node.js and Playwright available:

```sh
npm install --no-save playwright
npx playwright install chromium
python -m http.server 8765
```

In another terminal:

```sh
node tests/gantt.test.cjs
```

The browser suite checks rendering, JSON/CSV round trips, invalid input,
local persistence, drag/resize, undo, editing, actual file imports/downloads,
HTML escaping and mobile viewport overflow. Override `GANTT_URL` to test
another server. Screenshots are saved to `/tmp/gantt-desktop.png` and
`/tmp/gantt-mobile.png`.

DOM and data checks (no browser binary required):

```sh
npm install --no-save jsdom
node tests/gantt-dom.test.cjs
```

The DOM suite simulates pointer handlers; it does not verify real browser
geometry or appearance. Task IDs must not contain `|`, line breaks or leading/
trailing whitespace, so dependency lists can round-trip through CSV.

PNG and filename checks with a real Canvas encoder:

```sh
npm install --no-save jsdom @napi-rs/canvas
node tests/gantt-export.test.cjs
```

This suite checks download names, the Esfuerzo label, PNG encoding and size
limits, empty plans, unchanged project state and encoding error handling.
It writes `/tmp/gantt-export-preview.png` for visual review.


Displayed dates use `MM/DD/YYYY` in the editor and PNG. The second task line
includes start/end dates; milestones show only their start date. JSON/CSV and
native date input values retain ISO `YYYY-MM-DD` for compatibility. PNG output
contains no Influnic branding.

