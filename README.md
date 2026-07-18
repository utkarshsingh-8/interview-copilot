# 🧠 Interview Copilot

**Live:** https://interview-copilot-u.vercel.app


A personal, AI-powered **interview preparation platform** built as an iPhone-style
web app (installable PWA) — grounded entirely in **Utkarsh Singh's resume**. It
acts like a senior AI engineer mentoring you every day so you can confidently
crack AI Engineering interviews.

> Not a generic prep site. Every question, answer, and drill is tailored to the
> real projects, skills, and experience on the resume.

## ✨ Features (v1)

| Tab | What it does |
| --- | --- |
| 🏠 **Home** | Interview Readiness score, strongest topics, weak areas, "practice today" tasks, live stats |
| 💬 **Q&A** | Curated, resume-grounded questions with strong model answers. Search, filter by topic/difficulty, self-rate confidence, and **generate harder ones with AI** |
| 🎤 **Mock** | Realistic mock rounds (HR, AI Engineering, Backend, LLM, System Design, Project, Hiring Manager). Answer → reveal → self-rate → scored session |
| 📚 **Learn** | AI mentor that explains any concept interview-style: analogy, technical depth, code snippet, and likely follow-ups |
| 👤 **Profile** | Structured resume viewer + **AI resume review** (senior-recruiter feedback with rewrites) + settings |

Plus:
- 🔒 **Face ID lock** (WebAuthn) — biometric gate on iPhone Safari / installed PWA
- 📲 **PWA** — "Add to Home Screen" for a native app feel
- 💾 Works **fully offline** on `localStorage`; optional cloud sync via Supabase

## 🧱 Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — minimalist iOS/lavender design
- **Groq** (`llama-3.3-70b-versatile`) for AI — question generation, mentor, resume review
- **Supabase** (optional) — Postgres + Auth for cloud sync
- **WebAuthn** — Face ID / biometric lock

## 🚀 Getting started

```bash
npm install
cp .env.example .env.local   # add your keys (see below)
npm run dev                  # http://localhost:3000
```

The app runs **without any keys** using the curated question set. To unlock AI
features add a **free** Groq key:

```env
GROQ_API_KEY=gsk_...
```

Get one at <https://console.groq.com/keys>.

### Optional: cloud sync (Supabase)

1. Create a project at <https://supabase.com>.
2. Run `supabase/schema.sql` in the SQL editor.
3. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

## 📱 Install on iPhone

1. Deploy (Vercel recommended) so the app is served over HTTPS — required for
   both PWA install and Face ID/WebAuthn.
2. Open the URL in **Safari** → Share → **Add to Home Screen**.
3. Launch it, enable **Face ID** on first run.

## ☁️ Deploy to Vercel

1. Push to GitHub (already set up).
2. Import the repo at <https://vercel.com/new>.
3. Add `GROQ_API_KEY` (and Supabase vars if used) as environment variables.
4. Deploy.

## 🗺️ Roadmap

- Manual resume editing + AI PDF parsing on upload
- Company-specific prep plans
- Behavioral (STAR) answer coach
- Progress graphs & revision streaks
- Voice mock interviews, live coding rounds

## 📁 Structure

```
app/
  (app)/            # tabbed shell: home, questions, mock, learn, profile
  api/              # generate | learn | review  (Groq-backed)
components/         # QuestionsView, MockView, LearnView, DashboardView, ProfileView, TabBar, LockGate
lib/                # resume, questions (seed), progress store, ai (Groq), supabase
supabase/schema.sql # optional cloud schema
```

---

Built for **Utkarsh Singh** · [GitHub](https://github.com/utkarshsingh-8)
