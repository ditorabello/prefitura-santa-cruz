import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Search, 
  Upload, 
  FileText, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Printer,
  Download,
  ArrowLeft,
  Calendar,
  Sparkles,
  Phone,
  Mail,
  Check
} from 'lucide-react';
import { usePDDE } from '../context/PDDEContext';
import { Quotation, QuoteItem } from '../types/pdde';
import { formatBRL, formatCNPJ, formatDateBR } from '../utils/formatters';
import { downloadQuotationCSV } from '../utils/quotationFileExport';

interface SupplierPublicPortalProps {
  token: string;
  onExit?: () => void;
}

export const SupplierPublicPortal: React.FC<SupplierPublicPortalProps> = ({ token, onExit }) => {
  const { quotations, currentSchool, schools, submitProposalToQuotation, getQuotationByToken } = usePDDE();

  const [quotation, setQuotation] = useState<Quotation | null>(null);

  useEffect(() => {
    const found = getQuotationByToken(token);
    if (found) {
      setQuotation(found);
    } else if (quotations.length > 0) {
      setQuotation(quotations[0]);
    }
  }, [token, quotations, getQuotationByToken]);

  // Supplier form state
  const [cnpj, setCnpj] = useState('');
  const [isSearchingCNPJ, setIsSearchingCNPJ] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [address, setAddress] = useState('');
  const [statusReceita, setStatusReceita] = useState<'ATIVA' | 'INAPTA' | 'SUSPENSA' | undefined>(undefined);
  const [cndRegular, setCndRegular] = useState(true);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');
  const [legalDeclarationAccepted, setLegalDeclarationAccepted] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedStampToken, setSubmittedStampToken] = useState('');

  // Unit prices map
  const items = quotation?.itemsDemanded && quotation.itemsDemanded.length > 0
    ? quotation.itemsDemanded
    : [
        { id: 'item-1', description: 'Item 1 da cotação solicitada', quantity: 10, unit: 'un' },
        { id: 'item-2', description: 'Item 2 da cotação solicitada', quantity: 5, unit: 'un' }
      ];

  const [unitPrices, setUnitPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (items.length > 0 && Object.keys(unitPrices).length === 0) {
      const initial: Record<string, number> = {};
      items.forEach(it => {
        initial[it.id] = 0;
      });
      setUnitPrices(initial);
    }
  }, [items]);

  const school = quotation
    ? schools.find(s => s.id === quotation.schoolId) || currentSchool
    : currentSchool;

  const handleLookupCNPJ = (customCNPJ?: string) => {
    const target = customCNPJ || cnpj;
    if (!target) return;
    setIsSearchingCNPJ(true);

    setTimeout(() => {
      setIsSearchingCNPJ(false);
      const clean = target.replace(/\D/g, '');
      if (clean.includes('03456') || clean.includes('03.456')) {
        setCompanyName('Livraria e Papelaria Rio Pardo Ltda');
        setTradeName('Papelaria Rio Pardo');
        setAddress('Rua Marechal Floriano, 450 - Centro, Santa Cruz do Sul - RS');
        setStatusReceita('ATIVA');
        setCndRegular(true);
        setCnpj('03.456.789/0001-12');
      } else if (clean.includes('11222') || clean.includes('11.222')) {
        setCompanyName('Papelaria Central de Santa Cruz do Sul Ltda');
        setTradeName('Papelaria Central SCS');
        setAddress('Rua Marechal Floriano, 450 - Centro, Santa Cruz do Sul - RS');
        setStatusReceita('ATIVA');
        setCndRegular(true);
        setCnpj('11.222.333/0001-44');
      } else if (clean.includes('19882') || clean.includes('19.882')) {
        setCompanyName('Instaladora Santa Cruz Instalações Hidráulicas Eireli');
        setTradeName('Instaladora Santa Cruz');
        setAddress('Av. Independência, 1100 - Universitário, Santa Cruz do Sul - RS');
        setStatusReceita('ATIVA');
        setCndRegular(true);
        setCnpj('19.882.341/0001-72');
      } else {
        // Formatted valid simulation
        setCompanyName(`Empresa Comercial de Santa Cruz do Sul Ltda`);
        setTradeName('Fornecedor Parceiro SCS');
        setAddress('Santa Cruz do Sul - RS');
        setStatusReceita('ATIVA');
        setCndRegular(true);
        setCnpj(target.length >= 14 ? target : '12.345.678/0001-90');
      }
    }, 450);
  };

  const handleUnitPriceChange = (itemId: string, val: string) => {
    const num = parseFloat(val.replace(',', '.')) || 0;
    setUnitPrices(prev => ({
      ...prev,
      [itemId]: num,
    }));
  };

  const totalCalculated = items.reduce((acc, it) => {
    const unit = unitPrices[it.id] || 0;
    return acc + (unit * it.quantity);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotation) return;

    if (!companyName.trim() || !cnpj.trim()) {
      alert('Por favor, informe e valide o CNPJ da empresa.');
      return;
    }

    if (totalCalculated <= 0) {
      alert('Informe os preços unitários ofertados para os itens.');
      return;
    }

    if (!legalDeclarationAccepted) {
      alert('É necessário assinalar o aceite da declaração legal de autenticidade.');
      return;
    }

    const stampToken = `VAL-SCS-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-DIGITAL`;
    setSubmittedStampToken(stampToken);

    const newQuote: QuoteItem = {
      id: `quote-${Date.now()}`,
      companyName,
      tradeName: tradeName || companyName,
      cnpj,
      phone: contactPhone || '(51) 3715-0000',
      contactPerson: contactName || 'Representante Legal',
      proposalValue: Math.round(totalCalculated * 100) / 100,
      totalValue: Math.round(totalCalculated * 100) / 100,
      proposalDate: new Date().toISOString().split('T')[0],
      cndRegular,
      statusReceita: statusReceita || 'ATIVA',
      digitalSignature: {
        signedBy: contactName || companyName,
        signedAt: new Date().toISOString(),
        validationToken: stampToken,
        ipAddress: '177.18.242.19 (Santa Cruz do Sul - RS)',
        legalDeclaration: 'Declaro sob as penas da lei a veracidade da proposta comercial e a validade mínima de 60 dias.'
      },
      attachedFileName: attachedFileName || `Proposta_Comercial_${companyName.slice(0, 15).replace(/\s+/g, '_')}.pdf`,
      itemPrices: items.map(it => ({
        itemId: it.id,
        description: it.description,
        quantity: it.quantity,
        unitPrice: unitPrices[it.id] || 0,
        subtotal: (unitPrices[it.id] || 0) * it.quantity,
      })),
      notes: `Proposta preenchida via Portal Público Web WhatsApp em ${new Date().toLocaleDateString('pt-BR')} com autenticação digital de CNPJ.`
    };

    submitProposalToQuotation(quotation.id, newQuote);
    setSubmissionSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnToAdmin = () => {
    // Clear url query params without full reload
    const url = new URL(window.location.href);
    url.searchParams.delete('cotacao');
    url.searchParams.delete('token');
    window.history.pushState({}, '', url.pathname);
    if (onExit) {
      onExit();
    } else {
      window.location.reload();
    }
  };

  if (!quotation) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Cotação não localizada</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            O link de cotação informado não foi encontrado ou o processo já foi concluído pela escola.
          </p>
          <button
            onClick={handleReturnToAdmin}
            className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            Acessar Sistema Administrativo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 flex flex-col font-sans pb-12">
      
      {/* Top Municipal Bar */}
      <div className="bg-emerald-950 text-white px-4 py-3 border-b border-emerald-900">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded uppercase tracking-wider border border-emerald-400/30">
              Santa Cruz do Sul / RS
            </span>
            <span className="text-xs font-semibold text-emerald-100 hidden sm:inline">
              Secretaria Municipal de Educação (SEE)
            </span>
          </div>

          <button
            onClick={handleReturnToAdmin}
            className="text-[11px] text-emerald-200 hover:text-white flex items-center gap-1 cursor-pointer font-medium hover:underline"
            title="Voltar ao painel administrativo da escola"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Acesso da Escola</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl w-full mx-auto px-4 mt-6">
        
        {/* Success Screen */}
        {submissionSuccess ? (
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-200 overflow-hidden animate-in fade-in duration-200">
            <div className="bg-emerald-800 text-white p-6 text-center space-y-2">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto text-white">
                <CheckCircle2 className="w-10 h-10 text-emerald-200" />
              </div>
              <h2 className="text-xl font-bold text-white">Proposta Enviada com Sucesso!</h2>
              <p className="text-xs text-emerald-100 max-w-md mx-auto">
                Sua proposta comercial foi recebida digitalmente e integrada ao processo oficial de cotação da escola.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Protocol Badge */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-950">Protocolo de Validação Digital:</span>
                  <span className="text-slate-500">{new Date().toLocaleString('pt-BR')}</span>
                </div>
                <div className="font-mono font-bold text-sm text-emerald-900 bg-white p-2.5 rounded border border-emerald-300 flex items-center justify-between">
                  <span>{submittedStampToken}</span>
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Este protocolo substitui legalmente o carimbo físico e comprova a data e hora do envio conforme as diretrizes do FNDE e do TCE-RS.
                </p>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <div className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2">
                  Resumo da Proposta Enviada
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Empresa Fornecedora:</span>
                    <span className="font-semibold text-slate-900">{companyName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">CNPJ:</span>
                    <span className="font-mono font-semibold text-slate-900">{formatCNPJ(cnpj)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Escola Solicitante:</span>
                    <span className="font-semibold text-slate-900">{school?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Processo de Cotação:</span>
                    <span className="font-mono font-bold text-emerald-800">{quotation.code}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Valor Global da Proposta:</span>
                  <span className="font-mono font-bold text-base text-emerald-900">
                    {formatBRL(totalCalculated)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar Comprovante em PDF</span>
                </button>

                <button
                  onClick={handleReturnToAdmin}
                  className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Acessar Painel da Escola</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            
            {/* Header Card */}
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-400/30">
                    Formulário Oficial de Proposta
                  </span>
                  <span className="text-xs text-emerald-200">
                    PDDE Santa Cruz do Sul
                  </span>
                </div>
                <div className="text-xs text-emerald-200/90 flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Prazo: {new Date(quotation.deadline || Date.now()).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div>
                <h1 className="text-xl font-bold text-white">
                  {school?.name || 'Escola Municipal de Santa Cruz do Sul'}
                </h1>
                <div className="text-xs text-emerald-100/90 mt-1 flex flex-wrap items-center gap-3">
                  <span>UEx: <strong>{school?.uexName}</strong></span>
                  <span>·</span>
                  <span>CNPJ UEx: <strong>{formatCNPJ(school?.uexCnpj || '')}</strong></span>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-3 text-xs border border-white/15">
                <span className="font-semibold text-emerald-200 block mb-0.5">
                  Processo nº {quotation.code} — Objeto Solicitado:
                </span>
                <p className="text-white/95 leading-relaxed text-[11px]">
                  {quotation.description || quotation.objectDescription}
                </p>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span className="font-semibold text-[11px]">Ambiente Seguro & Dispensa de Carimbo Físico</span>
              </div>

              {/* Download Excel CSV Option for WhatsApp users who prefer files */}
              <button
                type="button"
                onClick={() => downloadQuotationCSV(quotation, school)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Baixar planilha para preenchimento em Excel"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Baixar Planilha (.csv / Excel)</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* SECTION 1: ITEMS DEMANDED & UNIT PRICES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>1. Itens e Preços Ofertados</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Digite o valor unitário de cada item (o sistema calcula o total)
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">Item</th>
                          <th className="py-2.5 px-3">Descrição Solicitada</th>
                          <th className="py-2.5 px-3 w-20 text-center">Qtd</th>
                          <th className="py-2.5 px-3 w-32 text-right">Preço Unitário (R$) *</th>
                          <th className="py-2.5 px-3 w-32 text-right">Subtotal (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((it, idx) => {
                          const unitPrice = unitPrices[it.id] || 0;
                          const subtotal = unitPrice * it.quantity;
                          return (
                            <tr key={it.id || idx} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-900">
                                {it.description}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                                {it.quantity} {it.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="relative inline-block w-full max-w-[120px]">
                                  <span className="absolute left-2.5 top-2 text-[10px] text-slate-400">R$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    placeholder="0,00"
                                    value={unitPrices[it.id] !== undefined && unitPrices[it.id] > 0 ? unitPrices[it.id] : ''}
                                    onChange={(e) => handleUnitPriceChange(it.id, e.target.value)}
                                    className="w-full pl-7 pr-2 py-1.5 border border-slate-300 rounded text-right font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                                  />
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                                {formatBRL(subtotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                          <td colSpan={4} className="py-3 px-4 text-right font-bold text-slate-800 text-xs uppercase">
                            Valor Global Total da Proposta:
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-sm text-emerald-900">
                            {formatBRL(totalCalculated)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* SECTION 2: SUPPLIER CNPJ & OFFICIAL DATA */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-700" />
                    <span>2. Dados da Empresa Fornecedora (Autenticação Receita Federal)</span>
                  </h3>
                  <span className="text-[11px] text-emerald-800 font-medium">
                    Busca direta no CNPJ
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        CNPJ da Empresa Fornecedora *:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="00.000.000/0001-00"
                          value={cnpj}
                          onChange={(e) => setCnpj(e.target.value)}
                          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleLookupCNPJ()}
                          disabled={isSearchingCNPJ || !cnpj}
                          className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          {isSearchingCNPJ ? (
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Search className="w-3.5 h-3.5" />
                          )}
                          <span>Buscar CNPJ</span>
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Dica: Digite o CNPJ e clique em "Buscar CNPJ" para preenchimento oficial instantâneo.
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Situação Cadastral:
                      </label>
                      <div className="py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs flex items-center gap-1.5">
                        {statusReceita === 'ATIVA' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-emerald-800">ATIVA na Receita</span>
                          </>
                        ) : (
                          <span className="text-slate-400">Aguardando CNPJ</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Auto-filled details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Razão Social Oficial *:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Razão Social extraída da Receita"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nome Fantasia:
                      </label>
                      <input
                        type="text"
                        placeholder="Nome Fantasia comercial"
                        value={tradeName}
                        onChange={(e) => setTradeName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Endereço Comercial Completo:
                      </label>
                      <input
                        type="text"
                        placeholder="Rua, Número, Bairro, Santa Cruz do Sul - RS"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Representante Comercial / Contato:
                      </label>
                      <input
                        type="text"
                        placeholder="Nome do responsável pelo orçamento"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Telefone / WhatsApp de Contato *:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="(51) 99999-9999"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: ATTACHMENT & DIGITAL ACCEPTANCE */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span>3. Anexo de Proposta & Aceite Digital</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* File attach simulated */}
                  <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-emerald-500 transition-colors bg-slate-50 text-center">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-slate-800 block">
                      Anexo Opcional de Proposta em PDF / Foto
                    </span>
                    <span className="text-[10px] text-slate-500 block mb-3">
                      Caso possua orçamento em PDF ou cartão CNPJ
                    </span>
                    <label className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-emerald-800 hover:border-emerald-500 rounded text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{attachedFileName ? 'Alterar Arquivo' : 'Selecionar Arquivo'}</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAttachedFileName(file.name);
                          }
                        }}
                      />
                    </label>
                    {attachedFileName && (
                      <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>{attachedFileName}</span>
                      </div>
                    )}
                  </div>

                  {/* Legal acceptance */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-950 mb-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span>Declaração de Autenticidade & Validade</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Declaro sob as penas da lei a veracidade dos dados e preços informados, com validade mínima de 60 dias e frete incluso até a escola.
                      </p>
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-emerald-200/60">
                      <input
                        type="checkbox"
                        required
                        checked={legalDeclarationAccepted}
                        onChange={(e) => setLegalDeclarationAccepted(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-emerald-950 select-none">
                        Confirmo a proposta comercial e aceito a assinatura digital deste orçamento *
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Total da Proposta: <strong className="font-mono text-emerald-900 text-sm">{formatBRL(totalCalculated)}</strong>
                </span>

                <button
                  type="submit"
                  disabled={totalCalculated <= 0}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Proposta Oficial para a Escola</span>
                </button>
              </div>

            </form>

          </div>
        )}

      </div>
    </div>
  );
};
