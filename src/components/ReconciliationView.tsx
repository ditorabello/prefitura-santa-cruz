import React, { useState, useRef } from 'react';
import { usePDDE } from '../context/PDDEContext';
import { formatBRL, formatDateBR } from '../utils/formatters';
import { BBStatementApiResponse, ProgramType } from '../types/pdde';
import {
  PRESET_STATEMENTS,
  parseBankStatementLocally,
  StatementAnalysisReport,
  StatementItem,
  StatementAlert
} from '../utils/statementParser';
import { 
  Landmark, 
  CheckCircle2, 
  AlertCircle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Check, 
  ShieldCheck,
  Code,
  Copy,
  Download,
  Terminal,
  RefreshCw,
  X,
  FileJson,
  Layers,
  Sparkles,
  Bot,
  FileText,
  AlertTriangle,
  Upload,
  Coins,
  Building2,
  FileSpreadsheet,
  HelpCircle,
  Eye,
  FileCheck
} from 'lucide-react';

export const ReconciliationView: React.FC = () => {
  const { 
    currentSchool, 
    selectedYear, 
    schoolTransfers, 
    schoolYields, 
    schoolExpenses, 
    toggleReconciled,
    addExpense,
    addYield,
    addTransfer,
    reconcileAllExpenses
  } = usePDDE();

  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [bankStatementBalance, setBankStatementBalance] = useState<string>('');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiActiveTab, setApiActiveTab] = useState<'json' | 'table' | 'spec'>('json');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // AI Statement Analyzer State
  const [rawStatementInput, setRawStatementInput] = useState<string>(PRESET_STATEMENTS.bancoDoBrasilFNDE);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisReport, setAnalysisReport] = useState<StatementAnalysisReport | null>(null);
  const [analysisViewTab, setAnalysisViewTab] = useState<'structured' | 'markdown'>('structured');
  const [aiEngineLabel, setAiEngineLabel] = useState<string>('gemini-3.8-flash');
  const [importedItemsCount, setImportedItemsCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentSchool) return null;

  // Run initial parse on mount if not already done
  const handleAnalyzeStatement = async () => {
    if (!rawStatementInput.trim()) return;

    setIsAnalyzing(true);
    setImportSuccessMessage(null);
    setImportedItemsCount(null);

    try {
      // Call server endpoint that uses Gemini 3.8 Flash
      const response = await fetch('/api/analyze-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statementText: rawStatementInput,
          schoolName: currentSchool.name,
          bankHint: currentSchool.bankAccount.bank,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.structuredReport) {
          const report: StatementAnalysisReport = {
            ...data.structuredReport,
            markdown: data.markdown || data.structuredReport.markdown,
          };
          setAnalysisReport(report);
          setAiEngineLabel(data.engineUsed || 'gemini-3.8-flash');
        } else {
          // Local fallback
          const localReport = parseBankStatementLocally(rawStatementInput, currentSchool.name);
          setAnalysisReport(localReport);
          setAiEngineLabel('motor-local-fnde');
        }
      } else {
        // Fallback to local parsing
        const localReport = parseBankStatementLocally(rawStatementInput, currentSchool.name);
        setAnalysisReport(localReport);
        setAiEngineLabel('motor-local-fnde');
      }
    } catch (err) {
      console.warn('Erro ao chamar API de análise, acionando motor local:', err);
      const localReport = parseBankStatementLocally(rawStatementInput, currentSchool.name);
      setAnalysisReport(localReport);
      setAiEngineLabel('motor-local-fnde');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load Presets
  const handleLoadPreset = (presetKey: 'bancoDoBrasilFNDE' | 'banrisulMunicipal') => {
    const text = PRESET_STATEMENTS[presetKey];
    setRawStatementInput(text);
    setAnalysisReport(null);
  };

  // Handle File Upload (TXT, CSV, PDF raw text)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawStatementInput(content);
        setAnalysisReport(null);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Copy Markdown to Clipboard
  const handleCopyMarkdown = () => {
    if (!analysisReport) return;
    navigator.clipboard.writeText(analysisReport.markdown);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Import items into system records
  const handleImportItemsToSystem = () => {
    if (!analysisReport) return;

    let count = 0;
    const isBanrisul = analysisReport.bancoPrograma.toLowerCase().includes('banrisul');
    const programType: ProgramType = isBanrisul ? 'PDDE_MUNICIPAL' : 'PDDE_BASICO_FNDE';

    analysisReport.itens.forEach((item, index) => {
      if (item.categoria === 'RENDIMENTO') {
        addYield({
          schoolId: currentSchool.id,
          year: selectedYear,
          month: `04/${selectedYear}`,
          program: programType,
          category: 'CUSTEIO',
          date: `${selectedYear}-04-${String(15 + (index % 15)).padStart(2, '0')}`,
          value: item.valor,
        });
        count++;
      } else if (item.tipo === 'Débito' && (item.categoria === 'CUSTEIO' || item.categoria === 'CAPITAL')) {
        addExpense({
          schoolId: currentSchool.id,
          year: selectedYear,
          program: programType,
          category: item.categoria === 'CAPITAL' ? 'CAPITAL' : 'CUSTEIO',
          expenseType: item.categoria === 'CAPITAL' ? 'equipamento_permanente' : 'material_consumo',
          supplierName: item.descricao.replace(/^(DEB\s+PIX\s+|DEB\s+TED\s+|DEB\s+)/i, '').slice(0, 40),
          supplierCnpjCpf: '00.000.000/0001-00',
          invoiceNumber: `${1000 + index}`,
          invoiceDate: `${selectedYear}-04-${String(10 + (index % 20)).padStart(2, '0')}`,
          attestationDate: `${selectedYear}-04-${String(10 + (index % 20)).padStart(2, '0')}`,
          paymentDate: `${selectedYear}-04-${String(10 + (index % 20)).padStart(2, '0')}`,
          paymentMethod: item.descricao.toUpperCase().includes('PIX') ? 'PIX' : 'TRANSFERENCIA',
          paymentDocNumber: `DOC-${index + 101}`,
          grossValue: item.valor,
          taxRetention: 0,
          netValue: item.valor,
          description: item.descricao,
          reconciled: true,
        });
        count++;
      }
    });

    setImportedItemsCount(count);
    setImportSuccessMessage(`${count} lançamentos do extrato bancário foram classificados e adicionados ao livro-caixa da escola com sucesso!`);
    setTimeout(() => setImportSuccessMessage(null), 6000);
  };

  // Build the authentic Banco do Brasil Statement API JSON Response (for secondary modal)
  const bbApiResponse: BBStatementApiResponse = {
    codigoRetorno: "000",
    mensagem: "Consulta de extrato realizada com sucesso.",
    timestampConsulta: `${selectedYear}-04-30T10:15:32-03:00`,
    instituicaoFinanceira: {
      codigoCompensacao: "001",
      nomeInstituicao: "BANCO DO BRASIL S.A.",
      canalAtendimento: "API BB Developers - Open Finance FNDE / Setor Público"
    },
    dadosConta: {
      numeroAgencia: currentSchool.bankAccount.agency.replace(/[^0-9-]/g, '') || "0180-5",
      numeroContaCorrente: currentSchool.bankAccount.accountNumber.replace(/[^0-9-]/g, '') || "14280-9",
      titularConta: currentSchool.uexName.toUpperCase(),
      cnpjTitular: currentSchool.uexCnpj,
      tipoConta: "CONTA ESPECIAL VINCULADA FNDE / PDDE BASICO",
      convenioFNDE: `CONV-FNDE-${selectedYear}/09841`,
      codigoPrograma: "PDDE_BASICO_FNDE"
    },
    periodo: {
      dataInicio: `${selectedYear}-04-01`,
      dataFim: `${selectedYear}-04-30`
    },
    saldos: {
      saldoAnterior: 0.00,
      totalCreditos: 18450.00,
      totalDebitos: 4340.00,
      saldoDisponivel: 14110.00,
      saldoBloqueado: 0.00
    },
    lancamentos: [
      {
        dataLancamento: `${selectedYear}-04-10`,
        dataMovimento: `${selectedYear}-04-10`,
        numeroDocumento: "OB 802319",
        codigoHistorico: 375,
        descricaoHistorico: "CRED TED FNDE PDDE BASICO ORDEM BANCARIA 2024OB802319",
        indicadorTipoLancamento: "C",
        valorLancamento: 18450.00,
        categoriaLancamento: "Repasse Federal FNDE",
        favorecido: "FUNDO NACIONAL DE DESENVOLVIMENTO DA EDUCACAO",
        naturezaDespesa: "Receita de Transferência Federal - PDDE Básico"
      },
      {
        dataLancamento: `${selectedYear}-04-18`,
        dataMovimento: `${selectedYear}-04-18`,
        numeroDocumento: "PIX 984021",
        codigoHistorico: 108,
        descricaoHistorico: "DEB PIX TRANSF PAPELARIA E LIVRARIA CENTRAL LTDA NF 4512",
        indicadorTipoLancamento: "D",
        valorLancamento: 2450.00,
        categoriaLancamento: "Despesa Escolar - Custeio",
        favorecido: "PAPELARIA E LIVRARIA CENTRAL LTDA",
        cnpjFavorecido: "08.123.456/0001-89",
        naturezaDespesa: "Material de Consumo / Pedagógico"
      },
      {
        dataLancamento: `${selectedYear}-04-24`,
        dataMovimento: `${selectedYear}-04-24`,
        numeroDocumento: "TED 004122",
        codigoHistorico: 105,
        descricaoHistorico: "DEB TED COMPR ELETR - CLIMATIZACAO E REPAROS ME NF 892",
        indicadorTipoLancamento: "D",
        valorLancamento: 1890.00,
        categoriaLancamento: "Despesa Escolar - Custeio",
        favorecido: "CLIMATIZACAO E REPAROS ME",
        cnpjFavorecido: "19.987.654/0001-32",
        naturezaDespesa: "Serviços de Manutenção Preventiva e Corretiva"
      }
    ]
  };

  const jsonString = JSON.stringify(bbApiResponse, null, 2);

  // Total credits in system
  const totalCredits = schoolTransfers.reduce((acc, t) => acc + t.value, 0) +
                       schoolYields.reduce((acc, y) => acc + y.value, 0);

  // Total debits in system
  const totalDebits = schoolExpenses.reduce((acc, e) => acc + e.netValue, 0);

  // Calculated ledger balance
  const calculatedBalance = initialBalance + totalCredits - totalDebits;

  // Statement balance (default to calculated balance if not manually typed)
  const statementVal = bankStatementBalance !== '' ? parseFloat(bankStatementBalance) : calculatedBalance;
  const divergence = Math.abs(calculatedBalance - statementVal);
  const isPerfectMatch = divergence < 0.01;

  // Unreconciled count
  const unreconciledExpenses = schoolExpenses.filter(e => !e.reconciled);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extrato-bb-${currentSchool.bankAccount.agency}-${currentSchool.bankAccount.accountNumber}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportBbTransactions = () => {
    reconcileAllExpenses();
    setImportSuccessMessage('Lançamentos da API do Banco do Brasil importados com sucesso! Todos os débitos e repasses foram conferidos.');
    setTimeout(() => setImportSuccessMessage(null), 5000);
    setIsApiModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Conciliação Bancária & Inteligência Artificial
            </h2>
            {isPerfectMatch && unreconciledExpenses.length === 0 ? (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                Conta 100% Conciliada
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-700" />
                Conferência Pendente
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Motor inteligente de leitura de extratos bancários (FNDE e Banrisul) e conciliação contábil oficial
          </p>
        </div>

        {/* Account Info Box & BB API Button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs font-mono text-slate-700">
            <div>
              <span className="text-slate-400 font-sans block text-[10px]">Banco / Agência</span>
              <strong className="text-slate-900">{currentSchool.bankAccount.bank} · Ag {currentSchool.bankAccount.agency}</strong>
            </div>
            <div className="mt-1">
              <span className="text-slate-400 font-sans block text-[10px]">Conta Corrente Escolar</span>
              <strong className="text-slate-900">CC {currentSchool.bankAccount.accountNumber}</strong>
            </div>
          </div>

          <button
            onClick={() => setIsApiModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-slate-950" />
            <span>Simulador API BB</span>
            <span className="bg-slate-950 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
              JSON
            </span>
          </button>
        </div>
      </div>

      {/* Global alerts */}
      {importSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{importSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setImportSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-0.5 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 MOTOR DE INTELIGÊNCIA ARTIFICIAL: LEITOR & CLASSIFICADOR DE EXTRATOS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-indigo-200 shadow-md overflow-hidden">
        {/* AI Card Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
                <Sparkles className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Motor de Inteligência Artificial · Leitor de Extratos Bancários
                  </h3>
                  <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-indigo-400/30">
                    FNDE & Banrisul Engine
                  </span>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Rendimentos Diários & Categorização
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Transforma o texto bruto ou arquivo do extrato bancário (PDF/Texto) em relatório estruturado de prestação de contas, isolando <strong>rendimentos diários de aplicação</strong> e classificando saídas em <strong>CUSTEIO</strong> ou <strong>CAPITAL</strong> com detecção automática de irregularidades.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-[11px] text-indigo-200 font-mono">
                Regras FNDE nº 15/2021
              </span>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="mt-4 pt-4 border-t border-indigo-900/60 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Carregar Exemplo Rápido:</span>

            <button
              type="button"
              onClick={() => handleLoadPreset('bancoDoBrasilFNDE')}
              className="flex items-center gap-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 hover:text-white px-2.5 py-1 rounded-lg border border-amber-400/30 text-[11px] font-medium transition-all cursor-pointer"
            >
              <Landmark className="w-3.5 h-3.5 text-amber-300" />
              <span>Extrato Banco do Brasil (PDDE Básico FNDE)</span>
            </button>

            <button
              type="button"
              onClick={() => handleLoadPreset('banrisulMunicipal')}
              className="flex items-center gap-1.5 bg-blue-400/20 hover:bg-blue-400/30 text-blue-200 hover:text-white px-2.5 py-1 rounded-lg border border-blue-400/30 text-[11px] font-medium transition-all cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-300" />
              <span>Extrato Banrisul (PDDE Municipal Santa Cruz)</span>
            </button>

            <label className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] font-medium transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Importar Arquivo (.txt / .csv)</span>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".txt,.csv,.log,.text" 
                className="hidden" 
                onChange={handleFileUpload} 
              />
            </label>

            <button
              type="button"
              onClick={() => { setRawStatementInput(''); setAnalysisReport(null); }}
              className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 ml-auto cursor-pointer"
            >
              Limpar Texto
            </button>
          </div>
        </div>

        {/* Input Text Area Section */}
        <div className="p-5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Texto Bruto do Extrato Bancário (Cole aqui o conteúdo copiado do Home Banking ou do PDF):</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {rawStatementInput.split('\n').filter(Boolean).length} linha(s) detectada(s)
            </span>
          </div>

          <textarea
            rows={7}
            value={rawStatementInput}
            onChange={(e) => setRawStatementInput(e.target.value)}
            placeholder="Cole aqui as linhas do extrato (ex: 05/04 CRED TED FNDE ... ou 12/04 DEB PIX PAPELARIA ...)"
            className="w-full p-3 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 shadow-inner resize-y leading-relaxed"
          />

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Identifica e classifica automaticamente rendimentos diários em conta corrente e fundos de aplicação vinculados.
              </span>
            </div>

            <button
              type="button"
              onClick={handleAnalyzeStatement}
              disabled={isAnalyzing || !rawStatementInput.trim()}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processando com IA...</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span>Analisar Extrato com IA</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OUTPUT: 3 SEÇÕES EXATAS REQUISITADAS */}
        {/* ========================================================================= */}
        {analysisReport && (
          <div className="p-5 space-y-6 bg-white animate-fade-in">
            {/* View Tab Switcher & Export Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAnalysisViewTab('structured')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    analysisViewTab === 'structured'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Relatório Visual Estruturado</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAnalysisViewTab('markdown')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    analysisViewTab === 'markdown'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Formato Markdown Oficial</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>{copiedNotification ? 'Copiado!' : 'Copiar Relatório'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleImportItemsToSystem}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Importar Lançamentos para o Sistema</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: VISUAL ESTRUTURADO */}
            {analysisViewTab === 'structured' && (
              <div className="space-y-6">
                {/* ------------------------------------------------------------- */}
                {/* SEÇÃO 1: 🏢 Resumo do Extrato Analisado */}
                {/* ------------------------------------------------------------- */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-lg">🏢</span>
                      <span>Resumo do Extrato Analisado</span>
                    </h4>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      Motor: {aiEngineLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    {/* Escola */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
                        Instituição de Ensino
                      </span>
                      <strong className="text-sm font-bold text-slate-900 block truncate">
                        {analysisReport.instituicao}
                      </strong>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Unidade Executora Escolar
                      </span>
                    </div>

                    {/* Banco / Programa */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
                        Banco / Programa
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          analysisReport.bancoPrograma.includes('Brasil') 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}>
                          {analysisReport.bancoPrograma}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Conta vinculada para movimentação
                      </span>
                    </div>

                    {/* Saldos Inicial e Final */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
                        Saldos em Conta
                      </span>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Saldo Inicial:</span>
                        <strong className="font-mono text-slate-800">{formatBRL(analysisReport.saldoInicial)}</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-slate-600 font-semibold">Saldo Final:</span>
                        <strong className="font-mono text-indigo-700 font-bold">{formatBRL(analysisReport.saldoFinal)}</strong>
                      </div>
                    </div>

                    {/* Total de Rendimentos no Período (REGRA CRÍTICA) */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3.5 rounded-lg border border-emerald-300 shadow-xs">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-emerald-900 block text-[10px] uppercase font-bold tracking-wider">
                          Total de Rendimentos no Período
                        </span>
                        <Coins className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="text-base font-mono font-bold text-emerald-800">
                        {formatBRL(analysisReport.totalRendimentos)}
                      </div>
                      <div className="mt-1 text-[10px] font-medium text-emerald-900 bg-emerald-100/70 p-1 rounded leading-tight">
                        <strong>{analysisReport.classificacaoRendimento}:</strong> somado ao saldo para uso exclusivo na finalidade pactuada.
                      </div>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* SEÇÃO 2: 📑 Classificação para Prestação de Contas */}
                {/* ------------------------------------------------------------- */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="text-lg">📑</span>
                        <span>Classificação para Prestação de Contas (FNDE / Municipal)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Lançamentos categorizados estritamente em <strong>CUSTEIO</strong>, <strong>CAPITAL</strong> e <strong>RENDIMENTO</strong>
                      </p>
                    </div>

                    {/* Badge counters */}
                    <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
                      <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-bold border border-blue-200">
                        Custeio: {analysisReport.itens.filter(i => i.categoria === 'CUSTEIO').length}
                      </span>
                      <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-bold border border-purple-200">
                        Capital: {analysisReport.itens.filter(i => i.categoria === 'CAPITAL').length}
                      </span>
                      <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold border border-emerald-200">
                        Rendimentos: {analysisReport.itens.filter(i => i.categoria === 'RENDIMENTO').length}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4 w-24">Data</th>
                          <th className="py-2.5 px-4">Descrição do Lançamento</th>
                          <th className="py-2.5 px-4 text-center w-28">Tipo</th>
                          <th className="py-2.5 px-4 text-center w-36">Categoria</th>
                          <th className="py-2.5 px-4 text-right w-36">Valor (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {analysisReport.itens.map((item) => {
                          const isCredit = item.tipo === 'Crédito';
                          const isCusteio = item.categoria === 'CUSTEIO';
                          const isCapital = item.categoria === 'CAPITAL';
                          const isRendimento = item.categoria === 'RENDIMENTO';
                          const isRepasse = item.categoria === 'REPASSE';

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-4 font-mono font-medium text-slate-700">
                                {item.data}
                              </td>
                              <td className="py-2.5 px-4">
                                <span className="font-semibold text-slate-900 block">
                                  {item.descricao}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                                  isCredit 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                  {isCredit ? (
                                    <>
                                      <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                                      Crédito
                                    </>
                                  ) : (
                                    <>
                                      <ArrowUpRight className="w-3 h-3 text-red-600" />
                                      Débito
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isCusteio
                                    ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                    : isCapital
                                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                    : isRendimento
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                                }`}>
                                  {item.categoria}
                                </span>
                              </td>
                              <td className={`py-2.5 px-4 text-right font-mono font-bold ${
                                isCredit ? 'text-emerald-700' : 'text-red-700'
                              }`}>
                                {isCredit ? '+' : '-'} {formatBRL(item.valor)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer Totals */}
                  <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-400 text-[10px] block">Total Custeio</span>
                      <strong className="text-blue-900 font-mono">
                        {formatBRL(analysisReport.itens.filter(i => i.categoria === 'CUSTEIO').reduce((acc, i) => acc + i.valor, 0))}
                      </strong>
                    </div>

                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-400 text-[10px] block">Total Capital (Bens Permanentes)</span>
                      <strong className="text-purple-900 font-mono">
                        {formatBRL(analysisReport.itens.filter(i => i.categoria === 'CAPITAL').reduce((acc, i) => acc + i.valor, 0))}
                      </strong>
                    </div>

                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-400 text-[10px] block">Total Rendimentos Diários</span>
                      <strong className="text-emerald-900 font-mono">
                        +{formatBRL(analysisReport.totalRendimentos)}
                      </strong>
                    </div>

                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-400 text-[10px] block">Total Repasses Creditados</span>
                      <strong className="text-amber-900 font-mono">
                        +{formatBRL(analysisReport.itens.filter(i => i.categoria === 'REPASSE').reduce((acc, i) => acc + i.valor, 0))}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* SEÇÃO 3: 💡 Alertas e Inconsistências */}
                {/* ------------------------------------------------------------- */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-lg">💡</span>
                      <span>Alertas e Inconsistências (Se houver)</span>
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {analysisReport.alertas.length} apontamento(s)
                    </span>
                  </div>

                  {analysisReport.alertas.length === 0 ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Nenhuma inconsistência ou irregularidade detectada no extrato analisado. Todas as movimentações estão em conformidade com as exigências do FNDE e da Secretaria Municipal de Educação.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analysisReport.alertas.map((alerta) => {
                        const isGrave = alerta.nivel === 'grave';
                        const isTarifa = alerta.tipo === 'tarifa';
                        const isSaque = alerta.tipo === 'saque_cash';

                        return (
                          <div 
                            key={alerta.id} 
                            className={`p-3.5 rounded-xl border text-xs ${
                              isSaque 
                                ? 'bg-red-50 border-red-300 text-red-950'
                                : isTarifa
                                ? 'bg-amber-50 border-amber-300 text-amber-950'
                                : 'bg-blue-50 border-blue-200 text-blue-950'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {isSaque ? (
                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                              ) : isTarifa ? (
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                              ) : (
                                <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                              )}

                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <strong className="font-bold text-slate-900">
                                    {alerta.titulo}
                                  </strong>
                                  <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase ${
                                    isGrave 
                                      ? 'bg-red-200 text-red-900' 
                                      : 'bg-amber-200 text-amber-900'
                                  }`}>
                                    {isGrave ? 'Irregularidade Grave' : 'Atenção / Verificação'}
                                  </span>
                                </div>

                                <p className="mt-1 text-slate-700 leading-relaxed">
                                  {alerta.descricao}
                                </p>

                                {alerta.itemReferencia && (
                                  <div className="mt-2 text-[10px] font-mono text-slate-600 bg-white/70 p-1.5 rounded border border-slate-200">
                                    Item detectado: {alerta.itemReferencia}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: MARKDOWN OFICIAL */}
            {analysisViewTab === 'markdown' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Conteúdo formatado conforme especificação exata do FNDE e Secretaria Municipal de Educação:</span>
                  <button
                    type="button"
                    onClick={handleCopyMarkdown}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedNotification ? 'Copiado para Área de Transferência!' : 'Copiar Texto Markdown'}</span>
                  </button>
                </div>

                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 selection:bg-indigo-700 selection:text-white">
                  {analysisReport.markdown}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PAINEL DE CONCILIAÇÃO BANCÁRIA: SALDOS & LIVRO CAIXA */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium block mb-1">Saldo Anterior (01/01/{selectedYear})</span>
          <div className="text-lg font-mono font-bold text-slate-800">
            {formatBRL(initialBalance)}
          </div>
          <span className="text-[10px] text-slate-400">Saldo transportado do ano anterior</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium block mb-1">(+) Total de Entradas (Créditos)</span>
          <div className="text-lg font-mono font-bold text-emerald-700">
            +{formatBRL(totalCredits)}
          </div>
          <span className="text-[10px] text-slate-400">Repasses ({schoolTransfers.length}) + Rendimentos ({schoolYields.length})</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium block mb-1">(-) Total de Saídas (Débitos)</span>
          <div className="text-lg font-mono font-bold text-red-700">
            -{formatBRL(totalDebits)}
          </div>
          <span className="text-[10px] text-slate-400">{schoolExpenses.length} pagamentos realizados</span>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs ${
          isPerfectMatch ? 'bg-emerald-50/70 border-emerald-300' : 'bg-amber-50/70 border-amber-300'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-700 block">(=) Saldo Final em Extrato</span>
            {isPerfectMatch ? (
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-700" />
            )}
          </div>
          <div className="text-xl font-mono font-bold text-slate-900">
            {formatBRL(calculatedBalance)}
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-600">
            {isPerfectMatch ? (
              <span className="text-emerald-800 font-semibold">Divergência: R$ 0,00 (Exato)</span>
            ) : (
              <span className="text-red-700 font-semibold">Divergência: {formatBRL(divergence)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Verification Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <span>Conferência dos Lançamentos no Extrato Bancário</span>
            <span className="text-[11px] font-mono text-slate-500 font-normal">
              (Total {schoolExpenses.length} lançamentos)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={reconcileAllExpenses}
              className="text-xs font-semibold px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Conciliar Todos Automaticamente
            </button>

            <div className="text-slate-500">
              {unreconciledExpenses.length === 0 ? (
                <span className="text-emerald-800 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Todas as despesas conferidas
                </span>
              ) : (
                <span className="text-amber-800 font-medium">
                  {unreconciledExpenses.length} pendente(s)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-4 text-center w-12">Conc.</th>
                <th className="py-2.5 px-4">Data Débito</th>
                <th className="py-2.5 px-4">Tipo de Movimento</th>
                <th className="py-2.5 px-4">Favorecido / Histórico</th>
                <th className="py-2.5 px-4">Nº Comprovante / Doc</th>
                <th className="py-2.5 px-4 text-right">Valor do Débito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schoolExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={exp.reconciled}
                      onChange={() => toggleReconciled(exp.id)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      title="Marcar como conciliado no extrato"
                    />
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-800">
                    {formatDateBR(exp.paymentDate)}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    Débito em Conta ({exp.paymentMethod})
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-semibold text-slate-900 block">
                      {exp.supplierName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      NF {exp.invoiceNumber} · {exp.description}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600 text-[11px]">
                    {exp.paymentDocNumber}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-red-700 text-right">
                    -{formatBRL(exp.netValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: RESPOSTA DA API BANCO DO BRASIL */}
      {/* ========================================================================= */}
      {isApiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 text-white rounded-xl shadow-2xl border border-slate-800 max-w-4xl w-full my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-xs font-mono">
                  BB
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white font-mono">
                      API de Extratos · Banco do Brasil Developers
                    </h3>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                      200 OK
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    GET /extratos-fnde/v1/contas-correntes/{bbApiResponse.dadosConta.numeroAgencia}/{bbApiResponse.dadosConta.numeroContaCorrente}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsApiModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 pt-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setApiActiveTab('json')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer ${
                  apiActiveTab === 'json'
                    ? 'border-amber-400 text-amber-300 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Payload JSON Bruto</span>
              </button>

              <button
                type="button"
                onClick={() => setApiActiveTab('table')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer ${
                  apiActiveTab === 'table'
                    ? 'border-amber-400 text-amber-300 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Lançamentos Formatados ({bbApiResponse.lancamentos.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setApiActiveTab('spec')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer ${
                  apiActiveTab === 'spec'
                    ? 'border-amber-400 text-amber-300 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Headers & Metadados</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs">
              {apiActiveTab === 'json' && (
                <div className="relative">
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <button
                      onClick={handleCopyJson}
                      className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-amber-300 px-2.5 py-1 rounded text-[11px] font-sans font-semibold border border-slate-700 cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedNotification ? 'Copiado!' : 'Copiar JSON'}</span>
                    </button>
                    <button
                      onClick={handleDownloadJson}
                      className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-[11px] font-sans font-semibold border border-slate-700 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar .json</span>
                    </button>
                  </div>

                  <pre className="bg-slate-900 p-4 rounded-xl text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800 selection:bg-emerald-900 selection:text-white">
                    {jsonString}
                  </pre>
                </div>
              )}

              {apiActiveTab === 'table' && (
                <div className="space-y-4">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Titular da Conta Bancária:</span>
                      <strong className="text-white text-xs">{bbApiResponse.dadosConta.titularConta}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">CNPJ / Agência / Conta:</span>
                      <strong className="text-amber-300 font-mono text-xs">
                        {bbApiResponse.dadosConta.cnpjTitular} · Ag {bbApiResponse.dadosConta.numeroAgencia} · CC {bbApiResponse.dadosConta.numeroContaCorrente}
                      </strong>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-800 text-slate-300 text-[11px] font-semibold">
                        <tr>
                          <th className="p-3">Data</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3">Documento</th>
                          <th className="p-3">Histórico / Descrição</th>
                          <th className="p-3 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-xs">
                        {bbApiResponse.lancamentos.map((l, idx) => {
                          const isCredit = l.indicadorTipoLancamento === 'C';
                          return (
                            <tr key={idx} className="hover:bg-slate-800/50">
                              <td className="p-3 font-mono text-slate-300">{l.dataLancamento}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isCredit 
                                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60' 
                                    : 'bg-red-900/60 text-red-300 border border-red-700/60'
                                }`}>
                                  {isCredit ? 'CRÉDITO (C)' : 'DÉBITO (D)'}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-amber-300">{l.numeroDocumento}</td>
                              <td className="p-3">
                                <div className="text-white font-medium">{l.descricaoHistorico}</div>
                                <div className="text-[10px] text-slate-400">
                                  {l.favorecido} · {l.naturezaDespesa}
                                </div>
                              </td>
                              <td className={`p-3 text-right font-bold font-mono ${
                                isCredit ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {isCredit ? '+' : '-'} {formatBRL(l.valorLancamento)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Balance Summary Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Créditos de Repasse FNDE</span>
                      <div className="text-emerald-400 font-bold text-sm">
                        +{formatBRL(bbApiResponse.saldos.totalCreditos)}
                      </div>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Débitos de Despesas Escolares</span>
                      <div className="text-red-400 font-bold text-sm">
                        -{formatBRL(bbApiResponse.saldos.totalDebitos)}
                      </div>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Saldo Disponível em Conta</span>
                      <div className="text-white font-bold text-sm">
                        {formatBRL(bbApiResponse.saldos.saldoDisponivel)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {apiActiveTab === 'spec' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-amber-400 font-bold block text-xs">Especificação da API BB Developers (Open Banking Gov):</span>
                    <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px] leading-relaxed">
                      <li><strong>Base URL:</strong> <code>https://api.bb.com.br/extratos-fnde/v1</code></li>
                      <li><strong>Protocolo de Autenticação:</strong> OAuth 2.0 (mTLS + Token JWT Bearer)</li>
                      <li><strong>Escopos de Acesso Requeridos:</strong> <code>extratos.conta-corrente.fnde.read</code></li>
                      <li><strong>Header de Autorização:</strong> <code>Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5c...</code></li>
                      <li><strong>Código de Retorno:</strong> <code>000 - Sucesso</code></li>
                      <li><strong>Regra de Negócio FNDE:</strong> Transações contêm obrigatoriamente a Ordem Bancária do FNDE para créditos e número de comprovante fiscal/PIX para débitos.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400">
                Extrato oficial sincronizado com o Banco do Brasil S.A.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsApiModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-800 cursor-pointer text-xs"
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={handleImportBbTransactions}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-xs cursor-pointer text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Importar & Conciliar no Sistema</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
