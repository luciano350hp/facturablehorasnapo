import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

const CHAT_URL = "/api/chat";

type Msg = { role: "user" | "bot"; text: string };


export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: "¡Hola! Soy Sofi, la asistente de FreelanceTrack 🙂 ¿En qué te ayudo?" },
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
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: sessionIdRef.current }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      const reply =
        data.reply?.trim() ||
        "Disculpá, no pude generar una respuesta en este momento. Probá de nuevo en un ratito 🙏";
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
              <span className="text-sm font-semibold">Sofi — FreelanceTrack</span>
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
