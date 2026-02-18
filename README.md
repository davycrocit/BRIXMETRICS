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
- Monthly calendar view with progress tracking
- Team rankings with % to goal
- Color-coded status indicators

### FTI Board
- First Time Interview scheduling
- Week view with daily columns
- Status tracking (Scheduled, Completed, Cancelled, Rescheduled)
- Team-filtered views

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
- User management (create, edit, activate/deactivate)
- Team management with manager assignments
- Goal setting for teams and individuals

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Charts:** Recharts
- **Backend:** Supabase (PostgreSQL + Auth)
- **Deployment:** Static hosting

## Database Schema

### Tables
- `users` - User profiles with roles
- `teams` - Team definitions with manager IDs
- `daily_metrics` - Daily activity tracking
- `goals` - Monthly/annual goals by user/team
- `fti_schedules` - Interview scheduling
- `placements` - Placement records

## Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project
3. Go to Project Settings > API to get your URL and anon key

### 2. Run Database Migrations

1. In Supabase, go to SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Run the SQL to create all tables, indexes, and RLS policies

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Create First Admin User

1. In Supabase, go to Authentication > Users
2. Click "Add User" and create a user with email/password
3. In the SQL Editor, run:
```sql
INSERT INTO users (id, email, first_name, last_name, role, is_active)
VALUES ('user-uuid-from-auth', 'admin@brixrecruiting.com', 'Admin', 'User', 'admin', true);
```

### 5. Deploy

```bash
npm install
npm run build
# Deploy the dist/ folder to your hosting provider
```

## Role Permissions

| Feature | Admin | Manager | Recruiter |
|---------|-------|---------|-----------|
| View Dashboard | All data | Own team + company | Own data only |
| View Daily Metrics | All | Own team | Own only |
| Input Daily Metrics | All | Own + team | Own only |
| View FTI Board | All | Own team | Own team |
| Edit FTI Board | All | Own team | Own only |
| View Yearly Tracking | All | Own team + company | Own team |
| View Forecasting | All | Own team | Own only |
| Manage Users | Yes | No | No |
| Manage Teams | Yes | No | No |
| Set Goals | All | Own team | No |
| View Leaderboards | Yes | Yes | Yes |

## Crelate API Integration (Future)

The portal is designed to integrate with Crelate API for automatic data sync:

- Job Orders → JO metric
- Submissions → Subs metric
- Interviews → FTI metric
- Placements/Deals → Placement $ and #

To implement:
1. Add Crelate API credentials to environment variables
2. Create a background job (using Supabase Edge Functions or external scheduler)
3. Map Crelate entities to portal metrics

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

For questions or issues, contact your system administrator.

---

Built with ❤️ for Brix Recruiting Partners
