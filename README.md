# Farm Tracker

## Required Environment Variables

Create a local `.env` file using `.env.example` as template:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## GitHub Pages Deployment Secrets

For GitHub Actions deploys, add these repository secrets:

1. `VITE_SUPABASE_URL`
2. `VITE_SUPABASE_PUBLISHABLE_KEY`

Path in GitHub:

1. Open repository
2. Go to Settings
3. Go to Secrets and variables > Actions
4. Add the two secrets above

The deploy workflow reads these secrets at build time.
