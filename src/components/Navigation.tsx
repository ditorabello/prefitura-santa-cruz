import React from 'react';
import { usePDDE } from '../context/PDDEContext';
import { 
  LayoutDashboard, 
  ArrowDownToLine, 
  Scale, 
  Receipt, 
  Package, 
  Landmark, 
  FileCheck2, 
  ShieldAlert,
  Building2,
  Wrench,
  HelpCircle,
  Award
} from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
}

export const Navigation: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    activeViewMode, 
    schoolExpenses, 
    auditChecks,
    schoolDiligences 
  } = usePDDE();

  const unreconciledCount = schoolExpenses.filter(e => !e.reconciled).length;
  const blockingCount = auditChecks.filter(c => c.severity === 'bloqueante').length;
  const pendingDiligencesCount = schoolDiligences.filter(d => d.status === 'pendente').length;
  const totalProblemAlerts = blockingCount + pendingDiligencesCount;

  const schoolTabs: TabItem[] = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'transfers', label: 'Repasses & Receitas', icon: ArrowDownToLine },
    { id: 'quotations', label: 'Orçamentos', icon: Scale },
    { id: 'expenses', label: 'Despesas & Pagamentos', icon: Receipt },
    { id: 'assets', label: 'Bens & Termo de Doação', icon: Package },
    { id: 'reconciliation', label: 'Conciliação Bancária', icon: Landmark, badge: unreconciledCount > 0 ? unreconciledCount : undefined },
    { id: 'audit', label: 'Problemas & Diligências', icon: ShieldAlert, badge: totalProblemAlerts > 0 ? totalProblemAlerts : undefined, badgeColor: 'bg-red-500 text-white' },
    { id: 'reports', label: 'Prestação de Contas Oficial', icon: FileCheck2 },
  ];

  if (activeViewMode === 'see') {
    return (
      <nav className="bg-white border-b border-slate-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex space-x-1 py-2">
            <button
              onClick={() => setActiveTab('see-overview')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'see-overview'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Painel de Contas & Escolas</span>
            </button>

            <button
              onClick={() => setActiveTab('see-supervisao-financeira')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'see-supervisao-financeira'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Supervisão Financeira & Prestação de Contas</span>
            </button>

            <button
              onClick={() => setActiveTab('see-gestao-democratica')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'see-gestao-democratica'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Gestão Democrática (Lei 9.738/2024)</span>
            </button>

            <button
              onClick={() => setActiveTab('see-cadastro-escolas')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'see-cadastro-escolas'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Cadastro de Escolas</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Auditoria & Diligências</span>
            </button>

            <button
              onClick={() => setActiveTab('see-guidelines')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'see-guidelines'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Diretrizes e Normativas</span>
            </button>
          </div>
          <div className="text-xs text-slate-500 hidden xl:block">
            Módulo de Supervisão SEE Santa Cruz do Sul
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-slate-200 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 flex space-x-1 py-1.5">
        {schoolTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer relative ${
                isActive
                  ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-200' : 'text-slate-500'}`} />
              <span>{tab.label}</span>

              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    tab.badgeColor || (isActive ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800')
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
