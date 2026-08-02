# PRD — HorasClaras

**Registro de horas y tarifario automático para profesionales independientes**

> Documento de definición de producto — v1 interna

---

| Campo | Valor |
|---|---|
| Versión | v1.1 — MVP (iter. feedback Caro) |
| Fecha | Mayo 2026 |
| Autor | Analista Funcional Senior |
| Horizonte MVP | 2 semanas |
| Presupuesto infra | Hasta USD 50/mes |

---

## 1. Problema

Profesores de inglés y traductores independientes (25–35 años) cobran por hora o por volumen de palabras, pero no tienen un sistema confiable para registrar cuánto tiempo le dedican a cada cliente ni calcular presupuestos con precisión. El resultado es triple:

- **Cobran de menos** porque olvidan horas o subestiman el volumen real de un documento.
- **Preparan presupuestos y tarifarios de forma manual** en hojas de cálculo o mensajes de WhatsApp.
- **No pueden distinguir las horas facturables** de las que invierten en planificación propia.

Para traductoras en particular, contar palabras a mano y aplicar tarifas con descuento por repeticiones es un proceso tedioso y propenso a errores que las frena a la hora de presupuestar rápido y con confianza. Ese tiempo perdido en administración es tiempo que podrían usar para tomar más clientes o simplemente descansar — y es el obstáculo concreto que les impide escalar sin agotarse.

> Profesores de inglés y traductoras freelance pierden entre 30 y 60 minutos semanales en tareas administrativas que no les generan un peso.

---

## 2. Usuario Primario

| Campo | Valor |
|---|---|
| Nombre ficticio | "Valen" (inglés) / "Caro" (traductora) |
| Edad | 26–34 años |
| Ocupación | Profesora de inglés / Traductora freelance |
| Clientes activos | 4 a 8 simultáneos |
| Tarifa | Por hora (profes) o por palabra/volumen (traductoras) |
| Herramientas actuales | Google Calendar, WhatsApp, cuaderno físico, Word |
| Dispositivo principal | Celular (Android/iOS) + notebook para traducir |
| Perfil técnico | Usuaria no técnica, aprende por intuición |

### Contexto y frustraciones

- Trabaja desde su casa o en las casas de sus alumnos, no tiene oficina ni horario fijo.
- A fin de mes no recuerda exactamente cuántas horas le dio a cada cliente, y subestima el total.
- Cuando un cliente nuevo pregunta "¿cuánto cobrás?", le cuesta responder rápido con algo que se vea profesional.
- No puede aceptar más clientes porque siente que ya está al límite, pero en realidad parte de ese tiempo es administración, no trabajo real.
- (Traductoras específicamente) Cuando llega un documento nuevo, contar palabras, detectar repeticiones y calcular el precio con descuento por volumen le lleva 20-30 minutos que no cobra.
- No quiere aprender una herramienta compleja: si no entiende cómo usarla en 5 minutos, la abandona.

---

## 3. Alternativas Actuales y Por Qué Fallan

El patrón común: las herramientas genéricas no entienden el flujo de trabajo de un profesional que cobra por hora a múltiples clientes. Las de facturación formal son demasiado complejas y caras para alguien que no tiene empresa. Nadie combina registro simple + separación planificación/facturable + generación de tarifario en un solo lugar.

| Herramienta | Qué hace | Por qué falla para nuestro usuario | Costo |
|---|---|---|---|
| Toggl / Clockify | Registro de horas general | No genera tarifario ni distingue horas planificadas de facturables por cliente | Gratis / bajo |
| Notion + planillas | Notas + tabla manual | 100% manual, no calcula ni envía nada automáticamente | Gratis |
| FreshBooks / Bonsai | Facturación freelance | Complejo, orientado a factura formal, no al seguimiento diario de horas por cliente | USD 15–35/mes |
| Google Calendar + Sheets | Agenda + planilla | Dos herramientas desconectadas, sin lógica de tarifas ni exportación | Gratis |

---

## 4. Visión del Producto

> *"HorasClaras es la herramienta más simple del mundo para saber exactamente cuánto trabajaste, para quién, y cuánto cobrarle — sin perder tiempo en papeles."*

---

## 5. MVP — Features v1

Todo lo que entra en 2 semanas de trabajo. Nada que no esté acá.

| Feature | Descripción concreta | Prioridad |
|---|---|---|
| Alta de clientes | Nombre + tarifa por hora O tarifa por palabra. Editable. Máx 10 clientes en v1. | 🔴 Bloqueante |
| Registro de horas | Inicio / fin de sesión (o ingreso manual). Se asocia a un cliente. Campo opcional: tipo (facturable / planificación). | 🔴 Bloqueante |
| Contador de palabras con presupuesto | El usuario sube o pega un texto. La app cuenta las palabras automáticamente. Dos modos: (A) la app calcula el precio directo (palabras × tarifa), o (B) muestra el conteo y el usuario ajusta el precio manualmente. El usuario elige el modo en su perfil. | 🔴 Bloqueante |
| Descuento por repeticiones | Al contar palabras, detecta repeticiones exactas y las señala. El usuario define el % de descuento (ej: repeticiones al 50%). El precio final se recalcula automáticamente. | 🟠 Alta |
| Resumen por cliente | Vista: cliente → horas totales del mes + palabras traducidas + monto a cobrar calculado. | 🔴 Bloqueante |
| Generación de tarifario PDF | Botón: 'Generar tarifario'. PDF simple con nombre del profesional, lista de clientes, horas o palabras según el tipo, tarifa y total. Listo para enviar por WhatsApp. | 🟠 Alta |
| Separación planificación / facturable | Al registrar una hora, el usuario elige el tipo. El resumen muestra ambas columnas separadas. | 🟠 Alta |
| Dashboard mensual simple | Una pantalla con el total del mes: horas facturables, horas de planificación, ingresos proyectados. | 🟡 Media |

### Stack sugerido para el MVP (Lovable)

- **Frontend + backend:** Lovable (genera app full-stack funcional en horas)
- **Base de datos:** Supabase (integrado con Lovable, gratis hasta 500 MB)
- **Conteo de palabras + detección de repeticiones:** lógica JS en frontend (no requiere API externa)
- **Generación PDF:** jsPDF o Lovable PDF export
- **Auth:** Supabase Auth (email + password, sin OAuth en v1)
- **Hosting:** Lovable Cloud (incluido en el plan)
- **Costo total estimado:** USD 20–25/mes (plan Lovable + Supabase free tier)

---

## 6. Features Post-MVP

Solo se abordan si el MVP tiene tracción real (≥ 10 usuarios activos por 30 días).

| Feature | Descripción | Condición para activar |
|---|---|---|
| Recordatorio automático | Notificación al final del día: '¿Tuviste clases hoy? Registrá tus horas'. | 20+ usuarios activos |
| Historial y tendencias | Gráfico: horas por semana, ingresos por mes, cliente que más aporta. | Feedback directo de usuarios |
| Envío de tarifario por email | Desde la app, enviar el PDF al cliente directamente. | 10+ usuarios piden esta función |
| Múltiples tarifas por cliente | Un cliente puede tener tarifa distinta por tipo de servicio (inglés general vs conversación). | Casos reales detectados en entrevistas |
| Módulo pedagógico (IA) | Generación de ideas de actividades o material nuevo para profes — producto separado. | Validar demanda independiente |
| Importar .docx / .pdf para contar palabras | El usuario sube el archivo directamente, sin necesidad de copiar y pegar el texto. | 10+ traductoras activas |
| Memoria de repeticiones entre proyectos | Para un mismo cliente, detecta palabras ya traducidas en proyectos anteriores (translation memory básico) y aplica descuento automático. | Feedback de traductoras frecuentes |

---

## 7. Métricas de Éxito

| Métrica | Meta v1 | Cómo se mide |
|---|---|---|
| Activación | 7 de cada 10 usuarios registran al menos 1 hora en los primeros 3 días | % usuarios con ≥1 registro en D+3 |
| Retención | 50% de usuarios vuelven en la semana 2 | DAU/WAU ratio |
| Valor percibido | 3 de 5 usuarios generan al menos 1 tarifario PDF en el mes 1 | Conteo de PDFs generados |
| Tiempo administrativo | Usuarios reportan reducir su carga admin en ≥30 min/semana | Survey en D+14 |
| NPS mínimo viable | NPS ≥ 30 al cierre del mes 1 | Encuesta 1 pregunta en la app |
| Engagement | Al menos 10 usuarios activos a los 30 días del lanzamiento | Usuarios con ≥3 sesiones en D+30 |

---

## 8. Restricciones

### Tiempo

- **MVP: 2 semanas de trabajo.** Sin negociación: si una feature no entra, va a post-MVP.
- Semana 1: alta de clientes (hora + por palabra), registro de horas, resumen por cliente.
- Semana 2: contador de palabras + repeticiones + modo auto/manual, separación planificación/facturable, generación de PDF, dashboard mensual.

### Presupuesto

- Techo: USD 50/mes para infraestructura.
- Estimado real v1: USD 20–25/mes (Lovable + Supabase free tier).
- Sin presupuesto para diseño UX externo: Lovable se encarga del UI por defecto.
- Sin publicidad paga en v1: validación orgánica con las 3 personas entrevistadas + red cercana.

### Habilidades y capacidades

- El builder tiene perfil de **Analista Funcional Senior**, NO de desarrollador full-stack: Lovable es la herramienta correcta porque genera código funcional desde prompts sin deuda técnica.
- Fortaleza real del builder: definición del problema, entrevistas de usuario, lógica de negocio — eso es el valor diferencial frente a un dev que vibe-codea sin entender al usuario.
- Sin equipo: producto unipersonal en v1. No escalar el alcance más allá de lo que una persona puede sostener.

### Fuera de alcance en v1 — explícito

- Integración con herramientas de facturación (AFIP, FreshBooks, etc.)
- Módulo de ideas pedagógicas — es un producto distinto, validar por separado.
- App mobile nativa — web responsive es suficiente para v1.
- Multi-idioma — solo castellano en v1.
- Cobros online — el tarifario es informativo, no un sistema de pagos.

---

*Documento de definición de producto — HorasClaras v1.1 — Mayo 2026*
