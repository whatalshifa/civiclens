# Deploying CivicLens

All on free tiers, in your own accounts.

1. **Database (Neon).** Create a project named `civiclens` in Singapore and copy its connection string.
2. **API (Render).** New > Blueprint > pick this repo. Render reads `render.yaml`, asks for
   `CL_DATABASE_URL` (paste the Neon string), and generates `CL_PROXY_SECRET`. The API creates its
   tables and loads the data on first start. Check `https://<your-api>.onrender.com/api/health`.
3. **Website (Vercel).** Import the repo, set the root directory to `frontend`, and add:
   - `API_URL`: the Render address, like `https://civiclens-api.onrender.com`
   - `API_PROXY_SECRET`: the value Render generated for `CL_PROXY_SECRET`
   - `SITE_URL`: the Vercel address
4. **Keeping it awake (optional).** `.github/workflows/keep-warm.yml` pings the API's
   `/api/health` every 10 minutes on weekdays, 09:30–18:30 India time, so visitors in those hours
   rarely wait for a cold start. Change the address in it if your API lives elsewhere. It uses
   about 200 of the 750 free instance hours Render gives a workspace each month.
