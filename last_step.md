# Last Step

## Step 22: Set up CI pipeline

**Do:** Create a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs on push/PR:
- `npm ci`
- `npm run build`
- `npm run test`
- `npm run test:coverage` (with minimum thresholds: 70% overall for now)
- `npx playwright install && npm run test:e2e`

**Measurable outcome:**
- A push to main triggers the CI workflow
- CI runs all unit, integration, and E2E tests
- CI fails if coverage drops below 70%
- Badge in README shows CI status
