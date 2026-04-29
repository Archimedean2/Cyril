# Last Step

## Step 6: Add React error boundaries

**Do:** Create an `ErrorBoundary` component in `src/components/layout/ErrorBoundary.tsx`. Wrap the editor surface, tools pane, and inventory pane each in their own error boundary. The fallback UI should display a message and a "Reload" button (not crash the whole app).

**Measurable outcome:**
- An integration test renders each pane with a component that throws, and asserts the error boundary fallback appears instead of an uncaught error
- The app shell remains functional when one pane crashes
- `npm run test` passes
