import React, { useState, useRef, useEffect } from 'react';
import { usePDDE } from '../context/PDDEContext';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  BookOpen, 
  Scale, 
  Landmark, 
  AlertCircle,
  HelpCircle,
  Zap,
  BrainCircuit,
  MessageSquareText
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export const PDDEChatbot: React.FC = () => {
  const { currentSchool, selectedYear, financialSummary } = usePDDE();

  const [isOpen, setIsOpen] = useState(true);
  const [modelPreference, setModelPreference] = useState<'general' | 'fast' | 'complex'>('general');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initial greeting message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: `Olá! Sou o **Assistente Jurídico e Contábil do PDDE da Prefeitura de Santa Cruz do Sul e FNDE**.\n\nEstou parametrizado com as leis e diretrizes vigentes:\n- **Resolução CD/FNDE nº 15/2021** (Regulamento Geral do PDDE);\n- **Lei Federal nº 11.947/2009** (Descentralização e isenção de tarifas bancárias);\n- **Decretos Municipais de Santa Cruz do Sul** (SEE / repasses complementares aos CPMs e APEEFs);\n- **Normas de Licitação / Compras** (Mínimo de 3 orçamentos, CNDs e menor preço);\n- **Programas FNDE:** PDDE Básico, Educação Conectada, Estrutura e Tempo Integral.\n\nEstou ciente dos dados atuais da **${currentSchool?.name || 'sua escola'}** no exercício de **${selectedYear}** (Saldo disponível: R$ ${financialSummary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Como posso ajudar?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (confirm('Deseja reiniciar a conversa com o Assistente do PDDE?')) {
      setMessages([
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Conversa reiniciada. Pode enviar sua dúvida sobre a aplicação dos recursos do PDDE Municipal de Santa Cruz do Sul ou programas do FNDE.`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare context for backend proxy
      const schoolContext = currentSchool ? {
        schoolName: currentSchool.name,
        uexName: currentSchool.uexName,
        uexCnpj: currentSchool.uexCnpj,
        year: selectedYear,
        balance: financialSummary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        totalExpenses: financialSummary.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        status: currentSchool.status,
      } : undefined;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          schoolContext,
          modelPreference,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na resposta do servidor: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.text || 'Não foi possível obter uma resposta adequada.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Falha no chatbot:', error);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Houve uma oscilação na conexão com o servidor. A legislação do PDDE Municipal e Resolução CD/FNDE nº 15/2021 estabelece que toda despesa deve ter pesquisa de 3 preços, ser paga via débito em conta ou PIX identificado e ter aprovação prévia do Conselho Fiscal do CPM. Por favor, tente novamente em instantes.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Quais despesas são terminantemente proibidas no PDDE Municipal?',
    'Como proceder se não conseguir 3 orçamentos em Santa Cruz do Sul?',
    'Posso comprar ar-condicionado ou computador com verba de Custeio?',
    'O Banco do Brasil cobrou tarifa bancária. Como recuperar?',
    'Como transferir os rendimentos da poupança para o próximo ano?',
    'Quais são os prazos de prestação de contas na SEE e no SiGPC?',
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white tracking-tight">
                Assistente de Legislação do PDDE
              </h3>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                SEE Santa Cruz do Sul & FNDE
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/70">
              Tira-dúvidas normativo, limites de compras, rubricas e prevenção de glosas
            </p>
          </div>
        </div>

        {/* Model preference selector & Collapse control */}
        <div className="flex items-center gap-2">
          {/* Model picker */}
          <div className="hidden sm:flex items-center bg-black/30 rounded-md p-0.5 border border-white/10 text-[11px]">
            <button
              onClick={() => setModelPreference('general')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                modelPreference === 'general' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
              title="Gemini 3.8 Flash: Equilíbrio padrão ideal para consultas em leis e gestão do PDDE"
            >
              <Sparkles className="w-3 h-3" />
              <span>Geral (3.8 Flash)</span>
            </button>
            <button
              onClick={() => setModelPreference('fast')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                modelPreference === 'fast' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
              title="Gemini 3.1 Flash Lite: Respostas ultra-rápidas para dúvidas diretas"
            >
              <Zap className="w-3 h-3" />
              <span>Rápido (Flash Lite)</span>
            </button>
            <button
              onClick={() => setModelPreference('complex')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                modelPreference === 'complex' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
              title="Gemini 4 Argon: Análise jurídica avançada para recursos complexos e defesas de auditoria"
            >
              <BrainCircuit className="w-3 h-3" />
              <span>Avançado (Argon)</span>
            </button>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="Limpar histórico da conversa"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title={isOpen ? 'Recolher chat' : 'Expandir chat'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chat Body */}
      {isOpen && (
        <div className="flex flex-col h-[480px]">
          {/* Quick Prompts Bar */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="font-semibold text-slate-500 shrink-0 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
              Perguntas frequentes:
            </span>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="shrink-0 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded px-2.5 py-1 transition-all cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40 text-xs">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                    isUser ? 'bg-slate-800 text-white' : 'bg-emerald-800 text-emerald-100 shadow-xs'
                  }`}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`rounded-xl px-4 py-3 shadow-xs text-slate-800 ${
                    isUser
                      ? 'bg-emerald-900 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 rounded-tl-none space-y-2'
                  }`}>
                    <div className="leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>

                    <div className={`flex items-center justify-between text-[10px] pt-1 border-t ${
                      isUser ? 'border-emerald-800/80 text-emerald-200' : 'border-slate-100 text-slate-400'
                    }`}>
                      <span>{msg.timestamp} {msg.modelUsed && `· ${msg.modelUsed}`}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="flex items-center gap-1 hover:text-slate-700 transition-colors cursor-pointer ml-3"
                          title="Copiar texto da resposta"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3 max-w-xl mr-auto">
                <div className="w-7 h-7 rounded-full bg-emerald-800 text-emerald-100 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none px-4 py-3 shadow-xs text-xs text-slate-500 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  <span>Consultando bases legais do FNDE e normas municipais de Santa Cruz do Sul...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua dúvida sobre leis do PDDE, orçamentos, notas fiscais, contas bancárias ou prazos..."
              disabled={isLoading}
              className="flex-1 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Perguntar</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
