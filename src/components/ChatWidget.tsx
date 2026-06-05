import { useEffect } from "react";

const WEBHOOK_URL =
  "https://napoeltibu.app.n8n.cloud/webhook/364f2dcc-4366-4064-aa70-e962346850fd/chat";

export function ChatWidget() {
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { createChat } = await import("@n8n/chat");
      await import("@n8n/chat/style.css");
      if (!mounted) return;
      createChat({
        webhookUrl: WEBHOOK_URL,
        mode: "window",
        showWelcomeScreen: false,
        defaultLanguage: "en",
        initialMessages: [
          "¡Hola! Soy Clara, la asistente de HorasClaras 🙂",
          "¿Tenés alguna duda sobre la app? Preguntame lo que quieras.",
        ],
        i18n: {
          en: {
            title: "Clara — HorasClaras",
            subtitle: "Resuelvo tus dudas en segundos",
            footer: "",
            getStarted: "Nueva conversación",
            inputPlaceholder: "Escribí tu pregunta…",
            closeButtonTooltip: "Cerrar",
          },
        },
      });
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <style>{`
      :root {
        --chat--color-primary: #d4622a;
        --chat--color-primary-shade-50: #c2581f;
        --chat--color-primary-shade-100: #b8501f;
        --chat--color-secondary: #1a1714;
        --chat--color-white: #ffffff;
        --chat--color-light: #f7f3ee;
        --chat--color-dark: #1a1714;
        --chat--color-typing: #5a5450;
        --chat--toggle--background: #d4622a;
        --chat--toggle--hover--background: #b8501f;
        --chat--toggle--active--background: #1a1714;
        --chat--toggle--color: #ffffff;
        --chat--header--background: #1a1714;
        --chat--header--color: #ffffff;
        --chat--message--font-size: 14px;
        --chat--border-radius: 16px;
        --chat--window--width: 380px;
        --chat--window--height: 560px;
      }
    `}</style>
  );
}
