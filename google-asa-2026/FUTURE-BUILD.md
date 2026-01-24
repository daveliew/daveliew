# Future Build: Web UI for Interview Coaching

**Status**: Parked (focus on interview prep)
**Resume after**: Interview complete

## Planned Features
- Supabase database for persistent scenarios
- Claude API integration for AI-powered practice
- Web UI for creating/editing scenarios (instead of CLI/markdown)
- Deploy to Vercel with private GitHub repo

## Already Built
- [x] Supabase schema designed (`supabase-schema.sql`)
- [x] API routes created (`/api/scenarios`, `/api/ai/coach`)
- [x] Practice mode UI (`/practice`)
- [x] GitHub repo: https://github.com/daveliew/interview-coaching (private)
- [x] Vercel deployment: https://coaching-app-gules-one.vercel.app

## To Complete Later
- [ ] Add Supabase env vars to Vercel
- [ ] Run schema in Supabase project `ouxewnsflyepuamvvguy`
- [ ] Test end-to-end flow
- [ ] Add Supabase MCP for direct database access

## Current Workaround
Using markdown files in `scenarios/` folder for now - simple and fast.
