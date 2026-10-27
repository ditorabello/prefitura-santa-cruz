import React, { useState } from 'react';
import { usePDDE } from '../context/PDDEContext';
import { Transfer, BankYield, ProgramType, Category, PROGRAM_LABELS } from '../types/pdde';
import { formatBRL, formatDateBR } from '../utils/formatters';
import { 
  ArrowDownToLine, 
  Plus, 
  Trash2, 
  TrendingUp, 
  ReceiptText, 
  HelpCircle,
  X,
  FileCheck
} from 'lucide-react';

export const TransfersView: React.FC = () => {
  const { 
    currentSchool, 
    selectedYear, 
    schoolTransfers, 
    schoolYields, 
    addTransfer, 
    deleteTransfer, 
    addYield, 
    deleteYield 
  } = usePDDE();

  const [activeSubTab, setActiveSubTab] = useState<'transfers' | 'yields'>('transfers');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isYieldModalOpen, setIsYieldModalOpen] = useState(false);

  // New transfer form state
  const [newTransferData, setNewTransferData] = useState({
    program: 'PDDE_MUNICIPAL' as ProgramType,
    category: 'CUSTEIO' as Category,
    date: new Date().toISOString().split('T')[0],
    description: '',
    docNumber: '',
    value: '',
  });

  // New yield form state
  const [newYieldData, setNewYieldData] = useState({
    program: 'PDDE_MUNICIPAL' as ProgramType,
    category: 'CUSTEIO' as Category,
    month: '06/2024',
    date: new Date().toISOString().split('T')[0],
    value: '',
  });

  if (!currentSchool) return null;

  const totalTransfers = schoolTransfers.reduce((acc, t) => acc + t.value, 0);
  const totalYields = schoolYields.reduce((acc, y) => acc + y.value, 0);

  const handleAddTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransferData.description || !newTransferData.value) return;

    addTransfer({
      schoolId: currentSchool.id,
      year: selectedYear,
      program: newTransferData.program,
      category: newTransferData.category,
      date: newTransferData.date,
      description: newTransferData.description,
      docNumber: newTransferData.docNumber || `OB-PM-${Date.now().toString().slice(-4)}`,
      value: parseFloat(newTransferData.value),
    });

    setNewTransferData({
      program: 'PDDE_MUNICIPAL',
      category: 'CUSTEIO',
      date: new Date().toISOString().split('T')[0],
      description: '',
      docNumber: '',
      value: '',
    });
    setIsTransferModalOpen(false);
  };

  const handleAddYieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYieldData.value) return;

    addYield({
      schoolId: currentSchool.id,
      year: selectedYear,
      month: newYieldData.month,
      program: newYieldData.program,
      category: newYieldData.category,
      date: newYieldData.date,
      value: parseFloat(newYieldData.value),
    });

    setNewYieldData({
      program: 'PDDE_MUNICIPAL',
      category: 'CUSTEIO',
      month: '06/2024',
      date: new Date().toISOString().split('T')[0],
      value: '',
    });
    setIsYieldModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Repasses e Rendimentos de Aplicação Financeira
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro das ordens bancárias creditadas pela Prefeitura de Santa Cruz do Sul e FNDE, mais os rendimentos mensais da poupança
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'transfers' ? (
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-800 text-white rounded-md text-xs font-semibold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Repasse Recebido</span>
            </button>
          ) : (
            <button
              onClick={() => setIsYieldModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-800 text-white rounded-md text-xs font-semibold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Rendimento Mensal</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('transfers')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'transfers'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>Parcelas e Repasses ({schoolTransfers.length})</span>
          <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
            {formatBRL(totalTransfers)}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('yields')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'yields'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Rendimentos de Poupança/Aplicação ({schoolYields.length})</span>
          <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
            {formatBRL(totalYields)}
          </span>
        </button>
      </div>

      {/* SubTab Content: Transfers Table */}
      {activeSubTab === 'transfers' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {schoolTransfers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum repasse registrado para este exercício. Clique em "Novo Repasse Recebido".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Data do Crédito</th>
                    <th className="py-3 px-4">Programa / Fonte</th>
                    <th className="py-3 px-4">Rubrica</th>
                    <th className="py-3 px-4">Descrição do Repasse</th>
                    <th className="py-3 px-4">Nº Ordem Bancária / Empenho</th>
                    <th className="py-3 px-4 text-right">Valor Creditado</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schoolTransfers.map((t) => {
                    const progInfo = PROGRAM_LABELS[t.program];
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {formatDateBR(t.date)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-900 block">
                            {progInfo.label}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Origem: {progInfo.origin}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.category === 'CUSTEIO' 
                              ? 'bg-sky-50 text-sky-800 border border-sky-200' 
                              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          }`}>
                            {t.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs">
                          {t.description}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                          {t.docNumber}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                          {formatBRL(t.value)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm('Deseja excluir este repasse?')) {
                                deleteTransfer(t.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Excluir repasse"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                  <tr>
                    <td colSpan={5} className="py-3 px-4 text-right">
                      Total de Repasses Creditados no Exercício:
                    </td>
                    <td className="py-3 px-4 font-mono text-right text-emerald-800">
                      {formatBRL(totalTransfers)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SubTab Content: Yields Table */}
      {activeSubTab === 'yields' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 text-xs text-slate-600 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              <strong>Regra Legal do PDDE (FNDE e Municipal):</strong> Todo saldo mantido em conta deve ser mantido em aplicação financeira. 
              Os rendimentos auferidos pertencem ao programa e devem ser obrigatoriamente aplicados no mesmo objeto e computados no Anexo I.
            </span>
          </div>

          {schoolYields.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum rendimento de aplicação financeira cadastrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Mês de Competência</th>
                    <th className="py-3 px-4">Data do Crédito</th>
                    <th className="py-3 px-4">Programa Vinculado</th>
                    <th className="py-3 px-4">Rubrica</th>
                    <th className="py-3 px-4 text-right">Rendimento Auferido</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schoolYields.map((y) => (
                    <tr key={y.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {y.month}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDateBR(y.date)}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {PROGRAM_LABELS[y.program].label}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {y.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800 text-right">
                        +{formatBRL(y.value)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm('Deseja excluir este rendimento?')) {
                              deleteYield(y.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Excluir rendimento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                  <tr>
                    <td colSpan={4} className="py-3 px-4 text-right">
                      Total de Rendimentos no Exercício:
                    </td>
                    <td className="py-3 px-4 font-mono text-right text-emerald-800">
                      +{formatBRL(totalYields)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Novo Repasse */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-slate-900 text-sm">
                Registrar Novo Repasse Recebido
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTransferSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Programa / Fonte do Recurso *</label>
                <select
                  value={newTransferData.program}
                  onChange={(e) => setNewTransferData({ ...newTransferData, program: e.target.value as ProgramType })}
                  className="w-full border border-slate-300 rounded px-3 py-2 bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="PDDE_MUNICIPAL">PDDE Municipal (SEE - Santa Cruz do Sul)</option>
                  <option value="PDDE_BASICO_FNDE">PDDE Básico (FNDE / Federal)</option>
                  <option value="PDDE_EDUCACAO_CONECTADA">PDDE Educação Conectada</option>
                  <option value="PDDE_ESTRUTURA">PDDE Estrutura / Acessibilidade</option>
                  <option value="PDDE_TEMPO_INTEGRAL">PDDE Tempo Integral</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Rubrica Orçamentária *</label>
                  <select
                    value={newTransferData.category}
                    onChange={(e) => setNewTransferData({ ...newTransferData, category: e.target.value as Category })}
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="CUSTEIO">Custeio (Materiais / Serviços)</option>
                    <option value="CAPITAL">Capital (Bens Permanentes)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Data do Crédito na Conta *</label>
                  <input
                    type="date"
                    required
                    value={newTransferData.date}
                    onChange={(e) => setNewTransferData({ ...newTransferData, date: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Descrição do Repasse / Objeto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 1ª Parcela PDDE Municipal - Repasse Descentralizado"
                  value={newTransferData.description}
                  onChange={(e) => setNewTransferData({ ...newTransferData, description: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Nº Ordem Bancária / Empenho</label>
                  <input
                    type="text"
                    placeholder="Ex: OB-PM-2024/0981"
                    value={newTransferData.docNumber}
                    onChange={(e) => setNewTransferData({ ...newTransferData, docNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Valor Creditado (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newTransferData.value}
                    onChange={(e) => setNewTransferData({ ...newTransferData, value: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 font-mono font-bold focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 text-white rounded font-semibold hover:bg-emerald-900 cursor-pointer"
                >
                  Salvar Repasse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Rendimento */}
      {isYieldModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-slate-900 text-sm">
                Registrar Rendimento de Aplicação
              </h3>
              <button onClick={() => setIsYieldModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddYieldSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Mês de Competência *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 06/2024"
                    value={newYieldData.month}
                    onChange={(e) => setNewYieldData({ ...newYieldData, month: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Data do Extrato *</label>
                  <input
                    type="date"
                    required
                    value={newYieldData.date}
                    onChange={(e) => setNewYieldData({ ...newYieldData, date: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Programa Vinculado</label>
                <select
                  value={newYieldData.program}
                  onChange={(e) => setNewYieldData({ ...newYieldData, program: e.target.value as ProgramType })}
                  className="w-full border border-slate-300 rounded px-3 py-2 bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="PDDE_MUNICIPAL">PDDE Municipal (SEE)</option>
                  <option value="PDDE_BASICO_FNDE">PDDE Básico (FNDE)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Rubrica de Aplicação</label>
                <select
                  value={newYieldData.category}
                  onChange={(e) => setNewYieldData({ ...newYieldData, category: e.target.value as Category })}
                  className="w-full border border-slate-300 rounded px-3 py-2 bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="CUSTEIO">Custeio</option>
                  <option value="CAPITAL">Capital</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Valor do Rendimento (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={newYieldData.value}
                  onChange={(e) => setNewYieldData({ ...newYieldData, value: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2 font-mono font-bold focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsYieldModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 text-white rounded font-semibold hover:bg-emerald-900 cursor-pointer"
                >
                  Salvar Rendimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
