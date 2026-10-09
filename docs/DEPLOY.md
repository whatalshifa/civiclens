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
