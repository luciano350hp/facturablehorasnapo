# Flujo de n8n — Chatbot "Clara" (HorasClaras)

Este documento explica **cómo está pensado el flujo de n8n** que alimenta al chatbot de la landing,
y cómo el widget se comporta cuando n8n no responde.

---

## 1. Arquitectura general

```text
Landing (/)  ─►  <ChatWidget />
                     │
                     ├─ 1) POST webhook n8n (timeout 8s)      ── si responde ──► muestra la respuesta
                     │
                     └─ 2) fallback: POST /api/chat            ── Lovable AI Gateway (Gemini)
```

- Archivo del widget: `src/components/ChatWidget.tsx`
- Fallback server route: `src/routes/api/chat.ts`
- Base de conocimiento: `docs/QA_bot.md` (mismo contenido embebido en el system prompt del fallback)

El fallback es **silencioso**: si n8n devuelve 404, 500, CORS error o tarda más de 8 segundos,
el widget reintenta contra `/api/chat` sin que la usuaria note nada.

---

## 2. El flujo dentro de n8n

URL de producción actual:

```
POST https://napoeltibu.app.n8n.cloud/webhook/364f2dcc-4366-4064-aa70-e962346850fd/chat
```

Nodos (de izquierda a derecha):

| # | Nodo | Configuración clave |
|---|------|--------------------|
| 1 | **Webhook** (o *Chat Trigger*) | Method `POST`, Path `.../chat`, Respond = "Using Respond to Webhook node" o streaming. **CORS: Allowed Origins = `*`** |
| 2 | **AI Agent** (LangChain) | System Message = el prompt de Clara (ver abajo) |
| 3 | **Chat Model** | OpenAI / Gemini / el que tengas conectado con credencial propia |
| 4 | **Simple Memory** (Buffer Window) | Session Key = `{{ $json.sessionId }}` — mantiene el hilo por conversación |
| 5 | *(opcional)* **Vector Store / Tool** | Para RAG sobre `docs/QA_bot.md` en lugar de pegar el texto en el prompt |
| 6 | **Respond to Webhook** | Devuelve `{ "output": "..." }` |

### Payload que manda el widget

```json
{ "message": "¿Cómo cargo mis horas?", "sessionId": "uuid-generado-en-el-browser" }
```

### Respuesta esperada

n8n con el AI Agent responde **NDJSON en streaming**: una línea JSON por chunk.
El widget parsea línea por línea y concatena el primer campo que encuentre entre
`output`, `text`, `reply`, `data.output`, `data.text` (ver `extractN8nReply()` en `ChatWidget.tsx`).

Un JSON plano `{"output":"..."}` también funciona.

---

## 3. System prompt del agente

```text
Sos "Clara", asistente virtual de HorasClaras.
Tono: cercano, rioplatense (voseo), claro, sin tecnicismos. Respuestas breves (2-4 frases).
Solo respondés en base a la base de conocimiento provista. Si no está la respuesta,
decí que no tenés esa info y sugerí anotarse en la lista de espera.
```

Seguido del contenido de `docs/QA_bot.md`.

---

## 4. Checklist para que funcione

- [ ] Workflow en estado **Active** (toggle arriba a la derecha en n8n Cloud).
- [ ] Usar la **Production URL** del webhook (no la de Test, que solo vive un request).
- [ ] En el nodo Webhook → Options → **Allowed Origins (CORS) = `*`**.
- [ ] El workspace de n8n Cloud no debe estar pausado/suspendido.
- [ ] Probar con curl:

```bash
curl -X POST 'https://napoeltibu.app.n8n.cloud/webhook/364f2dcc-4366-4064-aa70-e962346850fd/chat' \
  -H 'Content-Type: application/json' \
  -d '{"message":"hola","sessionId":"test-1"}'
```

---

## 5. Errores frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `404` en el POST | Workflow inactivo o URL de Test | Activar workflow / usar Production URL |
| Error de CORS en consola | Allowed Origins vacío | Poner `*` en el nodo Webhook |
| Responde JSON crudo en el chat | La respuesta no se parsea | Ya resuelto por `extractN8nReply()` |
| Tarda y luego responde igual | n8n lento >8s | El widget hizo fallback al AI Gateway |
| El paquete `@n8n/chat` rompe el build | Su CSS no lo digiere Vite | No usarlo: el widget es propio |

---

*Ver también: `docs/HANDOFF.md` (sección 5.3) y `docs/QA_bot.md`.*
