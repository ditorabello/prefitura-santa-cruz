import React, { useState } from 'react';
import { usePDDE } from '../context/PDDEContext';
import { 
  DemocraticEvaluation, 
  DemocraticIndicatorCode, 
  DirectorshipRequirements 
} from '../types/pdde';
import { DEMOCRATIC_INDICATOR_DEFINITIONS } from '../data/democraticManagementData';
import { 
  Building2, 
  Award, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Sparkles, 
  Printer, 
  Save, 
  RefreshCw, 
  HelpCircle, 
  Users, 
  Calendar, 
  Scale, 
  Landmark, 
  ChevronRight,
  TrendingUp,
  FileCheck2,
  AlertCircle,
  Search,
  Check
} from 'lucide-react';

export const DemocraticManagementView: React.FC = () => {
  const { 
    schools, 
    diligences, 
    expenses, 
    assets,
    democraticEvaluations,
    directorshipRequirements,
    saveDemocraticEvaluation,
    resetDemocraticEvaluationToGuidance,
    updateDirectorshipRequirements,
    getDemocraticEvaluationForSchool,
    setSelectedSchoolId,
    setActiveViewMode,
    setActiveTab
  } = usePDDE();

  const [selectedSchoolIdLocal, setSelectedSchoolIdLocal] = useState<string>('emef-menino-deus');
  const [selectedSemester, setSelectedSemester] = useState<string>('2024/2');
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'requirements' | 'history' | 'bulletin'>('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Active school & evaluation
  const currentSchool = schools.find(s => s.id === selectedSchoolIdLocal) || schools[0];
  const currentEvaluation = getDemocraticEvaluationForSchool(currentSchool.id, selectedSemester);
  const currentRequirements: DirectorshipRequirements = directorshipRequirements[currentSchool.id] || {
    schoolId: currentSchool.id,
    schoolName: currentSchool.name,
    directorName: currentSchool.presidentName || 'Diretor(a) Escolar',
    isEffectiveMagisterio: true,
    passedProbationaryPeriod: true,
    hasPostGraduationOrPedagogy: true,
    has180hManagementCourses: true,
    completedCourseHours: 180,
    hasCleanRecordAndCertificates: true,
    schoolManagementPlanSubmitted: true,
    cpmFiscalRegularity: true,
    isEligible: true,
    lastAuditedDate: new Date().toISOString().split('T')[0],
  };

  // Editable local state for active evaluation
  const [editingEvaluation, setEditingEvaluation] = useState<DemocraticEvaluation>(currentEvaluation);

  // Sync editingEvaluation when school or semester changes
  React.useEffect(() => {
    setEditingEvaluation(getDemocraticEvaluationForSchool(selectedSchoolIdLocal, selectedSemester));
  }, [selectedSchoolIdLocal, selectedSemester, democraticEvaluations]);

  // Network stats
  const totalSchools = schools.length;
  const allEvaluations = schools.map(s => getDemocraticEvaluationForSchool(s.id, selectedSemester));
  const avgNetworkScore = (allEvaluations.reduce((acc, ev) => acc + ev.totalScore, 0) / (totalSchools || 1)).toFixed(1);
  const avgNetworkPercentage = (allEvaluations.reduce((acc, ev) => acc + ev.percentage, 0) / (totalSchools || 1)).toFixed(0);
  const schoolsAtRisk = allEvaluations.filter(ev => ev.percentage < 50).length;
  const compliantRequirementsCount = Object.values(directorshipRequirements).filter(r => r.isEligible).length;

  // Filtered schools list
  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.neighborhood.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Diligences of the active school
  const schoolDiligences = diligences.filter(d => d.schoolId === currentSchool.id);
  const pendingDiligences = schoolDiligences.filter(d => d.status === 'pendente');
  const resolvedDiligences = schoolDiligences.filter(d => d.status === 'respondida' || d.status === 'homologada');

  // Handle score change
  const handleScoreChange = (code: DemocraticIndicatorCode, score: number) => {
    const updatedIndicators = {
      ...editingEvaluation.indicators,
      [code]: {
        ...editingEvaluation.indicators[code],
        score,
        isCustomized: true,
      }
    };
    const totalScore = (
      updatedIndicators.a.score + 
      updatedIndicators.b.score + 
      updatedIndicators.c.score + 
      updatedIndicators.d.score + 
      updatedIndicators.e.score
    );
    const percentage = Math.round((totalScore / 25) * 100);

    let performanceTier: DemocraticEvaluation['performanceTier'] = 'Bom / Satisfatório (70-89%)';
    if (percentage >= 90) performanceTier = 'Excelente (90-100%)';
    else if (percentage >= 70) performanceTier = 'Bom / Satisfatório (70-89%)';
    else if (percentage >= 50) performanceTier = 'Regular com Ressalvas (50-69%)';
    else performanceTier = 'Insatisfatório (<50%)';

    setEditingEvaluation(prev => ({
      ...prev,
      indicators: updatedIndicators,
      totalScore,
      percentage,
      performanceTier,
      isUnder50Percent: percentage < 50,
      historicalSemesters: prev.historicalSemesters.map(h => 
        h.semester === selectedSemester 
          ? { ...h, totalScore, percentage, isUnder50Percent: percentage < 50, status: percentage >= 50 ? 'aprovado' : 'insatisfatorio' }
          : h
      )
    }));
  };

  // Handle indicator justification change
  const handleJustificationChange = (code: DemocraticIndicatorCode, justification: string) => {
    setEditingEvaluation(prev => ({
      ...prev,
      indicators: {
        ...prev.indicators,
        [code]: {
          ...prev.indicators[code],
          justification,
          isCustomized: true,
        }
      }
    }));
  };

  // Reset to automated guidance
  const handleApplyAutomatedGuidance = () => {
    const fresh = resetDemocraticEvaluationToGuidance(currentSchool.id, selectedSemester);
    setEditingEvaluation(fresh);
    setSaveFeedback('Direcionamento prévio do sistema aplicado com sucesso com base nas diligências e entregas!');
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // Save changes
  const handleSaveEvaluation = () => {
    saveDemocraticEvaluation(editingEvaluation);
    setSaveFeedback('Avaliação semestral salva com sucesso no sistema da SEE!');
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // Homologate evaluation
  const handleHomologate = () => {
    if (confirm(`Deseja homologar oficialmente o parecer e boletim semestral da ${currentSchool.name}?`)) {
      const homologated: DemocraticEvaluation = {
        ...editingEvaluation,
        status: 'homologado',
        evaluationDate: new Date().toISOString().split('T')[0],
      };
      saveDemocraticEvaluation(homologated);
      setEditingEvaluation(homologated);
      setSaveFeedback('Avaliação HOMOLOGADA oficialmente pela Comissão de Gestão Democrática da SEE!');
      setTimeout(() => setSaveFeedback(null), 4000);
    }
  };

  // Toggle requirement
  const handleToggleRequirement = (field: keyof DirectorshipRequirements, value: boolean | number | string) => {
    updateDirectorshipRequirements(currentSchool.id, { [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-xl p-5 shadow-xs border border-emerald-900/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold tracking-wide uppercase mb-1">
              <Award className="w-4 h-4" />
              <span>Secretaria Municipal de Educação de Santa Cruz do Sul · SEE</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Gestão Democrática do Ensino Público Municipal
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-3xl leading-relaxed">
              Sistema oficial de acompanhamento, requisitos de elegibilidade (Art. 19), matriz semestral de avaliação administrativo-financeira (Art. 6º, § 3º) e monitoramento de desempenho (Art. 18, III da Lei Municipal nº 9.738/2024).
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-900/60 border border-emerald-700/60 p-2.5 rounded-lg text-xs">
            <div>
              <span className="text-[10px] text-emerald-300 uppercase block font-semibold">Semestre Letivo</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-slate-950/80 text-white font-bold text-sm rounded px-2.5 py-1 border border-emerald-600 focus:outline-none"
              >
                <option value="2024/2">2024/2 (Atual)</option>
                <option value="2024/1">2024/1</option>
                <option value="2023/2">2023/2</option>
                <option value="2023/1">2023/1</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Network KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium block mb-1">Média de Aproveitamento da Rede</span>
          <div className="text-xl font-bold font-mono text-emerald-700 flex items-baseline gap-2">
            <span>{avgNetworkScore} / 25 pts</span>
            <span className="text-xs font-semibold text-slate-500">({avgNetworkPercentage}%)</span>
          </div>
          <span className="text-[10px] text-slate-400">Dimensão Administrativo-Financeira</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium block mb-1">Escolas Acima de 80% (Pleno)</span>
          <div className="text-xl font-bold font-mono text-slate-900">
            {allEvaluations.filter(e => e.percentage >= 80).length} de {totalSchools}
          </div>
          <span className="text-[10px] text-slate-400">Desempenho satisfatório ou excelente</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium block mb-1">Alerta Art. 18, III (&lt; 50%)</span>
          <div className={`text-xl font-bold font-mono ${schoolsAtRisk > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
            {schoolsAtRisk === 0 ? 'Nenhuma escola em risco' : `${schoolsAtRisk} escola(s) &lt; 50%`}
          </div>
          <span className="text-[10px] text-slate-400">Risco de destituição em 4 semestres</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium block mb-1">Elegibilidade da Direção (Art. 19)</span>
          <div className="text-xl font-bold font-mono text-indigo-700">
            {compliantRequirementsCount} de {totalSchools} escolas
          </div>
          <span className="text-[10px] text-slate-400">Requisitos legais 100% regulares</span>
        </div>
      </div>

      {/* Main Content Card with School Navigation and Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* School Horizontal Selector Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Localizar escola por nome ou bairro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Escola Selecionada:</span>
            <select
              value={selectedSchoolIdLocal}
              onChange={(e) => setSelectedSchoolIdLocal(e.target.value)}
              className="bg-white border border-slate-300 rounded px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            >
              {filteredSchools.map((s) => {
                const ev = getDemocraticEvaluationForSchool(s.id, selectedSemester);
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({ev.totalScore}/25 pts - {ev.percentage}%)
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Selected School Quick Bar */}
        <div className="px-6 py-4 bg-slate-100/50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded uppercase">
                {currentSchool.type}
              </span>
              <h3 className="text-base font-bold text-slate-900">{currentSchool.name}</h3>
              <span className="text-xs text-slate-500">· {currentSchool.neighborhood}</span>
            </div>
            <p className="text-xs text-slate-600">
              Direção: <strong>{currentRequirements.directorName}</strong> {currentRequirements.viceDirectorName && `· Vice: ${currentRequirements.viceDirectorName}`} · {currentSchool.uexName}
            </p>
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs">
              <span className="text-slate-500">Pontuação Semestral:</span>
              <strong className="text-slate-900 font-mono text-sm">{editingEvaluation.totalScore} / 25</strong>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                editingEvaluation.percentage >= 80 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : editingEvaluation.percentage >= 50 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {editingEvaluation.percentage}%
              </span>
            </div>

            <div className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs">
              <span className="text-slate-500">Requisitos Art. 19:</span>
              {currentRequirements.isEligible ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Apto / Regular
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5" /> Pendência
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs">
              <span className="text-slate-500">Status:</span>
              {editingEvaluation.status === 'homologado' ? (
                <span className="inline-flex items-center gap-1 text-emerald-800 font-bold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Homologado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-600 font-bold text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Rascunho / Em Avaliação
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Feedback message banner */}
        {saveFeedback && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-medium">{saveFeedback}</span>
            </div>
            <button onClick={() => setSaveFeedback(null)} className="text-emerald-700 font-bold hover:underline">
              Fechar
            </button>
          </div>
        )}

        {/* Sub-Tabs Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-semibold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'matrix'
                ? 'border-emerald-800 text-emerald-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>1. Matriz de Avaliação da Equipe Gestora (Art. 6º, § 3º)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('requirements')}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-semibold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'requirements'
                ? 'border-emerald-800 text-emerald-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>2. Requisitos para Função Diretiva (Art. 19)</span>
            {!currentRequirements.isEligible && (
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-semibold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'border-emerald-800 text-emerald-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>3. Histórico de 4 Semestres & Risco Legal (Art. 18, III)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bulletin')}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-semibold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'bulletin'
                ? 'border-emerald-800 text-emerald-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>4. Boletim Oficial & Parecer Conclusivo</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SUBTAB 1: MATRIZ DE AVALIAÇÃO DA EQUIPE GESTORA                           */}
        {/* ========================================================================= */}
        {activeSubTab === 'matrix' && (
          <div className="p-6 space-y-6">
            {/* System Guidance & Diligence Integration Alert */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-xs font-bold text-slate-900">
                    Direcionamento Automático Integrado com Diligências e Prestações de Contas
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  O sistema analisa automaticamente os dados reais da escola: status da prestação ({currentSchool.status}), 
                  <strong> {schoolDiligences.length} diligência(s) registrada(s)</strong> ({pendingDiligences.length} pendente(s), {resolvedDiligences.length} sanada(s)) 
                  e bens patrimoniais para direcionar previamente a pontuação e os textos de parecer técnico, garantindo fundamentação jurídica e agilidade ao auditor.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleApplyAutomatedGuidance}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-900 text-white rounded text-xs font-semibold hover:bg-emerald-950 transition-colors cursor-pointer shadow-xs"
                  title="Recalcula as sugestões com base no histórico atualizado de diligências e prestações"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Aplicar Direcionamento do Sistema</span>
                </button>
              </div>
            </div>

            {/* List of 5 Indicators from the PDF Matrix */}
            <div className="space-y-5">
              {(['a', 'b', 'c', 'd', 'e'] as DemocraticIndicatorCode[]).map((code, index) => {
                const indicator = editingEvaluation.indicators[code];
                const def = DEMOCRATIC_INDICATOR_DEFINITIONS[code];
                
                return (
                  <div 
                    key={code}
                    className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors bg-white shadow-2xs space-y-4"
                  >
                    {/* Indicator Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center">
                            {code.toUpperCase()}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">{def.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-3xl">
                          {def.description}
                        </p>
                        <span className="text-[10px] text-emerald-800 font-mono mt-1 inline-block bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Base Legal: {def.legalBasis}
                        </span>
                      </div>

                      {/* Score Selector (1 to 5) */}
                      <div className="shrink-0 flex flex-col items-end">
                        <span className="text-[10px] text-slate-500 uppercase font-bold mb-1">Pontuação Atribuída (1 a 5)</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((pts) => {
                            const isSelected = indicator.score === pts;
                            const isSuggested = indicator.suggestedScore === pts;
                            return (
                              <button
                                key={pts}
                                type="button"
                                onClick={() => handleScoreChange(code, pts)}
                                className={`w-8 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                                  isSelected 
                                    ? pts >= 4 
                                      ? 'bg-emerald-700 text-white ring-2 ring-emerald-500 shadow-xs' 
                                      : pts === 3 
                                      ? 'bg-amber-600 text-white ring-2 ring-amber-400 shadow-xs' 
                                      : 'bg-red-600 text-white ring-2 ring-red-400 shadow-xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                }`}
                                title={isSuggested ? `Sugerido pelo sistema: ${pts} pontos` : `${pts} pontos`}
                              >
                                {pts}
                                {isSuggested && !isSelected && (
                                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {indicator.suggestedScore && (
                          <span className="text-[10px] text-slate-400 mt-1">
                            Sugestão do sistema: <strong>{indicator.suggestedScore} pts</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Verification Sources */}
                    <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
                      <strong className="text-slate-800 text-[11px] block">Fontes de Verificação Normativas:</strong>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {def.verificationSources.map((src, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                            <Check className="w-3 h-3 text-emerald-600" />
                            {src}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* System Guidance Note for this indicator */}
                    {indicator.systemGuidance && (
                      <div className="p-2.5 bg-sky-50 border border-sky-200 rounded text-xs text-sky-900 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-[11px] font-semibold text-sky-950">Direcionamento Prévio da SEE:</strong>
                          <p className="text-[11px] text-sky-900 leading-relaxed">{indicator.systemGuidance}</p>
                        </div>
                      </div>
                    )}

                    {/* Editable Justification Textarea */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>Parecer Técnico do Indicador / Justificativa Circunstanciada *</span>
                          <span className="text-[10px] text-slate-400 font-normal">(Editável pelo auditor)</span>
                        </label>
                        {indicator.isCustomized && (
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Editado Manualmente
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={2}
                        value={indicator.justification}
                        onChange={(e) => handleJustificationChange(code, e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-2.5 text-xs text-slate-800 leading-relaxed focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        placeholder="Insira os apontamentos, dados apurados e fundamentação técnica deste indicador..."
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Score & Official Opinion Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Parecer Técnico Conclusivo Oficial da SEE (Art. 6º, § 3º e Art. 41)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Texto oficial expedido pela Secretaria Municipal de Educação fundamentando a nota e apontamentos.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Aproveitamento Global:</div>
                  <div className="text-2xl font-black font-mono text-emerald-800">
                    {editingEvaluation.totalScore} / 25 pts ({editingEvaluation.percentage}%)
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700">
                    {editingEvaluation.performanceTier}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Parecer Conclusivo Editável (com direcionamento prévio fundamentado na Lei 9.738/2024):
                </label>
                <textarea
                  rows={8}
                  value={editingEvaluation.generalOpinion}
                  onChange={(e) => setEditingEvaluation(prev => ({ ...prev, generalOpinion: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded p-3 text-xs font-mono text-slate-800 leading-relaxed focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  Última atualização: {new Date(editingEvaluation.lastUpdated).toLocaleString('pt-BR')}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveEvaluation}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-800 rounded font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-600" />
                    <span>Salvar Rascunho</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleHomologate}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white rounded font-semibold text-xs hover:bg-emerald-900 transition-colors cursor-pointer shadow-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Homologar Parecer Oficial</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 2: REQUISITOS PARA FUNÇÃO DIRETIVA (ART. 19 DA LEI 9.738/2024)     */}
        {/* ========================================================================= */}
        {activeSubTab === 'requirements' && (
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-900 rounded-lg shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Art. 19 da Lei Municipal Nº 9.738/2024 - Requisitos para Exercício da Função Diretiva
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Para concorrer e desempenhar as funções de Diretor(a) e Vice-Diretor(a) das Escolas Municipais e CEMEJA de Santa Cruz do Sul, o profissional deve cumprir integralmente todos os requisitos legais abaixo discriminados.
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist of Requirements */}
            <div className="space-y-4">
              {/* Req 1: Cargo Efetivo */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Art. 19, Inciso I</span>
                    <span className="text-xs font-semibold text-slate-700">Cargo Efetivo do Magistério Público Municipal</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Ser titular de cargo de provimento efetivo do Magistério Público do Município de Santa Cruz do Sul.
                  </p>
                  <div className="text-[11px] text-slate-600 font-mono mt-1">
                    Comprovação: {currentRequirements.effectiveRoleDetail || 'Matrícula regular em folha de pagamento.'}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={currentRequirements.isEffectiveMagisterio}
                      onChange={(e) => handleToggleRequirement('isEffectiveMagisterio', e.target.checked)}
                      className="w-4 h-4 text-emerald-700 rounded focus:ring-emerald-600"
                    />
                    <span className={currentRequirements.isEffectiveMagisterio ? 'text-emerald-800' : 'text-slate-500'}>
                      {currentRequirements.isEffectiveMagisterio ? 'Conforme / Comprovado' : 'Não Comprovado'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Req 2: Estágio Probatório */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Art. 19, Inciso II</span>
                    <span className="text-xs font-semibold text-slate-700">Conclusão de Estágio Probatório</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Ter concluído o estágio probatório no Magistério Municipal até a data da inscrição/designação.
                  </p>
                  {currentRequirements.probationaryCompletionDate && (
                    <div className="text-[11px] text-slate-600 font-mono mt-1">
                      Data da Homologação da Estabilidade: {currentRequirements.probationaryCompletionDate}
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={currentRequirements.passedProbationaryPeriod}
                      onChange={(e) => handleToggleRequirement('passedProbationaryPeriod', e.target.checked)}
                      className="w-4 h-4 text-emerald-700 rounded focus:ring-emerald-600"
                    />
                    <span className={currentRequirements.passedProbationaryPeriod ? 'text-emerald-800' : 'text-slate-500'}>
                      {currentRequirements.passedProbationaryPeriod ? 'Estágio Concluído' : 'Em Estágio / Pendente'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Req 3: Pós-Graduação ou Pedagogia */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Art. 19, Inciso III</span>
                    <span className="text-xs font-semibold text-slate-700">Pós-Graduação ou Graduação em Pedagogia</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Possuir curso de pós-graduação lato sensu ou stricto sensu na área da Educação ou Gestão Escolar, ou graduação em Pedagogia.
                  </p>
                  <div className="text-[11px] text-slate-600 font-mono mt-1">
                    Curso Comprovado: {currentRequirements.postGraduationCourse || 'Diploma registrado no MEC arquivado no RH da SEE.'}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={currentRequirements.hasPostGraduationOrPedagogy}
                      onChange={(e) => handleToggleRequirement('hasPostGraduationOrPedagogy', e.target.checked)}
                      className="w-4 h-4 text-emerald-700 rounded focus:ring-emerald-600"
                    />
                    <span className={currentRequirements.hasPostGraduationOrPedagogy ? 'text-emerald-800' : 'text-slate-500'}>
                      {currentRequirements.hasPostGraduationOrPedagogy ? 'Titulação Comprovada' : 'Sem Comprovação'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Req 4: 180h Cursos de Gestão Escolar */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Art. 19, Inciso IV</span>
                    <span className="text-xs font-semibold text-slate-700">Mínimo de 180 Horas em Cursos de Gestão Escolar</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Ter participado de cursos de capacitação/formação continuada na área de gestão escolar com carga horária total mínima de 180 horas nos últimos 3 (três) anos.
                  </p>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Certificados: {currentRequirements.courseCertificatesDetail || 'Certificados válidos dos últimos 36 meses.'}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Carga Horária Comprovada:</span>
                    <input
                      type="number"
                      min={0}
                      value={currentRequirements.completedCourseHours}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        handleToggleRequirement('completedCourseHours', val);
                        handleToggleRequirement('has180hManagementCourses', val >= 180);
                      }}
                      className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-center"
                    />
                    <span className="text-xs font-bold text-slate-700">horas</span>
                  </div>

                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    currentRequirements.completedCourseHours >= 180 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {currentRequirements.completedCourseHours >= 180 ? '≥ 180h Atingido' : `Faltam ${180 - currentRequirements.completedCourseHours}h`}
                  </span>
                </div>
              </div>

              {/* Req 5: Obrigações Eleitorais e Certidões Negativas */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Art. 19, Inciso V</span>
                    <span className="text-xs font-semibold text-slate-700">Idoneidade Funcional & Certidões Negativas</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Estar em dia com as obrigações eleitorais e não registrar antecedentes criminais nem condenação administrativa disciplinar punível com suspensão nos últimos 5 anos.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={currentRequirements.hasCleanRecordAndCertificates}
                      onChange={(e) => handleToggleRequirement('hasCleanRecordAndCertificates', e.target.checked)}
                      className="w-4 h-4 text-emerald-700 rounded focus:ring-emerald-600"
                    />
                    <span className={currentRequirements.hasCleanRecordAndCertificates ? 'text-emerald-800' : 'text-slate-500'}>
                      {currentRequirements.hasCleanRecordAndCertificates ? 'Certidões Negativas Válidas' : 'Pendência Notificada'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Req 6: Plano de Gestão Escolar (PGE) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Art. 19, Inciso VI</span>
                    <span className="text-xs font-semibold text-slate-700">Plano de Gestão Escolar (PGE) Homologado</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Apresentação do Plano de Gestão Escolar quadrienal aprovado pela comunidade e cumprimento das metas semestrais.
                  </p>
                  <div className="text-[11px] text-slate-600 font-mono mt-1">
                    Ciclo Vigente: {currentRequirements.managementPlanCycle || 'PGE 2024-2027'}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={currentRequirements.schoolManagementPlanSubmitted}
                      onChange={(e) => handleToggleRequirement('schoolManagementPlanSubmitted', e.target.checked)}
                      className="w-4 h-4 text-emerald-700 rounded focus:ring-emerald-600"
                    />
                    <span className={currentRequirements.schoolManagementPlanSubmitted ? 'text-emerald-800' : 'text-slate-500'}>
                      {currentRequirements.schoolManagementPlanSubmitted ? 'PGE Entregue e Aprovado' : 'Pendente de Entrega'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Auditor notes for requirements */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Observações e Despacho do Auditor da SEE sobre a Elegibilidade da Direção:
              </label>
              <textarea
                rows={3}
                value={currentRequirements.auditorNotes || ''}
                onChange={(e) => handleToggleRequirement('auditorNotes', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                placeholder="Insira anotações sobre certidões complementares, prorrogações concedidas ou registros no processo..."
              />
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSaveFeedback('Requisitos de elegibilidade da direção atualizados com sucesso!');
                    setTimeout(() => setSaveFeedback(null), 3000);
                  }}
                  className="px-4 py-2 bg-emerald-900 text-white rounded text-xs font-semibold hover:bg-emerald-950 transition-colors cursor-pointer"
                >
                  Confirmar e Salvar Requisitos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 3: HISTÓRICO DE 4 SEMESTRES & RISCO LEGAL (ART. 18, III)           */}
        {/* ========================================================================= */}
        {activeSubTab === 'history' && (
          <div className="p-6 space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-900 rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-950">
                  Regra de Destituição por Desempenho Insatisfatório (Art. 18, III da Lei 9.738/2024)
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed">
                  <em>"Art. 18. A perda do mandato de Diretor ou Vice-Diretor ocorrerá nos seguintes casos: [...] III - apresentar rendimento insatisfatório, inferior a 50% (cinquenta por cento), na avaliação semestral de desempenho, por 4 (quatro) semestres consecutivos;"</em>
                </p>
                <p className="text-[11px] text-amber-800">
                  A SEE mantém controle sistemático dos últimos 4 boletins semestrais para garantir o devido processo legal e orientar as equipes escolares antes de qualquer medida sancionatória.
                </p>
              </div>
            </div>

            {/* 4 Semesters Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {editingEvaluation.historicalSemesters.map((sem, idx) => {
                const isUnder = sem.percentage < 50;
                return (
                  <div 
                    key={sem.semester}
                    className={`p-4 rounded-xl border transition-all ${
                      isUnder 
                        ? 'border-red-300 bg-red-50/50' 
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">Semestre {sem.semester}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isUnder ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isUnder ? 'Abaixo de 50%' : 'Aprovado'}
                      </span>
                    </div>

                    <div className="text-2xl font-black font-mono text-slate-900 mb-1">
                      {sem.percentage}%
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {sem.totalScore} de 25 pontos
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                      Boletim semestral homologado e arquivado no livro tombo.
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Risk Gauge */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 block">Monitoramento Consecutivo do Art. 18, III:</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4].map((step) => {
                      const isActive = step <= editingEvaluation.consecutiveUnder50Count;
                      return (
                        <div
                          key={step}
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isActive
                              ? 'bg-red-600 text-white ring-2 ring-red-400'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                          title={`Semestre ${step} com &lt; 50%`}
                        >
                          {step}º
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">
                    {editingEvaluation.consecutiveUnder50Count === 0 
                      ? 'Nenhum semestre consecutivo com rendimento inferior a 50% (Situação Regular).' 
                      : `${editingEvaluation.consecutiveUnder50Count} de 4 semestres em alerta.`}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Enquadramento Legal</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Regularidade Plena do Mandato
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 4: BOLETIM OFICIAL DE DESEMPENHO (IMPRESSÃO / FORMATAÇÃO OFICIAL)  */}
        {/* ========================================================================= */}
        {activeSubTab === 'bulletin' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Documento oficial expedido para arquivamento no processo da escola e ciência da direção escolar.
              </p>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Boletim Oficial</span>
              </button>
            </div>

            {/* Official Printable Sheet */}
            <div className="bg-white border-2 border-slate-300 p-8 rounded-lg shadow-sm max-w-4xl mx-auto space-y-6 text-slate-900 font-sans print:border-none print:shadow-none print:p-0">
              {/* Official Header */}
              <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                <div className="text-xs font-semibold tracking-widest uppercase text-slate-700">
                  Estado do Rio Grande do Sul · Município de Santa Cruz do Sul
                </div>
                <h2 className="text-base font-black tracking-tight text-slate-950 uppercase">
                  Secretaria Municipal de Educação · SEE
                </h2>
                <div className="text-xs font-bold text-slate-800 uppercase">
                  Comissão de Gestão Democrática e Avaliação Escolar
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Lei Ordinária Municipal nº 9.738/2024 · Matriz Administrativo-Financeira (Art. 6º, § 3º)
                </div>
              </div>

              {/* Title */}
              <div className="bg-slate-100 p-3 rounded text-center">
                <h3 className="text-sm font-black uppercase text-slate-900">
                  Boletim Semestral de Desempenho da Equipe Gestora
                </h3>
                <div className="text-xs font-semibold text-slate-700">
                  Exercício Auditado: 2024 · Semestre: {selectedSemester}
                </div>
              </div>

              {/* Identification Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Unidade de Ensino:</span>
                  <span className="font-bold text-slate-900">{currentSchool.name} ({currentSchool.type})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Unidade Executora / CPM:</span>
                  <span className="font-bold text-slate-900">{currentSchool.uexName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Diretor(a) Escolar:</span>
                  <span className="font-bold text-slate-900">{currentRequirements.directorName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">CNPJ do CPM:</span>
                  <span className="font-bold text-slate-900 font-mono">{currentSchool.uexCnpj}</span>
                </div>
              </div>

              {/* Table of the 5 Indicators */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2.5 w-12 text-center border-r border-slate-300">Item</th>
                      <th className="p-2.5 border-r border-slate-300">Indicador Avaliado</th>
                      <th className="p-2.5 w-20 text-center border-r border-slate-300">Pontos (1 a 5)</th>
                      <th className="p-2.5">Justificativa e Fontes de Verificação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(['a', 'b', 'c', 'd', 'e'] as DemocraticIndicatorCode[]).map((code) => {
                      const ind = editingEvaluation.indicators[code];
                      return (
                        <tr key={code} className="align-top">
                          <td className="p-2.5 text-center font-bold border-r border-slate-200 uppercase bg-slate-50">
                            {code}
                          </td>
                          <td className="p-2.5 border-r border-slate-200">
                            <strong className="block text-slate-900 font-semibold">{ind.shortTitle}</strong>
                            <span className="text-[10px] text-slate-500">{ind.legalBasis}</span>
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-sm border-r border-slate-200">
                            {ind.score}
                          </td>
                          <td className="p-2.5 text-slate-700 leading-relaxed text-[11px]">
                            {ind.justification}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={2} className="p-3 text-right text-xs uppercase border-r border-slate-300">
                        Total Geral Administrativo-Financeiro (Máx. 25 pts):
                      </td>
                      <td className="p-3 text-center text-base font-mono font-black border-r border-slate-300 text-emerald-900">
                        {editingEvaluation.totalScore}
                      </td>
                      <td className="p-3 text-xs text-emerald-900">
                        Aproveitamento: <strong>{editingEvaluation.percentage}%</strong> · Conceito: <strong>{editingEvaluation.performanceTier}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Parecer Conclusivo Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs space-y-2">
                <strong className="block text-slate-900 uppercase font-bold text-[11px]">
                  Parecer Conclusivo da Comissão Técnica da SEE:
                </strong>
                <p className="whitespace-pre-line text-slate-800 leading-relaxed font-mono text-[11px]">
                  {editingEvaluation.generalOpinion}
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-slate-400 pt-2">
                  <div className="font-bold text-slate-900">Auditor Técnico de Gestão Escolar</div>
                  <div className="text-[10px] text-slate-500">Secretaria Municipal de Educação</div>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <div className="font-bold text-slate-900">{currentRequirements.directorName}</div>
                  <div className="text-[10px] text-slate-500">Direção da {currentSchool.name}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
