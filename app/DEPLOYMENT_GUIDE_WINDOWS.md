# Brix Recruiting Metrics Portal - Windows Deployment Guide

This guide will walk you through deploying the Brix Recruiting Metrics Portal to Netlify with Supabase as the backend, using **Windows**.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Set Up Supabase](#step-1-set-up-supabase)
3. [Step 2: Prepare Project on Windows](#step-2-prepare-project-on-windows)
4. [Step 3: Deploy to Netlify](#step-3-deploy-to-netlify)
5. [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
6. [Step 5: Create Admin User](#step-5-create-admin-user)
7. [Step 6: Verify Deployment](#step-6-verify-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, you'll need:
- **Windows 10 or Windows 11**
- **Git for Windows** - Download from [https://git-scm.com/download/win](https://git-scm.com/download/win)
- **Node.js** - Download from [https://nodejs.org](https://nodejs.org) (LTS version recommended)
- A **GitHub** account (to store your code)
- A **Supabase** account (free tier works fine)
- A **Netlify** account (free tier works fine)

---

## Step 1: Set Up Supabase

### 1.1 Create a New Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Enter:
   - **Organization**: Choose or create one
   - **Project Name**: `brix-metrics-portal`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., `US East`)
4. Click **Create new project** and wait (takes ~2 minutes)

### 1.2 Get Your API Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in left sidebar)
2. Click **API** in the left menu
3. Copy these values (you'll need them later - save in Notepad):
   - **Project URL** (e.g., `https://xxxxxxxxxxxxxx.supabase.co`)
   - **anon/public** key (starts with `eyJ...`)

### 1.3 Run the Database Schema

1. In the Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Open the `supabase\schema.sql` file from this project in Notepad or VS Code
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (top right)

✅ **Verify**: You should see "Success. No rows returned" and the default teams (Team HI, Team Roofing, Team BMC) will be created.

### 1.4 Configure Authentication Settings

1. Go to **Authentication** (left sidebar)
2. Click **Providers** tab
3. Ensure **Email** provider is enabled (it should be by default)
4. Click **Settings** under Email provider
5. Set:
   - **Confirm email**: OFF (for easier testing, turn ON later for production)
   - **Secure email change**: ON
   - **Double confirm email changes**: ON

---

## Step 2: Prepare Project on Windows

### 2.1 Open Terminal

You can use any of these on Windows:
- **Git Bash** (recommended - installed with Git for Windows)
- **PowerShell**
- **Command Prompt (CMD)**
- **Windows Terminal**

### 2.2 Navigate to Project Folder

Using **Git Bash** or **PowerShell**:

```bash
# Replace with your actual path to the project folder
cd "C:\Users\YourUsername\Documents\brix-metrics-portal"
```

Or using **Command Prompt (CMD)**:

```cmd
cd C:\Users\YourUsername\Documents\brix-metrics-portal
```

### 2.3 Install Dependencies

```bash
npm install
```

If you get errors, try:

```bash
npm install --legacy-peer-deps
```

### 2.4 Create Environment File (for local testing)

Create a file named `.env` in the project root folder:

```env
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note**: On Windows, you may need to show file extensions to create this file properly.

---

## Step 3: Deploy to Netlify

### 3.1 Push Code to GitHub

1. Create a new repository on GitHub:
   - Go to [https://github.com/new](https://github.com/new)
   - Name it `brix-metrics-portal`
   - Make it **Public** or **Private**
   - Click **Create repository**

2. Push this code to your repository (in your terminal):

**Using Git Bash or PowerShell:**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/brix-metrics-portal.git
git push -u origin main
```

**Using Command Prompt (CMD):**

```cmd
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/brix-metrics-portal.git
git push -u origin main
```

When prompted, enter your GitHub username and password (or personal access token).

### 3.2 Connect to Netlify

1. Go to [https://netlify.com](https://netlify.com) and sign in
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub** and authorize Netlify
4. Select your `brix-metrics-portal` repository
5. Configure build settings:
   - **Branch to deploy**: `main`
   - **Base directory**: (leave blank)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click **Deploy site**

Netlify will start building your site. This takes ~2-3 minutes.

---

## Step 4: Configure Environment Variables

### 4.1 In Netlify

1. In Netlify, go to **Site configuration** → **Environment variables**
2. Click **Add a variable** → **Add multiple variables**
3. Add these variables:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

4. Click **Save**
5. Go to **Deploys** and click **Trigger deploy** → **Deploy site** to rebuild with the new variables

### 4.2 For Local Development (Optional)

If you want to run the project locally on Windows:

1. Create a `.env` file in the project root folder
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Run the development server:

```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

**Never commit this `.env` file to GitHub!** It's already in `.gitignore`.

---

## Step 5: Create Admin User

### 5.1 Create Your First User

1. Go to your deployed Netlify URL (e.g., `https://your-site.netlify.app`)
2. Click **Sign Up** (since no users exist yet)
3. Enter:
   - **Email**: your admin email
   - **Password**: strong password (min 6 characters)
   - **First Name**: Your first name
   - **Last Name**: Your last name
4. Click **Sign Up**

### 5.2 Make Yourself Admin

Since the first user isn't automatically an admin, you need to manually update your role in Supabase:

1. Go to Supabase dashboard → **Table Editor**
2. Click **profiles** table
3. Find your user record
4. Click the edit icon (pencil)
5. Change **role** from `recruiter` to `admin`
6. Click **Save**

✅ **You're now the admin!**

---

## Step 6: Verify Deployment

### 6.1 Test Login

1. Go to your Netlify URL
2. Enter your email and password
3. Click **Sign In**
4. You should be redirected to the Dashboard

### 6.2 Test Key Features

**Dashboard**:
- Should show YTD metrics cards
- Should show team performance table

**Daily Metrics**:
- Click "Daily Metrics" in sidebar
- Try entering decimal values (e.g., 2.5)
- Click Save

**FTI Board**:
- Click "FTI Board"
- Add a test entry
- Check that stages show correct colors:
  - Submitted = Yellow
  - Scheduled = Blue
  - Completed = Green

**Pipeline**:
- Click "Pipeline"
- Add a test deal
- Verify all fields work including:
  - Company, Job, Amount
  - Classification dropdown (25% splits)
  - Candidate source dropdown
  - Due date with red highlight if overdue

**Admin Features** (as admin):
- Click "User Management" in sidebar
- Try adding a new user
- Click "Team Management"
- Verify 3 default teams exist

---

## Troubleshooting

### Issue: Git commands not recognized

**Solution**:
1. Make sure Git for Windows is installed: [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Restart your terminal after installation
3. Try using **Git Bash** instead of PowerShell/CMD

### Issue: npm command not recognized

**Solution**:
1. Make sure Node.js is installed: [https://nodejs.org](https://nodejs.org)
2. Restart your terminal after installation
3. Verify installation: `node --version` and `npm --version`

### Issue: "Invalid login credentials"

**Solution**:
1. Check that you're using the correct email/password
2. In Supabase, go to **Authentication** → **Users**
3. Verify your user exists
4. If needed, use "Send magic link" or reset password

### Issue: "Blank white page" after login

**Solution**:
1. Open browser DevTools (F12) → **Console**
2. Check for red error messages
3. Common causes:
   - Missing environment variables → Check Netlify env vars
   - Supabase URL incorrect → Verify in Project Settings
   - RLS policies blocking data → Check schema.sql was run correctly

### Issue: "Failed to fetch" errors

**Solution**:
1. Verify `VITE_SUPABASE_URL` is correct in Netlify
2. Check that schema.sql was run completely
3. In Supabase, go to **Database** → **Tables** and verify all tables exist

### Issue: Can't add users from User Management

**Solution**:
1. Verify you're logged in as admin (check role in profiles table)
2. Check browser Console for errors
3. Ensure the new user's email is valid and not already in use

### Issue: Data not saving

**Solution**:
1. Check browser Console for errors
2. Verify RLS policies are set up correctly
3. In Supabase, go to **Authentication** → **Policies** and ensure policies exist for all tables

---

## Windows-Specific Tips

### File Paths

On Windows, use backslashes (`\`) for file paths:

```bash
# Correct for Windows
cd C:\Users\Username\Documents\brix-metrics-portal

# Or use forward slashes (also works in Git Bash)
cd C:/Users/Username/Documents/brix-metrics-portal
```

### Terminal Options

**Git Bash** (Recommended):
- Comes with Git for Windows
- Works like Linux terminal
- Best compatibility with npm/git commands

**PowerShell**:
- Built into Windows
- Good for most commands
- Some commands may need adjustment

**Command Prompt (CMD)**:
- Built into Windows
- Most basic option
- May need to use different syntax for some commands

### Creating .env File on Windows

1. Open Notepad
2. Add your environment variables
3. Click **File** → **Save As**
4. In the filename field, type: `.env` (with the dot)
5. Change "Save as type" to **All Files (*.*)**
6. Click **Save**

---

## Next Steps

### Add More Users

1. As admin, go to **User Management**
2. Click **Add User**
3. Enter user details and assign to a team
4. The user will receive an email to set their password

### Set Team Goals

1. Go to **Settings** → **Goals**
2. Set monthly/yearly targets for each team
3. These will appear on the Dashboard

### Customize Teams

1. Go to **Team Management**
2. Edit team names or add new teams
3. Assign managers to teams

---

## Support

If you encounter issues not covered here:

1. Check browser Console (F12) for error messages
2. Check Netlify deploy logs (Deploys → Click deploy → Deploy log)
3. Check Supabase logs (Database → Logs)
4. Review the schema.sql was executed without errors

---

## Security Notes

For production use:

1. **Enable Email Confirmation**:
   - Supabase → Authentication → Providers → Email → Confirm email: ON

2. **Set Up Strong Password Policy**:
   - Supabase → Authentication → Policies

3. **Add Custom Domain**:
   - Netlify → Domain settings → Add custom domain

4. **Enable HTTPS**:
   - Netlify provides this automatically

---

**You're all set!** Your Brix Recruiting Metrics Portal should now be live and ready to use on Windows.
