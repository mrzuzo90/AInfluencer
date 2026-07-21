# Fase 2 & 3 Setup Guide

This guide walks you through configuring credentials for **Fase 2 (Video + YouTube)** and **Fase 3 (Bot Control + Analytics)**.

---

## Phase 2: Video Generation & YouTube Shorts

### Step 0: ffmpeg (required for real video rendering)

Without this, the pipeline still runs but only produces narration audio +
subtitle metadata — no actual `.mp4` file, and nothing gets uploaded to
YouTube even with valid credentials (`youtubePublisher` falls back to a
`'scheduled'` placeholder when there's no rendered file).

**Important**: the plain `ffmpeg` Homebrew formula does **not** include
`libass`, so the `subtitles` filter (burned-in captions) isn't available
and rendering fails with `No such filter: 'subtitles'`. Use `ffmpeg-full`
instead (or any build with `--enable-libass`):

```bash
# macOS — ffmpeg-full includes libass (subtitles) + many more codecs
brew install ffmpeg-full
brew link --overwrite ffmpeg-full   # make it the `ffmpeg` on PATH

# Debian/Ubuntu — the distro package usually already includes libass
sudo apt install ffmpeg

# Verify: this line must appear, or subtitles will silently be skipped
ffmpeg -filters 2>/dev/null | grep subtitles
```

### Step 0b: Pexels (stock footage, optional but recommended)

1. Go to https://www.pexels.com/api/ and request a free API key (instant, no card)
2. In `.env`, set:
   ```
   PEXELS_API_KEY=your_api_key_here
   ```
Without this, rendered videos use a solid black background instead of stock footage.

### Step 1: ElevenLabs (Text-to-Speech)

1. Go to https://elevenlabs.io/sign-up and create account
2. Navigate to **Account > API Keys**
3. Copy your API key
4. In `.env`, set:
   ```
   ELEVENLABS_API_KEY=your_api_key_here
   ELEVENLABS_VOICE_ID=eleven_monolingual_v1
   ```
5. Test:
   ```bash
   PUBLISH_VIDEO=true npm run dev
   ```
   Look for: `🎙️ Generated narration (xxx bytes)`

**Cost**: Pay-as-you-go (~$5-20/month for 1 post/day)

---

### Step 2: YouTube Shorts API

1. Go to https://console.cloud.google.com and create project
2. Enable **YouTube Data API v3**:
   - Click "Enable APIs and Services"
   - Search "YouTube Data API v3"
   - Click "Enable"
3. Create OAuth 2.0 credentials:
   - Go to **Credentials** > **Create Credentials** > **OAuth client ID**
   - Choose **Desktop app** (or Web app)
   - Download the JSON file
   - Extract `client_id` and `client_secret`
4. Add the redirect URI `http://localhost:8765/oauth2callback` to the OAuth client's authorized redirect URIs
5. In `.env`, set `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET`, then run:
   ```bash
   npm run get-youtube-token
   ```
   Open the printed URL, authorize, and the script prints your `YOUTUBE_REFRESH_TOKEN` — add it to `.env`.
6. Enable video publishing:
   ```
   PUBLISH_VIDEO=true
   PUBLISH_LIVE=true
   YOUTUBE_PRIVACY_STATUS=unlisted   # or public / private
   ```

**Cost**: Free (API quota: 10,000 units/day)

---

## Phase 3: Telegram Bot Commands & Analytics

### Step 1: Telegram Bot Setup

1. Open Telegram and message **@BotFather**
2. Type `/newbot` and follow instructions
3. Copy the token (format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
4. In `.env`, set:
   ```
   TELEGRAM_BOT_TOKEN=your_token_here
   ```

### Step 2: Get Your Chat ID (Optional)

If you want bot to send you notifications:

1. Forward a message from any chat to **@userinfobot**
   (It will reply with your chat ID)
2. Or use this command to auto-detect:
   ```bash
   npm run get-telegram-chat-id
   ```
3. In `.env`, set:
   ```
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```

### Step 3: Start Bot

```bash
TELEGRAM_BOT_TOKEN=your_token npm run start
```

**Available Commands**:
- `/create-trending` - Generate post from today's news
- `/create-hybrid [topic-id]` - Generate hybrid (AI + Electrical)
- `/schedule [HH:MM]` - Schedule post at specific time
- `/analytics` - Show today's performance
- `/draft-list` - List pending drafts
- `/publish [draft-id]` - Approve & publish draft
- `/help` - Show all commands

---

## Phase 3: Analytics Database

### Option A: In-Memory (Default, for testing)

No setup needed. Analytics stored in app memory (resets on restart).

### Option B: Supabase PostgreSQL (Production)

1. Create project at: https://supabase.com/dashboard/projects
2. In **Project Settings > API**, copy:
   - URL
   - Anon Key
3. In `.env`, set:
   ```
   SUPABASE_URL=your_url_here
   SUPABASE_ANON_KEY=your_anon_key_here
   ```
4. Apply the migrations: open the Supabase dashboard's **SQL Editor** and
   paste/run `migrations/001_init.sql` then `migrations/002_post_metrics.sql`
   (no CLI migration runner is set up in this repo)

---

## Configuration Flags

```bash
# ===== Publishing =====
PUBLISH_LIVE=true         # Auto-publish to platforms (requires credentials)
PUBLISH_LIVE=false        # Draft only (safe, default)

# ===== Video =====
PUBLISH_VIDEO=true        # Generate & publish video
PUBLISH_VIDEO=false       # Text only

# ===== Hybrid Profile =====
HYBRID_ENABLED=true       # Enable hybrid content rotation
HYBRID_RATIO=5            # 1 of every 5 posts is hybrid

# ===== Scheduler =====
SCHEDULER_ENABLED=true    # Daily posting at 9am
SCHEDULER_ENABLED=false   # Manual only (default)
```

---

## Testing Without Credentials

All features degrade gracefully:

```bash
# Text only, no video
npm run dev

# With Anthropic (better content)
ANTHROPIC_API_KEY=sk-... npm run dev

# With Telegram notifications
TELEGRAM_BOT_TOKEN=... npm run dev

# With analytics
SUPABASE_URL=... SUPABASE_ANON_KEY=... npm run dev
```

---

## Troubleshooting

### ElevenLabs API Errors
```
ELEVENLABS_API_KEY not configured
→ Check ELEVENLABS_API_KEY in .env
→ Verify API key is valid at https://elevenlabs.io/account
```

### YouTube OAuth Issues
```
OAuth error: ... statusText
→ Check YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET
→ Ensure refresh token is still valid (may expire after 6 months of inactivity)
→ Re-authenticate: npm run get-youtube-token
```

### Telegram Bot Not Responding
```
Telegram bot token not configured
→ Set TELEGRAM_BOT_TOKEN in .env
→ Verify token format: number:string (e.g., 123456:ABC-...)
→ Test polling: npm run start
```

---

## Cost Summary

| Service | Cost | Usage |
|---------|------|-------|
| **ElevenLabs** | $5-20/mo | 1 narration/day @ 30s |
| **YouTube API** | Free | 10k units/day quota |
| **Telegram Bot** | Free | Unlimited messages |
| **Supabase** | Free (5GB DB) | Analytics storage |
| **Claude API** | Variable | Scoring + content gen (Phase 1) |
| **NewsAPI** | Free-$50 | 100-1000 requests/day |

**Total estimate**: $10-50/month for full system

---

## Next Steps

1. **Pick Phase 2 or 3** (or both)
2. **Set credentials** in `.env`
3. **Test with mock data**:
   ```bash
   npm run dev
   ```
4. **Monitor logs** for integration status
5. **Iterate** on prompts & content

Questions? Check [CLAUDE.md](./CLAUDE.md) for architecture & blocking issues.
