# Brix Metrics Portal - Deployment Guide

## Overview
This guide will walk you through deploying the Brix Metrics Portal to Netlify with Supabase as the backend.

---

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Enter:
   - **Organization**: Your organization name
   - **Project Name**: `brix-metrics`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
4. Click "Create New Project"
5. Wait for the project to be created (this takes a few minutes)

---

## Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql` from this project
4. Paste it into the SQL Editor
5. Click **Run**

This will create:
- All tables (users, teams, daily_metrics, goals, fti_schedules, placements, pipeline_deals)
- Indexes for performance
- Row Level Security (RLS) policies
- Default teams: Team HI, Team Roofing, Team BMC

---

## Step 3: Get Supabase Credentials

1. In Supabase, go to **Project Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy these values:
   - **URL**: `https://your-project.supabase.co`
   - **anon public**: `eyJ...` (long string)

Save these - you'll need them for Netlify.

---

## Step 4: Create First Admin User

### Option A: Using Supabase Dashboard (Recommended for first user)

1. In Supabase, go to **Authentication** → **Users**
2. Click **Add User**
3. Enter:
   - **Email**: your admin email (e.g., `admin@brixrecruiting.com`)
   - **Password**: strong password (min 6 characters)
4. Click **Create User**
5. Copy the **User ID** (UUID) that was created

### Option B: Using SQL (Alternative)

1. Go to **SQL Editor**
2. Run this query (replace with your email):

```sql
-- First, sign up via the auth API or dashboard
-- Then run this to make the user an admin:

INSERT INTO users (id, email, first_name, last_name, role, is_active)
VALUES (
    'PASTE-USER-UUID-HERE',
    'admin@brixrecruiting.com',
    'Admin',
    'User',
    'admin',
    true
)
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

---

## Step 5: Deploy to Netlify

### Method 1: Deploy via Netlify CLI (Recommended)

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Build the project**:
   ```bash
   cd /path/to/brix-metrics-portal
   npm install
   npm run build
   ```

4. **Deploy**:
   ```bash
   netlify deploy --prod --dir=dist
   ```

5. **Set environment variables** in Netlify:
   - Go to your site dashboard → **Site settings** → **Environment variables**
   - Add:
     - `VITE_SUPABASE_URL` = your Supabase URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

### Method 2: Deploy via Netlify Dashboard

1. **Build locally**:
   ```bash
   npm install
   npm run build
   ```

2. **Go to Netlify Dashboard**: [https://app.netlify.com](https://app.netlify.com)

3. **Drag and drop deploy**:
   - Drag the `dist` folder onto the Netlify dashboard
   - Or click "Add new site" → "Deploy manually" → Upload `dist` folder

4. **Set environment variables**:
   - Go to Site settings → Environment variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

5. **Redeploy** after setting environment variables

### Method 3: Git-based Deploy (Recommended for ongoing updates)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/brix-metrics.git
   git push -u origin main
   ```

2. **Connect to Netlify**:
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repo
   - Build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
   - Click "Deploy site"

3. **Set environment variables** in Netlify site settings

---

## Step 6: Configure Custom Domain (brixmetrics.com)

1. **In Netlify**:
   - Go to your site → **Domain settings**
   - Click "Add custom domain"
   - Enter: `brixmetrics.com`
   - Click "Verify" and "Add domain"

2. **In your DNS provider** (where you bought the domain):
   - Add an A record pointing to Netlify's load balancer:
     - **Type**: A
     - **Name**: @
     - **Value**: `75.2.60.5`
   - Or add a CNAME:
     - **Type**: CNAME
     - **Name**: www
     - **Value**: `your-site-name.netlify.app`

3. **Wait for DNS propagation** (can take up to 24 hours)

4. **Enable HTTPS**:
   - In Netlify, go to Domain settings
   - Click "HTTPS" tab
   - Click "Verify DNS configuration"
   - Netlify will automatically provision an SSL certificate

---

## Step 7: Test the Portal

1. Go to your deployed site (e.g., `https://brixmetrics.com`)
2. Log in with the admin credentials you created
3. Verify you can:
   - See the Dashboard
   - Navigate to all pages
   - Add users (Admin only)
   - Add teams (Admin only)

---

## Troubleshooting

### Issue: "Invalid login credentials"

1. Verify the user exists in Supabase Auth (Authentication → Users)
2. Verify the user profile exists in the `users` table
3. Check that the user's `is_active` is `true`

### Issue: "Blank page after login"

1. Check browser console for errors
2. Verify environment variables are set correctly in Netlify
3. Check that Supabase URL and anon key are correct

### Issue: "Cannot create users"

1. Make sure you're logged in as an admin
2. Check RLS policies in Supabase
3. Verify the new user's email is not already in use

### Issue: "Data not saving"

1. Check browser console for errors
2. Verify RLS policies allow the operation
3. Check that the user has a team assigned (required for some operations)

---

## Features Included

### Authentication
- Email/password login
- Role-based access (Admin, Manager, Recruiter)
- Session management

### Dashboard
- YTD KPIs (Sales, Placements, FTIs, Job Orders)
- Team performance comparison
- Individual rankings

### Daily Metrics
- Decimal support for all metrics
- Monthly calendar view
- Team rankings

### FTI Board
- 3 stages: Submitted (yellow), Scheduled (blue), Completed (green)
- Status tracking
- Team filtering

### Pipeline
- Company, job title, candidate
- Amount, invoice number, due dates
- Classification (25% splits)
- Retainer invoice option
- Candidate source tracking
- Overdue payment highlighting (red)

### Admin Features
- User management (create, edit, activate/deactivate)
- Team management with manager assignments
- Goal setting

---

## Default Teams

The following teams are created automatically:
- **Team HI**
- **Team Roofing**
- **Team BMC**

---

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify Supabase RLS policies
3. Check Netlify deployment logs

---

## Next Steps

1. Add more users via the User Management page
2. Assign users to teams
3. Set up team managers
4. Start tracking daily metrics
5. Add pipeline deals
