// Loads the @testing-library/jest-dom matcher augmentation (toHaveAttribute,
// toHaveValue, toBeInTheDocument, …) into the workbench's TypeScript program so
// the OklchPicker test files type-check under `tsc -b`. The runtime gets these
// matchers from vitest.setup.ts, but that file lives outside the `src` glob the
// build compiles, so the `Assertion` augmentation it imports never reached the
// build — leaving the matchers unknown on `expect(...)`. This re-imports it from
// inside `src`. Types only; nothing is emitted or bundled into the app.
import "@testing-library/jest-dom/vitest";
