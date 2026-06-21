# Tale Smiths — Production Launch & Deployment Guide

Follow these steps in this exact order to populate your database, configure your custom subdomain, and deploy the application live.

---

## Phase A: Database Setup (Supabase SQL Editor)

Before deploying the app, your database tables and triggers must exist in Supabase, otherwise the application will fail to read story data or handle signups.

1. Open your **Supabase Dashboard** and select your project (`oeduowaqdvpmvbjciffa`).
2. In the left-hand sidebar, click on the **SQL Editor** icon (represented by `SQL` text or a terminal symbol).
3. Click **New Query** (or the **+** button) to open a blank editor.
4. Open the file [supabase_schema.sql](file:///d:/Projects/Series7Mangaaa/supabase_schema.sql) in your local workspace folder.
5. Copy the entire contents of the file and paste them into the Supabase SQL Editor text box.
6. Click the **Run** button at the bottom right of the editor.
7. Verify that the output shows `Success. No rows returned` (or lists tables created successfully). This sets up:
   - Tables: `profiles`, `stories`, `episodes`, `panels`, `comments`, `likes`, `bookmarks`, `email_subscribers`, `analytics_events`.
   - Automatic triggers to create user profiles on auth signups.
   - Row Level Security (RLS) policies.

---

## Phase B: Configure Cloudflare R2 (Image Storage & CDN)

Since your subdomain `talesmiths.indevs.in` is delegated to you, configuring a custom CDN subdomain (like `cdn.talesmiths.indevs.in`) might require setting up a separate Cloudflare zone. 

To bypass this complexity, you can use Cloudflare's **Public Development URL** which gives you a free, public CDN endpoint out-of-the-box.

### 1. Enable R2 Public Access URL
1. Log in to your **Cloudflare Dashboard** -> **R2** -> **Buckets** -> Select **`talesmiths-manga`**.
2. Click the **Settings** tab.
3. Scroll down to the **Public Development URL** section.
4. Click the **Enable** button on the right.
5. Once enabled, Cloudflare will display an auto-generated public endpoint URL (e.g., `https://pub-a590b1464da44265bf8915bc5e24b7a1.r2.dev`). Copy this URL.
6. You will use this URL as your `NEXT_PUBLIC_CDN_URL` environment variable.

### 2. Configure CORS Policy (Required for Uploads)
1. In the same **Settings** tab, scroll down to the **CORS Policy** section.
2. Click **Edit CORS Policy** and paste this JSON configuration:
   ```json
   [
     {
       "AllowedOrigins": [
         "https://*.vercel.app",
         "https://talesmiths.indevs.in",
         "http://localhost:3000"
       ],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
3. Click **Save**.

---

## Phase C: Configure DNS for your Subdomain

Go to your **Stackryze Domain Management panel** where you claimed `talesmiths.indevs.in`. Add the following DNS record:

*   **Type**: `CNAME`
*   **Name / Host**: `@` (or leave blank if it represents the root `talesmiths.indevs.in`)
*   **Target / Value**: `cname.vercel-dns.com`
*   **TTL**: Auto / 3600

*This delegates your subdomain root to Vercel's edge network.*

---

## Phase D: Deploy the Project to Vercel

1. **Commit and Push your local repository to GitHub**:
   Open a terminal in your project directory (`d:\Projects\Series7Mangaaa`) and run:
   ```bash
   git init
   git add .
   git commit -m "feat: complete talesmiths launch build"
   # Create a repository on github.com, then run:
   git remote add origin <your-github-repo-url>
   git branch -M main
   git push -u origin main
   ```

2. **Import Project to Vercel**:
   - Log in to your [Vercel Dashboard](https://vercel.com) using GitHub.
   - Click **Add New** -> **Project**.
   - Import your GitHub repository.

3. **Configure Environment Variables**:
   Under **Environment Variables**, add the following keys from your local `.env.local` file:

   | Variable Key | Value to enter |
   | :--- | :--- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://oeduowaqdvpmvbjciffa.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(your Supabase Anon Key)* |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(your Supabase Service Role Key)* |
   | `R2_ACCESS_KEY_ID` | `d33b0130c9fb0c9396e6364e69d93531` |
   | `R2_SECRET_ACCESS_KEY` | `8851b5e8e7b22042ecdbe1777e3a5d165d20eddf07f1829159fc8638840f9c52` |
   | `R2_ENDPOINT` | `https://ea25409d2cb26723938770ae403fc6b0.r2.cloudflarestorage.com` |
   | `R2_BUCKET_NAME` | `talesmiths-manga` |
   | `NEXT_PUBLIC_CDN_URL` | *(The `https://pub-xxxx.r2.dev` URL you copied in Phase B)* |
   | `ADMIN_PASSWORD` | `series07` |

4. Click **Deploy**. Vercel will build the project and assign a deployment URL (e.g. `talesmiths.vercel.app`).

5. **Link your Subdomain in Vercel**:
   - Go to your Vercel Project -> **Settings** -> **Domains**.
   - Enter **`talesmiths.indevs.in`** and click **Add**.
   - Select the defaults. Since you configured the CNAME record in Phase C, Vercel will automatically verify it and generate your SSL certificate.

---

## Phase E: Update Supabase Authentication URL Configuration

Now that your site is hosted at `talesmiths.indevs.in`, update the Supabase callback routes.

1. Open your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
2. Change the **Site URL** to:
   ```
   https://talesmiths.indevs.in
   ```
3. Under **Redirect URLs**, add:
   ```
   https://talesmiths.indevs.in/api/auth/callback
   ```
4. If using Google OAuth, go to **Google Cloud Console** -> **APIs & Services** -> **Credentials** -> Select your Client ID, and add `https://talesmiths.indevs.in` to the **Authorized JavaScript origins**.

---

## Phase F: Accessing your Creator Portal
Once live, you can access the admin control panel on the subdomain by:
- Pressing `Ctrl + Shift + A` on desktop.
- Long-pressing the "Tale Smiths" logo for 3 seconds in the top navigation bar.
- Navigating directly to `https://talesmiths.indevs.in/admin-gate` on your mobile phone or browser.
- Enter the creator password: **`series07`** to unlock the publisher console.
