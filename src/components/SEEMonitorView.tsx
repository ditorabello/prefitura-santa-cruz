import React, { useState } from 'react';
import { usePDDE } from '../context/PDDEContext';
import { School, AccountStatus, Expense, ProgramType, PROGRAM_LABELS } from '../types/pdde';
import { formatBRL, formatDateBR } from '../utils/formatters';
import { DemocraticManagementView } from './DemocraticManagementView';
import { SchoolRegistrationView } from './SchoolRegistrationView';
import { 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  FileCheck, 
  MessageSquare, 
  Search, 
  Filter, 
  BookOpen, 
  X, 
  Award, 
  Sparkles,
  FileCheck2,
  PieChart,
  Wallet,
  Tag,
  ArrowUpDown
} from 'lucide-react';

const PROGRAM_OPTIONS: Array<{ id: string; label: string; origin: string; shortLabel: string }> = [
  { id: 'all', label: 'Todos os Programas (Consolidado Municipal & Federal)', origin: 'Rede Toda', shortLabel: 'Todos os Programas' },
  { id: 'PDDE_MUNICIPAL', label: 'PDDE Municipal (Recurso Próprio SEE - Santa Cruz do Sul)', origin: 'Municipal', shortLabel: 'PDDE Municipal' },
  { id: 'PDDE_BASICO_FNDE', label: 'PDDE Básico (FNDE / Ministério da Educação)', origin: 'Federal', shortLabel: 'PDDE Básico FNDE' },
  { id: 'PDDE_EDUCACAO_CONECTADA', label: 'PDDE Educação Conectada (FNDE)', origin: 'Federal', shortLabel: 'Educação Conectada' },
  { id: 'PDDE_ESTRUTURA', label: 'PDDE Estrutura / Acessibilidade (FNDE)', origin: 'Federal', shortLabel: 'PDDE Estrutura' },
  { id: 'PDDE_TEMPO_INTEGRAL', label: 'PDDE Tempo Integral (FNDE)', origin: 'Federal', shortLabel: 'Tempo Integral' },
];

export const SEEMonitorView: React.FC = () => {
  const { 
    schools, 
    transfers, 
    expenses, 
    selectedYear, 
    updateSchoolStatus, 
    setSelectedSchoolId, 
    setActiveViewMode, 
    setActiveTab,
    activeTab,
    getDemocraticEvaluationForSchool
  } = usePDDE();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all');
  const [selectedSchoolForDiligence, setSelectedSchoolForDiligence] = useState<School | null>(null);
  const [diligenceNotes, setDiligenceNotes] = useState('');

  // Sibling Tab Navigation Handler
  const handleTabSwitch = (tab: string) => {
    setActiveTab(tab);
  };

  // If activeTab is Democratic Management, render it directly
  if (activeTab === 'see-gestao-democratica') {
    return (
      <div className="space-y-6">
        <SEEHeaderNavigation activeTab={activeTab} onSwitch={handleTabSwitch} />
        <DemocraticManagementView />
      </div>
    );
  }

  // If activeTab is School Registration, render it directly
  if (activeTab === 'see-cadastro-escolas') {
    return (
      <div className="space-y-6">
        <SEEHeaderNavigation activeTab={activeTab} onSwitch={handleTabSwitch} />
        <SchoolRegistrationView />
      </div>
    );
  }

  // If activeTab is Guidelines, render guidelines
  if (activeTab === 'see-guidelines') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <SEEHeaderNavigation activeTab={activeTab} onSwitch={handleTabSwitch} />
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-800">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Diretrizes e Normativas do PDDE Municipal de Santa Cruz do Sul
              </h2>
              <p className="text-xs text-slate-500">
                Orientações da Secretaria Municipal de Educação (SEE) para Direções e Associações de Pais e Mestres (CPMs)
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <strong className="text-slate-900 block font-semibold text-sm">1. Critérios de Cálculo do Repasse Municipal</strong>
              <p>
                Os repasses do PDDE Municipal são calculados com base no Censo Escolar oficial homologado pelo MEC/INEP, 
                garantindo valor per capita para custeio operacional e parcela fixa complementar para demandas de manutenção escolar.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <strong className="text-slate-900 block font-semibold text-sm">2. Vedação Expressa de Gastos</strong>
              <p>
                É expressamente proibido o uso de recursos do PDDE para pagamento de pessoal com vínculo empregatício público, 
                gratificações a servidores, combustíveis para veículos particulares, reformas estruturais de grande porte 
                (que competem à Secretaria de Obras) e festividades não pedagógicas.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <strong className="text-slate-900 block font-semibold text-sm">3. Pesquisa de Preços Rigorosa (3 Cotações)</strong>
              <p>
                Nenhuma compra ou contratação de serviço poderá ser efetuada sem a realização prévia de pesquisa de preços com 
                no mínimo 3 (três) fornecedores distintos, anexando-se as propostas e o Mapa Comparativo assinado pela diretoria.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <strong className="text-slate-900 block font-semibold text-sm">4. Tombamento Obrigatório de Capital</strong>
              <p>
                Todo equipamento permanente ou mobiliário adquirido com a verba de Capital deve ser doado formalmente ao Município 
                de Santa Cruz do Sul através do Termo de Doação, cabendo ao setor de Patrimônio da Prefeitura afixar a plaqueta de tombamento.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // FINANCIAL SUPERVISION & OVERVIEW VIEW
  // ==========================================

  // Filter transfers and expenses by Year AND selected Program!
  const isProgramFiltered = selectedProgramFilter !== 'all';
  const selectedProgramObj = PROGRAM_OPTIONS.find(p => p.id === selectedProgramFilter);

  const filteredTransfers = transfers.filter(t => {
    const matchesYear = t.year === selectedYear;
    const matchesProgram = selectedProgramFilter === 'all' || t.program === selectedProgramFilter;
    return matchesYear && matchesProgram;
  });

  const filteredExpenses = expenses.filter(e => {
    const matchesYear = e.year === selectedYear;
    const matchesProgram = selectedProgramFilter === 'all' || e.program === selectedProgramFilter;
    return matchesYear && matchesProgram;
  });

  // Global network calculations for current year & selected program
  const totalNetworkTransfers = filteredTransfers.reduce((acc, t) => acc + t.value, 0);
  const totalNetworkExpenses = filteredExpenses.reduce((acc, e) => acc + e.netValue, 0);
  const totalNetworkBalance = totalNetworkTransfers - totalNetworkExpenses;

  // Category breakdown for selected program
  const custeioTransfers = filteredTransfers.filter(t => t.category === 'CUSTEIO').reduce((acc, t) => acc + t.value, 0);
  const capitalTransfers = filteredTransfers.filter(t => t.category === 'CAPITAL').reduce((acc, t) => acc + t.value, 0);
  const custeioExpenses = filteredExpenses.filter(e => e.category === 'CUSTEIO').reduce((acc, e) => acc + e.netValue, 0);
  const capitalExpenses = filteredExpenses.filter(e => e.category === 'CAPITAL').reduce((acc, e) => acc + e.netValue, 0);

  const approvedSchoolsCount = schools.filter(s => s.status === 'aprovado').length;
  const diligenceSchoolsCount = schools.filter(s => s.status === 'diligencia').length;
  const submittedSchoolsCount = schools.filter(s => s.status === 'enviado_see').length;

  // Filtered schools list
  const filteredSchools = schools.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.uexName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.principalName && s.principalName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case 'aprovado':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Aprovado pela SEE
          </span>
        );
      case 'enviado_see':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-800 bg-sky-50 border border-sky-300 px-2 py-0.5 rounded">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            Em Análise Técnica
          </span>
        );
      case 'diligencia':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Em Diligência
          </span>
        );
      case 'aguardando_cpm':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-800 bg-indigo-50 border border-indigo-300 px-2 py-0.5 rounded">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            Aguardando CPM
          </span>
        );
      case 'em_elaboracao':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Em Elaboração
          </span>
        );
    }
  };

  const handleApprove = (schoolId: string, schoolName: string) => {
    if (confirm(`Homologar e aprovar integralmente a prestação de contas de ${schoolName}?`)) {
      updateSchoolStatus(schoolId, 'aprovado', 'Prestação de contas homologada e deferida pela equipe técnica da Secretaria Municipal de Educação.');
    }
  };

  const handleOpenDiligence = (school: School) => {
    setSelectedSchoolForDiligence(school);
    setDiligenceNotes(school.seeNotes || '');
  };

  const handleSaveDiligence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolForDiligence) return;

    updateSchoolStatus(selectedSchoolForDiligence.id, 'diligencia', diligenceNotes);
    setSelectedSchoolForDiligence(null);
  };

  const handleInspectSchool = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setActiveViewMode('school');
    setActiveTab('dashboard');
  };

  return (
    <div className="space-y-6">
      {/* Sibling Tab Switcher alongside Painel de Contas & Escolas */}
      <SEEHeaderNavigation activeTab={activeTab} onSwitch={handleTabSwitch} />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white rounded-xl p-5 shadow-xs border border-emerald-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold tracking-wide uppercase mb-1">
            <Building2 className="w-4 h-4" />
            <span>Módulo de Supervisão Financeira e Prestação de Contas</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Painel Geral da Rede Municipal de Ensino
          </h2>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl">
            Acompanhamento orçamentário por programa, fiscalização de despesas e homologação das prestações de contas de Santa Cruz do Sul.
          </p>
        </div>

        <div className="bg-emerald-900/60 border border-emerald-700/50 p-3 rounded-lg text-xs font-mono">
          <div className="text-emerald-300 text-[10px] uppercase font-sans font-semibold">Exercício Auditado</div>
          <div className="text-lg font-bold text-white">{selectedYear}</div>
        </div>
      </div>

      {/* PROGRAM FILTER SELECTOR & QUICK BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-700" />
            <span className="font-bold text-xs text-slate-800">
              Filtro por Programa Financiador:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedProgramFilter}
              onChange={(e) => setSelectedProgramFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            >
              {PROGRAM_OPTIONS.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.label}
                </option>
              ))}
            </select>

            {isProgramFiltered && (
              <button
                onClick={() => setSelectedProgramFilter('all')}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
              >
                Limpar Filtro
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
          {PROGRAM_OPTIONS.map((prog) => {
            const isSelected = selectedProgramFilter === prog.id;
            return (
              <button
                key={prog.id}
                onClick={() => setSelectedProgramFilter(prog.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <span>{prog.shortLabel}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {prog.origin}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Filter Notification Pill */}
        {isProgramFiltered && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-700" />
              <span>
                Visualizando dados específicos de: <strong>{selectedProgramObj?.label}</strong> ({selectedProgramObj?.origin})
              </span>
            </div>
            <span className="font-mono font-bold text-emerald-800">
              {filteredTransfers.length} repasses · {filteredExpenses.length} despesas
            </span>
          </div>
        )}
      </div>

      {/* Network KPIs (Dynamically calculated based on selected program!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium block mb-1">
            Total Repassado {isProgramFiltered ? `(${selectedProgramObj?.shortLabel})` : 'no Município'}
          </span>
          <div className="text-xl font-bold font-mono text-slate-900">
            {formatBRL(totalNetworkTransfers)}
          </div>
          <span className="text-[10px] text-slate-400">
            {filteredTransfers.length} ordens de repasse emitidas
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium block mb-1">
            Despesas Liquidadas {isProgramFiltered ? `(${selectedProgramObj?.shortLabel})` : ''}
          </span>
          <div className="text-xl font-bold font-mono text-slate-900">
            {formatBRL(totalNetworkExpenses)}
          </div>
          <span className="text-[10px] text-slate-400">
            {filteredExpenses.length} comprovantes e pagamentos conferidos
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium block mb-1">
            Saldo Disponível em Conta
          </span>
          <div className={`text-xl font-bold font-mono ${totalNetworkBalance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {formatBRL(totalNetworkBalance)}
          </div>
          <span className="text-[10px] text-slate-400">
            Recursos remanescentes em conta bancária
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium block mb-1">
            Prestações de Contas
          </span>
          <div className="text-xl font-bold font-mono text-emerald-700">
            {approvedSchoolsCount} de {schools.length} Escolas
          </div>
          <span className="text-[10px] text-slate-400">
            {diligenceSchoolsCount} em diligência · {submittedSchoolsCount} aguardando análise
          </span>
        </div>
      </div>

      {/* Custeio vs Capital Distribution Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] block font-semibold uppercase">
              Custeio (Consumo & Manutenção)
            </span>
            <div className="text-base font-bold font-mono text-slate-900">
              Repassado: {formatBRL(custeioTransfers)}
            </div>
            <div className="text-[11px] text-slate-500">
              Gasto: {formatBRL(custeioExpenses)} · Saldo: <strong className="font-mono text-emerald-800">{formatBRL(custeioTransfers - custeioExpenses)}</strong>
            </div>
          </div>
          <div className="text-right">
            <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">
              CUSTEIO
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] block font-semibold uppercase">
              Capital (Bens & Equipamentos Permanentes)
            </span>
            <div className="text-base font-bold font-mono text-slate-900">
              Repassado: {formatBRL(capitalTransfers)}
            </div>
            <div className="text-[11px] text-slate-500">
              Gasto: {formatBRL(capitalExpenses)} · Saldo: <strong className="font-mono text-emerald-800">{formatBRL(capitalTransfers - capitalExpenses)}</strong>
            </div>
          </div>
          <div className="text-right">
            <span className="px-2 py-1 rounded bg-sky-100 text-sky-900 font-bold text-[10px]">
              CAPITAL
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar for Schools Table */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por escola, bairro, diretor ou CPM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded px-3 py-1.5 bg-white font-medium text-slate-800 focus:outline-none"
          >
            <option value="all">Todos os Status ({schools.length})</option>
            <option value="enviado_see">Apenas Aguardando Análise</option>
            <option value="diligencia">Apenas em Diligência</option>
            <option value="aprovado">Apenas Aprovados</option>
            <option value="em_elaboracao">Em Elaboração</option>
          </select>
        </div>
      </div>

      {/* Schools Network Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Escola Municipal</th>
                <th className="py-3 px-4">Unidade Executora (CPM)</th>
                <th className="py-3 px-4 text-center">Matrículas</th>
                <th className="py-3 px-4">Status da Prestação</th>
                <th className="py-3 px-4">Gestão Democrática</th>
                <th className="py-3 px-4 text-right">
                  Repassado {isProgramFiltered ? `(${selectedProgramObj?.shortLabel})` : ''}
                </th>
                <th className="py-3 px-4 text-right">
                  Executado {isProgramFiltered ? `(${selectedProgramObj?.shortLabel})` : ''}
                </th>
                <th className="py-3 px-4 text-right">Saldo do Programa</th>
                <th className="py-3 px-4 text-center">Ações da SEE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchools.map((school) => {
                // School transfers filtered by selected program
                const schoolTransfersFiltered = transfers
                  .filter(t => t.schoolId === school.id && t.year === selectedYear && (selectedProgramFilter === 'all' || t.program === selectedProgramFilter))
                  .reduce((acc, t) => acc + t.value, 0);

                // School expenses filtered by selected program
                const schoolExpensesFiltered = expenses
                  .filter((e: Expense) => e.schoolId === school.id && e.year === selectedYear && (selectedProgramFilter === 'all' || e.program === selectedProgramFilter))
                  .reduce((acc: number, e: Expense) => acc + e.netValue, 0);

                const schoolBalanceFiltered = schoolTransfersFiltered - schoolExpensesFiltered;
                const demEval = getDemocraticEvaluationForSchool(school.id, '2024/2');

                return (
                  <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{school.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {school.type} · {school.neighborhood} · {school.zone || 'Urbana'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 line-clamp-1">{school.uexName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{school.uexCnpj}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {school.studentCount}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(school.status)}
                      {school.seeNotes && (
                        <div className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic max-w-xs" title={school.seeNotes}>
                          Nota: {school.seeNotes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSchoolId(school.id);
                          setActiveTab('see-gestao-democratica');
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                        title="Abrir Matriz e Boletim da Lei 9.738/2024 para esta escola"
                      >
                        <Award className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="font-mono font-bold">{demEval.totalScore}/25 pts</span>
                        <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                          demEval.percentage >= 80 
                            ? 'bg-emerald-200 text-emerald-900' 
                            : demEval.percentage >= 50 
                            ? 'bg-amber-200 text-amber-900' 
                            : 'bg-red-200 text-red-900'
                        }`}>
                          {demEval.percentage}%
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 text-right">
                      {formatBRL(schoolTransfersFiltered)}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 text-right">
                      {formatBRL(schoolExpensesFiltered)}
                    </td>
                    <td className={`py-3 px-4 font-mono font-bold text-right ${
                      schoolBalanceFiltered >= 0 ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      {formatBRL(schoolBalanceFiltered)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleInspectSchool(school.id)}
                          className="px-2 py-1 bg-white border border-slate-300 text-slate-700 hover:text-emerald-900 hover:border-emerald-500 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                          title="Abrir pasta e documentos desta escola"
                        >
                          Ver Pasta
                        </button>

                        <button
                          onClick={() => handleOpenDiligence(school)}
                          className="p-1 text-amber-700 hover:bg-amber-50 rounded border border-amber-200 transition-colors cursor-pointer"
                          title="Emitir Notificação de Diligência / Pendência"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {school.status !== 'aprovado' && (
                          <button
                            onClick={() => handleApprove(school.id, school.name)}
                            className="p-1 text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200 transition-colors cursor-pointer"
                            title="Homologar e Aprovar Contas"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Diligência Técnica */}
      {selectedSchoolForDiligence && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-50 rounded-t-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-800" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Emitir Diligência Técnica - {selectedSchoolForDiligence.name}
                </h3>
              </div>
              <button onClick={() => setSelectedSchoolForDiligence(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDiligence} className="p-5 space-y-3.5 text-xs">
              <p className="text-slate-600">
                Descreva detalhadamente a inconformidade, documento faltante ou ajuste exigido pela Secretaria Municipal de Educação. 
                O status da escola será alterado para <strong>"Em Diligência"</strong>.
              </p>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Descrição da Diligência / Notificação Oficial *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ex: Identificada ausência da certidão negativa de débitos estaduais da empresa cotada na tomada de preços COT-01. Solicita-se juntada no prazo de 10 dias úteis."
                  value={diligenceNotes}
                  onChange={(e) => setDiligenceNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2.5 bg-white text-xs leading-relaxed focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedSchoolForDiligence(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 cursor-pointer font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-700 text-white rounded font-semibold hover:bg-amber-800 cursor-pointer shadow-xs"
                >
                  Notificar Escola
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Sibling Tab Navigation Component used across SEE views
interface SEEHeaderNavigationProps {
  activeTab: string;
  onSwitch: (tab: string) => void;
}

const SEEHeaderNavigation: React.FC<SEEHeaderNavigationProps> = ({ activeTab, onSwitch }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
      <button
        onClick={() => onSwitch('see-overview')}
        className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
          activeTab === 'see-overview'
            ? 'bg-emerald-900 text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Building2 className="w-4 h-4" />
        <span>Painel de Contas & Escolas</span>
      </button>

      <button
        onClick={() => onSwitch('see-supervisao-financeira')}
        className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
          activeTab === 'see-supervisao-financeira'
            ? 'bg-emerald-900 text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <FileCheck2 className="w-4 h-4" />
        <span>Supervisão Financeira & Prestações de Contas</span>
      </button>

      <button
        onClick={() => onSwitch('see-gestao-democratica')}
        className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
          activeTab === 'see-gestao-democratica'
            ? 'bg-emerald-900 text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Award className="w-4 h-4 text-amber-400" />
        <span>Gestão Democrática - Avaliação da Direção (Lei 9.738/2024)</span>
      </button>

      <button
        onClick={() => onSwitch('see-cadastro-escolas')}
        className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
          activeTab === 'see-cadastro-escolas'
            ? 'bg-emerald-900 text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Building2 className="w-4 h-4 text-emerald-600" />
        <span>Cadastro de Escolas</span>
      </button>
    </div>
  );
};
