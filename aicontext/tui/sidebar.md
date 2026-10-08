# Sidebar interaction and package entrypoint

The editable TUI is `src/tui.tsx`. `scripts/build.mjs` compiles it using Solid's
universal Babel preset without bundling dependencies. The package exports
`dist/tui.js`; the root `tui.tsx` also forwards to that generated module for
directory-based loading. Commit the generated file for Git installations.

OpenTUI's runtime JSX transform excludes `node_modules`. A local checkout can
therefore work while a Git/npm installation of raw TSX appears frozen: clicking
updates a signal but the rendered expressions were not transformed reactively.

The heading toggles full-width bars and a four-line compact view. Percentage
follows the resource label on the left; used/total remains right-aligned. Polls
must update both modes without resetting the section's open state.

Run `npm test` and `npm run typecheck`. The tests use the real OpenTUI headless
renderer and mouse clicks for both the source and distribution entrypoint.
