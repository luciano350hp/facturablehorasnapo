import { useEffect } from "react";

const WEBHOOK_URL =
  "https://napoeltibu.app.n8n.cloud/webhook/364f2dcc-4366-4064-aa70-e962346850fd/chat";

declare global {
  interface Window {
    __hcN8nChatInitialized?: boolean;
  }
}

export function ChatWidget() {
  useEffect(() => {
    if (window.__hcN8nChatInitialized) return;

    if (!document.getElementById("n8n-chat-css")) {
      const link = document.createElement("link");
      link.id = "n8n-chat-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/@n8n/chat@1.23.0/dist/style.css";
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.id = "n8n-chat-script";
    script.type = "module";
    script.textContent = `
      import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat@1.23.0/dist/chat.bundle.es.js';
      createChat({
        webhookUrl: ${JSON.stringify(WEBHOOK_URL)},
        mode: 'window',
        showWelcomeScreen: false,
        defaultLanguage: 'en',
        initialMessages: [
          '¡Hola! Soy Clara, la asistente de HorasClaras 🙂',
          '¿Tenés alguna duda sobre la app? Preguntame lo que quieras.',
        ],
        i18n: {
          en: {
            title: 'Clara — HorasClaras',
            subtitle: 'Resuelvo tus dudas en segundos',
            footer: '',
            getStarted: 'Nueva conversación',
            inputPlaceholder: 'Escribí tu pregunta…',
            closeButtonTooltip: 'Cerrar',
          },
        },
      });
    `;
    document.body.appendChild(script);
    window.__hcN8nChatInitialized = true;
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
