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

### ✅ FASE 0: Setup (1-2 días)
- [ ] Crear repo
- [ ] Setup CI/CD (GitHub Actions)
- [ ] Configure Supabase project
- [ ] Setup Claude.md + memoria
- [ ] Config credentials (NewsAPI, Twitter, Telegram, etc.)

### 🚀 FASE 1: MVP (2-3 semanas)
**Objetivo**: Sistema end-to-end funcionando con LinkedIn + Telegram

- [ ] News aggregation pipeline
  - [ ] NewsAPI integration
  - [ ] Reddit scraper
  - [ ] Google Trends integration
- [ ] Intelligent filtering
  - [ ] Scoring LLM system
  - [ ] Daily selection logic
  - [ ] Database de noticias evaluadas
- [ ] Content generation
  - [ ] Prompt engineering para scripts
  - [ ] LinkedIn post generator
  - [ ] Hashtag + keywords optimizer
- [ ] LinkedIn publishing
  - [ ] LinkedIn API integration
  - [ ] Scheduler (daily 9am)
  - [ ] Error handling + retries
- [ ] Telegram notifications
  - [ ] Bot setup
  - [ ] Publish notifications
  - [ ] Basic commands (/status, /next)

**Output**: 1 post/día a LinkedIn, notif vía Telegram

---

### 🎬 FASE 2: Video + YouTube Shorts (2-3 semanas)
**Objetivo**: Generación de video automática para YouTube Shorts

- [ ] Script optimization para video
- [ ] Video generation pipeline
  - [ ] ElevenLabs integration (narración)
  - [ ] Stock footage/visuals provider
  - [ ] Subtitle generation (burned-in)
  - [ ] Branding/watermark
- [ ] YouTube Shorts API integration
- [ ] Scheduler para dual publishing (LinkedIn + YouTube)
- [ ] Dashboard: view metrics (YouTube Analytics)

**Output**: Videos de 15-30s publicados automáticamente

---

### 🎮 FASE 3: User Control + Refinement (1-2 semanas)
**Objetivo**: Control manual, feedback loop, optimizaciones

- [ ] Telegram commands
  - [ ] `/create [prompt]` - crear contenido on-demand
  - [ ] `/delete [url]` - borrar/ocultar post
  - [ ] `/schedule [time]` - reprogramar publicación
  - [ ] `/analytics` - ver metrics del día
- [ ] Draft review system
  - [ ] Preview antes de publicar
  - [ ] Aprobación manual (si quieres)
- [ ] Analytics dashboard
  - [ ] Impressions, CTR, engagement por post
  - [ ] Trending topics that worked
  - [ ] ROI por temática
- [ ] Feedback loop
  - [ ] Ajuste automático de scoring basado en performance

**Output**: Sistema con control manual + self-learning

---

### 🌐 FASE 4: Expansion (Post-MVP)
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

## Fase 2: Video + YouTube Shorts (2-3 semanas)

### Tasks
- [ ] Video script optimization (15-30s, high-engagement)
- [ ] ElevenLabs integration (text-to-speech narración)
- [ ] Stock footage provider (placeholder o Pixabay/Pexels API)
- [ ] Subtitle generation (burned-in, sync con narración)
- [ ] Branding layer (watermark, intro/outro)
- [ ] YouTube Shorts API integration
- [ ] Dual publishing: LinkedIn post + YouTube Short (same content)
- [ ] Video script templates (+ Claude enhancement)

### Technical
- `src/video/` new folder
  - `scriptOptimizer.ts` - adapt for video (shorter, punchier)
  - `narrationGenerator.ts` - ElevenLabs client
  - `videoAssembler.ts` - orchestrate footage + narration + subtitles
  - `youtubePublisher.ts` - Shorts API client
- Add to `package.json`: ElevenLabs SDK
- Modify `publishing/publisherFactory.ts` - add video publisher option
- Modify `pipeline.ts` - generate video content path

### Configuration
```
ELEVENLABS_API_KEY=          # https://elevenlabs.io/sign-up
ELEVENLABS_VOICE_ID=eleven_monolingual_v1
YOUTUBE_REFRESH_TOKEN=       # OAuth credential
PUBLISH_VIDEO=true           # Enable video generation
```

---

## Fase 3: User Control + Analytics (1-2 semanas)

### Telegram Bot Commands
- [ ] `/create-hybrid [topic-id]` - generate hybrid post on-demand
- [ ] `/create-trending` - generate from today's news
- [ ] `/schedule [time] [topic-id]` - schedule specific post
- [ ] `/analytics` - show today's performance
- [ ] `/draft-list` - list pending drafts
- [ ] `/publish [draft-id]` - publish specific draft to production

### Analytics Dashboard
- [ ] impressions, clicks, shares per post
- [ ] trending topics that worked (scoring accuracy)
- [ ] hybrid vs trending performance comparison
- [ ] ROI by category/topic

### Technical
- `src/telegram/` refactor
  - `botCommandHandler.ts` - command routing
  - `draftManager.ts` - list, preview, publish drafts
  - `analyticsReporter.ts` - fetch + format metrics
- Add to `package.json`: telegram-bot-api (official)
- Modify `pipeline.ts` - export createHybridPost, createTrendingPost as public functions

### Configuration
```
TELEGRAM_BOT_TOKEN=          # https://t.me/BotFather
TELEGRAM_CHAT_ID=            # Your chat ID (auto-detected or manual)
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
ANTHROPIC_API_KEY=            # Claude (scoring, generation)
SUPABASE_URL=                 # PostgreSQL persistence
SUPABASE_ANON_KEY=
TELEGRAM_BOT_TOKEN=           # Notifications
NEWSAPI_KEY=                  # Additional news source
LINKEDIN_CLIENT_ID=           # Production publishing
LINKEDIN_CLIENT_SECRET=
ELEVENLABS_API_KEY=           # Phase 2 (video)
YOUTUBE_REFRESH_TOKEN=        # Phase 2 (video)
```

### Configuration Flags
```
PUBLISH_LIVE=true             # Auto-publish (default false = draft only)
HYBRID_RATIO=5                # 1 of every 5 posts is hybrid (default)
HYBRID_ENABLED=true           # Toggle hybrid system (default)
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

# Formatter (when added)
npm run format

# Generate hybrid post on-demand (add later)
npm run create-hybrid [topic-id]

# View database (Supabase web UI)
# https://supabase.com/dashboard
```

---

## Architecture Summary

### Current Stack
- **Runtime**: Node.js + TypeScript (ESM)
- **APIs**: Claude (Anthropic), Supabase (PostgreSQL), Telegram Bot, NewsAPI, Reddit JSON
- **Scheduler**: node-cron (9am daily when enabled)
- **Database**: In-memory (Map) or Supabase (swap via factory pattern)
- **Publishing**: Draft (default) → LinkedIn (OAuth) → YouTube (Phase 2)
- **Notifications**: Console (default) → Telegram Bot (optional)

### Key Files
- `src/pipeline.ts` - orchestration (trending vs hybrid decision, generate, publish, notify)
- `src/shared/repository/factory.ts` - database abstraction (in-memory vs Supabase)
- `src/hybrid-profile/hybridScheduler.ts` - cadence control (1/N posts)
- `src/filtering/select.ts` - 40% trending + 60% monetization scoring
- `.env.example` - credential template with links

### Folder Structure
```
src/
├── aggregation/       (News sources)
├── filtering/         (Scoring, selection)
├── generation/        (Content creation)
├── publishing/        (Draft, LinkedIn, YouTube)
├── notifications/     (Console, Telegram)
├── hybrid-profile/    (Your unique positioning)
├── shared/
│   ├── repository/    (DB abstraction)
│   ├── config.ts      (Flexible, no throw on missing keys)
│   └── types.ts       (Article, Post, GeneratedContent)
├── pipeline.ts        (Main orchestration)
├── scheduler.ts       (Cron + notifications)
└── index.ts           (Entry point)

migrations/            (SQL schemas - run in Supabase)
.github/workflows/     (CI/CD - TypeScript, tests)
```

---

## What to Focus On Next Session

1. **Prioritize Fase 2** if you want video content (highest value-add for LinkedIn + YouTube)
   - Start with script optimization (smaller scope)
   - Then ElevenLabs + stock footage
   - YouTube Shorts API last (you have OAuth template)

2. **Or Prioritize Fase 3** if you want bot control + analytics
   - Telegram commands are quick (use existing bot framework)
   - Analytics require Supabase schema + queries (more work)

3. **Test with real credentials** when ready:
   - Add ANTHROPIC_API_KEY → system uses Claude instead of heuristics
   - Add SUPABASE_URL + ANON_KEY → persistence instead of memory
   - Add TELEGRAM_BOT_TOKEN → real notifications
   - Run `npm run dev` to see system upgrade automatically

4. **Customize hybrid topics** if the 8 don't fit your exact angle
   - Edit `src/hybrid-profile/hybridTopics.ts`
   - Add your specific use cases, examples, target audiences
   - System will randomly rotate them

---

**Status**: Fase 1 ✅ Complete. MVP + Hybrid Profile System running autonomously.

Ready for Fase 2 (Video) or Fase 3 (Bot Control) when you are. 🚀
