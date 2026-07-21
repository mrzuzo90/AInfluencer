# AInfluencer: Sistema Autónomo de Creación de Contenido

## Visión

Un sistema completamente autónomo que actúa como showreel de capacidades con IA, demostrando:
- **Inteligencia editorial**: filtrado inteligente de noticias con criterio marketing + datos
- **Automatización compleja**: orquestación de múltiples APIs y servicios
- **Escalabilidad**: arquitectura que puede replicarse a otros nichos
- **Monetización**: contenido diseñado específicamente para engagement y conversión

Publica contenido diariamente en múltiples plataformas basándose en noticias de actualidad, con control manual via WhatsApp/Telegram.

---

## Arquitectura General

```
┌──────────────────────┐
│   NEWS AGGREGATION   │
├──────────────────────┤
│ • NewsAPI            │
│ • Reddit (trending)  │
│ • Twitter/X API      │
│ • Google Trends      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│         INTELLIGENT FILTERING (Claude)   │
├──────────────────────────────────────────┤
│ SCORING:                                 │
│ • Trending Score (0-100): menciones,    │
│   volumen búsquedas, recencia            │
│ • Monetization Score (0-100): emociona-  │
│   lidad, controversia, aplicabilidad     │
│ • Topic Match: rotación temática del día │
│                                          │
│ FINAL = (Trending × 0.4) + (Monetiz × 0.6)
│ → Select TOP 1 per day                   │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│      CONTENT GENERATION (Claude + APIs)  │
├──────────────────────────────────────────┤
│ • Script para shorts (15-30s)            │
│ • Versión LinkedIn (texto + insights)    │
│ • Hooks/angles optimizados para CTR      │
│ • Metadatos (hashtags, keywords)         │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│    VIDEO GENERATION (API externa)        │
├──────────────────────────────────────────┤
│ • Sintetización: texto → narración       │
│ • Stock footage/visuals                  │
│ • Subtítulos automáticos                 │
│ • Branding (watermark/intro)             │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│    SCHEDULED PUBLISHING                  │
├──────────────────────────────────────────┤
│ • YouTube Shorts / TikTok                │
│ • LinkedIn (posts + video)               │
│ • Scheduling: 1 post/día (configurable)  │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│    NOTIFICATIONS + USER CONTROL          │
├──────────────────────────────────────────┤
│ Telegram Bot:                            │
│ • Notif: "Publicado: [enlace]"           │
│ • Comandos: /create [prompt], /delete    │
│ • Analytics: impressions, engagement     │
└──────────────────────────────────────────┘
```

---

## Rotación Temática (Propuesta)

| Día | Tema | Ejemplo |
|-----|------|---------|
| Lunes | 🔬 Tecnología/IA | Breakthrough en IA, ciberseguridad, startups tech |
| Martes | 💼 Negocios/Startups | Funding rounds, layoffs, market trends |
| Miércoles | 💰 Economía/Finanzas | Mercados, inversión, análisis macroeconómico |
| Jueves | 🌍 Actualidad General | Política, sociedad, eventos destacados |
| Viernes | 📈 Tendencias/Análisis | Análisis profundo de la semana, predicciones |

---

## Stack Técnico (Propuesta)

### Backend
- **Runtime**: Node.js + TypeScript (rapid dev + async excellent)
- **Scheduler**: node-cron + Bull queue (para reintentos robustos)
- **Database**: Supabase PostgreSQL (auth included + real-time)
- **API Gateway**: Cloudflare Workers (webhooks de Telegram/plataformas)

### AI/Content
- **Filtering & Generation**: Claude API (Opus para decisiones complejas)
- **Video Generation**: ElevenLabs (narración) + placeholder stock footage provider
- **Imagen/Graphics**: Placeholder (configurar después)

### Publishing
- **YouTube**: oficial API (Shorts)
- **LinkedIn**: oficial API (posts)
- **TikTok**: Restricted; considerar alternativa o wrapper (posible blocker)
- **Telegram**: Official Bot API

### Monitoring
- **Logs**: Pino + Datadog / Sentry
- **Metrics**: promClient + Grafana (opcional Phase 1)

---

## Scoring Detallado

### Trending Score (40% peso final)

```javascript
TRENDING_SCORE = (
  (mentions_last_24h / max_mentions) × 0.4 +
  (search_volume_spike / baseline) × 0.4 +
  (recency_hours < 12 ? 1 : 0.5) × 0.2
) × 100
```

**Fuentes:**
- NewsAPI: trending en categoría
- Reddit: upvotes, comments en r/technology, r/business, r/worldnews
- Twitter: retweets + replies
- Google Trends: comparación vs baseline

### Monetization Score (60% peso final)

```javascript
MONETIZATION_SCORE = (
  emotionality_rating × 0.35 +          // Surprise, controversy, inspiration
  shareability_rating × 0.35 +          // "Me lo cuento a un amigo"
  personal_relevance × 0.20 +           // "Esto me aplica"
  engagement_hook_potential × 0.10
) × 100
```

**Criterios:**
- **Emotionality**: sorpresa (+30), miedo (+20), inspiración (+25), curiosidad (+35)
- **Shareability**: polaridad controlada (no extrema), trending pero no saturado
- **Relevance**: afecta inversión personal, carrera, dinero, tendencias
- **Hook Potential**: título/primer frame que obliga click

---

## Fases de Desarrollo

### ✅ FASE 0: Setup — Completa
- [x] Crear repo
- [x] Setup CI/CD (GitHub Actions)
- [x] Setup Claude.md + memoria
- [ ] Configure Supabase project — plantilla lista (`migrations/`), proyecto real aún no creado por el usuario
- [ ] Config credentials (NewsAPI, Twitter, Telegram, etc.) — pendiente de que el usuario las ingrese

### ✅ FASE 1: MVP — Completa
**Objetivo**: Sistema end-to-end funcionando con LinkedIn + Telegram

- [x] News aggregation pipeline (NewsAPI + Reddit + samples fallback; Google Trends no implementado)
- [x] Intelligent filtering (scoring 40% trending / 60% monetización)
- [x] Content generation (Claude `claude-sonnet-5` + template fallback)
- [x] LinkedIn publishing (draft real; llamada real a LinkedIn API sigue pendiente — placeholder honesto)
- [x] Telegram notifications (bot setup, publish notifications; comandos ver Fase 3)

**Output**: 1 post/día a LinkedIn, notif vía Telegram ✅

---

### ✅ FASE 2: Video + YouTube Shorts — Code-complete (ver sección detallada más abajo)

- [x] Script optimization para video
- [x] Video generation pipeline (ElevenLabs, Pexels, subtítulos quemados, watermark)
- [x] YouTube Shorts API integration (upload real)
- [x] Dashboard: view metrics (YouTube Analytics) vía `/analytics`
- [ ] Scheduler para dual publishing coordinado (hoy LinkedIn y YouTube publican independientemente)

**Output**: Videos de 15-30s — código completo, **no probado con ffmpeg/credenciales reales** (ver caveat en la sección detallada)

---

### 🟡 FASE 3: User Control + Refinement — Mayormente completa

- [x] Telegram commands (`/create-trending`, `/create-hybrid`, `/schedule`, `/analytics`, `/draft-list`, `/publish` — todos reales)
- [ ] Draft review system con preview visual (hoy solo texto)
- [x] Analytics dashboard (impressions, engagement — trending/ROI comparisons no implementados)
- [ ] Feedback loop (ajuste automático de scoring basado en performance) — no implementado

**Output**: Sistema con control manual ✅ + self-learning ❌ (pendiente)

---

### 🌐 FASE 4: Expansion (Post-MVP) — No iniciada
- TikTok integration (requiere workaround; posible blocker)
- Instagram Reels
- Blog syncing (WordPress/Medium)
- Multi-language support
- Advanced analytics + BI

---

## Decisiones Clave Tomadas

| Decisión | Valor | Razón |
|----------|-------|-------|
| Scoring split | 40% trending, 60% monetización | Trending garantiza relevancia, monetización garantiza ROI |
| Cadencia | 1 post/día | Sostenible, permite perfeccionar; fácil de aumentar |
| Plataforma inicial | LinkedIn | APIs más abiertas, menos restrictivas que TikTok |
| Video generation | ElevenLabs + stock footage | Rápido, affordable, outputs consistentes |
| DB | PostgreSQL (Supabase) | Relational data (news, posts, analytics), auth included |
| Scheduler | Bull queue | Retry logic robusio, tracking de jobs |
| Notificaciones | Telegram | API open, rápido, mejor UX que SMS/email |

---

## Estrategia de Modelos Claude

**Principio**: Capacidad mínima necesaria para no matar moscas a cañonazos.

| Fase | Task | Modelo Default | Excepciones | Reasoning |
|------|------|---|---|---|
| **FASE 0** | Setup general | **Haiku 4.5** | — | Tareas administrativas simples, no requiere reasoning |
| **FASE 1** | Scoring/Filtering (critical) | **Sonnet 5** | **Opus 4.8** si fallan evals | Requiere reasoning profundo sobre múltiples factores; Sonnet es capaz + económico |
| **FASE 1** | Content generation (scripts, posts) | **Sonnet 5** | **Opus 4.8** para prompt eng inicial (una sola vez) | Sonnet maneja generation bien; Opus solo para ajustar prompts |
| **FASE 1** | Integración APIs simples | **Haiku 4.5** | — | Parsing, formatting, no reasoning necesario |
| **FASE 2** | Script optimization para video | **Sonnet 5** | — | Requiere contexto de formato video pero no es crítico |
| **FASE 2** | Generación de subtítulos | **Haiku 4.5** | — | Conversión texto simple, no reasoning |
| **FASE 3** | Analytics + feedback analysis | **Sonnet 5** | — | Análisis de patterns y performance |
| **FASE 3** | Comandos Telegram simples | **Haiku 4.5** | — | Parsing de comandos, respuestas templated |
| **FASE 4** | Expansion tasks | **Sonnet 5** | **Opus 4.8** para decisiones arquitectónicas | Default Sonnet, escalable |

**Regla de revisión**: Si recomiendo usar un modelo diferente al default de la fase actual, **DEBO pedir tu confirmación ANTES** de proceder.

> **Auditoría (2026-07-22)**: se encontró que `generation/contentGenerator.ts`, `hybrid-profile/hybridGenerator.ts` y `filtering/monetizationScorer.ts` usaban `claude-opus-4-5-20250805` — un model ID inválido, y además Opus sin la confirmación previa que exige esta regla. Corregido a `claude-sonnet-5` (el default correcto de Fase 1) en todos los casos.

**Presupuesto estimado (monthly)**:
- FASE 1: ~$50-80 (30 scoring calls @ Sonnet + content generation)
- FASE 2: +$30-50 (video scripts + metadata)
- FASE 3: ~$20-30 (análisis + feedback)
- FASE 4: Scale según volumen

---

## Potenciales Blockers + Soluciones

| Blocker | Solución |
|---------|----------|
| **TikTok API restrictiva** | Start con LinkedIn + YouTube; TikTok es Phase 4 (o usar wrapper como TikTok Desktop) |
| **Rate limits** | Caching de noticias, throttling inteligente, queue system |
| **Calidad de video** | Empezar con narración + subtítulos simples; mejorar iterativamente |
| **Copyright en stock footage** | Usar APIs de stock video gratuitas (Pixabay, Pexels) o licencia anual |
| **Costo de APIs** | NewsAPI $50/mes, ElevenLabs pay-as-you-go (~$5-20/mes), Claude API según volumen (ver Estrategia de Modelos) |

---

## Métricas de Éxito (Fase 1)

- ✅ Sistema publica 1 post/día sin intervención manual
- ✅ Scoring predice "buen contenido" con ~70%+ accuracy (medido por engagement)
- ✅ 0 errores críticos en 30 días
- ✅ Tiempo promedio: news → publish < 4 horas
- ✅ Notificaciones Telegram llegan 100% de las veces

---

## Próximos Pasos

1. **Setup inicial** (hoy): crear repo, estructura base
2. **Arquitectura detallada**: definir schemas DB, API contracts
3. **Environment setup**: credentials, CI/CD
4. **Desarrollo iterativo**: Phase 1 feature by feature
5. **Testing**: antes de publicar en vivo

---

## Skills de Claude Code

**Filosofía**: Minimizar tokens y mantener contexto entre sesiones sin re-explicar el proyecto.

### Tier 1: Críticas (Usa siempre)

| Skill | Cuándo | Qué hace |
|-------|--------|----------|
| **Memory** | Automático | Persiste contexto del proyecto entre sesiones (auto-memoria configurada) |
| **code-review** | Pre-commit crítico | `/code-review low` = verificación rápida; `/code-review high` en scoring logic |
| **verify** | Post-feature | Prueba end-to-end: news → publish → Telegram notification |
| **schedule** | Setup Phase 1 | Reemplaza Bull queue; `/schedule` para publicación diaria automática |
| **loop** | Phase 1+ | `/loop 30m /monitor` = verificar que el sistema está vivo cada 30 min |

### Tier 2: Útiles (Usa en checkpoints)

| Skill | Cuándo | Qué hace |
|-------|--------|----------|
| **init** | Enriquecimiento | `/init` expande CLAUDE.md con DB schemas + API contracts |
| **simplify** | Post-Fase-1 | Refactor de utilities, queues, helpers sin sobre-ingeniería |
| **run** | Dev local | `/run` lanza la app; prueba que news → publish funciona |
| **claude-api** | Referencia | Recordar pricing, rate limits, token counting de modelos |

### Tier 3: Auxiliares (Usa si necesitas)

| Skill | Cuándo | Qué hace |
|-------|--------|----------|
| **fewer-permission-prompts** | Setup | Reduce prompts repetitivos en herramientas comunes |
| **security-review** | Pre-producción | Audita API keys, auth, credenciales antes de ir vivo |
| **dataviz** | Fase 3 | Dashboard de analytics (cuando agregues visualización de metrics) |

### Regla de oro

**Si recomiendo cambiar de skill o método**: Te pido confirmación ANTES. No hago nada sin ok.

---

## Notas de Desarrollo

- **Logging everywhere**: necesitaremos visibilidad total en early stages
- **Gradual rollout**: Phase 1 publica en "draft" o cuenta test antes de vivo
- **Prompt engineering**: 50% del éxito está en los prompts para Claude
- **Monitoring**: alertas si scoring falleć, si APIs caen, si queue se queda atrás
- **Documentation**: cada componente debe tener docstring claro

---

## Status & Próximos Pasos

### ✅ COMPLETADO

**Fase 0**: Setup inicial ✓
- Repo git inicializado
- TypeScript + Node.js configurado
- CI/CD con GitHub Actions
- Estructura base creada

**Fase 1**: MVP end-to-end ✓
- News aggregation: Reddit (público) + NewsAPI (opcional) + samples (fallback)
- Intelligent filtering: scoring trending/monetization (40/60 split)
- Content generation: Claude API (si disponible) o templates
- Publishing: Draft mode (default, seguro) + LinkedIn (OAuth ready)
- Notifications: Console (default) + Telegram Bot (opcional)
- Database: In-memory (dev) + Supabase PostgreSQL (production-ready)
- Scheduler: node-cron (9am diario) o manual one-shot
- **Pipeline ejecuta end-to-end sin ninguna credencial**

**Hybrid Profile System**: Activo ✓
- 8 tópicos predefinidos (IA + Electricidad)
- Cadencia automática: 1 de cada 5 posts (configurable)
- On-demand generation ready (para `/create-hybrid`)
- Integrated into main pipeline: trending + hybrid alternating
- Claude + template fallbacks

---

## Fase 2: Video + YouTube Shorts — ✅ Completa (code-complete, untested with real ffmpeg/credentials)

### Tasks
- [x] Video script optimization (15-30s, high-engagement) — `video/scriptOptimizer.ts`
- [x] ElevenLabs integration (text-to-speech narración) — `video/narrationGenerator.ts`; only calls the real (billed) API when `PUBLISH_LIVE=true`, template estimate otherwise
- [x] Stock footage provider (Pexels API + placeholder fallback) — `video/stockFootageProvider.ts`
- [x] Subtitle generation (burned-in, sync con narración) — `video/videoRenderer.ts` (ffmpeg `subtitles` filter)
- [x] Branding layer (watermark) — `video/videoRenderer.ts` (ffmpeg `drawtext` filter, `VIDEO_WATERMARK_TEXT`)
- [x] YouTube Shorts API integration — real resumable upload in `publishing/youtubePublisher.ts`
- [x] Dashboard: view metrics (YouTube Analytics) — `publishing/youtubeAnalytics.ts`, wired into `/analytics`
- [ ] Dual publishing: LinkedIn post + YouTube Short (same content) — both publish independently today (`publishing/videoPublisher.ts`), not yet a single coordinated "same content, two platforms" flow
- [ ] intro/outro — only a still watermark exists, no animated intro/outro clip

**Estado del renderizado real (2026-07-22)**: ffmpeg (`ffmpeg-full`, con libass) fue instalado y el renderizado se probó de punta a punta — genera un `.mp4` real 1080x1920 (h264+aac), duración correcta, subtítulos quemados y watermark verificados visualmente. En el proceso se encontraron y corrigieron 2 bugs reales que solo aparecían con un binario real:
1. El `force_style` de subtítulos con comillas simples anidadas no lo parsea ffmpeg 8.x (hay que escapar comas con `\,`)
2. Combinar `scale+crop+setsar+fps` en una sola cadena de filtros hacía que el watermark apareciera arriba en vez de abajo — se corrigió separando `fps` en su propio paso.

**Todavía sin probar**: stock footage real de Pexels (sin API key en este entorno, solo se verificó el fallback de fondo negro), narración real de ElevenLabs (sin API key, solo template), y el upload real a YouTube (sin credenciales OAuth reales). Antes de producción: configurar `PEXELS_API_KEY`, `ELEVENLABS_API_KEY` y credenciales de YouTube, y correr el pipeline una vez más para confirmar esas 3 piezas. Ver `PHASE_2_3_SETUP.md`.

### Technical
- `src/video/`
  - `scriptOptimizer.ts` - adapt for video (shorter, punchier)
  - `narrationGenerator.ts` - ElevenLabs client (gated behind `PUBLISH_LIVE`)
  - `stockFootageProvider.ts` - Pexels client + placeholder fallback
  - `videoRenderer.ts` - ffmpeg-based mp4 assembly (footage + narration + burned-in subs + watermark)
  - `videoAssembler.ts` - orchestrates the above into a `CompiledVideo`
- `src/publishing/`
  - `youtubePublisher.ts` - real resumable upload (falls back to honest 'scheduled'/'draft' placeholder without ffmpeg/credentials)
  - `youtubeAnalytics.ts` - views/likes/comments fetch for `/analytics`
  - `videoPublisher.ts` - multi-platform orchestration (draft vs live, text + video)

### Configuration
```
ELEVENLABS_API_KEY=          # https://elevenlabs.io/sign-up
ELEVENLABS_VOICE_ID=eleven_monolingual_v1
YOUTUBE_CLIENT_ID=           # OAuth credential (get via npm run get-youtube-token)
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=
YOUTUBE_PRIVACY_STATUS=unlisted   # public | unlisted | private
PEXELS_API_KEY=              # https://www.pexels.com/api/ (free)
VIDEO_WATERMARK_TEXT=AInfluencer
VIDEO_OUTPUT_DIR=./output
PUBLISH_VIDEO=true           # Enable video generation
```
Requires the `ffmpeg` binary on PATH, built with `libass` for burned-in subtitles (`brew install ffmpeg-full && brew link --overwrite ffmpeg-full` on macOS — the plain `ffmpeg` formula lacks `libass`; `apt install ffmpeg` on Debian/Ubuntu already includes it) — without it, video generation silently degrades to audio+metadata only.

---

## Fase 3: User Control + Analytics — 🟡 Mayormente completa

### Telegram Bot Commands
- [x] `/create-hybrid [topic-id]` - generate hybrid post on-demand (el `[topic-id]` específico todavía se ignora — usa el que decida el scheduler, ver TODO en `botCommandHandler.ts`)
- [x] `/create-trending` - generate from today's news
- [x] `/schedule [HH:MM]` - reprograma el cron real (`scheduler.ts: rescheduleDailyRun`)
- [x] `/analytics` - real, con refresh de YouTube Analytics cuando hay credenciales
- [x] `/draft-list` - lista drafts reales desde `postRepo`
- [x] `/publish [draft-id]` - publica de verdad (LinkedIn o YouTube según el draft), actualiza el status

**Importante**: el bot nunca se arrancaba — `botCommandHandler.startPolling()` no estaba conectado a `index.ts`. Ya corregido: se arranca automáticamente cuando `TELEGRAM_BOT_TOKEN` está configurado.

### Analytics Dashboard
- [x] impressions, clicks, shares per post — `shared/repository/analyticsRepository.ts` (in-memory + Supabase real vía `post_metrics` table, `migrations/002_post_metrics.sql`)
- [ ] trending topics that worked (scoring accuracy) — no implementado
- [ ] hybrid vs trending performance comparison — no implementado
- [ ] ROI by category/topic — no implementado

### Pendiente (no implementado)
- [ ] Draft review system con preview visual antes de publicar (hoy `/draft-list` es solo texto)
- [ ] Feedback loop: ajuste automático de scoring basado en performance real

### Technical
- `src/telegram/`
  - `botCommandHandler.ts` - command routing (real, no stubs)
- `src/shared/telegramClient.ts` - cliente HTTP compartido (sendMessage + getUpdates), usado tanto por el bot como por `notifications/notifier.ts`
- `src/scheduler.ts` - soporta reprogramación dinámica (`rescheduleDailyRun`)
- `pipeline.ts` exporta `runHybridPost()` / `runTrendingPost()` directamente (en vez de un único `runPipeline()` que decidía por su cuenta)

### Configuration
```
TELEGRAM_BOT_TOKEN=          # https://t.me/BotFather
TELEGRAM_CHAT_ID=            # npm run get-telegram-chat-id
PUBLISH_LIVE=false           # Safe default; set true to auto-publish from bot
```

---

## Fase 4: Expansion (Post-MVP)

### Features
- [ ] TikTok integration (requires workaround - see CLAUDE.md blockers)
- [ ] Instagram Reels publishing
- [ ] Multi-language support (Claude translation)
- [ ] Blog/Medium syncing
- [ ] Advanced analytics: LLM-powered insights ("this topic got 3x engagement")
- [ ] A/B testing hooks/CTAs
- [ ] SEO optimization (keywords, meta tags)

### Potential Blockers
| Issue | Solution |
|-------|----------|
| TikTok API restrictive | Use unofficial SDK or desktop automation wrapper |
| High API costs (Claude, ElevenLabs) | Cache responses, batch generation, fallback templates |
| Rate limits | Implement exponential backoff, throttling |
| Video storage | Cloud bucket (S3, Cloudinary) instead of local |

---

## Important Environment Variables

### Required (for basic operation)
```
NODE_ENV=development          # or production
LOG_LEVEL=debug               # or info, warn, error
SCHEDULER_ENABLED=false       # set true for automatic 9am runs
```

### API Keys (optional, auto-activate integrations)
```
ANTHROPIC_API_KEY=            # Claude (scoring, generation) — model: claude-sonnet-5
SUPABASE_URL=                 # PostgreSQL persistence
SUPABASE_ANON_KEY=
TELEGRAM_BOT_TOKEN=           # Notifications + bot commands
TELEGRAM_CHAT_ID=             # npm run get-telegram-chat-id
NEWSAPI_KEY=                  # Additional news source
LINKEDIN_CLIENT_ID=           # Production publishing
LINKEDIN_CLIENT_SECRET=
ELEVENLABS_API_KEY=           # Phase 2 (video narration)
YOUTUBE_CLIENT_ID=            # Phase 2 (video upload) — npm run get-youtube-token
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=
YOUTUBE_PRIVACY_STATUS=unlisted  # public | unlisted | private
PEXELS_API_KEY=               # Phase 2 (stock footage, free tier)
```
Requires `ffmpeg` on PATH for real video rendering (Phase 2) — see `PHASE_2_3_SETUP.md`.

### Configuration Flags
```
PUBLISH_LIVE=true             # Auto-publish (default false = draft only)
PUBLISH_VIDEO=true            # Generate + publish video content (default false)
HYBRID_RATIO=5                # 1 of every 5 posts is hybrid (default)
HYBRID_ENABLED=true           # Toggle hybrid system (default)
VIDEO_WATERMARK_TEXT=AInfluencer
VIDEO_OUTPUT_DIR=./output
```

---

## Quick Commands

```bash
# Development (runs pipeline once, no scheduler)
npm run dev

# Build TypeScript
npm run build

# Tests
npm run test:run

# Type-check
npm run lint

# One-time OAuth flow to get YOUTUBE_REFRESH_TOKEN
npm run get-youtube-token

# Print your Telegram chat id (send the bot a message first)
npm run get-telegram-chat-id

# View database / run migrations (Supabase web UI SQL Editor)
# https://supabase.com/dashboard — paste migrations/001_init.sql, then 002_post_metrics.sql
```

---

## Architecture Summary

### Current Stack
- **Runtime**: Node.js + TypeScript (ESM)
- **APIs**: Claude (Anthropic, `claude-sonnet-5`), Supabase (PostgreSQL), Telegram Bot, NewsAPI, Reddit JSON, ElevenLabs, Pexels, YouTube Data API v3
- **Scheduler**: node-cron, reprogrammable at runtime via `/schedule` (`scheduler.ts: rescheduleDailyRun`)
- **Database**: In-memory (Map) or Supabase (swap via factory pattern) — articles, posts, and analytics all follow this pattern
- **Publishing**: Draft (default) → LinkedIn (OAuth, posts only — no real API call implemented) → YouTube Shorts (real resumable upload, requires ffmpeg-rendered video)
- **Video rendering**: ffmpeg (local binary) assembles Pexels stock footage + ElevenLabs narration + burned-in subtitles + watermark into an mp4; degrades to audio+metadata-only if ffmpeg/footage aren't available
- **Notifications**: Console (default) → Telegram Bot (optional), shared HTTP client with the bot command handler
- **Bot**: Telegram polling loop (exponential backoff on errors), started automatically when `TELEGRAM_BOT_TOKEN` is set

### Key Files
- `src/pipeline.ts` - exports `runHybridPost()` / `runTrendingPost()`, plus `runPipeline()` which picks one via the scheduler's rotation
- `src/shared/repository/factory.ts` - database abstraction (in-memory vs Supabase) for articles, posts, **and analytics**
- `src/hybrid-profile/hybridScheduler.ts` - cadence control (1/N posts), reads ratio from `shared/config.ts`
- `src/filtering/select.ts` - 40% trending + 60% monetization scoring
- `src/video/videoAssembler.ts` - orchestrates script → narration → footage → render into a `CompiledVideo`
- `src/publishing/videoPublisher.ts` - `selectPublisher()` is the single source of truth for draft/LinkedIn/video routing
- `src/shared/telegramClient.ts` - shared Telegram HTTP client (bot + notifier)
- `.env.example` - credential template with links

### Folder Structure
```
src/
├── aggregation/       (News sources)
├── filtering/         (Scoring, selection)
├── generation/        (Content creation)
├── publishing/        (Draft, LinkedIn, YouTube upload + analytics, video orchestration)
├── notifications/     (Console, Telegram)
├── hybrid-profile/    (Your unique positioning)
├── video/             (Script optimization, narration, stock footage, ffmpeg rendering)
├── telegram/          (Bot command handler)
├── shared/
│   ├── repository/    (DB abstraction: articles, posts, analytics)
│   ├── telegramClient.ts
│   ├── config.ts      (Flexible, no throw on missing keys)
│   └── types.ts       (Article, Post, GeneratedContent)
├── pipeline.ts        (Main orchestration)
├── scheduler.ts       (Cron + dynamic rescheduling)
└── index.ts           (Entry point — starts scheduler AND bot polling)

scripts/               (get-youtube-token, get-telegram-chat-id — one-time setup helpers)
migrations/            (SQL schemas - run manually in Supabase SQL Editor)
.github/workflows/     (CI/CD - TypeScript, tests)
```

---

## What to Focus On Next Session

1. **Test the remaining Fase 2 unknowns with real credentials**:
   - ffmpeg rendering itself is confirmed working (see caveat above) — what's left is Pexels footage, ElevenLabs narration, and YouTube upload
   - Add `PEXELS_API_KEY`, `ELEVENLABS_API_KEY`, YouTube OAuth creds
   - Run `PUBLISH_VIDEO=true npm run dev` and confirm real stock clips get concatenated (not just the solid-background fallback)
   - Flip `PUBLISH_LIVE=true` and confirm an actual YouTube upload succeeds end-to-end

2. **Remaining Fase 3 gaps**:
   - `/create-hybrid [topic-id]` still ignores the specific topic id
   - No draft review system with visual preview (text-only via `/draft-list`)
   - No feedback loop (scoring doesn't adjust based on real performance yet)

3. **Fase 4** (not started): TikTok, Instagram Reels, multi-language, SEO optimization — see blockers table above

4. **Customize hybrid topics** if the 8 don't fit your exact angle
   - Edit `src/hybrid-profile/hybridTopics.ts`

---

**Status**: Fase 1 ✅ Complete. Fase 2 (Video) and Fase 3 (Bot Control + Analytics) are code-complete but **untested with real ffmpeg/API credentials** — see caveats above. Fase 4 not started.
