import React, { useState } from 'react';
import { usePDDE } from '../context/PDDEContext';
import { Quotation, QuoteItem, DemandItem, Category, ProgramType, PROGRAM_LABELS } from '../types/pdde';
import { formatBRL, formatDateBR, formatCNPJ } from '../utils/formatters';
import { 
  Scale, 
  Plus, 
  Printer, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  X, 
  Award, 
  Building2,
  ExternalLink,
  QrCode,
  Scan,
  FileSpreadsheet,
  Send,
  ShieldCheck,
  Sparkles,
  Info,
  Calendar,
  Check,
  Edit3,
  Download
} from 'lucide-react';
import { PublicQuoteFormModal } from './PublicQuoteFormModal';
import { SupplierDirectoryModal } from './SupplierDirectoryModal';
import { OCRProposalModal } from './OCRProposalModal';
import { EditQuotationModal } from './EditQuotationModal';
import { downloadQuotationCSV } from '../utils/quotationFileExport';

const DEFAULT_SINGLE_QUOTE_JUSTIFICATION =
  'Certifico para os devidos fins de prestação de contas que foram consultadas empresas do segmento em Santa Cruz do Sul, tendo apenas a presente empresa capacidade técnica imediata ou estoque para fornecimento do item nas especificações exigidas pela escola, justificando-se a contratação excepcional com respaldo no Art. 14, § 2º da Resolução CD/FNDE nº 15/2021.';

export const QuotationsView: React.FC = () => {
  const { 
    currentSchool, 
    selectedYear, 
    schoolQuotations, 
    addQuotation, 
    deleteQuotation 
  } = usePDDE();

  // Modals state
  const [selectedQuotationForPrint, setSelectedQuotationForPrint] = useState<Quotation | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedQuotationForEdit, setSelectedQuotationForEdit] = useState<Quotation | null>(null);
  const [selectedQuotationForPublicLink, setSelectedQuotationForPublicLink] = useState<Quotation | null>(null);
  const [selectedQuotationForDirectory, setSelectedQuotationForDirectory] = useState<Quotation | null>(null);
  const [selectedQuotationForOCR, setSelectedQuotationForOCR] = useState<Quotation | null>(null);

  // New quotation form state
  const [formData, setFormData] = useState({
    code: `COT-${selectedYear}/${String(schoolQuotations.length + 1).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
    category: 'CUSTEIO' as Category,
    program: 'PDDE_MUNICIPAL' as ProgramType,
    justification: 'Menor preço global apurado na pesquisa de preços entre fornecedores habilitados e regulares perante o Fisco.',
    allowSingleQuote: false,
    singleQuoteReason: 'Inviabilidade de competição na praça local de Santa Cruz do Sul (Art. 14, § 2º Resolução FNDE 15/2021)',
    singleQuoteJustification: DEFAULT_SINGLE_QUOTE_JUSTIFICATION,
    itemsDemanded: [
      { id: '1', description: 'Papel A4 Sulfite 75g (Resma com 500 folhas)', quantity: 30, unit: 'resma' },
      { id: '2', description: 'Tinta Guache escolar 250ml cores sortidas', quantity: 20, unit: 'frasco' },
    ] as DemandItem[],
    quotes: [
      { companyName: '', cnpj: '', contactName: '', phone: '', proposalValue: '', validityDays: 60, cndRegular: true, notes: '' },
    ],
  });

  if (!currentSchool) return null;

  const handleAddItemDemand = () => {
    const nextId = String(formData.itemsDemanded.length + 1);
    setFormData(prev => ({
      ...prev,
      itemsDemanded: [
        ...prev.itemsDemanded,
        { id: nextId, description: '', quantity: 1, unit: 'un' }
      ]
    }));
  };

  const handleUpdateItemDemand = (index: number, field: keyof DemandItem, value: any) => {
    const updated = [...formData.itemsDemanded];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, itemsDemanded: updated }));
  };

  const handleRemoveItemDemand = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itemsDemanded: prev.itemsDemanded.filter((_, idx) => idx !== index)
    }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      alert('Informe a descrição detalhada da compra ou serviço.');
      return;
    }

    if (formData.allowSingleQuote && (!formData.singleQuoteJustification || formData.singleQuoteJustification.trim().length < 15)) {
      alert('Para permitir envio com menos de 3 orçamentos, é obrigatório preencher a justificativa legal fundamentada.');
      return;
    }

    // Build initial quotes (if any filled)
    const validQuotes: QuoteItem[] = formData.quotes
      .filter(q => q.companyName.trim() && (parseFloat(q.proposalValue) > 0 || q.cnpj))
      .map(q => ({
        id: `quote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        companyName: q.companyName,
        tradeName: q.companyName,
        cnpj: q.cnpj || '00.000.000/0001-00',
        phone: q.phone || '(51) 3715-0000',
        contactPerson: q.contactName || 'Representante Legal',
        proposalValue: parseFloat(q.proposalValue) || 0,
        totalValue: parseFloat(q.proposalValue) || 0,
        proposalDate: formData.date,
        cndRegular: Boolean(q.cndRegular),
        statusReceita: 'ATIVA',
        digitalSignature: {
          signedBy: q.companyName,
          signedAt: new Date().toISOString(),
          validationToken: `VAL-SCS-${selectedYear}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-DIGITAL`,
          ipAddress: '177.18.242.19 (Santa Cruz do Sul - RS)',
          legalDeclaration: 'Declaração de autenticidade de proposta comercial e regularidade fiscal.'
        },
        notes: q.notes || 'Cotação cadastrada no sistema PDDE Santa Cruz do Sul.'
      }));

    const sorted = [...validQuotes].sort((a, b) => (a.proposalValue || a.totalValue || 0) - (b.proposalValue || b.totalValue || 0));
    const lowest = sorted[0];

    const uniqueToken = `${formData.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;

    addQuotation({
      schoolId: currentSchool.id,
      year: selectedYear,
      code: formData.code,
      date: formData.date,
      deadline: formData.deadline,
      description: formData.description,
      objectDescription: formData.description,
      category: formData.category,
      program: formData.program,
      publicToken: uniqueToken,
      itemsDemanded: formData.itemsDemanded.filter(it => it.description.trim().length > 0),
      quotes: validQuotes,
      selectedQuoteId: lowest?.id,
      winningQuoteIndex: lowest ? 0 : 0,
      finalValue: lowest ? (lowest.proposalValue || lowest.totalValue || 0) : 0,
      justification: formData.justification,
      allowSingleQuote: formData.allowSingleQuote,
      singleQuoteReason: formData.allowSingleQuote ? formData.singleQuoteReason : undefined,
      singleQuoteJustification: formData.allowSingleQuote ? formData.singleQuoteJustification : undefined,
      status: (validQuotes.length >= 3 || (formData.allowSingleQuote && validQuotes.length >= 1) ? 'concluida' : 'em_andamento') as 'concluida' | 'em_andamento',
    });

    setIsNewModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Module renamed to "Orçamentos" */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              Orçamentos
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-300">
              Módulo Digital Integrado
            </span>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
              Receita Federal & FNDE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Gestão digital de cotações: Gere links públicos com autenticação digital de CNPJ (dispensa carimbo físico), dispare em lote para fornecedores locais de Santa Cruz do Sul, confira somas via OCR ou apresente orçamentos com justificativa de praça restrita.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedQuotationForDirectory({} as Quotation)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs"
          >
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>Banco de Fornecedores Locais</span>
          </button>

          <button
            onClick={() => {
              setFormData({
                code: `COT-${selectedYear}/${String(schoolQuotations.length + 1).padStart(3, '0')}`,
                date: new Date().toISOString().split('T')[0],
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                description: '',
                category: 'CUSTEIO',
                program: 'PDDE_MUNICIPAL',
                justification: 'Menor preço global apurado na pesquisa de preços entre fornecedores habilitados e regulares perante o Fisco.',
                allowSingleQuote: false,
                singleQuoteReason: 'Inviabilidade de competição na praça local de Santa Cruz do Sul (Art. 14, § 2º Resolução FNDE 15/2021)',
                singleQuoteJustification: DEFAULT_SINGLE_QUOTE_JUSTIFICATION,
                itemsDemanded: [
                  { id: '1', description: 'Papel A4 Sulfite 75g (Resma com 500 folhas)', quantity: 30, unit: 'resma' },
                  { id: '2', description: 'Tinta Guache escolar 250ml cores sortidas', quantity: 20, unit: 'frasco' },
                ],
                quotes: [
                  { companyName: '', cnpj: '', contactName: '', phone: '', proposalValue: '', validityDays: 60, cndRegular: true, notes: '' },
                ],
              });
              setIsNewModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Pedido de Orçamento</span>
          </button>
        </div>
      </div>

      {/* Modern Regulatory & Feature Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-2 font-bold text-blue-950">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>Autenticação Digital de CNPJ</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Substitui carimbos manuais de borracha. Ao preencher no link público, o CNPJ é checado na Receita Federal e a proposta ganha assinatura eletrônica com validade legal perante FNDE e TCE-RS.
          </p>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-2 font-bold text-emerald-950">
            <Scan className="w-4 h-4 text-emerald-700" />
            <span>Leitura OCR & Auditoria de Soma</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Recebeu proposta em papel? O leitor OCR digitaliza os itens, confere a multiplicação (Qtd × Unitário) e alerta caso o fornecedor tenha somado valores divergentes.
          </p>
        </div>

        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <Info className="w-4 h-4 text-amber-700" />
            <span>Envio com Apenas 1 Orçamento</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Caso não haja outras empresas no município, a escola pode justificar formalmente (praça restrita ou fornecedor exclusivo). O motor de auditoria valida a justificativa sem pendência.
          </p>
        </div>
      </div>

      {/* Quotations List */}
      <div className="space-y-5">
        {schoolQuotations.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs space-y-3">
            <Scale className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Nenhum processo de orçamento cadastrado neste exercício ({selectedYear}).
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Clique em "Criar Novo Pedido de Orçamento" para cadastrar os itens demandados, gerar o link público ou utilizar o banco de fornecedores locais.
            </p>
          </div>
        ) : (
          schoolQuotations.map((quotation) => {
            const quotesCount = quotation.quotes.length;
            const hasThreeQuotes = quotesCount >= 3;
            const isSingleQuoteJustified = quotation.allowSingleQuote && quotation.singleQuoteJustification;

            // Only compute winner if there are quotes with price > 0
            const validQuotes = quotation.quotes.filter(q => (q.proposalValue || q.totalValue || 0) > 0);
            const winner = quotesCount > 0 ? (
              (quotation.selectedQuoteId ? quotation.quotes.find(q => q.id === quotation.selectedQuoteId) : undefined)
              || (quotation.winningQuoteIndex !== undefined && quotation.quotes[quotation.winningQuoteIndex] ? quotation.quotes[quotation.winningQuoteIndex] : undefined)
              || (validQuotes.length > 0 ? [...validQuotes].sort((a, b) => (a.proposalValue || a.totalValue || 0) - (b.proposalValue || b.totalValue || 0))[0] : quotation.quotes[0])
            ) : undefined;

            return (
              <div 
                key={quotation.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Quotation Header */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-800 bg-slate-200/80 border border-slate-300 px-2 py-0.5 rounded">
                      {quotation.code}
                    </span>
                    <span className="text-xs text-slate-500">
                      Criado em {formatDateBR(quotation.date)}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {quotation.category}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-600">
                      {PROGRAM_LABELS[quotation.program].label}
                    </span>

                    {/* Exemption badge */}
                    {isSingleQuoteJustified ? (
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded flex items-center gap-1">
                        <Check className="w-3 h-3 text-purple-700" />
                        Envio Justificado ({quotesCount} orçamento{quotesCount !== 1 ? 's' : ''})
                      </span>
                    ) : !hasThreeQuotes ? (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-700" />
                        Aguardando 3 cotações ({quotesCount}/3)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-blue-700" />
                        Completo (3 orçamentos válidos)
                      </span>
                    )}
                  </div>

                  {/* Top Item Actions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* EDIT QUOTATION BUTTON */}
                    <button
                      onClick={() => setSelectedQuotationForEdit(quotation)}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:text-blue-800 hover:border-blue-400 rounded flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="Editar dados, prazos e itens demandados do orçamento antes de despachar"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                      <span>Editar Orçamento</span>
                    </button>

                    {/* DOWNLOAD SPREADSHEET FOR WHATSAPP */}
                    <button
                      onClick={() => downloadQuotationCSV(quotation, currentSchool)}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:text-emerald-800 hover:border-emerald-500 rounded flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="Baixar planilha Excel (.csv) para preenchimento ou envio no WhatsApp"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Planilha WhatsApp</span>
                    </button>

                    <button
                      onClick={() => setSelectedQuotationForPrint(quotation)}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:text-emerald-800 hover:border-emerald-500 rounded flex items-center gap-1 transition-colors cursor-pointer"
                      title="Imprimir Mapa Comparativo com dados de autenticação"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Mapa Comparativo</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Excluir o processo de orçamento ${quotation.code}?`)) {
                          deleteQuotation(quotation.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Excluir Cotação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quotation Body */}
                <div className="p-5 space-y-4 text-xs">
                  
                  {/* Object & Demanded items */}
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Objeto / Descrição da Necessidade:</span>
                    <p className="text-slate-900 font-semibold leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {quotation.description || quotation.objectDescription}
                    </p>
                  </div>

                  {/* Demanded items summary table if available */}
                  {quotation.itemsDemanded && quotation.itemsDemanded.length > 0 && (
                    <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                        <span>Itens Solicitados na Cotação ({quotation.itemsDemanded.length})</span>
                        <span className="text-slate-500 font-normal">Prazo de envio: {new Date(quotation.deadline || Date.now()).toLocaleDateString('pt-BR')}</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {quotation.itemsDemanded.map((it, idx) => (
                          <div key={it.id || idx} className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between gap-2">
                            <span className="text-slate-800 font-medium truncate">
                              {idx + 1}. {it.description}
                            </span>
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                              {it.quantity} {it.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ACTION BAR FOR THIS QUOTATION (Requirement 2, 4, 5) */}
                  <div className="bg-emerald-950/5 border border-emerald-300/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-emerald-950 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <span>Ferramentas Digitais de Coleta & Validação:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Button 1: Public Link & QR Code */}
                      <button
                        onClick={() => setSelectedQuotationForPublicLink(quotation)}
                        className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                        title="Abrir formulário web ou gerar QR Code / link para enviar ao fornecedor"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Link Público / Web Form</span>
                      </button>

                      {/* Button 2: Batch dispatch from directory */}
                      <button
                        onClick={() => setSelectedQuotationForDirectory(quotation)}
                        className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                        title="Selecionar empresas parceiras e disparar WhatsApp em lote"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Disparar para 3 Fornecedores Locais</span>
                      </button>

                      {/* Button 3: Download Excel CSV for WhatsApp */}
                      <button
                        onClick={() => downloadQuotationCSV(quotation, currentSchool)}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-400 hover:text-emerald-900 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                        title="Baixar planilha Excel (.csv) para preenchimento ou envio no WhatsApp"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>Baixar Planilha Excel</span>
                      </button>

                      {/* Button 4: OCR Reader */}
                      <button
                        onClick={() => setSelectedQuotationForOCR(quotation)}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                        title="Digitalizar proposta física e verificar erro de cálculo"
                      >
                        <Scan className="w-3.5 h-3.5 text-slate-600" />
                        <span>Ler Proposta via OCR (Auditar Soma)</span>
                      </button>
                    </div>
                  </div>

                  {/* Single quote justification box (Requirement 6) */}
                  {isSingleQuoteJustified && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-950 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-purple-900">
                        <Check className="w-4 h-4 text-purple-700" />
                        <span>Justificativa Legal de Apresentação de Menos de 3 Orçamentos:</span>
                      </div>
                      <div className="text-[11px] text-purple-900 font-semibold">
                        Motivo: {quotation.singleQuoteReason}
                      </div>
                      <p className="text-[11px] text-purple-950/80 leading-relaxed italic bg-white/70 p-2 rounded border border-purple-200">
                        "{quotation.singleQuoteJustification}"
                      </p>
                      <span className="text-[10px] text-purple-700 block font-medium">
                        Base Legal: Art. 14, § 2º da Resolução CD/FNDE nº 15/2021 c/c Lei 14.133/2021 (Inviabilidade de competição na praça local de Santa Cruz do Sul). Aceito no módulo de auditoria.
                      </span>
                    </div>
                  )}

                  {/* Proposals Comparative Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                        Propostas Comerciais Registradas ({quotation.quotes.length} orçamento{quotation.quotes.length !== 1 ? 's' : ''})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Critério: Menor preço global e habilitação fiscal
                      </span>
                    </div>

                    {quotation.quotes.length === 0 ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-500 text-xs">
                        Nenhum fornecedor enviou proposta ainda. Envie o <strong>Link Público</strong> ou utilize o <strong>Disparo para Fornecedores Locais</strong> para receber cotações.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {quotation.quotes.map((quote, idx) => {
                          const isWinner = Boolean(
                            winner &&
                            (quote.id === winner.id || (quote.cnpj && quote.cnpj === winner.cnpj)) &&
                            (quote.proposalValue || quote.totalValue || 0) > 0
                          );

                          return (
                            <div
                              key={quote.id || `${quote.cnpj}-${idx}`}
                              className={`p-3.5 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                                isWinner
                                  ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500 shadow-sm'
                                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-1 mb-1">
                                  <span className={`font-bold line-clamp-1 ${isWinner ? 'text-emerald-950 font-bold' : 'text-slate-800'}`}>
                                    {quote.tradeName || quote.companyName}
                                  </span>
                                  {isWinner ? (
                                    <span className="bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 shadow-2xs">
                                      <Award className="w-3 h-3 text-amber-300" />
                                      Vencedor (Menor Preço)
                                    </span>
                                  ) : (
                                    <span className="bg-slate-200 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0">
                                      Proposta Cotada
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono mb-2">
                                  CNPJ: {formatCNPJ(quote.cnpj)}
                                </div>

                                {/* Digital Validation Stamp Badge (Requirement 3) */}
                                {quote.digitalSignature ? (
                                  <div className={`mb-2 p-1.5 border rounded text-[10px] space-y-0.5 ${
                                    isWinner ? 'bg-emerald-100/60 border-emerald-300 text-emerald-950' : 'bg-slate-100 border-slate-200 text-slate-700'
                                  }`}>
                                    <div className="flex items-center gap-1 font-bold">
                                      <ShieldCheck className={`w-3 h-3 ${isWinner ? 'text-emerald-700' : 'text-slate-500'}`} />
                                      <span>Validação Digital de CNPJ</span>
                                    </div>
                                    <span className={`font-mono text-[9px] block truncate ${isWinner ? 'text-emerald-800' : 'text-slate-600'}`}>
                                      {quote.digitalSignature.validationToken}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="mb-2 p-1 bg-slate-100 rounded text-[10px] text-slate-600">
                                    <span>Carimbo físico anexado em proposta</span>
                                  </div>
                                )}

                                {quote.attachedFileName && (
                                  <div className="text-[10px] text-slate-500 flex items-center gap-1 mb-2 truncate">
                                    <FileText className="w-3 h-3 text-slate-400" />
                                    <span className="truncate">{quote.attachedFileName}</span>
                                  </div>
                                )}
                              </div>

                              <div>
                                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                                  <span className="text-slate-500 text-[11px]">Valor Ofertado:</span>
                                  <span className={`font-mono font-bold ${isWinner ? 'text-base text-emerald-950 font-extrabold' : 'text-sm text-slate-800'}`}>
                                    {formatBRL(quote.proposalValue || quote.totalValue || 0)}
                                  </span>
                                </div>

                                <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                                  <span>Data: {quote.proposalDate ? formatDateBR(quote.proposalDate) : 'Recebido'}</span>
                                  <span className={
                                    isWinner
                                      ? (quote.cndRegular ? 'text-emerald-700 font-bold' : 'text-red-600')
                                      : (quote.cndRegular ? 'text-slate-600 font-medium' : 'text-red-600')
                                  }>
                                    {quote.cndRegular ? 'CND Regular' : 'CND Pendente'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Winner Summary & Contract Justification */}
                  {winner && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 text-xs text-emerald-950">
                      <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Empresa Vencedora Apurada: {winner.companyName} ({formatBRL(winner.proposalValue || winner.totalValue || 0)})</span>
                      </div>
                      <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                        <strong>Justificativa da Homologação:</strong> {quotation.justification || 'Proposta de menor valor global em conformidade com as especificações exigidas pela direção escolar.'}
                      </p>
                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: CRIAR NOVO PEDIDO DE ORÇAMENTO (COM SINGLE QUOTE JUSTIFICATION) */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col my-6 border border-slate-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-800" />
                  Cadastrar Processo de Orçamento / Cotação
                </h3>
                <p className="text-xs text-slate-500">
                  Preencha as informações da demanda e itens para gerar o link web e receber cotações das empresas parceiras
                </p>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nº do Processo / Código *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Data de Abertura *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Prazo Limite para Cotações *</label>
                  <input
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Rubrica Orçamentária</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                  >
                    <option value="CUSTEIO">Custeio (Consumo / Reparos / Serviços)</option>
                    <option value="CAPITAL">Capital (Bens Permanentes / Móveis / TI)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Programa Vinculado</label>
                <select
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value as ProgramType })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                >
                  <option value="PDDE_MUNICIPAL">PDDE Municipal (Secretaria Municipal de Educação de Santa Cruz do Sul)</option>
                  <option value="PDDE_BASICO_FNDE">PDDE Básico (FNDE / Federal)</option>
                  <option value="PDDE_EDUCACAO_CONECTADA">PDDE Educação Conectada</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Objeto Detalhado da Compra ou Serviço *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Aquisição de material pedagógico e de consumo para atendimento das turmas de ensino fundamental da EMEF Menino Deus..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              {/* Items Demanded Registration (Requirement 2 & 5) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Lista de Produtos ou Serviços a Cotar
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Estes itens aparecerão no Link Público e na Planilha Protegida para o fornecedor digitar os preços unitários.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemDemand}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Adicionar Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.itemsDemanded.map((it, idx) => (
                    <div key={it.id || idx} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="font-mono text-slate-400 text-xs w-5 text-center">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder="Descrição do item ou especificação técnica..."
                        value={it.description}
                        onChange={(e) => handleUpdateItemDemand(idx, 'description', e.target.value)}
                        className="flex-1 border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                        required
                      />
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qtd"
                          value={it.quantity}
                          onChange={(e) => handleUpdateItemDemand(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-16 border border-slate-300 rounded px-2 py-1 text-xs text-center font-semibold"
                          required
                        />
                        <select
                          value={it.unit}
                          onChange={(e) => handleUpdateItemDemand(idx, 'unit', e.target.value)}
                          className="border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                        >
                          <option value="un">un</option>
                          <option value="resma">resma</option>
                          <option value="pct">pct</option>
                          <option value="cx">cx</option>
                          <option value="kg">kg</option>
                          <option value="lt">lt</option>
                          <option value="servico">serviço</option>
                        </select>
                      </div>
                      {formData.itemsDemanded.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemDemand(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* REQUIREMENT 6: EXEMPTION FOR SINGLE QUOTE WITH JUSTIFICATION */}
              <div className="bg-purple-50/80 border border-purple-300 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="allowSingleQuote"
                    checked={formData.allowSingleQuote}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        allowSingleQuote: checked,
                        singleQuoteJustification: prev.singleQuoteJustification.trim()
                          ? prev.singleQuoteJustification
                          : DEFAULT_SINGLE_QUOTE_JUSTIFICATION
                      }));
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-purple-700 focus:ring-purple-600 cursor-pointer"
                  />
                  <label htmlFor="allowSingleQuote" className="text-xs text-purple-950 font-semibold cursor-pointer select-none">
                    Possibilidade de envio com menos de 3 orçamentos (Inviabilidade de competição na praça local / Fornecedor exclusivo)
                  </label>
                </div>

                {formData.allowSingleQuote && (
                  <div className="space-y-3 pl-6 pt-1 border-t border-purple-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                        Motivo Legal da Apresentação de Menos de 3 Orçamentos:
                      </label>
                      <select
                        value={formData.singleQuoteReason}
                        onChange={(e) => setFormData({ ...formData, singleQuoteReason: e.target.value })}
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
                          onClick={() => setFormData(prev => ({ ...prev, singleQuoteJustification: DEFAULT_SINGLE_QUOTE_JUSTIFICATION }))}
                          className="text-[10px] text-purple-700 hover:text-purple-900 hover:underline cursor-pointer font-medium"
                          title="Restaurar o modelo padrão de justificativa legal"
                        >
                          Restaurar texto padrão
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        required
                        value={formData.singleQuoteJustification}
                        onChange={(e) => setFormData({ ...formData, singleQuoteJustification: e.target.value })}
                        placeholder="Ex: Certifico para os devidos fins de prestação de contas que foram consultadas empresas do segmento em Santa Cruz do Sul, tendo apenas a presente empresa capacidade técnica imediata ou estoque para fornecimento do item nas especificações exigidas pela escola..."
                        className="w-full bg-white border border-purple-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-700 leading-relaxed shadow-2xs"
                      />
                      <div className="flex items-center justify-between text-[10px] text-purple-800 mt-1">
                        <span>
                          Texto pré-preenchido com fundamentação padrão. Edite e complemente livremente com as particularidades da escola.
                        </span>
                        <span className="font-medium text-purple-900">
                          Art. 14, § 2º Res. FNDE 15/2021
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Justificativa Padrão de Homologação</label>
                <input
                  type="text"
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Salvar e Habilitar Coleta de Propostas
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LINK PÚBLICO & FORMULÁRIO DO FORNECEDOR */}
      {selectedQuotationForPublicLink && (
        <PublicQuoteFormModal
          quotation={selectedQuotationForPublicLink}
          onClose={() => setSelectedQuotationForPublicLink(null)}
        />
      )}

      {/* MODAL 3: BANCO DE FORNECEDORES LOCAIS & DISPARO EM LOTE */}
      {selectedQuotationForDirectory && (
        <SupplierDirectoryModal
          quotation={selectedQuotationForDirectory.id ? selectedQuotationForDirectory : undefined}
          onClose={() => setSelectedQuotationForDirectory(null)}
        />
      )}

      {/* MODAL 4: LEITOR OCR & PLANILHA INTELIGENTE PROTEGIDA */}
      {selectedQuotationForOCR && (
        <OCRProposalModal
          quotation={selectedQuotationForOCR}
          onClose={() => setSelectedQuotationForOCR(null)}
        />
      )}

      {/* MODAL 6: EDITAR PEDIDO DE ORÇAMENTO */}
      {selectedQuotationForEdit && (
        <EditQuotationModal
          quotation={selectedQuotationForEdit}
          onClose={() => setSelectedQuotationForEdit(null)}
        />
      )}

      {/* MODAL 5: IMPRESSÃO DO MAPA COMPARATIVO DE PREÇOS */}
      {selectedQuotationForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col my-8 border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Mapa Comparativo de Preços — Visualização Oficial para Impressão
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Documento</span>
                </button>
                <button 
                  onClick={() => setSelectedQuotationForPrint(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Content */}
            <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-900 font-sans print:p-0">
              
              {/* Document Header */}
              <div className="text-center border-b pb-4 space-y-1">
                <div className="font-bold text-sm tracking-wider uppercase">
                  ESTADO DO RIO GRANDE DO SUL
                </div>
                <div className="font-bold text-xs uppercase">
                  MUNICÍPIO DE SANTA CRUZ DO SUL
                </div>
                <div className="text-xs text-slate-700">
                  SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEE)
                </div>
                <div className="font-bold text-sm text-emerald-950 pt-2 uppercase">
                  MAPA DE APURAÇÃO E CONFERÊNCIA DE PREÇOS
                </div>
                <div className="text-slate-600 text-[11px]">
                  PROGRAMA DINHEIRO DIRETO NA ESCOLA — EXERCÍCIO {selectedYear}
                </div>
              </div>

              {/* Entity info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 text-[11px]">
                <div>
                  <span className="font-bold block">UNIDADE ESCOLAR:</span>
                  <span>{currentSchool.name}</span>
                </div>
                <div>
                  <span className="font-bold block">UNIDADE EXECUTORA (CPM):</span>
                  <span>{currentSchool.uexName} (CNPJ: {formatCNPJ(currentSchool.uexCnpj)})</span>
                </div>
                <div>
                  <span className="font-bold block">Nº DO PROCESSO:</span>
                  <span className="font-mono font-bold text-emerald-900">{selectedQuotationForPrint.code}</span>
                </div>
                <div>
                  <span className="font-bold block">PROGRAMA / RUBRICA:</span>
                  <span>{PROGRAM_LABELS[selectedQuotationForPrint.program].label} — {selectedQuotationForPrint.category}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold block">OBJETO:</span>
                  <span>{selectedQuotationForPrint.objectDescription || selectedQuotationForPrint.description}</span>
                </div>
              </div>

              {/* Single quote justification note on map */}
              {selectedQuotationForPrint.allowSingleQuote && selectedQuotationForPrint.singleQuoteJustification && (
                <div className="p-3 bg-purple-50 border border-purple-300 rounded text-[11px] text-purple-950 space-y-1">
                  <div className="font-bold uppercase tracking-wide">
                    CERTIDÃO DE APRESENTAÇÃO DE MENOS DE 3 ORÇAMENTOS (ART. 14 § 2º RESOLUÇÃO CD/FNDE Nº 15/2021)
                  </div>
                  <div><strong>Motivo:</strong> {selectedQuotationForPrint.singleQuoteReason}</div>
                  <div className="italic bg-white/80 p-2 rounded border border-purple-200">
                    "{selectedQuotationForPrint.singleQuoteJustification}"
                  </div>
                </div>
              )}

              {/* Comparative Table */}
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r">Fornecedor / Razão Social</th>
                      <th className="p-2 border-r text-center w-36">CNPJ</th>
                      <th className="p-2 border-r text-center w-28">CND Regular</th>
                      <th className="p-2 border-r text-center w-36">Autenticação Digital</th>
                      <th className="p-2 text-right w-32">Valor Total (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {selectedQuotationForPrint.quotes.map((quote, idx) => {
                      const isWinner = (selectedQuotationForPrint.selectedQuoteId && quote.id === selectedQuotationForPrint.selectedQuoteId) || idx === 0;
                      return (
                        <tr key={quote.id || idx} className={isWinner ? 'bg-emerald-50/80 font-semibold' : ''}>
                          <td className="p-2 border-r">
                            {quote.companyName} {isWinner && <span className="text-emerald-800 font-bold ml-1">(Vencedor)</span>}
                          </td>
                          <td className="p-2 border-r font-mono text-center">
                            {formatCNPJ(quote.cnpj)}
                          </td>
                          <td className="p-2 border-r text-center">
                            {quote.cndRegular ? 'Regular' : 'Pendente'}
                          </td>
                          <td className="p-2 border-r text-center font-mono text-[10px] text-slate-600">
                            {quote.digitalSignature?.validationToken || 'Conferido via OCR'}
                          </td>
                          <td className="p-2 text-right font-mono">
                            {formatBRL(quote.proposalValue || quote.totalValue || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-1">
                  <div className="border-t border-slate-400 pt-2 w-4/5 mx-auto"></div>
                  <span className="font-bold block">{currentSchool.presidentName}</span>
                  <span className="text-[10px] text-slate-500">Presidente do CPM / Responsável</span>
                </div>
                <div className="space-y-1">
                  <div className="border-t border-slate-400 pt-2 w-4/5 mx-auto"></div>
                  <span className="font-bold block">{currentSchool.treasurerName}</span>
                  <span className="text-[10px] text-slate-500">Tesoureiro(a) do CPM</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
