import { Bot, Send, Sparkles, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { sendChatMessage } from '../services/api';

const WELCOME = {
  role: 'assistant',
  content: '¡Hola! Soy Valdecito, tu asistente virtual de Juan Valdez Café. ¿En qué puedo ayudarte hoy? Puedo contarte sobre nuestro menú, horarios, promociones y más.',
};

const SUGERENCIAS = [
  '¿Qué bebidas frías tienen?',
  '¿Cuál es el horario de atención?',
  'Recomiéndame un postre',
  '¿Tienen promociones vigentes?',
];

const Chatbot = () => {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const content = text.trim();
    if (!content || loading) return;

    const userMessage = { role: 'user', content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      // Se envía el historial sin el mensaje de bienvenida local.
      const history = nextMessages.filter((m, i) => !(i === 0 && m === WELCOME));
      const res = await sendChatMessage(history);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      toast.error(err.message || 'No se pudo obtener respuesta del asistente');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, no pude procesar tu mensaje en este momento. Por favor, inténtalo de nuevo más tarde.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="min-h-screen bg-base-200/40">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Encabezado */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center rounded-box bg-primary/10 p-4 text-primary mb-3">
            <Sparkles size={30} />
          </div>
          <h1 className="text-3xl font-bold">Asistente Virtual</h1>
          <p className="text-base-content/60 mt-1">Conversa con Valdecito, nuestro asistente con IA.</p>
        </div>

        {/* Ventana de chat */}
        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-0">
            {/* Mensajes */}
            <div ref={scrollRef} className="h-[55vh] overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`chat ${m.role === 'user' ? 'chat-end' : 'chat-start'}`}>
                  <div className="chat-image avatar avatar-placeholder">
                    <div className={`w-9 rounded-full ${m.role === 'user' ? 'bg-neutral text-neutral-content' : 'bg-primary text-primary-content'}`}>
                      {m.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                    </div>
                  </div>
                  <div className={`chat-bubble ${m.role === 'user' ? 'chat-bubble-neutral' : 'chat-bubble-primary'} whitespace-pre-wrap`}>
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="chat chat-start">
                  <div className="chat-image avatar avatar-placeholder">
                    <div className="w-9 rounded-full bg-primary text-primary-content">
                      <Bot size={18} />
                    </div>
                  </div>
                  <div className="chat-bubble chat-bubble-primary">
                    <span className="loading loading-dots loading-sm" />
                  </div>
                </div>
              )}
            </div>

            {/* Sugerencias rápidas (solo al inicio) */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 px-4 pb-3">
                {SUGERENCIAS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => sendMessage(s)}
                    disabled={loading}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Entrada */}
            <form onSubmit={handleSubmit} className="border-t border-base-300 p-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="input input-bordered w-full"
                disabled={loading}
              />
              <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-base-content/50 mt-3">
          Las respuestas son generadas por IA y pueden contener errores.
        </p>
      </div>
    </div>
  );
};

export default Chatbot;
