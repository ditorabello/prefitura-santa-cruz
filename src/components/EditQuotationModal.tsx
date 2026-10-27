import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  FileText, 
  AlertCircle, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { Quotation, DemandItem, Category, ProgramType, PROGRAM_LABELS } from '../types/pdde';
import { usePDDE } from '../context/PDDEContext';

const DEFAULT_SINGLE_QUOTE_JUSTIFICATION =
  'Certifico para os devidos fins de prestação de contas que foram consultadas empresas do segmento em Santa Cruz do Sul, tendo apenas a presente empresa capacidade técnica imediata ou estoque para fornecimento do item nas especificações exigidas pela escola, justificando-se a contratação excepcional com respaldo no Art. 14, § 2º da Resolução CD/FNDE nº 15/2021.';

interface EditQuotationModalProps {
  quotation: Quotation;
  onClose: () => void;
  onSaved?: () => void;
}

export const EditQuotationModal: React.FC<EditQuotationModalProps> = ({
  quotation,
  onClose,
  onSaved,
}) => {
  const { updateQuotation } = usePDDE();

  const [code, setCode] = useState(quotation.code);
  const [date, setDate] = useState(quotation.date);
  const [deadline, setDeadline] = useState(quotation.deadline || '');
  const [description, setDescription] = useState(quotation.description || quotation.objectDescription || '');
  const [category, setCategory] = useState<Category>(quotation.category);
  const [program, setProgram] = useState<ProgramType>(quotation.program);
  const [justification, setJustification] = useState(quotation.justification || '');

  // Single quote exception settings
  const [allowSingleQuote, setAllowSingleQuote] = useState(Boolean(quotation.allowSingleQuote));
  const [singleQuoteReason, setSingleQuoteReason] = useState(
    quotation.singleQuoteReason || 'Inviabilidade de competição na praça local de Santa Cruz do Sul (Art. 14, § 2º Resolução FNDE 15/2021)'
  );
  const [singleQuoteJustification, setSingleQuoteJustification] = useState(
    quotation.singleQuoteJustification || DEFAULT_SINGLE_QUOTE_JUSTIFICATION
  );

  // Demanded items list
  const [itemsDemanded, setItemsDemanded] = useState<DemandItem[]>(() => {
    if (quotation.itemsDemanded && quotation.itemsDemanded.length > 0) {
      return quotation.itemsDemanded.map(it => ({ ...it }));
    }
    return [
      { id: '1', description: 'Item 1 da cotação', quantity: 1, unit: 'un' }
    ];
  });

  const handleAddItem = () => {
    const nextId = String(Date.now());
    setItemsDemanded(prev => [
      ...prev,
      { id: nextId, description: '', quantity: 1, unit: 'un' }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (itemsDemanded.length <= 1) {
      alert('O pedido de orçamento deve conter pelo menos 1 item solicitado.');
      return;
    }
    setItemsDemanded(prev => prev.filter(it => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof DemandItem, value: any) => {
    setItemsDemanded(prev => prev.map(it => {
      if (it.id === id) {
        return { ...it, [field]: value };
      }
      return it;
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      alert('Informe o objeto/descrição da necessidade do orçamento.');
      return;
    }

    const invalidItem = itemsDemanded.find(it => !it.description.trim() || it.quantity <= 0);
    if (invalidItem) {
      alert('Preencha a descrição e quantidade de todos os itens demandados.');
      return;
    }

    if (allowSingleQuote && (!singleQuoteJustification || singleQuoteJustification.trim().length < 15)) {
      alert('Para permitir envio com menos de 3 orçamentos, é obrigatório preencher a justificativa circunstanciada fundamentada.');
      return;
    }

    updateQuotation(quotation.id, {
      code,
      date,
      deadline,
      description,
      objectDescription: description,
      category,
      program,
      justification,
      allowSingleQuote,
      singleQuoteReason: allowSingleQuote ? singleQuoteReason : undefined,
      singleQuoteJustification: allowSingleQuote ? singleQuoteJustification : undefined,
      itemsDemanded,
    });

    if (onSaved) {
      onSaved();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded uppercase tracking-wider border border-emerald-400/30">
                Edição Prévia
              </span>
              <span className="text-xs text-emerald-200 font-mono">
                {quotation.code}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Editar Pedido de Orçamento
            </h3>
            <p className="text-xs text-emerald-100/80">
              Altere itens, prazos ou regras antes de despachar a solicitação aos fornecedores
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="bg-blue-50 border-b border-blue-200 px-5 py-2.5 flex items-center gap-2 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-700 shrink-0" />
          <span>
            As alterações realizadas aqui atualizarão instantaneamente o Link Público e a Planilha de Cotação enviada aos fornecedores.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Row 1: Code, Date, Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Código do Processo *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Data da Solicitação *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Prazo Limite para Propostas *</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Program and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Programa / Rubrica *</label>
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value as ProgramType)}
                className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none bg-white"
              >
                {Object.entries(PROGRAM_LABELS).map(([key, item]) => (
                  <option key={key} value={key}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Categoria de Aplicação *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none bg-white"
              >
                <option value="CUSTEIO">CUSTEIO (Material de consumo, papelaria, limpeza, serviços)</option>
                <option value="CAPITAL">CAPITAL (Bens permanentes, equipamentos, móveis)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Description */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Objeto / Descrição da Necessidade *</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
              placeholder="Descreva resumidamente os itens ou serviços que a escola precisa cotar..."
            />
          </div>

          {/* Row 4: Demanded items list */}
          <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-xs">Lista de Itens Solicitados na Cotação</span>
                <span className="text-[11px] text-slate-500">
                  Estes itens serão preenchidos pelos fornecedores no formulário digital ou planilha
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-800 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-700" />
                <span>Adicionar Item</span>
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {itemsDemanded.map((it, idx) => (
                <div key={it.id || idx} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-xs font-bold text-slate-400 w-6 text-center">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Descrição do item ou serviço..."
                    value={it.description}
                    onChange={(e) => handleUpdateItem(it.id, 'description', e.target.value)}
                    className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Qtd"
                    value={it.quantity}
                    onChange={(e) => handleUpdateItem(it.id, 'quantity', parseInt(e.target.value, 10) || 1)}
                    className="w-16 border border-slate-300 rounded px-2 py-1.5 text-xs text-center font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                  <select
                    value={it.unit}
                    onChange={(e) => handleUpdateItem(it.id, 'unit', e.target.value)}
                    className="w-20 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  >
                    <option value="un">un</option>
                    <option value="cx">cx</option>
                    <option value="pacote">pct</option>
                    <option value="resma">resma</option>
                    <option value="kit">kit</option>
                    <option value="frasco">frasco</option>
                    <option value="metro">metro</option>
                    <option value="servico">serviço</option>
                    <option value="kg">kg</option>
                    <option value="litro">litro</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(it.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                    title="Remover item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Row 5: Single Quote Justification Settings */}
          <div className="bg-purple-50/80 border border-purple-300 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="editAllowSingleQuote"
                checked={allowSingleQuote}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAllowSingleQuote(checked);
                  if (checked && !singleQuoteJustification.trim()) {
                    setSingleQuoteJustification(DEFAULT_SINGLE_QUOTE_JUSTIFICATION);
                  }
                }}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-purple-700 focus:ring-purple-600 cursor-pointer"
              />
              <label htmlFor="editAllowSingleQuote" className="text-xs text-purple-950 font-semibold cursor-pointer select-none">
                Possibilidade de envio com menos de 3 orçamentos (Inviabilidade de competição na praça local / Fornecedor exclusivo)
              </label>
            </div>

            {allowSingleQuote && (
              <div className="space-y-3 pl-6 pt-1 border-t border-purple-200">
                <div>
                  <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                    Motivo Legal da Apresentação de Menos de 3 Orçamentos:
                  </label>
                  <select
                    value={singleQuoteReason}
                    onChange={(e) => setSingleQuoteReason(e.target.value)}
                    className="w-full bg-white border border-purple-300 rounded px-2.5 py-1.5 text-xs text-purple-950 focus:outline-none"
                  >
                    <option value="Inviabilidade de competição na praça local de Santa Cruz do Sul (Art. 14, § 2º Resolução FNDE 15/2021)">
                      Inviabilidade de competição / Praça local restrita em Santa Cruz do Sul (Art. 14 § 2º Resolução FNDE 15/2021)
                    </option>
                    <option value="Fornecedor ou representante exclusivo no município de Santa Cruz do Sul">
                      Fornecedor ou representante exclusivo no município de Santa Cruz do Sul
                    </option>
                    <option value="Desinteresse comprovado de outras empresas após convocação formal via e-mail/WhatsApp">
                      Desinteresse formal de outras empresas consultadas na praça comercial
                    </option>
                    <option value="Serviço emergencial de reparo físico com risco à segurança dos estudantes">
                      Serviço emergencial de reparo estrutural urgente
                    </option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-purple-900">
                      Justificativa Circunstanciada (Obrigatória para o FNDE e TCE-RS) *:
                    </label>
                    <button
                      type="button"
                      onClick={() => setSingleQuoteJustification(DEFAULT_SINGLE_QUOTE_JUSTIFICATION)}
                      className="text-[10px] text-purple-700 hover:text-purple-900 hover:underline cursor-pointer font-medium"
                      title="Restaurar o modelo padrão"
                    >
                      Restaurar texto padrão
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={singleQuoteJustification}
                    onChange={(e) => setSingleQuoteJustification(e.target.value)}
                    className="w-full bg-white border border-purple-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-700 leading-relaxed shadow-2xs"
                  />
                  <div className="flex items-center justify-between text-[10px] text-purple-800 mt-1">
                    <span>
                      Texto pré-preenchido com fundamentação padrão. Edite conforme a necessidade da escola.
                    </span>
                    <span className="font-medium text-purple-900">
                      Art. 14, § 2º Res. FNDE 15/2021
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Row 6: Homologation justification */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Justificativa Padrão de Homologação</label>
            <input
              type="text"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
            />
          </div>

          {/* Form buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações do Orçamento</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
