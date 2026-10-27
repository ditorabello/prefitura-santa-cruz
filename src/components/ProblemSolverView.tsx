import React, { useState } from 'react';
import { usePDDE } from '../context/PDDEContext';
import { AuditCheckResult, DiligenceItem } from '../types/pdde';
import { formatBRL, formatDateBR } from '../utils/formatters';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Wrench, 
  MessageSquare, 
  BookOpen, 
  Copy, 
  Check, 
  ArrowRight, 
  Sparkles, 
  FileText, 
  Send,
  HelpCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';

export const ProblemSolverView: React.FC = () => {
  const { 
    currentSchool, 
    selectedYear, 
    auditChecks, 
    schoolDiligences, 
    setActiveTab,
    reconcileAllExpenses,
    syncCapitalAssets,
    autoFixCouncilOpinion,
    respondDiligence,
    resolveDiligence,
    activeViewMode
  } = usePDDE();

  const [activeSubTab, setActiveSubTab] = useState<'diagnostic' | 'diligences' | 'guide'>('diagnostic');
  const [selectedDiligence, setSelectedDiligence] = useState<DiligenceItem | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoFixSuccessMessage, setAutoFixSuccessMessage] = useState<string | null>(null);

  if (!currentSchool) return null;

  const blockingIssues = auditChecks.filter(c => c.severity === 'bloqueante');
  const warningIssues = auditChecks.filter(c => c.severity === 'advertencia');

  const complianceScore = Math.max(0, 100 - (blockingIssues.length * 25) - (warningIssues.length * 10));

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleAutoFixAll = () => {
    reconcileAllExpenses();
    syncCapitalAssets();
    autoFixCouncilOpinion();
    setAutoFixSuccessMessage('Ações automáticas executadas: pagamentos conciliados, bens de capital sincronizados e parecer do conselho regularizado!');
    setTimeout(() => setAutoFixSuccessMessage(null), 4000);
  };

  const handleSendResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiligence || !responseNotes) return;
    respondDiligence(selectedDiligence.id, responseNotes);
    setSelectedDiligence(null);
    setResponseNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-xl p-5 shadow-xs border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold tracking-wide uppercase mb-1">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>Auditoria Preventiva & Resolução de Inconformidades</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Central de Tratamento de Problemas e Diligências do PDDE
          </h2>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl">
            Diagnóstico antecipado contra glosas, rejeições do Conselho Fiscal, apontamentos da SEE e diligências do Tribunal de Contas.
          </p>
        </div>

        {/* Compliance Meter & Auto-Fix Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-2.5 rounded-lg text-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-300 block font-semibold">
              Índice de Conformidade Legal
            </span>
            <div className={`text-xl font-bold font-mono ${
              complianceScore >= 80 ? 'text-emerald-400' : complianceScore >= 50 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {complianceScore}% Conforme
            </div>
          </div>

          <button
            onClick={handleAutoFixAll}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg"
            title="Corrigir automaticamente itens estruturados como conciliação bancária, tombamento de bens e quórum"
          >
            <Sparkles className="w-4 h-4" />
            <span>Corrigir Pendências em 1 Clique</span>
          </button>
        </div>
      </div>

      {autoFixSuccessMessage && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs p-3.5 rounded-lg flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{autoFixSuccessMessage}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('diagnostic')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'diagnostic'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Diagnóstico da Escola ({auditChecks.length} itens)</span>
          {blockingIssues.length > 0 && (
            <span className="bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {blockingIssues.length} bloqueios
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('diligences')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'diligences'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Diligências da SEE ({schoolDiligences.length})</span>
          {schoolDiligences.filter(d => d.status === 'pendente').length > 0 && (
            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {schoolDiligences.filter(d => d.status === 'pendente').length} pendente(s)
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('guide')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'guide'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Guia dos 7 Principais Problemas & Modelos de Justificativa</span>
        </button>
      </div>

      {/* 1. DIAGNOSTIC TAB */}
      {activeSubTab === 'diagnostic' && (
        <div className="space-y-4">
          {auditChecks.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-emerald-950 text-sm">
                Nenhuma inconformidade ou problema detectado!
              </h3>
              <p className="text-emerald-800 max-w-md mx-auto">
                A prestação de contas de {currentSchool.name} para o exercício de {selectedYear} está 
                100% aderente às diretrizes do PDDE Municipal e Resolução do FNDE.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {auditChecks.map((check) => {
                const isBlocking = check.severity === 'bloqueante';
                return (
                  <div
                    key={check.id}
                    className={`bg-white rounded-xl border p-4 shadow-xs transition-all ${
                      isBlocking
                        ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200'
                        : 'border-amber-300 bg-amber-50/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded shrink-0 ${isBlocking ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {isBlocking ? <XCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              isBlocking ? 'bg-red-700 text-white' : 'bg-amber-700 text-white'
                            }`}>
                              {isBlocking ? 'Bloqueio Legal' : 'Risco de Diligência'}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                              Módulo: {check.category}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">{check.title}</h4>
                          <p className="text-slate-700 leading-relaxed max-w-3xl">{check.description}</p>
                          <div className="text-[11px] text-slate-500 font-mono pt-1">
                            <strong>Base Legal:</strong> {check.legalBasis}
                          </div>
                        </div>
                      </div>

                      {/* Action to resolve */}
                      <div className="shrink-0 flex items-center sm:flex-col gap-2">
                        {check.actionTab && (
                          <button
                            onClick={() => setActiveTab(check.actionTab!)}
                            className="px-3 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ir para {check.actionTab}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {check.id.includes('capital') && (
                          <button
                            onClick={syncCapitalAssets}
                            className="px-3 py-1.5 bg-emerald-800 text-white rounded font-semibold hover:bg-emerald-900 transition-colors cursor-pointer"
                          >
                            Sincronizar Bens
                          </button>
                        )}
                        {check.id.includes('unreconciled') && (
                          <button
                            onClick={reconcileAllExpenses}
                            className="px-3 py-1.5 bg-emerald-800 text-white rounded font-semibold hover:bg-emerald-900 transition-colors cursor-pointer"
                          >
                            Conciliar Todos
                          </button>
                        )}
                        {check.id.includes('council') && (
                          <button
                            onClick={autoFixCouncilOpinion}
                            className="px-3 py-1.5 bg-emerald-800 text-white rounded font-semibold hover:bg-emerald-900 transition-colors cursor-pointer"
                          >
                            Regularizar Parecer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. DILIGENCES TAB */}
      {activeSubTab === 'diligences' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong>Como funcionam as diligências na Secretaria Municipal de Educação:</strong> Quando a comissão técnica da SEE encontra 
              uma inconsistência documental (falta de CND, nota sem ateste, ata incompleta), é expedida uma Notificação de Diligência com prazo para correção. 
              A escola responde juntando os esclarecimentos e a SEE homologa o saneamento da pendência.
            </div>
          </div>

          {schoolDiligences.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
              Nenhuma diligência registrada para esta escola.
            </div>
          ) : (
            <div className="space-y-3">
              {schoolDiligences.map((dil) => {
                const isPending = dil.status === 'pendente';
                const isAnswered = dil.status === 'respondida';
                const isResolved = dil.status === 'homologada';

                return (
                  <div key={dil.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isPending ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          isAnswered ? 'bg-sky-100 text-sky-900 border border-sky-300' :
                          'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {isPending ? 'Aguardando Resposta da Escola' : isAnswered ? 'Resposta Enviada à SEE' : 'Diligência Sanada / Homologada'}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">Expedida em: {formatDateBR(dil.date)}</span>
                      </div>

                      <div className="text-slate-500 text-[11px]">
                        Emissor: <strong className="text-slate-700">{dil.reviewedBySEE || 'SEE Santa Cruz do Sul'}</strong>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">{dil.subject}</h4>
                      <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                        {dil.description}
                      </p>
                      {dil.legalReference && (
                        <div className="text-[11px] text-slate-500 mt-1">
                          <strong>Amparo Legal:</strong> {dil.legalReference}
                        </div>
                      )}
                    </div>

                    {/* School Response */}
                    {dil.schoolResponse ? (
                      <div className="bg-sky-50/70 border border-sky-200 rounded p-3 text-slate-800 space-y-1">
                        <div className="flex items-center justify-between font-semibold text-sky-950">
                          <span>Resposta Formalizada pela Escola:</span>
                          <span className="text-[10px] text-sky-700 font-normal">Data: {formatDateBR(dil.responseDate)}</span>
                        </div>
                        <p className="leading-relaxed">{dil.schoolResponse}</p>
                      </div>
                    ) : (
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-amber-800 text-[11px] font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Prazo de atendimento em aberto (15 dias úteis)
                        </span>
                        <button
                          onClick={() => setSelectedDiligence(dil)}
                          className="px-3 py-1.5 bg-emerald-800 text-white rounded font-semibold text-xs hover:bg-emerald-900 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Responder Notificação</span>
                        </button>
                      </div>
                    )}

                    {/* SEE Action to homologate/resolve if in SEE mode or if answered */}
                    {(activeViewMode === 'see' || isAnswered) && !isResolved && (
                      <div className="pt-2 flex items-center justify-end">
                        <button
                          onClick={() => {
                            if (confirm('Homologar e dar baixa definitiva nesta diligência?')) {
                              resolveDiligence(dil.id, 'Regularidade comprovada e acolhida pela SEE Santa Cruz do Sul.');
                            }
                          }}
                          className="px-3 py-1.5 bg-emerald-700 text-white rounded font-semibold text-xs hover:bg-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Homologar e Baixar Diligência</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. PRACTICAL GUIDE & OFFICIAL JUSTIFICATION TEMPLATES */}
      {activeSubTab === 'guide' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>Manual Prático de Solução dos 7 Maiores Problemas do PDDE</span>
            </h3>
            <p className="text-xs text-slate-500">
              Modelos de ofício, despachos e justificativas pré-aprovadas pelo FNDE e Tribunal de Contas (TCE-RS) para copiar e usar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Problema 1: Impossibilidade de 3 orçamentos */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">1. Não foi possível obter 3 orçamentos</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">Pesquisa de Preços</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                <strong>Quando ocorre:</strong> Praça comercial reduzida ou empresa exclusiva em Santa Cruz do Sul. A lei permite justificar a impossibilidade sem invalidar a compra.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 font-mono text-[11px] text-slate-800 leading-relaxed relative">
                "Declaramos que na pesquisa de preços do processo {selectedYear}, foram consultados os fornecedores da região de Santa Cruz do Sul/RS, tendo sido obtidas 2 propostas válidas em razão da ausência de outros prestadores habilitados na praça. A proposta escolhida atende aos preços médios de mercado."
              </div>
              <button
                onClick={() => handleCopyText('modelo-1', `Declaramos que na pesquisa de preços do processo ${selectedYear}, foram consultados os fornecedores da região de Santa Cruz do Sul/RS, tendo sido obtidas 2 propostas válidas em razão da ausência de outros prestadores habilitados na praça. A proposta escolhida atende aos preços médios de mercado.`)}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedId === 'modelo-1' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'modelo-1' ? 'Copiado para Área de Transferência!' : 'Copiar Modelo de Justificativa'}</span>
              </button>
            </div>

            {/* Problema 2: Tarifas Bancárias Cobradas */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">2. Banco cobrou tarifa de manutenção ou PIX</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">Banco do Brasil</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                <strong>Quando ocorre:</strong> As contas do PDDE são isentas de tarifas por lei. Qualquer débito bancário deve ser estornado pelo Banco do Brasil.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 font-mono text-[11px] text-slate-800 leading-relaxed">
                "Solicitamos formalmente à gerência da Agência 0180-5 do Banco do Brasil o estorno imediato da tarifa cobrada na conta do PDDE (CC {currentSchool.bankAccount.accountNumber}), tendo em vista a isenção legal conferida pela Lei nº 11.947/2009 e Resolução CD/FNDE nº 15/2021."
              </div>
              <button
                onClick={() => handleCopyText('modelo-2', `Solicitamos formalmente à gerência da Agência 0180-5 do Banco do Brasil o estorno imediato da tarifa cobrada na conta do PDDE (CC ${currentSchool.bankAccount.accountNumber}), tendo em vista a isenção legal conferida pela Lei nº 11.947/2009 e Resolução CD/FNDE nº 15/2021.`)}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedId === 'modelo-2' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'modelo-2' ? 'Copiado para Área de Transferência!' : 'Copiar Requerimento de Estorno'}</span>
              </button>
            </div>

            {/* Problema 3: Ateste em atraso na Nota Fiscal */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">3. Nota Fiscal sem ateste ou ateste tardio</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">Notas Fiscais</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                <strong>Quando ocorre:</strong> A entrega física do material ocorreu, mas a nota não foi assinada na hora pela direção.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 font-mono text-[11px] text-slate-800 leading-relaxed">
                "ATESTO que as mercadorias/serviços constantes da presente Nota Fiscal foram integralmente recebidos e conferidos na Escola Municipal {currentSchool.name}, atendendo aos padrões de qualidade e ao objeto pactuado."
              </div>
              <button
                onClick={() => handleCopyText('modelo-3', `ATESTO que as mercadorias/serviços constantes da presente Nota Fiscal foram integralmente recebidos e conferidos na Escola Municipal ${currentSchool.name}, atendendo aos padrões de qualidade e ao objeto pactuado.`)}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedId === 'modelo-3' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'modelo-3' ? 'Copiado para Área de Transferência!' : 'Copiar Carimbo de Ateste Padrão'}</span>
              </button>
            </div>

            {/* Problema 4: Rendimentos da Poupança não gastos */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">4. Rendimentos de Poupança não gastos</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">Saldo Residual</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                <strong>Quando ocorre:</strong> Sobram juros da poupança no dia 31 de dezembro. Não há glosa se o valor for reprogramado no Anexo I.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 font-mono text-[11px] text-slate-800 leading-relaxed">
                "O saldo remanescente da conta poupança nº {currentSchool.bankAccount.savingsAccount}, composto por repasses e rendimentos auferidos, foi devidamente registrado no Anexo I e reprogramado para execução no exercício subsequente na mesma categoria."
              </div>
              <button
                onClick={() => handleCopyText('modelo-4', `O saldo remanescente da conta poupança nº ${currentSchool.bankAccount.savingsAccount}, composto por repasses e rendimentos auferidos, foi devidamente registrado no Anexo I e reprogramado para execução no exercício subsequente na mesma categoria.`)}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedId === 'modelo-4' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'modelo-4' ? 'Copiado para Área de Transferência!' : 'Copiar Termo de Reprogramação'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Responder Diligência */}
      {selectedDiligence && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-sky-50 rounded-t-xl">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Responder Notificação de Diligência
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedDiligence.subject}
                </p>
              </div>
            </div>
            <form onSubmit={handleSendResponse} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-700 leading-relaxed">
                <strong>Apontamento da SEE:</strong> {selectedDiligence.description}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Resposta Formal / Justificativa e Providências Adotadas *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Descreva as correções realizadas pela escola, anexação de comprovantes ou esclarecimentos técnicos..."
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2.5 text-xs focus:ring-1 focus:ring-sky-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedDiligence(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 cursor-pointer font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 text-white rounded font-semibold hover:bg-emerald-900 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Resposta à SEE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
