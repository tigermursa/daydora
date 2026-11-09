# Daydora

**Live:** https://daydora.vercel.app/

A date-remembering app — add birthdays, anniversaries, deadlines, or any important day and track how many days are left.

**Features:** Multi-user signup/login (name, email, password) · Strict per-user isolation — each account only sees its own dates · 20-min sliding session · Home shows upcoming events sorted by nearest date, today's events highlighted on top · Full CRUD with toast notifications · Yearly recurrence for birthdays/anniversaries · Month-view calendar · Fully responsive dark-green UI.

**Stack:** Next.js 16 + React 19 + TypeScript + Tailwind v4 + Lucide icons + MongoDB Atlas + Sonner · Deployed on Vercel.

**Old events migration:** Events created before accounts existed have no owner and are hidden from everyone. Assign them once to your account:

```bash
node scripts/migrate-events.mjs <your-email>
```
