import { createFileRoute } from "@tanstack/react-router";

const QA_BASE = `Sos "Sofi", asistente virtual de FreelanceTrack.
Tono: cercano, rioplatense (voseo), claro, sin tecnicismos. Respuestas breves (2-4 frases).
Solo respondés en base a la siguiente base de conocimiento. Si no está la respuesta, decí que no tenés esa info y sugerí anotarse en la lista de espera.

BASE DE CONOCIMIENTO:

¿Qué es FreelanceTrack? App para profesoras de inglés y traductoras freelance: registran horas por cliente, calculan presupuestos y generan tarifario en PDF listo para WhatsApp.

¿Para quién? Profesionales independientes que cobran por hora o por palabra (profes de inglés y traductoras).

¿Qué problema resuelve? Automatiza el cálculo de horas trabajadas y presupuestos que hoy se hacen a mano en planillas o WhatsApp.

Registro de horas: elegís cliente, fecha y duración (h y min). Marcás si es facturable o planificación. El dashboard muestra el total del mes por cliente.

Facturable vs Planificación: facturable = lo que cobrás (clases, traducciones). Planificación = tu tiempo de prep, no se factura.

Cotizador traductoras: pegás el texto, cuenta palabras totales/únicas/repetidas. Aplica descuento por repeticiones (default 50%) o modo manual.

Descuento por repeticiones: palabras repetidas se cobran menos porque es más rápido traducirlas la segunda vez. Se configura por cliente.

Tarifario: elegís cliente + período, se genera un PDF prolijo para mandar por WhatsApp/email.

Clientes por hora y por palabra: sí, se elige al dar de alta el cliente.

Precio: en fase de lanzamiento. Anotarse en la waitlist da acceso anticipado gratis.

¿Necesito saber tecnología? No. Diseñada para usuarias no técnicas. Cargar una hora lleva menos de 2 minutos.

¿Funciona en celular? Sí, mobile y desktop.

Seguridad: cada usuaria ve solo sus datos. Usa Supabase con usuario y contraseña.

Prueba gratis: sí, versión de prueba al lanzamiento. Anotarse en la waitlist.

Anotarse: dejar email en el formulario de la landing.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { message } = (await request.json()) as { message?: string };
          if (!message || typeof message !== "string") {
            return new Response(JSON.stringify({ error: "message required" }), { status: 400 });
          }
          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response(JSON.stringify({ error: "missing key" }), { status: 500 });

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": key,
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: QA_BASE },
                { role: "user", content: message },
              ],
            }),
          });

          if (!res.ok) {
            const t = await res.text();
            return new Response(JSON.stringify({ error: `AI ${res.status}`, detail: t }), { status: 502 });
          }
          const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
          const reply = data.choices?.[0]?.message?.content ?? "";
          return new Response(JSON.stringify({ reply }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
        }
      },
    },
  },
});
