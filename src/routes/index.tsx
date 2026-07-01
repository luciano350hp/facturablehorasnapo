import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast, Toaster } from "sonner";
import { ChatWidget } from "@/components/ChatWidget";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "FreelanceTrack — Sabé exactamente cuánto cobrar" },
      {
        name: "description",
        content:
          "Para profes de inglés y traductoras freelance: registrá tus horas y trabajos de traducción, y generá un tarifario PDF listo para enviar por WhatsApp.",
      },
      { property: "og:title", content: "FreelanceTrack — Sabé exactamente cuánto cobrar" },
      {
        property: "og:description",
        content:
          "Registrá tus horas y trabajos de traducción, y generá un tarifario PDF en menos de 2 minutos.",
      },
    ],
  }),
});

const styles = `
:root {
  --hc-cream: #f7f3ee;
  --hc-ink: #1a1714;
  --hc-ink-soft: #5a5450;
  --hc-accent: #d4622a;
  --hc-accent-light: #f0e0d6;
  --hc-border: #e2dbd4;
  --hc-white: #ffffff;
}
.hc-root { font-family: 'DM Sans', system-ui, sans-serif; background: var(--hc-cream); color: var(--hc-ink); font-size: 16px; line-height: 1.6; overflow-x: hidden; }
.hc-root *, .hc-root *::before, .hc-root *::after { box-sizing: border-box; }
.hc-root h1, .hc-root h2, .hc-root h3, .hc-root p, .hc-root ul { margin: 0; padding: 0; }

.hc-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 18px 48px; display: flex; justify-content: space-between; align-items: center; background: rgba(247,243,238,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--hc-border); }
.hc-logo { font-family: 'Instrument Serif', serif; font-size: 20px; color: var(--hc-ink); text-decoration: none; }
.hc-logo span { color: var(--hc-accent); }
.hc-nav-right { display: flex; gap: 14px; align-items: center; }
.hc-nav-link { color: var(--hc-ink-soft); text-decoration: none; font-size: 14px; }
.hc-nav-link:hover { color: var(--hc-accent); }
.hc-nav-cta { background: var(--hc-ink); color: var(--hc-white); padding: 10px 22px; border-radius: 100px; font-size: 14px; font-weight: 500; text-decoration: none; transition: background 0.2s; }
.hc-nav-cta:hover { background: var(--hc-accent); }

.hc-hero { min-height: 100vh; display: flex; align-items: center; padding: 120px 48px 80px; position: relative; overflow: hidden; }
.hc-hero::before { content: ''; position: absolute; top: -200px; right: -200px; width: 600px; height: 600px; background: radial-gradient(circle, rgba(212,98,42,0.12) 0%, transparent 70%); pointer-events: none; }
.hc-hero-inner { max-width: 720px; position: relative; z-index: 1; }
.hc-tag { display: inline-block; background: var(--hc-accent-light); color: var(--hc-accent); font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 14px; border-radius: 100px; margin-bottom: 28px; }
.hc-hero h1 { font-family: 'Instrument Serif', serif; font-size: clamp(42px, 7vw, 72px); line-height: 1.1; color: var(--hc-ink); margin-bottom: 24px; }
.hc-hero h1 em { font-style: italic; color: var(--hc-accent); }
.hc-hero p { font-size: 18px; color: var(--hc-ink-soft); max-width: 520px; margin-bottom: 40px; line-height: 1.7; }
.hc-form { display: flex; gap: 10px; flex-wrap: wrap; }
.hc-form input { flex: 1; min-width: 220px; padding: 14px 20px; border: 1px solid var(--hc-border); border-radius: 100px; font-size: 15px; font-family: inherit; background: var(--hc-white); color: var(--hc-ink); outline: none; }
.hc-form input:focus { border-color: var(--hc-accent); }
.hc-form button { padding: 14px 28px; background: var(--hc-accent); color: var(--hc-white); border: none; border-radius: 100px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.2s, transform 0.15s; }
.hc-form button:hover { background: #b8501f; transform: translateY(-1px); }
.hc-form button:disabled { opacity: 0.6; cursor: not-allowed; }
.hc-hero-note { font-size: 13px; color: var(--hc-ink-soft); margin-top: 14px; }

.hc-proof { border-top: 1px solid var(--hc-border); padding: 20px 48px; display: flex; align-items: center; gap: 32px; flex-wrap: wrap; background: var(--hc-white); }
.hc-proof-item { font-size: 13px; color: var(--hc-ink-soft); display: flex; align-items: center; gap: 8px; }
.hc-proof-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--hc-accent); flex-shrink: 0; }

.hc-problem { padding: 100px 48px; max-width: 900px; margin: 0 auto; }
.hc-problem h2 { font-family: 'Instrument Serif', serif; font-size: clamp(28px, 4vw, 42px); line-height: 1.2; margin-bottom: 48px; color: var(--hc-ink); }
.hc-problem h2 em { font-style: italic; color: var(--hc-accent); }
.hc-pain-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.hc-pain { background: var(--hc-white); border: 1px solid var(--hc-border); border-radius: 16px; padding: 24px; }
.hc-pain-icon { font-size: 24px; margin-bottom: 12px; }
.hc-pain h3 { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
.hc-pain p { font-size: 14px; color: var(--hc-ink-soft); line-height: 1.6; }

.hc-features { padding: 80px 48px; background: var(--hc-ink); color: var(--hc-white); }
.hc-features-inner { max-width: 900px; margin: 0 auto; }
.hc-features-tag { display: inline-block; background: rgba(212,98,42,0.3); color: #f09070; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 14px; border-radius: 100px; margin-bottom: 24px; }
.hc-features h2 { font-family: 'Instrument Serif', serif; font-size: clamp(28px, 4vw, 42px); margin-bottom: 48px; line-height: 1.2; }
.hc-features h2 em { color: var(--hc-accent); font-style: italic; }
.hc-feature-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
.hc-feature { border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; transition: border-color 0.2s; }
.hc-feature:hover { border-color: rgba(212,98,42,0.5); }
.hc-feature-num { font-family: 'Instrument Serif', serif; font-size: 36px; color: rgba(255,255,255,0.15); margin-bottom: 12px; }
.hc-feature h3 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
.hc-feature p { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.6; }

.hc-forwho { padding: 100px 48px; max-width: 900px; margin: 0 auto; }
.hc-forwho h2 { font-family: 'Instrument Serif', serif; font-size: clamp(28px, 4vw, 42px); margin-bottom: 40px; line-height: 1.2; }
.hc-forwho h2 em { font-style: italic; color: var(--hc-accent); }
.hc-profiles { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.hc-profile { background: var(--hc-white); border: 1px solid var(--hc-border); border-radius: 20px; padding: 28px; }
.hc-profile-emoji { font-size: 32px; margin-bottom: 14px; }
.hc-profile h3 { font-size: 17px; font-weight: 600; margin-bottom: 6px; }
.hc-profile p { font-size: 14px; color: var(--hc-ink-soft); line-height: 1.6; }
.hc-profile ul { margin-top: 12px; padding-left: 18px; }
.hc-profile ul li { font-size: 13px; color: var(--hc-ink-soft); margin-bottom: 4px; }

.hc-final { padding: 100px 48px; text-align: center; background: var(--hc-accent-light); border-top: 1px solid #e8d5c8; }
.hc-final h2 { font-family: 'Instrument Serif', serif; font-size: clamp(32px, 5vw, 52px); line-height: 1.15; margin: 0 auto 20px; color: var(--hc-ink); max-width: 600px; }
.hc-final h2 em { font-style: italic; color: var(--hc-accent); }
.hc-final p { font-size: 17px; color: var(--hc-ink-soft); margin-bottom: 36px; }
.hc-final form { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.hc-final input { padding: 14px 22px; border: 1px solid #d0bfb3; border-radius: 100px; font-size: 15px; font-family: inherit; background: var(--hc-white); color: var(--hc-ink); width: 280px; outline: none; }
.hc-final input:focus { border-color: var(--hc-accent); }
.hc-final button { padding: 14px 28px; background: var(--hc-ink); color: var(--hc-white); border: none; border-radius: 100px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.2s; }
.hc-final button:hover { background: var(--hc-accent); }
.hc-final button:disabled { opacity: 0.6; cursor: not-allowed; }

.hc-footer { padding: 24px 48px; text-align: center; font-size: 13px; color: var(--hc-ink-soft); border-top: 1px solid var(--hc-border); }

@media (max-width: 640px) {
  .hc-nav { padding: 16px 20px; }
  .hc-hero { padding: 100px 20px 60px; }
  .hc-proof { padding: 16px 20px; gap: 16px; }
  .hc-problem, .hc-forwho { padding: 60px 20px; }
  .hc-features { padding: 60px 20px; }
  .hc-final { padding: 60px 20px; }
  .hc-footer { padding: 20px; }
  .hc-profiles { grid-template-columns: 1fr; }
}
`;

function useFont() {
  useEffect(() => {
    const id = "hc-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

function WaitlistForm({ source, variant }: { source: string; variant: "hero" | "final" }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Ingresá un email válido");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("waitlist_signups")
      .insert({ email: email.trim().toLowerCase(), source });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast.success("Ya estás anotada — te avisamos cuando abramos.");
        setEmail("");
        return;
      }
      toast.error("No pudimos anotarte. Probá de nuevo en un rato.");
      return;
    }
    setEmail("");
    toast.success("¡Listo! Te avisamos cuando abramos el acceso.");
  };

  return (
    <form className={variant === "hero" ? "hc-form" : ""} onSubmit={onSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Anotando…" : "Quiero acceso anticipado"}
      </button>
    </form>
  );
}

function Landing() {
  useFont();
  return (
    <div className="hc-root">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <Toaster position="top-center" richColors />

      <nav className="hc-nav">
        <a className="hc-logo" href="#top">
          Horas<span>Claras</span>
        </a>
        <div className="hc-nav-right">
          <Link to="/app" className="hc-nav-link">
            Probar la app
          </Link>
          <a className="hc-nav-cta" href="#lista">
            Quiero acceso anticipado
          </a>
        </div>
      </nav>

      <section className="hc-hero" id="top">
        <div className="hc-hero-inner">
          <div className="hc-tag">Para profes y traductoras freelance</div>
          <h1>
            Sabé exactamente
            <br />
            cuánto cobrarle
            <br />a <em>cada cliente</em>
          </h1>
          <p>
            Registrá tus horas y trabajos de traducción, y generá un tarifario profesional en PDF
            listo para enviar por WhatsApp — en menos de 2 minutos.
          </p>
          <div id="lista">
            <WaitlistForm source="hero" variant="hero" />
          </div>
          <p className="hc-hero-note">
            Gratis durante el lanzamiento · Sin tarjeta de crédito
          </p>
        </div>
      </section>

      <div className="hc-proof">
        <div className="hc-proof-item">
          <span className="hc-proof-dot" />
          Validado con profes y traductoras reales
        </div>
        <div className="hc-proof-item">
          <span className="hc-proof-dot" />
          Funciona en celular y computadora
        </div>
        <div className="hc-proof-item">
          <span className="hc-proof-dot" />
          Todo en castellano
        </div>
        <div className="hc-proof-item">
          <span className="hc-proof-dot" />
          Sin planillas ni cuentas manuales
        </div>
      </div>

      <section className="hc-problem">
        <h2>
          ¿Cuántas horas perdés
          <br />
          por mes en <em>administración</em>
          <br />
          que no te paga nadie?
        </h2>
        <div className="hc-pain-grid">
          {[
            { i: "😶", h: "Fin de mes sin claridad", p: "No sabés bien cuántas horas trabajaste ni cuánto cobrarle a cada cliente. Terminás cobrando de menos." },
            { i: "📊", h: "La planilla que nadie entiende", p: "Un Excel con fórmulas que se rompen, datos desactualizados y presupuestos hechos a mano en WhatsApp." },
            { i: "🔢", h: "Contar palabras a mano", p: "Pegar el texto en Word, contar, calcular el descuento por repeticiones, multiplicar por la tarifa... cada vez." },
            { i: "⏳", h: "Tiempo que no cobra", p: "Entre 30 y 60 minutos por semana en tareas administrativas. Tiempo que podría ser otra clase o descanso." },
          ].map((c) => (
            <div key={c.h} className="hc-pain">
              <div className="hc-pain-icon">{c.i}</div>
              <h3>{c.h}</h3>
              <p>{c.p}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="hc-features">
        <div className="hc-features-inner">
          <div className="hc-features-tag">Cómo funciona</div>
          <h2>
            Todo lo que necesitás,
            <br />
            <em>nada que no usás</em>
          </h2>
          <div className="hc-feature-list">
            {[
              { n: "01", h: "Registrá tus horas", p: "Cliente, fecha, duración y tipo (facturable o planificación). En 30 segundos. Desde el celular entre clase y clase." },
              { n: "02", h: "Cotizador de palabras", p: "Pegás el texto y la app cuenta sola: total, únicas, repetidas. Aplica el descuento configurado y te da el precio." },
              { n: "03", h: "Tarifario PDF en un clic", p: "Elegís el cliente y el mes. La app genera un PDF prolijo con el detalle completo, listo para mandar por WhatsApp." },
              { n: "04", h: "Dashboard del mes", p: "Ves de un vistazo cuánto trabajaste, para quién, y cuánto vas a cobrar. Sin buscar en planillas ni hacer cuentas." },
            ].map((f) => (
              <div key={f.n} className="hc-feature">
                <div className="hc-feature-num">{f.n}</div>
                <h3>{f.h}</h3>
                <p>{f.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hc-forwho">
        <h2>
          Hecho para <em>vos</em>
        </h2>
        <div className="hc-profiles">
          <div className="hc-profile">
            <div className="hc-profile-emoji">👩‍🏫</div>
            <h3>Profesora de inglés</h3>
            <p>
              Tenés varios alumnos con distintos horarios y tarifas. Querés saber exactamente
              cuántas horas diste en el mes y generar el resumen para cada uno.
            </p>
            <ul>
              <li>Registro de horas por cliente</li>
              <li>Separación facturable / planificación</li>
              <li>Tarifario PDF listo para enviar</li>
            </ul>
          </div>
          <div className="hc-profile">
            <div className="hc-profile-emoji">📝</div>
            <h3>Traductora freelance</h3>
            <p>
              Cobrás por palabra y necesitás contar, calcular descuentos por repeticiones y
              presupuestar rápido. Sin perder tiempo en cuentas manuales.
            </p>
            <ul>
              <li>Cotizador automático de palabras</li>
              <li>Descuento por repeticiones configurable</li>
              <li>Presupuesto listo en segundos</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="hc-final">
        <h2>
          Empezá el mes que viene
          <br />
          sabiendo <em>exactamente</em>
          <br />
          cuánto cobrar
        </h2>
        <p>Anotate y sé de las primeras en acceder gratis.</p>
        <WaitlistForm source="cta_final" variant="final" />
      </section>

      <footer className="hc-footer">
        © 2026 FreelanceTrack · Para profes y traductoras freelance de Argentina
      </footer>
      <ChatWidget />
    </div>
  );
}
