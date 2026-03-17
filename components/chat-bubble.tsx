"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";

type Provider = "claude" | "openai" | "gemini";

const PROVIDER_LABELS: Record<Provider, string> = {
  claude: "Claude",
  openai: "OpenAI",
  gemini: "Gemini",
};

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [provider, setProvider] = useState<Provider>("claude");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/chat",
      body: { provider },
      maxSteps: 5,
    });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, error]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <span className="text-xs text-white bg-gray-700/80 rounded-full px-3 py-1 shadow">
          💬 Pregúntale a la IA sobre tu negocio
        </span>
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          aria-label="Abrir asistente IA"
        >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[500px] bg-white rounded-xl shadow-2xl flex flex-col border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-xl">
        <span className="font-semibold text-sm">Asistente IA</span>
        <div className="flex items-center gap-2">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            className="text-xs bg-blue-700 text-white border border-blue-500 rounded px-2 py-1 outline-none"
          >
            {(Object.keys(PROVIDER_LABELS) as Provider[]).map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABELS[p]}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-blue-700 rounded p-1 transition-colors"
            aria-label="Cerrar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !error && (
          <div className="mt-4 space-y-3">
            <p className="text-gray-600 text-sm font-medium text-center">
              Asistente IA del negocio
            </p>
            <p className="text-gray-400 text-xs text-center leading-relaxed">
              Conoce toda la información de tu academia. Puedes preguntar en español natural.
            </p>
            <div className="space-y-2 mt-4">
              {[
                "¿Cuántas clases tuve con la Familia López este año?",
                "¿Cuánto ingresé en febrero de 2026?",
                "¿Cuál es el cliente que más horas tiene?",
              ].map((hint) => (
                <button
                  key={hint}
                  onClick={() => {
                    const fakeEvent = { target: { value: hint } } as React.ChangeEvent<HTMLInputElement>;
                    handleInputChange(fakeEvent);
                  }}
                  className="w-full text-left text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg px-3 py-2 transition-colors"
                >
                  &ldquo;{hint}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.filter((m) => m.content.trim() !== "").map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-lg text-sm">
              Pensando...
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-start">
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex items-start gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
              <span>
                {error.message.includes("401")
                  ? "Sesión expirada. Recarga la página."
                  : error.message.includes("API")
                  ? `API key de ${PROVIDER_LABELS[provider]} inválida o no configurada.`
                  : "Error al conectar con el asistente. Intenta de nuevo."}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-gray-200 flex gap-2"
      >
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Escribe tu pregunta..."
          disabled={isLoading}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            "Enviar"
          )}
        </button>
      </form>
    </div>
  );
}
