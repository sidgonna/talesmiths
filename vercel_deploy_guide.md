# Tale Smiths — Deployment Guide

This guide details the exact steps to deploy the **Tale Smiths** web application to production using **Vercel**, **Supabase**, and **Cloudflare R2**.

---

## 1. Cloudflare R2 Settings (CRITICAL)

Because creators upload manga panels directly from their browser to R2 via presigned URLs, you **MUST** enable CORS (Cross-Origin Resource Sharing) on your R2 bucket.

### A. Enable CORS Policy
1. Go to the **Cloudflare Dashboard** -> **R2** -> **Buckets**.
2. Select your bucket: `talesmiths-manga`.
3. Go to the **Settings** tab.
4. Scroll down to **CORS Policy** and click **Edit CORS Policy** (or Add CORS Policy).
5. Paste the following JSON configuration:
   ```json
   [
     {
       "AllowedOrigins": [
         "https://*.vercel.app",
         "https://talesmiths.com",
         "http://localhost:3000"
       ],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
6. Click **Save**.

### B. Connect a Custom Domain (CDN)
Connecting a domain makes loading comic panels faster and avoids Cloudflare R2 API download charges by routing traffic through Cloudflare's global edge cache.
1. In the same **Settings** tab for the `talesmiths-manga` bucket, find the **Public Bucket** section.
2. Click **Connect Domain**.
3. Enter your custom subdomain (e.g., `cdn.talesmiths.com`).
4. Click **Continue** and follow the prompts to add the CNAME record to your DNS configuration.
5. In your production deployment, update your environment variable `NEXT_PUBLIC_CDN_URL` to point to `https://cdn.talesmiths.com`.

---

## 2. Supabase Authentication Configurations

To support login status and Google OAuth signups, update your Supabase redirect settings.

### A. Configure Site URL & Redirects
1. Go to the **Supabase Dashboard** -> Select your Project.
2. Go to **Authentication** -> **URL Configuration**.
3. Under **Site URL**, enter your production URL:
   - E.g., `https://talesmiths.com` (or your temporary Vercel URL, like `https://talesmiths.vercel.app`).
4. Under **Redirect URLs**, add:
   - `https://talesmiths.com/api/auth/callback` (or `https://talesmiths.vercel.app/api/auth/callback`).
   - `http://localhost:3000/api/auth/callback` (for local development testing).

### B. Configure Google OAuth Providers
1. Go to **Authentication** -> **Providers** -> **Google**.
2. Toggle Google Auth **ON**.
3. Go to the **Google Cloud Console** -> **APIs & Services** -> **Credentials**.
4. Create an **OAuth Client ID** for a Web Application.
   - Under **Authorized JavaScript Origins**, add your domain: `https://talesmiths.com` and `https://talesmiths.vercel.app`.
   - Under **Authorized Redirect URIs**, paste the **Redirect URI** provided by the Supabase dashboard (it looks like `https://oeduowaqdvpmvbjciffa.supabase.co/auth/v1/callback`).
5. Copy the **Client ID** and **Client Secret** from Google Cloud Console and paste them into the Supabase Google Provider fields.
6. Click **Save** in Supabase.

---

## 3. Vercel Deployment

1. Initialize a Git repository in the project folder and push it to a **GitHub repository** (private or public):
   ```bash
   git init
   git add .
   git commit -m "feat: tale smiths complete build"
   # Link your github remote repository and push
   git remote add origin <your-github-repo-url>
   git branch -M main
   git push -u origin main
   ```
2. Go to the **Vercel Dashboard** and click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Expand **Environment Variables** and add all the keys from your local `.env.local` file:

   | Key | Value / Source |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://oeduowaqdvpmvbjciffa.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(your Supabase Anon Key)* |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(your Supabase Service Role Key - server only)* |
   | `R2_ACCESS_KEY_ID` | `d33b0130c9fb0c9396e6364e69d93531` |
   | `R2_SECRET_ACCESS_KEY` | `8851b5e8e7b22042ecdbe1777e3a5d165d20eddf07f1829159fc8638840f9c52` |
   | `R2_ENDPOINT` | `https://ea25409d2cb26723938770ae403fc6b0.r2.cloudflarestorage.com` |
   | `R2_BUCKET_NAME` | `talesmiths-manga` |
   | `NEXT_PUBLIC_CDN_URL` | `https://ea25409d2cb26723938770ae403fc6b0.r2.cloudflarestorage.com/talesmiths-manga` *(or your custom connected domain `https://cdn.talesmiths.com`)* |
   | `ADMIN_PASSWORD` | `series07` |

5. Click **Deploy**. Vercel will build the project and output your live production URL!
