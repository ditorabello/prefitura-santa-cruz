import React, { useState } from 'react';
import { usePDDE } from '../context/PDDEContext';
import { 
  Expense, 
  ExpenseType, 
  Category, 
  ProgramType, 
  PaymentMethod, 
  PROGRAM_LABELS, 
  EXPENSE_TYPE_LABELS 
} from '../types/pdde';
import { formatBRL, formatDateBR, formatCNPJ } from '../utils/formatters';
import {
  PRESET_NFES,
  validateNFeChave,
  formatChaveAcesso,
  NFeValidationResult,
  ExtratoDebitoInput
} from '../utils/nfeValidator';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Filter,
  Sparkles,
  Search,
  Copy,
  Scale,
  ShieldCheck,
  CheckCheck,
  Eye,
  FileText,
  AlertTriangle,
  RefreshCw,
  Coins,
  ArrowRight
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { 
    currentSchool, 
    selectedYear, 
    schoolExpenses, 
    schoolQuotations, 
    addExpense, 
    deleteExpense, 
    toggleReconciled,
    addAsset
  } = usePDDE();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [filterReconciled, setFilterReconciled] = useState<string>('all');

  // NF-e Chave de Acesso State
  const [nfeChave, setNfeChave] = useState<string>(PRESET_NFES[0].chave);
  const [nfeExtratoMode, setNfeExtratoMode] = useState<boolean>(true);
  const [nfeExtratoDescricao, setNfeExtratoDescricao] = useState<string>(PRESET_NFES[0].extratoSugerido.descricao);
  const [nfeExtratoValor, setNfeExtratoValor] = useState<string>(String(PRESET_NFES[0].extratoSugerido.valor));
  const [nfeValidationResult, setNfeValidationResult] = useState<NFeValidationResult | null>(null);
  const [isValidatingNfe, setIsValidatingNfe] = useState<boolean>(false);
  const [nfeResultViewTab, setNfeResultViewTab] = useState<'structured' | 'markdown'>('structured');
  const [copiedNfeNotification, setCopiedNfeNotification] = useState<boolean>(false);
  const [prefillSuccessMessage, setPrefillSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    quotationId: '',
    program: 'PDDE_MUNICIPAL' as ProgramType,
    category: 'CUSTEIO' as Category,
    expenseType: 'material_consumo' as ExpenseType,
    supplierName: '',
    supplierCnpjCpf: '',
    invoiceNumber: '',
    invoiceSeries: '1',
    invoiceDate: new Date().toISOString().split('T')[0],
    attestationDate: new Date().toISOString().split('T')[0],
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'PIX' as PaymentMethod,
    paymentDocNumber: '',
    grossValue: '',
    taxRetention: '0',
    description: '',
    nfeAccessKey: '',
    // If Capital: asset fields
    assetBrandModel: '',
    assetLocation: 'Escola Municipal',
  });

  if (!currentSchool) return null;

  // Filtered list
  const filteredExpenses = schoolExpenses.filter(e => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterProgram !== 'all' && e.program !== filterProgram) return false;
    if (filterReconciled === 'yes' && !e.reconciled) return false;
    if (filterReconciled === 'no' && e.reconciled) return false;
    return true;
  });

  const totalFilteredValue = filteredExpenses.reduce((acc, e) => acc + e.netValue, 0);

  const handleQuotationSelect = (cotId: string) => {
    if (!cotId) {
      setFormData(prev => ({ ...prev, quotationId: '' }));
      return;
    }
    const quotation = schoolQuotations.find(q => q.id === cotId);
    if (quotation) {
      const winner = quotation.quotes[quotation.winningQuoteIndex];
      setFormData(prev => ({
        ...prev,
        quotationId: cotId,
        program: quotation.program,
        category: quotation.category,
        description: quotation.objectDescription,
        supplierName: winner?.companyName || '',
        supplierCnpjCpf: winner?.cnpj || '',
        grossValue: winner?.proposalValue ? String(winner.proposalValue) : '',
      }));
    }
  };

  // Trigger NF-e Validation (SEFAZ + Extrato Batimento)
  const handleValidateNfe = async () => {
    if (!nfeChave.trim()) return;
    setIsValidatingNfe(true);
    setPrefillSuccessMessage(null);

    const parsedExtratoVal = parseFloat(nfeExtratoValor.replace(/\./g, '').replace(',', '.'));
    const extratoPayload: ExtratoDebitoInput | null = nfeExtratoMode ? {
      descricao: nfeExtratoDescricao || 'DEB PIX FORNECEDOR',
      valor: isNaN(parsedExtratoVal) ? 0 : parsedExtratoVal,
      favorecido: nfeExtratoDescricao
    } : null;

    try {
      const response = await fetch('/api/validate-nfe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chaveAcesso: nfeChave,
          extratoDebito: extratoPayload
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.structuredValidation) {
          setNfeValidationResult({
            ...data.structuredValidation,
            markdown: data.markdown || data.structuredValidation.markdown
          });
        } else {
          const local = validateNFeChave(nfeChave, extratoPayload);
          setNfeValidationResult(local);
        }
      } else {
        const local = validateNFeChave(nfeChave, extratoPayload);
        setNfeValidationResult(local);
      }
    } catch (err) {
      console.warn('Erro na requisição /api/validate-nfe, aplicando validação local:', err);
      const local = validateNFeChave(nfeChave, extratoPayload);
      setNfeValidationResult(local);
    } finally {
      setIsValidatingNfe(false);
    }
  };

  // Load Preset NF-e
  const handleSelectNfePreset = (preset: typeof PRESET_NFES[0]) => {
    setNfeChave(preset.chave);
    if (preset.extratoSugerido) {
      setNfeExtratoMode(true);
      setNfeExtratoDescricao(preset.extratoSugerido.descricao);
      setNfeExtratoValor(String(preset.extratoSugerido.valor));
    } else {
      setNfeExtratoMode(false);
    }
    setNfeValidationResult(null);
    setPrefillSuccessMessage(null);
  };

  // Pre-fill form fields with validated SEFAZ data
  const handleApplyNfeToForm = () => {
    if (!nfeValidationResult) return;

    const toISODate = (brDate: string) => {
      const parts = brDate.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return new Date().toISOString().split('T')[0];
    };

    const isoDate = toISODate(nfeValidationResult.dataEmissao);

    setFormData(prev => ({
      ...prev,
      supplierName: nfeValidationResult.fornecedor,
      supplierCnpjCpf: nfeValidationResult.cnpj,
      invoiceNumber: nfeValidationResult.numeroNota,
      invoiceSeries: nfeValidationResult.serie,
      invoiceDate: isoDate,
      attestationDate: isoDate,
      grossValue: String(nfeValidationResult.valorTotal),
      category: nfeValidationResult.categoriaSugerida,
      expenseType: nfeValidationResult.categoriaSugerida === 'CAPITAL' ? 'equipamento_permanente' : 'material_consumo',
      description: nfeValidationResult.itensDetectados.join(', '),
      nfeAccessKey: nfeValidationResult.chaveOriginal,
      paymentDate: isoDate,
      paymentMethod: nfeValidationResult.extratoComparado?.descricao.toUpperCase().includes('TED') ? 'TRANSFERENCIA' : 'PIX',
      paymentDocNumber: prev.paymentDocNumber || `DOC-SEFAZ-${nfeValidationResult.numeroNota.slice(-4)}`
    }));

    setPrefillSuccessMessage('✨ Dados da NF-e aplicados com sucesso aos campos do formulário abaixo!');
    setTimeout(() => setPrefillSuccessMessage(null), 4000);
  };

  // Copy Markdown to Clipboard
  const handleCopyNfeMarkdown = () => {
    if (!nfeValidationResult) return;
    navigator.clipboard.writeText(nfeValidationResult.markdown);
    setCopiedNfeNotification(true);
    setTimeout(() => setCopiedNfeNotification(false), 2500);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const gross = parseFloat(formData.grossValue) || 0;
    const tax = parseFloat(formData.taxRetention) || 0;
    const net = gross - tax;

    if (!formData.supplierName || !formData.invoiceNumber || gross <= 0) {
      alert('Preencha os campos obrigatórios (Fornecedor, Nota Fiscal e Valor).');
      return;
    }

    const expensePayload: Omit<Expense, 'id'> = {
      schoolId: currentSchool.id,
      year: selectedYear,
      quotationId: formData.quotationId || undefined,
      program: formData.program,
      category: formData.category,
      expenseType: formData.expenseType,
      supplierName: formData.supplierName,
      supplierCnpjCpf: formData.supplierCnpjCpf,
      invoiceNumber: formData.invoiceNumber,
      invoiceSeries: formData.invoiceSeries,
      invoiceDate: formData.invoiceDate,
      attestationDate: formData.attestationDate,
      paymentDate: formData.paymentDate,
      paymentMethod: formData.paymentMethod,
      paymentDocNumber: formData.paymentDocNumber || `DOC-${Date.now().toString().slice(-4)}`,
      grossValue: gross,
      taxRetention: tax,
      netValue: net,
      description: formData.description,
      reconciled: true,
      nfeAccessKey: formData.nfeAccessKey || undefined,
      nfeValidated: Boolean(formData.nfeAccessKey),
    };

    addExpense(expensePayload);

    // If it is CAPITAL, automatically create the Asset for the Donation Term!
    if (formData.category === 'CAPITAL') {
      addAsset({
        schoolId: currentSchool.id,
        year: selectedYear,
        expenseId: `exp-${Date.now()}`,
        description: formData.description,
        brandModel: formData.assetBrandModel || 'Não especificado',
        quantity: 1,
        unitValue: net,
        totalValue: net,
        location: formData.assetLocation || 'Sede da Unidade Escolar',
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: formData.invoiceDate,
        donatedToMunicipality: true,
        tombamentoNumber: `PMSCS-PAT-${selectedYear}/${String(Math.floor(Math.random() * 8999 + 1000))}`,
      });
    }

    setIsAddModalOpen(false);
  };

  const digitsOnlyChave = nfeChave.replace(/\D/g, '');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Despesas, Notas Fiscais e Comprovantes de Pagamento
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Validação SEFAZ 44 Dígitos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de documentos fiscais liquidados com ateste de recebimento, débito em conta (PIX/TED) e conciliação
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              quotationId: '',
              program: 'PDDE_MUNICIPAL',
              category: 'CUSTEIO',
              expenseType: 'material_consumo',
              supplierName: '',
              supplierCnpjCpf: '',
              invoiceNumber: '',
              invoiceSeries: '1',
              invoiceDate: new Date().toISOString().split('T')[0],
              attestationDate: new Date().toISOString().split('T')[0],
              paymentDate: new Date().toISOString().split('T')[0],
              paymentMethod: 'PIX',
              paymentDocNumber: '',
              grossValue: '',
              taxRetention: '0',
              description: '',
              nfeAccessKey: '',
              assetBrandModel: '',
              assetLocation: 'Escola Municipal',
            });
            setNfeValidationResult(null);
            setPrefillSuccessMessage(null);
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 bg-emerald-800 text-white rounded-lg text-xs font-bold hover:bg-emerald-900 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Despesa / Nota Fiscal</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtros:</span>
        </div>

        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs text-slate-800 focus:outline-none"
          >
            <option value="all">Todas as Rubricas (Custeio & Capital)</option>
            <option value="CUSTEIO">Apenas Custeio</option>
            <option value="CAPITAL">Apenas Capital</option>
          </select>
        </div>

        <div>
          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs text-slate-800 focus:outline-none"
          >
            <option value="all">Todos os Programas</option>
            <option value="PDDE_MUNICIPAL">PDDE Municipal</option>
            <option value="PDDE_BASICO_FNDE">PDDE Básico FNDE</option>
            <option value="PDDE_EDUCACAO_CONECTADA">PDDE Educação Conectada</option>
          </select>
        </div>

        <div>
          <select
            value={filterReconciled}
            onChange={(e) => setFilterReconciled(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs text-slate-800 focus:outline-none"
          >
            <option value="all">Status da Conciliação</option>
            <option value="yes">Apenas Conciliadas no Extrato</option>
            <option value="no">Pendentes de Conciliação</option>
          </select>
        </div>

        <div className="ml-auto text-xs font-semibold text-slate-700">
          Total Filtrado: <span className="font-mono text-emerald-800">{formatBRL(totalFilteredValue)}</span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Nenhuma despesa localizada com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Data Pagto</th>
                  <th className="py-3 px-4">Nota Fiscal / Doc</th>
                  <th className="py-3 px-4">Favorecido (Fornecedor)</th>
                  <th className="py-3 px-4">Rubrica / Tipo</th>
                  <th className="py-3 px-4">Meio / Nº Comprovante</th>
                  <th className="py-3 px-4 text-center">Conciliado</th>
                  <th className="py-3 px-4 text-right">Valor Líquido</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {formatDateBR(exp.paymentDate)}
                      <span className="block text-[10px] text-slate-400">
                        Emissão: {formatDateBR(exp.invoiceDate)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">
                          NF-e {exp.invoiceNumber}
                        </span>
                        {exp.nfeValidated && (
                          <span 
                            className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-300 flex items-center gap-0.5" 
                            title="NF-e Autenticada e Válida na SEFAZ"
                          >
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" />
                            SEFAZ
                          </span>
                        )}
                      </div>
                      {exp.invoiceSeries && (
                        <span className="text-[10px] text-slate-500 block">
                          Série: {exp.invoiceSeries}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block line-clamp-1">
                        {exp.supplierName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatCNPJ(exp.supplierCnpjCpf)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          exp.category === 'CAPITAL' 
                            ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}>
                          {exp.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-1">
                        {EXPENSE_TYPE_LABELS[exp.expenseType] || exp.expenseType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-medium text-slate-800 block">
                        {exp.paymentMethod}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {exp.paymentDocNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleReconciled(exp.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors ${
                          exp.reconciled 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                            : 'bg-amber-50 text-amber-800 border border-amber-300'
                        }`}
                        title="Clique para alternar status da conciliação"
                      >
                        {exp.reconciled ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            Conciliado
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Pendente
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-red-700 text-right">
                      -{formatBRL(exp.netValue)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Deseja excluir o lançamento da NF-e ${exp.invoiceNumber}?`)) {
                            deleteExpense(exp.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Excluir lançamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                <tr>
                  <td colSpan={6} className="py-3 px-4 text-right">
                    Total das Despesas Listadas:
                  </td>
                  <td className="py-3 px-4 font-mono text-right text-emerald-900">
                    {formatBRL(totalFilteredValue)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CADASTRAR NOVA DESPESA / NOTA FISCAL COM VALIDADOR SEFAZ */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col my-6 border border-slate-200 animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Cadastrar Nova Despesa / Nota Fiscal
                  </h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    Validador NF-e 44 Dígitos
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preenchimento inteligente com consulta na SEFAZ e batimento de extrato bancário
                </p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* ================================================================= */}
              {/* 🧾 MÓDULO EXTRA: VALIDADOR INTELIGENTE DE NF-E (CHAVE DE ACESSO) */}
              {/* ================================================================= */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-slate-50 rounded-xl border border-indigo-200 p-4 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        Validador Inteligente de NF-e · Chave de Acesso (44 Dígitos)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Insira a chave para busca na SEFAZ (preenchimento prévio) e/ou realize o batimento com o débito do extrato
                      </p>
                    </div>
                  </div>

                  {/* Mode selector: Apenas Chave vs Com Extrato */}
                  <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 text-[11px] font-medium shadow-2xs">
                    <button
                      type="button"
                      onClick={() => { setNfeExtratoMode(false); setNfeValidationResult(null); }}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        !nfeExtratoMode 
                          ? 'bg-indigo-600 text-white font-bold' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Apenas Chave (SEFAZ)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNfeExtratoMode(true); setNfeValidationResult(null); }}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        nfeExtratoMode 
                          ? 'bg-indigo-600 text-white font-bold' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Conciliar com Extrato
                    </button>
                  </div>
                </div>

                {/* Preset Chips */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Exemplos Rápidos de Chaves de Acesso:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_NFES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectNfePreset(preset)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                          nfeChave === preset.chave 
                            ? 'bg-indigo-100 border-indigo-400 text-indigo-900 font-bold shadow-2xs' 
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Receipt className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Key Input Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold text-[11px] flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Chave de Acesso da NF-e (44 dígitos numéricos):</span>
                    </label>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      digitsOnlyChave.length === 44 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {digitsOnlyChave.length} / 44 dígitos
                    </span>
                  </div>

                  <input
                    type="text"
                    value={nfeChave}
                    onChange={(e) => {
                      setNfeChave(e.target.value);
                      setNfeValidationResult(null);
                    }}
                    placeholder="4324 0408 1234 5600 0189 5500 1000 0045 1218 9402 1350"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold tracking-wider text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner"
                  />
                </div>

                {/* Optional Bank Statement Debit Section (When conciliação mode is active) */}
                {nfeExtratoMode && (
                  <div className="p-3 bg-white rounded-lg border border-indigo-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Dados do Lançamento do Extrato Bancário para Batimento:</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Confronto direto com a saída PIX/TED
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 text-[10px] font-medium mb-0.5">
                          Favorecido / Histórico do Débito:
                        </label>
                        <input
                          type="text"
                          value={nfeExtratoDescricao}
                          onChange={(e) => {
                            setNfeExtratoDescricao(e.target.value);
                            setNfeValidationResult(null);
                          }}
                          placeholder="Ex: DEB PIX PAPELARIA E LIVRARIA CENTRAL LTDA"
                          className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 text-[10px] font-medium mb-0.5">
                          Valor da Saída no Extrato (R$):
                        </label>
                        <input
                          type="text"
                          value={nfeExtratoValor}
                          onChange={(e) => {
                            setNfeExtratoValor(e.target.value);
                            setNfeValidationResult(null);
                          }}
                          placeholder="1350,00"
                          className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Trigger Button */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Consulta os webservices da SEFAZ RS e Ambiente Nacional NF-e
                  </span>

                  <button
                    type="button"
                    onClick={handleValidateNfe}
                    disabled={isValidatingNfe || digitsOnlyChave.length < 10}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isValidatingNfe ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Consultando SEFAZ...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Validar Chave na SEFAZ</span>
                      </>
                    )}
                  </button>
                </div>

                {/* ============================================================= */}
                {/* 📥 FORMATO EXATO DE RESPOSTA REQUISITADO */}
                {/* ============================================================= */}
                {nfeValidationResult && (
                  <div className="mt-4 pt-4 border-t border-indigo-200/80 space-y-4 bg-white p-4 rounded-xl shadow-xs">
                    {/* View Switcher & Action buttons */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setNfeResultViewTab('structured')}
                          className={`text-xs px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                            nfeResultViewTab === 'structured' 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Visualização Estruturada
                        </button>
                        <button
                          type="button"
                          onClick={() => setNfeResultViewTab('markdown')}
                          className={`text-xs px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                            nfeResultViewTab === 'markdown' 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Markdown Oficial
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyNfeMarkdown}
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedNfeNotification ? 'Copiado!' : 'Copiar Parecer'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleApplyNfeToForm}
                          className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-lg shadow-xs transition-all cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Aplicar Preenchimento Prévio</span>
                        </button>
                      </div>
                    </div>

                    {/* Notification message */}
                    {prefillSuccessMessage && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{prefillSuccessMessage}</span>
                      </div>
                    )}

                    {nfeResultViewTab === 'structured' ? (
                      <div className="space-y-4">
                        {/* SEÇÃO 1: 🔍 Validação da Chave de Acesso (NF-e) */}
                        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                          <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-2">
                            <span>🔍</span>
                            <span>Validação da Chave de Acesso (NF-e)</span>
                          </h5>
                          <ul className="space-y-1.5 text-xs text-slate-700 font-sans">
                            <li className="flex items-center gap-1.5">
                              <strong className="text-slate-900">Status da Nota:</strong>
                              <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-200">
                                {nfeValidationResult.statusNota}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                (Protocolo: {nfeValidationResult.protocoloAutorizacao})
                              </span>
                            </li>
                            <li>
                              <strong className="text-slate-900">Chave Analisada:</strong>{' '}
                              <span className="font-mono text-indigo-700 font-bold">
                                {nfeValidationResult.chaveFormatada}
                              </span>
                            </li>
                            <li>
                              <strong className="text-slate-900">Fornecedor:</strong>{' '}
                              <span className="font-semibold text-slate-900">
                                {nfeValidationResult.fornecedor}
                              </span>{' '}
                              | <strong className="text-slate-900">CNPJ:</strong>{' '}
                              <span className="font-mono">{nfeValidationResult.cnpj}</span>
                            </li>
                            <li>
                              <strong className="text-slate-900">Data de Emissão:</strong>{' '}
                              <span>{nfeValidationResult.dataEmissao}</span> (NF-e nº {nfeValidationResult.numeroNota} / Série {nfeValidationResult.serie})
                            </li>
                          </ul>
                        </div>

                        {/* SEÇÃO 2: ✏️ Sugestão de Preenchimento Prévio dos Campos */}
                        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                          <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-2">
                            <span>✏️</span>
                            <span>Sugestão de Preenchimento Prévio dos Campos</span>
                          </h5>
                          <ul className="space-y-1.5 text-xs text-slate-700">
                            <li>
                              <strong className="text-slate-900">Valor Total do Documento:</strong>{' '}
                              <span className="font-mono font-bold text-indigo-900 text-sm">
                                {formatBRL(nfeValidationResult.valorTotal)}
                              </span>
                            </li>
                            <li className="flex items-baseline gap-1.5">
                              <strong className="text-slate-900">Categoria Sugerida:</strong>{' '}
                              <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                                nfeValidationResult.categoriaSugerida === 'CAPITAL'
                                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                  : 'bg-blue-100 text-blue-900 border border-blue-200'
                              }`}>
                                {nfeValidationResult.categoriaSugerida}
                              </span>{' '}
                              <span className="text-slate-600">
                                ({nfeValidationResult.justificativaCategoria})
                              </span>
                            </li>
                            <li>
                              <strong className="text-slate-900 block mb-1">Itens Detectados:</strong>
                              <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                                {nfeValidationResult.itensDetectados.map((it, idx) => (
                                  <div key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                                    <span className="text-indigo-600">•</span>
                                    <span>{it}</span>
                                  </div>
                                ))}
                              </div>
                            </li>
                          </ul>

                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={handleApplyNfeToForm}
                              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>Preencher Campos do Formulário Automaticamente</span>
                            </button>
                          </div>
                        </div>

                        {/* SEÇÃO 3: ⚖️ Resultado da Conciliação (Nota vs. Extrato) */}
                        <div className={`p-3.5 rounded-lg border text-xs ${
                          nfeValidationResult.isConvergente === true 
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' 
                            : nfeValidationResult.isConvergente === false
                            ? 'bg-red-50/70 border-red-300 text-red-950'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-2">
                            <span>⚖️</span>
                            <span>Resultado da Conciliação (Nota vs. Extrato)</span>
                          </h5>
                          
                          <div className="space-y-1.5 font-sans">
                            <div>
                              <strong className="text-slate-900">Status do Batimento:</strong>{' '}
                              <span className="font-bold">
                                {nfeValidationResult.statusBatimento}
                              </span>
                            </div>

                            {nfeValidationResult.divergenciaDetalhes && (
                              <div className="mt-2 p-2 bg-white/90 rounded border border-red-300 text-red-900 font-medium">
                                <span className="block font-bold">🚨 Inconsistência Detectada:</span>
                                <span>{nfeValidationResult.divergenciaDetalhes}</span>
                              </div>
                            )}

                            {nfeValidationResult.extratoComparado && nfeValidationResult.isConvergente && (
                              <div className="text-[11px] text-emerald-800 bg-emerald-100/60 p-2 rounded mt-1">
                                Débito no extrato: <strong>{nfeValidationResult.extratoComparado.descricao}</strong> no valor exato de <strong>{formatBRL(nfeValidationResult.extratoComparado.valor)}</strong> liquidado e conciliado.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Markdown Display */
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 selection:bg-indigo-700 selection:text-white">
                        {nfeValidationResult.markdown}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* ================================================================= */}
              {/* FORMULÁRIO DE CADASTRO TRADICIONAL */}
              {/* ================================================================= */}
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                  Dados do Lançamento Contábil
                </div>

                {/* Optional Link to Quotation */}
                {schoolQuotations.length > 0 && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                    <label className="block text-emerald-900 font-semibold mb-1">
                      Vincular à Tomada de Preços (3 Orçamentos)
                    </label>
                    <select
                      value={formData.quotationId}
                      onChange={(e) => handleQuotationSelect(e.target.value)}
                      className="w-full border border-emerald-300 rounded px-3 py-1.5 bg-white text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="">-- Seleção manual (Sem cotação vinculada) --</option>
                      {schoolQuotations.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.code} - {q.objectDescription.substring(0, 70)}...
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Programs and Category */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Programa / Fonte *</label>
                    <select
                      value={formData.program}
                      onChange={(e) => setFormData({ ...formData, program: e.target.value as ProgramType })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="PDDE_MUNICIPAL">PDDE Municipal (SEE Santa Cruz)</option>
                      <option value="PDDE_BASICO_FNDE">PDDE Básico (FNDE)</option>
                      <option value="PDDE_EDUCACAO_CONECTADA">PDDE Educação Conectada</option>
                      <option value="PDDE_ESTRUTURA">PDDE Estrutura</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Rubrica Orçamentária *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="CUSTEIO">Custeio (Consumo / Reparos / Serviços)</option>
                      <option value="CAPITAL">Capital (Equipamentos / Móveis)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Tipo de Despesa</label>
                    <select
                      value={formData.expenseType}
                      onChange={(e) => setFormData({ ...formData, expenseType: e.target.value as ExpenseType })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="material_consumo">Material de Consumo / Pedagógico</option>
                      <option value="servico_pj">Serviço de Terceiros - PJ</option>
                      <option value="servico_pf">Serviço de Terceiros - PF</option>
                      <option value="equipamento_permanente">Equipamento Permanente</option>
                      <option value="mobiliario">Mobiliário Escolar</option>
                    </select>
                  </div>
                </div>

                {/* Supplier Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Razão Social do Fornecedor *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Livraria e Papelaria Central Ltda"
                      value={formData.supplierName}
                      onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">CNPJ / CPF do Fornecedor *</label>
                    <input
                      type="text"
                      required
                      placeholder="00.000.000/0001-00"
                      value={formData.supplierCnpjCpf}
                      onChange={(e) => setFormData({ ...formData, supplierCnpjCpf: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Invoice and Dates */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Nº Nota / Cupom Fiscal *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 004812"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Série</label>
                    <input
                      type="text"
                      placeholder="1"
                      value={formData.invoiceSeries}
                      onChange={(e) => setFormData({ ...formData, invoiceSeries: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Data Emissão NF *</label>
                    <input
                      type="date"
                      required
                      value={formData.invoiceDate}
                      onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Data do Ateste Escolar *</label>
                    <input
                      type="date"
                      required
                      value={formData.attestationDate}
                      onChange={(e) => setFormData({ ...formData, attestationDate: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Payment and Bank Movement */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Forma de Pagamento *</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="PIX">PIX (Transferência Instantânea)</option>
                      <option value="TRANSFERENCIA">TED / Transferência Bancária</option>
                      <option value="CHEQUE">Cheque Nominativo Cruzado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Data do Pagamento *</label>
                    <input
                      type="date"
                      required
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Nº Comprovante / Autenticação *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 984021 ou PIX-ID"
                      value={formData.paymentDocNumber}
                      onChange={(e) => setFormData({ ...formData, paymentDocNumber: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Valor Bruto da NF (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formData.grossValue}
                      onChange={(e) => setFormData({ ...formData, grossValue: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono font-bold text-slate-900 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Descrição Detalhada do Objeto / Produtos Adquiridos *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Discrimine os itens da nota fiscal (ex: 15 resmas papel sulfite A4, 10 caixas giz escolar...)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                {/* Capital Specific Fields */}
                {formData.category === 'CAPITAL' && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
                    <span className="text-[11px] font-bold text-purple-900 block">
                      ⚠️ Identificação Obrigatória para Termo de Doação (Patrimônio Municipal):
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-purple-900 text-[10px] font-medium mb-0.5">Marca / Modelo do Equipamento</label>
                        <input
                          type="text"
                          placeholder="Ex: Dell Inspiron 15 / Split Consul 12k"
                          value={formData.assetBrandModel}
                          onChange={(e) => setFormData({ ...formData, assetBrandModel: e.target.value })}
                          className="w-full border border-purple-300 rounded px-2.5 py-1 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-purple-900 text-[10px] font-medium mb-0.5">Local de Instalação na Escola</label>
                        <input
                          type="text"
                          placeholder="Ex: Sala de Informática / Sala dos Professores"
                          value={formData.assetLocation}
                          onChange={(e) => setFormData({ ...formData, assetLocation: e.target.value })}
                          className="w-full border border-purple-300 rounded px-2.5 py-1 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    O lançamento será inserido com o status "Conciliado" no extrato da escola.
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer text-xs"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-800 text-white rounded-lg font-bold hover:bg-emerald-900 transition-all shadow-xs cursor-pointer text-xs"
                    >
                      Salvar Despesa & Liquidar
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
