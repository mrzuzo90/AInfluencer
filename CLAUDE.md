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

**Status**: Ready to build 🚀
