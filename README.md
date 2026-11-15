# AI Interview Platform — Phase 1

An AI-powered interview preparation platform focused on **Communication & Pronunciation Assessment**.

## Features

### ✅ Authentication
- Email/password signup & login (Supabase Auth)
- Protected routes
- Session persistence
- Profile management

### ✅ Communication Practice
- Read-aloud paragraph challenges
- Real-time speech recognition (Web Speech API)
- Live transcript display during recording
- **Raw transcript preservation** — never modified or corrected
- Audio visualizer with microphone input
- Pause/resume recording controls

### ✅ Analysis & Results
- Word-level comparison (expected vs spoken)
- Pronunciation issue detection
- Communication scoring (5 sub-scores)
- Interactive word-level diff with click-to-detail
- Pronunciation tips with IPA and "Listen" button
- Strengths & improvement feedback

### ✅ UI/UX
- Dark/light theme toggle
- Responsive design
- Smooth animations
- Skeleton loaders
- Toast notifications
- Professional SaaS aesthetic

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project

### 1. Clone & Install

```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `server/src/database/schema.sql`
3. Go to **Settings → API** and copy:
   - Project URL
   - Anon (public) key
   - Service role key (secret)

### 3. Environment Variables

Create `client/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Create `server/.env`:
```env
PORT=3001
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

Open **http://localhost:5173** in Chrome or Edge.

---

## Architecture

```
AI LSITNER COMMUNICATION/
├── client/                          # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── AudioVisualizer.tsx   # Canvas-based mic waveform
│   │   │   ├── FeedbackSection.tsx   # Strengths/improvements
│   │   │   ├── MicButton.tsx         # Recording button states
│   │   │   ├── Navbar.tsx            # Top navigation
│   │   │   ├── PronunciationCard.tsx # Expandable pronunciation issues
│   │   │   ├── ProtectedRoute.tsx    # Auth route guard
│   │   │   ├── ScoreCard.tsx         # Circular progress scores
│   │   │   ├── ToastContainer.tsx    # Notification toasts
│   │   │   └── WordComparison.tsx    # Interactive word diff
│   │   ├── context/
│   │   │   ├── AuthContext.tsx       # Supabase Auth state
│   │   │   ├── ThemeContext.tsx      # Dark/light mode
│   │   │   └── ToastContext.tsx      # Toast notifications
│   │   ├── hooks/
│   │   │   └── useSpeechRecognition.ts  # Web Speech API wrapper
│   │   ├── pages/
│   │   │   ├── Landing.tsx           # Hero + features
│   │   │   ├── Login.tsx             # Email/password login
│   │   │   ├── Signup.tsx            # Registration
│   │   │   ├── Dashboard.tsx         # Practice hub
│   │   │   ├── Communication.tsx     # Recording interface
│   │   │   └── Result.tsx            # Score + analysis
│   │   ├── services/
│   │   │   ├── api.ts                # REST API client
│   │   │   └── supabase.ts           # Supabase client
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript types
│   │   ├── App.tsx                   # Root + routing
│   │   ├── main.tsx                  # Entry point
│   │   └── index.css                 # Design system
│   ├── index.html
│   ├── vite.config.ts
│   └── tsconfig.json
├── server/                          # Express + TypeScript
│   ├── src/
│   │   ├── controllers/             # (Future expansion)
│   │   ├── database/
│   │   │   ├── schema.sql           # Full DB schema + seed
│   │   │   └── supabase.ts          # Admin client
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT verification
│   │   │   └── errorHandler.ts      # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.ts              # Auth endpoints
│   │   │   └── communication.ts     # Challenge/session/analysis
│   │   ├── services/
│   │   │   ├── analysis/
│   │   │   │   ├── feedbackService.ts    # Strengths/improvements
│   │   │   │   ├── scoringService.ts     # Score calculation
│   │   │   │   └── wordComparison.ts     # LCS-based word diff
│   │   │   └── pronunciation/
│   │   │       └── pronunciationService.ts  # Phonetic analysis
│   │   └── index.ts                 # Server entry
│   ├── package.json
│   └── tsconfig.json
└── .env.example
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Sign in |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/communication/challenge` | Yes | Fetch random paragraph |
| POST | `/api/communication/session` | Yes | Create session (raw transcript) |
| POST | `/api/communication/analyze` | Yes | Analyze session → scores |
| GET | `/api/communication/result/:id` | Yes | Fetch result |
| GET | `/api/communication/history` | Yes | Past sessions |

---

## How Speech Recognition Works

```
Microphone Input
       ↓
Web Speech API (browser)
       ↓
Raw Transcript (IMMUTABLE)
       ↓
POST /api/communication/session
       ↓
Stored in database (raw_transcript column)
       ↓
POST /api/communication/analyze
       ↓
┌─────────────────────┐
│ Word Comparison      │ → LCS alignment + Levenshtein
│ Pronunciation Check  │ → Phonetic similarity + IPA lookup
│ Score Calculation     │ → Weighted metrics
│ Feedback Generation  │ → Rule-based strengths/improvements
└─────────────────────┘
       ↓
Communication Result with scores + feedback
```

**CRITICAL**: The raw transcript is NEVER modified. Analysis happens separately and never overwrites what the speech recognition returned.

---

## How Pronunciation Analysis Works

**Phase 1 (Current):** Rule-based approach:
1. Compare expected words with spoken words using Levenshtein distance
2. Apply Soundex-like phonetic encoding for similarity detection
3. Look up IPA from a built-in dictionary
4. Generate severity rating and practice tips

**Phase 2 (Future):** The `pronunciationService.ts` is designed as a service interface that can be swapped with:
- Azure Speech Services Pronunciation Assessment
- SpeechAce API
- Custom ML pronunciation model

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends Supabase Auth) |
| `communication_challenges` | Paragraphs to read aloud |
| `communication_sessions` | Practice sessions with **immutable** raw_transcript |
| `communication_results` | Scores, word comparison, feedback |
| `pronunciation_issues` | Per-word pronunciation issues |

---

## Browser Compatibility

| Browser | Speech Recognition | Status |
|---------|-------------------|--------|
| Chrome | ✅ Full support | Recommended |
| Edge | ✅ Full support | Recommended |
| Firefox | ❌ Not supported | Graceful fallback message |
| Safari | ⚠️ Partial | May have issues |

---

## Known Limitations

1. **Web Speech API** depends on Google's cloud speech recognition in Chrome — requires internet connection
2. Speech recognition accuracy varies by accent, microphone quality, and ambient noise
3. Chrome may occasionally stop continuous recognition — auto-restart is implemented
4. Pronunciation analysis in Phase 1 is rule-based, not audio-based — it compares text output, not actual audio
5. The "Listen" button uses browser's SpeechSynthesis — voice quality varies by OS

---

## Future Extensibility (Phase 2+)

The codebase is structured to support:
- Technical Interview module
- HR Interview module
- Coding Interview module
- System Design module
- Audio-based pronunciation assessment
- LLM-enhanced feedback
- Practice history analytics
- User progress tracking
