# Brix Recruiting Metrics Portal

A comprehensive metrics tracking and forecasting platform for recruiting teams with role-based access control.

## Live Demo

**URL:** https://syta3ldaplwje.ok.kimi.link

## Features

### Authentication & Security
- Secure login with email/password
- Role-based access control (Admin, Manager, Recruiter)
- Password protection for all content
- Row-level security in database

### Dashboard
- YTD KPIs: Sales, Placements, FTIs, Job Orders
- Team performance comparison
- Individual rankings/leaderboards
- Visual charts and progress tracking

### Daily Metrics
- Daily input form for all metrics (RP, MP, Subs, JO, FTI, Placements)
- **Decimal support** for all numeric inputs
- Monthly calendar view with progress tracking
- Team rankings with % to goal
- Color-coded status indicators

### FTI Board
- First Time Interview scheduling
- Week view with daily columns
- **3 Color-coded stages**:
  - 🟡 **Submitted** (Yellow)
  - 🔵 **Scheduled** (Blue)
  - 🟢 **Completed** (Green)
- Team-filtered views

### Pipeline/Deals
- Deal tracking with all required fields:
  - Company and Job Title
  - Candidate Name
  - Amount
  - Invoice Number & Dates
  - **Payment Due Date** (red highlight if overdue)
  - **Classification** (25% splits):
    - Candidate Sourced 25%
    - Candidate Submission 25%
    - Client MP 25%
    - Client JO 25%
  - **Retainer** checkbox
  - **Candidate Source** dropdown:
    - ATS
    - LinkedIn Email
    - LinkedIn CR Msg
    - Zoominfo Cold Call
    - Reply from Talent Bulletin
    - Referral
    - Applied via Website

### Yearly Tracking
- Monthly breakdown of Placements, Interviews, Job Orders
- Revenue tracking
- Team comparison charts
- CSV export functionality

### Forecasting
- Revenue target calculator
- Pipeline flow visualization
- Conversion rate sliders
- Team goal allocation

### Admin Features
- **User Management**: Create/edit users, assign roles, activate/deactivate
- **Team Management**: Create teams, assign managers
- **Goal Setting**: Set monthly/yearly targets for teams and individuals

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Charts:** Recharts
- **Backend:** Supabase (PostgreSQL + Auth)
- **Deployment:** Netlify

## Teams (Pre-configured)

- **Team HI**
- **Team Roofing**
- **Team BMC**

## Database Schema

### Tables
- `profiles` - User profiles with roles
- `teams` - Team definitions with manager IDs
- `daily_metrics` - Daily activity tracking
- `goals` - Monthly/annual goals by user/team
- `fti_schedule` - Interview scheduling
- `placements` - Placement records
- `pipeline_deals` - Pipeline/deal tracking

## Deployment

### Choose Your Platform:

- **[Linux/macOS](./DEPLOYMENT_GUIDE.md)** - For Mac or Linux users
- **[Windows](./DEPLOYMENT_GUIDE_WINDOWS.md)** - For Windows users

### Quick Start:

1. **Set up Supabase** (free tier):
   - Create project at [supabase.com](https://supabase.com)
   - Run `supabase/schema.sql` in SQL Editor
   - Copy your Project URL and Anon Key

2. **Deploy to Netlify** (free tier):
   - Push code to GitHub
   - Connect GitHub repo to Netlify
   - Set environment variables

3. **Create admin user**:
   - Sign up on your deployed site
   - Change role to `admin` in Supabase profiles table

See the full deployment guide for your platform for detailed instructions.

## Role Permissions

| Feature | Admin | Manager | Recruiter |
|---------|-------|---------|-----------|
| View Dashboard | All data | Own team + company | Own data only |
| View Daily Metrics | All | Own team | Own only |
| Input Daily Metrics | All | Own + team | Own only |
| View FTI Board | All | Own team | Own team |
| Edit FTI Board | All | Own team | Own only |
| View Pipeline | All | Own team | Own team |
| Edit Pipeline | All | Own team | Own only |
| View Yearly Tracking | All | Own team + company | Own team |
| View Forecasting | All | Own team | Own only |
| Manage Users | Yes | No | No |
| Manage Teams | Yes | No | No |
| Set Goals | All | Own team | No |
| View Leaderboards | Yes | Yes | Yes |

## Metrics Tracked

| Abbreviation | Description |
|--------------|-------------|
| RP | Recruiting Presentations |
| MP | Marketing Presentations |
| Subs | Submissions |
| JO | Job Orders |
| FTI | First Time Interview |
| Placement $ | Revenue from placements |
| Placement # | Number of placements |

## Free Tier Limits (Supabase)

- **Database:** 500MB (sufficient for 20+ users)
- **Auth:** Unlimited users
- **API Requests:** Unlimited
- **Edge Functions:** 500K invocations/month

## Support

For questions or issues:
1. Check browser Console (F12) for error messages
2. Check Netlify deploy logs
3. Check Supabase logs
4. Review the deployment guide for your platform

---

Built for Brix Recruiting Partners
