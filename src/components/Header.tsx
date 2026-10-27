import React, { useState } from 'react';
import { usePDDE } from '../context/PDDEContext';
import { 
  Building2, 
  ShieldCheck, 
  Calendar, 
  FileDown, 
  FileUp, 
  RotateCcw, 
  Settings, 
  Plus, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { SchoolSettingsModal } from './SchoolSettingsModal';
import { NewSchoolModal } from './NewSchoolModal';

export const Header: React.FC = () => {
  const {
    activeViewMode,
    setActiveViewMode,
    selectedSchoolId,
    setSelectedSchoolId,
    selectedYear,
    setSelectedYear,
    schools,
    currentSchool,
    exportDataJSON,
    importDataJSON,
    resetToDefault,
  } = usePDDE();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewSchoolOpen, setIsNewSchoolOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJSON(content);
      if (success) {
        setImportStatus('Dados importados com sucesso!');
        setTimeout(() => setImportStatus(null), 3500);
      } else {
        alert('Erro ao importar arquivo JSON: formato inválido ou arquivo incompatível.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getStatusBadge = () => {
    if (!currentSchool) return null;
    switch (currentSchool.status) {
      case 'aprovado':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Prestação Aprovada pela SEE
          </span>
        );
      case 'enviado_see':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-800 bg-sky-50 border border-sky-300 px-2.5 py-1 rounded">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            Enviada para Análise da SEE
          </span>
        );
      case 'diligencia':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Pendente de Diligência / Retificação
          </span>
        );
      case 'aguardando_cpm':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-800 bg-indigo-50 border border-indigo-300 px-2.5 py-1 rounded">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            Aguardando Reunião do CPM
          </span>
        );
      case 'em_elaboracao':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Prestação em Elaboração
          </span>
        );
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top institutional strip */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-400 uppercase tracking-wide">Prefeitura Municipal de Santa Cruz do Sul</span>
          <span className="text-slate-500">|</span>
          <span>Secretaria Municipal de Educação (SEE)</span>
          <span className="text-slate-500">·</span>
          <span>Núcleo de Gestão Financeira Escolar</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportDataJSON}
            title="Exportar cópia de segurança completa em JSON"
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Exportar Backup</span>
          </button>
          <label
            title="Importar dados de um arquivo JSON salvo anteriormente"
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Restaurar Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
          <button
            onClick={resetToDefault}
            title="Restaurar dados de exemplo do sistema"
            className="flex items-center gap-1 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Dados Iniciais</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="bg-emerald-600 text-white text-xs font-medium px-4 py-1.5 text-center transition-all">
          {importStatus}
        </div>
      )}

      {/* Main header bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-emerald-800 rounded-lg flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                PDDE Santa Cruz do Sul
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide uppercase">
                Municipal & FNDE
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Gestão Financeira, Tomada de Preços e Prestação de Contas das Escolas Municipais
            </p>
          </div>
        </div>

        {/* Controls: Mode Switch, School Picker, Year Picker */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveViewMode('school')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'school'
                  ? 'bg-white text-emerald-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              Visão da Escola / CPM
            </button>
            <button
              onClick={() => setActiveViewMode('see')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'see'
                  ? 'bg-emerald-800 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Auditoria SEE (Secretaria)
            </button>
          </div>

          {/* School selector (active in school view) */}
          {activeViewMode === 'school' && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 text-xs font-medium rounded-md px-3 py-2 shadow-xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 max-w-[220px]"
              >
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.type})
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsSettingsOpen(true)}
                title="Editar dados cadastrais da Escola e do CPM"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsNewSchoolOpen(true)}
                title="Cadastrar nova Escola Municipal"
                className="p-2 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-md border border-emerald-200 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Fiscal year selector */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-md px-2 py-1.5 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500 font-medium">Exercício:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subheader info strip for School mode */}
      {activeViewMode === 'school' && currentSchool && (
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <div>
                <span className="text-slate-400">Unidade Executora:</span>{' '}
                <strong className="text-slate-800">{currentSchool.uexName}</strong>
              </div>
              <span className="text-slate-300">·</span>
              <div>
                <span className="text-slate-400">CNPJ CPM:</span>{' '}
                <span className="font-mono text-slate-700">{currentSchool.uexCnpj}</span>
              </div>
              <span className="text-slate-300">·</span>
              <div>
                <span className="text-slate-400">Presidente:</span>{' '}
                <span className="text-slate-700">{currentSchool.presidentName}</span>
              </div>
              <span className="text-slate-300">·</span>
              <div>
                <span className="text-slate-400">Conta BB:</span>{' '}
                <span className="font-mono text-slate-700">Ag {currentSchool.bankAccount.agency} / CC {currentSchool.bankAccount.accountNumber}</span>
              </div>
            </div>
            <div>{getStatusBadge()}</div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isSettingsOpen && (
        <SchoolSettingsModal
          school={currentSchool}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isNewSchoolOpen && (
        <NewSchoolModal
          onClose={() => setIsNewSchoolOpen(false)}
        />
      )}
    </header>
  );
};
