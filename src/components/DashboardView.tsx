import React from 'react';
import { usePDDE } from '../context/PDDEContext';
import { formatBRL } from '../utils/formatters';
import { PROGRAM_LABELS } from '../types/pdde';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  AlertTriangle, 
  CheckCircle, 
  Scale, 
  Receipt, 
  FileSpreadsheet, 
  Calendar,
  AlertCircle,
  HelpCircle,
  Package,
  Wrench
} from 'lucide-react';
import { PDDEChatbot } from './PDDEChatbot';

export const DashboardView: React.FC = () => {
  const { 
    currentSchool, 
    selectedYear, 
    financialSummary, 
    complianceAlerts, 
    setActiveTab, 
    schoolExpenses, 
    schoolQuotations 
  } = usePDDE();

  if (!currentSchool) return null;

  const executionRate = financialSummary.totalRevenue > 0
    ? Math.min(100, Math.round((financialSummary.totalExpenses / financialSummary.totalRevenue) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Notification Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-xl p-5 shadow-sm border border-emerald-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold tracking-wide uppercase mb-1">
              <span>{currentSchool.name}</span>
              <span>·</span>
              <span>Exercício {selectedYear}</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Painel Financeiro e Prestação de Contas do PDDE
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl">
              Gerencie orçamentos, notas fiscais, conciliação e emita os formulários legais da 
              Secretaria Municipal de Educação de Santa Cruz do Sul e FNDE.
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('quotations')}
              className="px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 hover:text-white rounded-md text-xs font-medium border border-emerald-600 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Orçamentos</span>
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className="px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 hover:text-white rounded-md text-xs font-medium border border-emerald-600 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Nova Despesa</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Emitir Anexos Oficiais</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compliance / Alerts Box */}
      {complianceAlerts.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-amber-900 font-semibold text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Itens de Atenção e Conformidade Legal ({complianceAlerts.length})</span>
            </div>
            <button
              onClick={() => setActiveTab('audit')}
              className="px-2.5 py-1 bg-amber-800 text-white rounded text-[11px] font-semibold hover:bg-amber-900 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Wrench className="w-3 h-3" />
              <span>Central de Diagnóstico & Resolução</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
            {complianceAlerts.map((alert) => (
              <div 
                key={alert.id}
                className="bg-white/80 border border-amber-200 rounded p-2.5 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <strong className="text-amber-950 block">{alert.title}</strong>
                  <span className="text-slate-600 leading-relaxed">{alert.message}</span>
                </div>
                {alert.actionTab && (
                  <button
                    onClick={() => setActiveTab(alert.actionTab!)}
                    className="shrink-0 text-emerald-800 hover:text-emerald-950 font-semibold text-[11px] underline cursor-pointer"
                  >
                    Resolver
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Receita Total Disponível</span>
            <div className="p-1.5 bg-emerald-50 rounded text-emerald-700">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {formatBRL(financialSummary.totalRevenue)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Repasses: {formatBRL(financialSummary.totalTransfers)}</span>
            <span className="text-emerald-700 font-semibold">Rend: {formatBRL(financialSummary.totalYields)}</span>
          </div>
        </div>

        {/* Despesas Executadas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Despesas Pagas (Executado)</span>
            <div className="p-1.5 bg-sky-50 rounded text-sky-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {formatBRL(financialSummary.totalExpenses)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {schoolExpenses.length} comprovante(s) e notas pagas
          </div>
        </div>

        {/* Saldo Restante */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Saldo em Conta Bancária</span>
            <div className="p-1.5 bg-slate-100 rounded text-slate-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-bold font-mono ${
            financialSummary.balance >= 0 ? 'text-emerald-700' : 'text-red-700'
          }`}>
            {formatBRL(financialSummary.balance)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {financialSummary.balance >= 0 ? 'Saldo positivo disponível' : 'Atenção: déficit orçamentário'}
          </div>
        </div>

        {/* Taxa de Execução */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Execução Orçamentária</span>
            <div className="p-1.5 bg-emerald-50 rounded text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {executionRate}%
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all" 
              style={{ width: `${executionRate}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Two Column Section: Category Distribution & Program Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rubricas: Custeio vs Capital */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Execução por Rubrica Orçamentária
              </h3>
              <p className="text-xs text-slate-500">
                Divisão estrita entre Despesas Correntes (Custeio) e Investimento (Capital)
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Custeio */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-800">
                  Custeio (Materiais, Serviços e Pequenos Reparos)
                </span>
                <span className="font-mono font-bold text-slate-900">
                  Saldo: {formatBRL(financialSummary.byCategory.custeioBalance)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block">Receita (Repasse + Rend)</span>
                  <span className="font-mono font-medium">{formatBRL(financialSummary.byCategory.custeioRevenue)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Despesas Pagas</span>
                  <span className="font-mono font-medium text-red-700">-{formatBRL(financialSummary.byCategory.custeioExpenses)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">% Executado</span>
                  <span className="font-semibold text-slate-800">
                    {financialSummary.byCategory.custeioRevenue > 0
                      ? Math.round((financialSummary.byCategory.custeioExpenses / financialSummary.byCategory.custeioRevenue) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Capital */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-800">
                  Capital (Equipamentos Permanentes e Mobiliário)
                </span>
                <span className="font-mono font-bold text-slate-900">
                  Saldo: {formatBRL(financialSummary.byCategory.capitalBalance)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block">Receita (Repasse + Rend)</span>
                  <span className="font-mono font-medium">{formatBRL(financialSummary.byCategory.capitalRevenue)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Despesas Pagas</span>
                  <span className="font-mono font-medium text-red-700">-{formatBRL(financialSummary.byCategory.capitalExpenses)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">% Executado</span>
                  <span className="font-semibold text-slate-800">
                    {financialSummary.byCategory.capitalRevenue > 0
                      ? Math.round((financialSummary.byCategory.capitalExpenses / financialSummary.byCategory.capitalRevenue) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown by Program */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Recursos por Programa / Fonte
              </h3>
              <p className="text-xs text-slate-500">
                Repasses municipais da Prefeitura de Santa Cruz do Sul e programas FNDE
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {(Object.keys(financialSummary.byProgram) as (keyof typeof financialSummary.byProgram)[]).map((progKey) => {
              const data = financialSummary.byProgram[progKey];
              const progInfo = PROGRAM_LABELS[progKey];
              if (data.transfers === 0 && data.expenses === 0 && data.yields === 0) return null;

              return (
                <div key={progKey} className="py-2.5 flex items-center justify-between">
                  <div className="pr-4">
                    <div className="font-medium text-slate-800">
                      {progInfo.label}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Receitas: {formatBRL(data.transfers + data.yields)} · Pagos: {formatBRL(data.expenses)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-slate-900 block">
                      {formatBRL(data.balance)}
                    </span>
                    <span className="text-[10px] text-slate-400">Saldo atual</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Deadlines and Regulatory Information */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <span>Calendário e Prazos Obrigatórios de Prestação de Contas em Santa Cruz do Sul</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-800 block mb-1">
              1º Semestre (Prestação Parcial SEE)
            </span>
            <div className="text-emerald-800 font-bold mb-1">Até 31 de Julho</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Envio da prestação de contas parcial dos repasses efetuados de janeiro a junho à Secretaria Municipal de Educação.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-800 block mb-1">
              2º Semestre e Encerramento Anual (SEE)
            </span>
            <div className="text-emerald-800 font-bold mb-1">Até 15 de Janeiro</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Consolidação definitiva do exercício fiscal municipal com pasta documental e parecer do Conselho Fiscal.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-800 block mb-1">
              PDDE Federal / FNDE (SiGPC)
            </span>
            <div className="text-sky-800 font-bold mb-1">Até 30 de Abril</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Lançamento eletrônico das contas das verbas federais no Sistema de Gestão de Prestação de Contas (SiGPC/Contas Online).
            </p>
          </div>
        </div>
      </div>

      {/* Assistente de Legislação do PDDE (Municipal de Santa Cruz do Sul e FNDE) */}
      <PDDEChatbot />
    </div>
  );
};

