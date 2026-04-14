# ICP Builder

Project scaffold for a Create React App-based ICP Builder application.

## Environment Setup

1. Copy `.env.example` to `.env` for local development:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Update `.env` with your real values, especially `OPENAI_API_KEY`.

3. In Netlify, add the same environment variables in:
   Site settings -> Build & deploy -> Environment -> Environment variables.
   Add at least:
   - `OPENAI_API_KEY`
   - `REACT_APP_FUNCTION_URL` (for example: `/.netlify/functions/generate-icp`)

4. Verify the function receives the API key correctly:
   - Deploy the site on Netlify.
   - Trigger the form flow so it calls `/.netlify/functions/generate-icp`.
   - Check Netlify Function logs for `generate-icp`.
   - Confirm there is no "missing OPENAI_API_KEY" error and that OpenAI requests succeed.

Security note: Never expose `OPENAI_API_KEY` in frontend code (`REACT_APP_*` values are bundled client-side). Keep the key only in server-side environment variables and read it only inside the Netlify function.
