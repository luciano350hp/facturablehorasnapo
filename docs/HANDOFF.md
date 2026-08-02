# HorasClaras — Documento de traspaso (handoff)

> Guía completa para recrear / continuar este proyecto en **otro proyecto de Lovable**.
> Incluye: contexto, prompt maestro, arquitectura, modelo de datos, claves/API, autenticación,
> chatbot con n8n + fallback IA, y modo de uso.

---

## 1. Qué es el proyecto

**HorasClaras** es un prototipo (MVP funcional) para **profesoras de inglés y traductoras freelance**.
Resuelve: registrar horas trabajadas por cliente, cotizar traducciones por palabra y generar
un **resumen para facturar en PDF** listo para mandar por WhatsApp/email.

Estado actual: **prototipo de demostración**. Todos los datos son **ficticios (dummy)** y se guardan
en `localStorage` del navegador. No hay datos reales ni información sensible.

URLs:
- Preview (dev): `https://id-preview--6810e86b-c582-44cd-ae01-1408ebd0ea1e.lovable.app`
- Producción: `https://facturablehorasnapo.lovable.app`

---

## 2. Prompt maestro (copiar/pegar en el proyecto nuevo)

```text
Construí "HorasClaras", una app en español rioplatense (voseo) para profesoras de inglés
y traductoras freelance de Argentina. Moneda ARS.

STACK: TanStack Start (React 19 + Vite) + Tailwind v4 + shadcn/ui + Lovable Cloud (Supabase).

RUTAS:
- "/" → Landing page de captación (hero, problema, features, waitlist, FAQ) + chatbot flotante.
- "/app" → La aplicación (prototipo, datos en localStorage), con banner de "datos ficticios".

APP (/app) — 5 pestañas:
1. Resumen: totales del mes por cliente (horas facturables, horas de planificación, monto a cobrar).
2. Clientes: alta/baja/edición. Cada cliente es tipo "hora" o "palabra".
   - tipo hora: tarifa por hora.
   - tipo palabra: tarifa por palabra + modo de precio (auto|manual) + % descuento por repeticiones (default 50).
3. Horas: cargar fecha, duración (horas y minutos), cliente, tipo (facturable | planificación) y nota.
4. Palabras: pegar texto → cuenta palabras totales, únicas y repetidas → calcula precio
   aplicando el descuento por repeticiones del cliente (o precio manual).
5. Tarifario: elegir cliente + mes → resumen y botón "Descargar PDF" (jsPDF).

REGLAS DE NEGOCIO:
- Horas "planificación" NO se facturan, pero se muestran para visibilizar el tiempo invisible.
- Descuento por repeticiones: precio = (totales - repetidas) * tarifa + repetidas * tarifa * (1 - desc%).
- El descuento se configura POR CLIENTE (editable inline en la pestaña Clientes).
- El tiempo se guarda siempre en minutos (int).

BACKEND (Lovable Cloud):
- Tabla waitlist_signups (id uuid pk, email text unique not null, source text, created_at timestamptz)
  con RLS: INSERT público solo con email válido por regex.

CHATBOT:
- Widget flotante propio (no iframe) en la landing, asistente llamada "Clara".
- Primero intenta un webhook de n8n (timeout 8s, respuesta NDJSON en streaming);
  si falla, hace fallback automático a /api/chat (Lovable AI Gateway, modelo Gemini)
  con un system prompt basado en el documento Q&A del producto.

DISEÑO: paleta cálida — fondo crema #f7f3ee, texto #1a1714, acento terracota #d4622a.
Tipografías: Instrument Serif (títulos) + Work Sans (texto).
```

---

## 3. Arquitectura y archivos clave

| Archivo | Rol |
|---|---|
| `src/routes/index.tsx` | Landing page + formulario de waitlist + `<ChatWidget />` |
| `src/routes/app.tsx` | App completa (5 pestañas, PDF con jsPDF) |
| `src/lib/horas-store.ts` | Store en `localStorage` + tipos + `countWords()` + helpers de formato |
| `src/components/ChatWidget.tsx` | Chat flotante: n8n → fallback `/api/chat` |
| `src/routes/api/chat.ts` | Server route: llama al Lovable AI Gateway con el system prompt |
| `src/routes/__root.tsx` | Layout raíz, fuentes, metadatos |
| `src/styles.css` | Tokens de diseño (Tailwind v4 `@theme`) |
| `src/integrations/supabase/*` | Cliente Supabase autogenerado (no editar) |
| `supabase/migrations/*.sql` | Esquema de base de datos |
| `docs/DER.md` | Diagrama ER (Mermaid): modelo simple y modelo con facturas |
| `docs/QA_bot.md` | Base de conocimiento del chatbot (RAG) |

Dependencias no triviales: `jspdf` (PDF), `sonner` (toasts), `lucide-react` (iconos),
`@supabase/supabase-js`, `recharts`.

---

## 4. Modelo de datos

### 4.1 Lo que HOY está en la base (Lovable Cloud)

```sql
CREATE TABLE public.waitlist_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.waitlist_signups TO anon, authenticated;
GRANT ALL ON public.waitlist_signups TO service_role;
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
ON public.waitlist_signups FOR INSERT TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND char_length(email) BETWEEN 3 AND 320
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND (source IS NULL OR char_length(source) <= 64)
);
```

> No hay policy de SELECT: nadie puede leer la lista desde el cliente (solo backend/service_role).

### 4.2 Modelo objetivo cuando se migre de localStorage a Postgres

```
USERS 1─n CLIENTS 1─n TIME_ENTRIES
                 └─n WORD_JOBS
```

```sql
CREATE TYPE public.client_type AS ENUM ('hour','word');
CREATE TYPE public.pricing_mode AS ENUM ('auto','manual');
CREATE TYPE public.entry_kind  AS ENUM ('billable','planning');

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type public.client_type NOT NULL,
  rate numeric(12,2) NOT NULL CHECK (rate >= 0),
  pricing_mode public.pricing_mode DEFAULT 'auto',   -- solo type='word'
  repetition_discount int DEFAULT 50 CHECK (repetition_discount BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  date date NOT NULL,
  minutes int NOT NULL CHECK (minutes > 0),
  kind public.entry_kind NOT NULL DEFAULT 'billable',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.word_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  date date NOT NULL,
  title text NOT NULL,
  total_words int NOT NULL CHECK (total_words >= 0),
  repeated_words int NOT NULL DEFAULT 0 CHECK (repeated_words >= 0),
  priced_amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

RLS para las tres tablas (patrón "dueño del dato"):

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.word_jobs    TO authenticated;
GRANT ALL ON public.clients, public.time_entries, public.word_jobs TO service_role;

ALTER TABLE public.clients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_jobs    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own clients" ON public.clients
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "own time entries" ON public.time_entries
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.user_id = auth.uid()));

CREATE POLICY "own word jobs" ON public.word_jobs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.user_id = auth.uid()));
```

### 4.3 ¿Y `invoices` / `invoice_items`?

- **`invoices`** = encabezado (cliente, número, período, total, estado: draft/sent/paid/void).
- **`invoice_items`** = renglones del detalle (descripción, cantidad, precio unitario, subtotal).
- **No hacen falta en el MVP**: el PDF se calcula "al vuelo" desde `time_entries` + `word_jobs`
  filtrando por mes. Se agregan recién cuando necesitás **historial inmutable** (que la factura no
  cambie si después editás horas) y **estados de cobro**. Ver `docs/DER.md`.

---

## 5. Claves y APIs

### 5.1 Variables de entorno (autogeneradas por Lovable Cloud, no hardcodear a mano)

| Variable | Dónde | Uso |
|---|---|---|
| `VITE_SUPABASE_URL` | cliente | URL del backend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | cliente | clave pública (anon) — **es segura** en el código |
| `VITE_SUPABASE_PROJECT_ID` | cliente | id del proyecto |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | servidor | acceso desde server functions |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor | **secreto**, bypassea RLS, nunca al frontend |
| `SUPABASE_DB_URL` | servidor | conexión directa a Postgres |
| `LOVABLE_API_KEY` | servidor | **secreto**, autentica contra el AI Gateway |

> En un proyecto nuevo de Lovable estas claves se crean solas al activar Cloud. No las copies del
> proyecto viejo: cada proyecto tiene las suyas.

### 5.2 Lovable AI Gateway (el "cerebro" del chatbot)

Endpoint OpenAI-compatible, sin API key propia de OpenAI/Google:

```
POST https://ai.gateway.lovable.dev/v1/chat/completions
Headers: { "Content-Type": "application/json", "Lovable-API-Key": process.env.LOVABLE_API_KEY }
Body: { "model": "google/gemini-3-flash-preview", "messages": [ {role:"system",...}, {role:"user",...} ] }
```

Se llama **solo desde el servidor** (`src/routes/api/chat.ts`). Nunca desde el navegador.
Errores a manejar: `429` (rate limit) y `402` (créditos agotados).

### 5.3 Webhook n8n (opcional)

```
POST https://napoeltibu.app.n8n.cloud/webhook/<id>/chat
Body: { "message": "...", "sessionId": "..." }
Respuesta: NDJSON en streaming (una línea JSON por chunk, campo output/text/reply)
```

Requisitos para que funcione: workflow **Active** en n8n Cloud y **CORS habilitado (`*`)** en el nodo
Webhook. Si devuelve 404/timeout, el widget hace fallback silencioso al AI Gateway.

---

## 6. Autenticación

Hoy el prototipo **no tiene login**: `/app` es pública y todo vive en `localStorage`.

Para agregar auth en el proyecto nuevo (Lovable Cloud):

1. Métodos por defecto: **email + contraseña** y **Google**. (GitHub/Discord no están soportados nativamente).
2. Desactivar auto-confirm de email solo si querés verificación real; para demos, dejalo confirmado.
3. Activar **Leaked Password Protection** (HIBP).
4. Página `/auth` con signup/login; rutas protegidas bajo `src/routes/_authenticated/`.
5. El `user_id` de `auth.users` es el dueño de `clients` → todas las RLS cuelgan de ahí (sección 4.2).
6. Los roles, si hicieran falta, **nunca** en la tabla de perfiles: tabla `user_roles` aparte +
   función `has_role()` con `SECURITY DEFINER`.
7. `src/start.ts` ya registra `attachSupabaseAuth` en `functionMiddleware`, que adjunta el bearer
   token a las server functions protegidas. No lo quites.

---

## 7. Modo de uso (usuario final)

1. **Landing `/`** → leer propuesta de valor, dejar email en la waitlist, preguntarle al chatbot.
2. **App `/app`**:
   - *Clientes*: dar de alta un cliente, elegir si cobra por **hora** o por **palabra**, cargar tarifa
     y (si es por palabra) el **% de descuento por repeticiones**.
   - *Horas*: cargar fecha + duración + tipo (facturable / planificación).
   - *Palabras*: pegar el texto → ver totales/únicas/repetidas → guardar el trabajo con su precio.
   - *Resumen*: ver el total del mes por cliente.
   - *Tarifario*: elegir cliente y mes → **Descargar PDF**.

> Nota: si la descarga del PDF no arranca dentro del preview embebido, abrí la app en una pestaña
> propia (el iframe bloquea descargas).

---

## 8. Checklist para recrear el proyecto en Lovable

- [ ] Crear proyecto nuevo y pegar el **prompt maestro** (sección 2).
- [ ] Activar **Lovable Cloud**.
- [ ] Correr la migración de `waitlist_signups` (sección 4.1).
- [ ] Copiar `docs/QA_bot.md` (base de conocimiento del bot) y `docs/DER.md`.
- [ ] Crear `src/routes/api/chat.ts` con el system prompt del bot.
- [ ] Crear `src/components/ChatWidget.tsx` con la lógica n8n → fallback.
- [ ] Verificar que exista el secreto `LOVABLE_API_KEY`.
- [ ] (Opcional) Configurar el webhook de n8n con CORS `*` y workflow activo.
- [ ] Publicar. **Los cambios de frontend no van a producción hasta re-publicar.**

---

## 9. Cosas aprendidas / trampas conocidas

- El paquete `@n8n/chat` rompe el build de Vite por su CSS → se implementó widget propio.
- n8n responde **NDJSON en streaming**, no un JSON plano: hay que parsear línea por línea.
- Publicar es un paso manual: la preview actualizada ≠ producción actualizada.
- Las descargas (PDF) fallan dentro del iframe del preview.
- Las claves `anon`/`publishable` son públicas por diseño; la `service_role` **jamás** al cliente.
- Cada `CREATE TABLE` en `public` necesita sus `GRANT` además de RLS, o el Data API devuelve error de permisos.

---

*Documento de traspaso — HorasClaras — actualizado agosto 2026.*
