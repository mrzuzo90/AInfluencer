# AInfluencer

**Motor autónomo de creación de contenido impulsado por IA** — desde la noticia hasta el post publicado, sin intervención manual, con criterio editorial y control humano cuando lo necesitas.

AInfluencer no es un simple "auto-poster". Es un sistema que **piensa qué publicar** (no solo cómo), **genera** el contenido en varios formatos, lo **publica** en varias plataformas y te lo **enseña todo en un dashboard en vivo** — todo configurable por variables de entorno, sin tocar código.

Fue construido como showreel de ingeniería de automatización con IA, pero su arquitectura está pensada desde el día uno para adaptarse a **cualquier negocio** que quiera automatizar su creación de contenido: una marca personal, una agencia, una startup, un ecommerce o una consultora — el "qué" (nicho, tono, plataformas) es 100% configurable; el "cómo" (pipeline, scoring, publicación, control) ya está construido.

---

## Qué hace, de un vistazo

```
Noticias/tendencias  →  Scoring con IA  →  Generación de contenido  →  Publicación multi-plataforma  →  Notificación + Dashboard
   (NewsAPI, Reddit)     (trending +         (texto, video con        (LinkedIn, YouTube             (Telegram + panel
                          monetización)       narración e IA)          Shorts, ...)                    web en vivo)
```

1. **Agrega** noticias/tendencias de múltiples fuentes.
2. **Puntúa** cada una con un criterio editorial doble: qué tan viral es (*trending*, 40%) y qué tan bien convierte/genera engagement (*monetización*, 60%) — no publica lo más ruidoso, publica lo más rentable.
3. **Genera** el contenido con Claude: texto para LinkedIn, guion + narración + subtítulos + marca de agua para vídeo vertical (Shorts/Reels).
4. **Publica** en las plataformas activas, o lo deja en borrador para revisión humana.
5. **Notifica** por Telegram y deja todo visible en un **dashboard web en vivo**.

---

## Capacidades clave

- 🧠 **Filtrado editorial con IA, no solo automatización** — un LLM decide qué merece publicarse, con una fórmula de scoring explícita y auditable (no una caja negra).
- 🎬 **Contenido multi-formato desde una sola fuente** — el mismo artículo se convierte en post de texto y en vídeo vertical con narración, subtítulos quemados y watermark, sin duplicar trabajo.
- 📡 **Publicación multi-plataforma** — arquitectura de "publishers" intercambiables (LinkedIn, YouTube Shorts hoy; añadir TikTok/Instagram/X es implementar una interfaz, no reescribir el pipeline).
- 🕹️ **Control humano cuando lo quieras** — bot de Telegram con comandos reales (`/create-trending`, `/create-hybrid`, `/schedule`, `/draft-list`, `/publish`, `/analytics`): puedes dejarlo 100% autónomo o revisar cada pieza antes de que salga.
- 📊 **Dashboard web en vivo** — pipeline ejecutándose paso a paso en tiempo real, transparencia total del scoring (por qué se eligió cada noticia), calendario de publicación y analytics — pensado para enseñarlo, no solo para depurarlo.
- 🎯 **Rotación temática configurable** — de "tecnología los lunes, finanzas los miércoles" a cualquier calendario editorial que tu negocio necesite, sin tocar lógica de negocio.
- 🧩 **Sistema de nichos "híbridos"** — combina contenido de tendencias con contenido evergreen de tu propio posicionamiento (hoy: IA + Electricidad; se reconfigura editando un array de topics).
- 🛡️ **Draft-safe por defecto** — nada se publica en vivo hasta que explícitamente activas `PUBLISH_LIVE=true`; ideal para probar con clientes antes de comprometerse.
- 💸 **Coste bajo control** — selección de modelo Claude por tarea (Haiku para lo mecánico, Sonnet para lo que requiere criterio, Opus solo si hace falta), documentada y auditada.

---

## Pensado para adaptarse a cualquier negocio

El sistema separa deliberadamente **qué contenido generar** de **cómo se genera y se publica**, así que adaptarlo a un nicho o cliente nuevo no requiere reescribir el pipeline:

| Quieres cambiar... | Tocas... |
|---|---|
| El nicho/tema del contenido | `src/hybrid-profile/hybridTopics.ts` — array de topics declarativo |
| La rotación editorial (qué día qué tema) | `src/filtering/topicRotation.ts` |
| Los criterios de qué es "buen contenido" | Los pesos de scoring en `src/filtering/` (trending vs. monetización) |
| Dónde se publica | Añadir un nuevo `Publisher` en `src/publishing/` — el resto del pipeline no cambia |
| De dónde salen las noticias | Añadir una nueva fuente en `src/aggregation/` |
| Cadencia y horario | Variables de entorno (`SCHEDULER_ENABLED`, `HYBRID_RATIO`) o el comando `/schedule` en caliente |
| Persistencia (demo vs. producción) | Nada — `src/shared/repository/factory.ts` cambia de memoria a PostgreSQL (Supabase) automáticamente según haya credenciales o no |

Ninguna clave de API está hardcodeada ni es obligatoria: cada integración se activa sola en cuanto configuras su variable de entorno, y el sistema degrada con elegancia (plantillas en vez de IA, borrador en vez de publicación real, fondo sólido en vez de stock footage) cuando falta alguna.

---

## Arquitectura

```
News Aggregation (NewsAPI, Reddit, Google Trends*)
        │
        ▼
Intelligent Filtering (Claude) — trending × 40% + monetización × 60%
        │
        ▼
Content Generation (Claude) — script vídeo + post LinkedIn + hooks/CTA
        │
        ▼
Video Rendering (ffmpeg) — narración (ElevenLabs) + stock footage (Pexels) + subtítulos + watermark
        │
        ▼
Scheduled Publishing — LinkedIn / YouTube Shorts (más plataformas = nuevo Publisher)
        │
        ▼
Notifications (Telegram) + Dashboard web (pipeline en vivo, scoring, calendario, analytics)
```

*Google Trends está en el diseño original pero no implementado todavía.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Runtime | Node.js + TypeScript (ESM) |
| IA | Claude (Anthropic) — scoring, generación de contenido |
| Vídeo | ffmpeg (render local) + ElevenLabs (narración) + Pexels (stock footage) |
| Publicación | LinkedIn API, YouTube Data API v3 (resumable upload real) |
| Base de datos | PostgreSQL vía Supabase, con fallback en memoria para desarrollo |
| Programación | node-cron, reprogramable en caliente |
| Control humano | Telegram Bot API (polling) |
| Dashboard | Express + Server-Sent Events + HTML/CSS/JS vanilla (cero build step, cero CDN) |

---

## Empezar en 5 minutos

```bash
npm install
cp .env.example .env
npm run dev
```

Sin ninguna credencial configurada, el pipeline ya corre de punta a punta con datos de muestra y contenido por plantilla, y el dashboard queda disponible en `http://localhost:3000`. Cada integración (Claude, Telegram, Supabase, LinkedIn, YouTube, ElevenLabs, Pexels) se activa sola en cuanto añades su clave al `.env` — ver [`PHASE_2_3_SETUP.md`](./PHASE_2_3_SETUP.md) para la guía paso a paso de cada una.

---

## Estado del proyecto

| Fase | Estado |
|---|---|
| **Fase 1** — Filtrado + generación + publicación (LinkedIn) + Telegram | ✅ Completa, corre end-to-end sin credenciales |
| **Fase 2** — Vídeo + YouTube Shorts | ✅ Código completo; renderizado real con ffmpeg probado end-to-end; pendiente probar con credenciales reales de Pexels/ElevenLabs/YouTube |
| **Fase 3** — Control por Telegram + Analytics + Dashboard web | 🟡 Mayormente completa; dashboard probado localmente, pendiente desplegarlo públicamente |
| **Fase 4** — TikTok, Instagram, multi-idioma | ⬜ No iniciada |

Documentación técnica completa, decisiones de arquitectura y roadmap detallado: [`CLAUDE.md`](./CLAUDE.md).

---

## Licencia

Código propietario — [todos los derechos reservados](./LICENSE). El repositorio es público para que puedas revisar cómo está construido, pero no está licenciado para uso, copia ni reventa sin permiso. ¿Interesado en usarlo o adaptarlo para tu negocio? [Contacta para una licencia comercial](https://github.com/mrzuzo90).
