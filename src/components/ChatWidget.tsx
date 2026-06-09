import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

const WEBHOOK_URL =
  "https://napoeltibu.app.n8n.cloud/webhook/364f2dcc-4366-4064-aa70-e962346850fd/chat";

type Msg = { role: "user" | "bot"; text: string };

function extractText(data: unknown): string {
  if (data == null) return "";
  if (typeof data === "string") return data;
  if (Array.isArray(data)) {
    for (const item of data) {
      const t = extractText(item);
      if (t) return t;
    }
    return "";
  }
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    // Common n8n Chat Trigger / AI Agent response keys
    const keys = ["output", "text", "message", "response", "answer", "content", "reply", "data"];
    for (const k of keys) {
      if (k in obj) {
        const t = extractText(obj[k]);
        if (t) return t;
      }
    }
  }
  return "";
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: "¡Hola! Soy Clara, la asistente de HorasClaras 🙂 ¿En qué te ayudo?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendMessage",
          sessionId: sessionIdRef.current,
          chatInput: text,
          message: text,
        }),
      });
      const raw = (await res.text()).trim();
      let reply = "";
      // n8n Chat Trigger streaming: NDJSON con {type:"item",content:"..."}
      if (raw.includes('"type"') && raw.includes('"item"')) {
        const lines = raw.split(/\r?\n/).filter(Boolean);
        const parts: string[] = [];
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj?.type === "item" && typeof obj.content === "string") {
              parts.push(obj.content);
            } else if (obj?.type === "end" && typeof obj?.content === "string") {
              parts.push(obj.content);
            }
          } catch {
            /* ignore parse errors per line */
          }
        }
        reply = parts.join("").trim();
      }
      if (!reply) {
        // Fallback: respuesta JSON única
        try {
          reply = extractText(JSON.parse(raw));
        } catch {
          reply = raw;
        }
      }
      if (!reply) reply = "Disculpá, no pude generar una respuesta en este momento. Probá de nuevo en un ratito 🙏";

      setMessages((m) => [...m, { role: "bot", text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "Ups, hubo un problema de conexión. Intentá nuevamente." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
        style={{ background: "#d4622a", color: "#fff" }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 flex w-[90vw] max-w-[380px] flex-col overflow-hidden rounded-2xl shadow-2xl"
          style={{ height: "min(560px, 75vh)", background: "#fff", border: "1px solid #e5e0d8" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#1a1714", color: "#fff" }}>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
              style={{ background: "#d4622a" }}
            >
              C
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Clara — HorasClaras</span>
              <span className="text-xs opacity-70">Resuelvo tus dudas en segundos</span>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3" style={{ background: "#f7f3ee" }}>
            <div className="flex flex-col gap-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm"
                  style={
                    m.role === "user"
                      ? { alignSelf: "flex-end", background: "#d4622a", color: "#fff", borderBottomRightRadius: 4 }
                      : { alignSelf: "flex-start", background: "#fff", color: "#1a1714", border: "1px solid #ece6dc", borderBottomLeftRadius: 4 }
                  }
                >
                  {m.text}
                </div>
              ))}
              {loading && (
                <div
                  className="max-w-[85%] rounded-2xl px-3 py-2 text-sm"
                  style={{ alignSelf: "flex-start", background: "#fff", color: "#5a5450", border: "1px solid #ece6dc" }}
                >
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full" style={{ background: "#d4622a", animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full" style={{ background: "#d4622a", animationDelay: "120ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full" style={{ background: "#d4622a", animationDelay: "240ms" }} />
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-2 border-t px-3 py-2"
            style={{ background: "#fff", borderColor: "#ece6dc" }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí tu pregunta…"
              className="flex-1 rounded-full px-4 py-2 text-sm outline-none"
              style={{ background: "#f7f3ee", color: "#1a1714" }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity disabled:opacity-50"
              style={{ background: "#d4622a", color: "#fff" }}
              aria-label="Enviar"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
