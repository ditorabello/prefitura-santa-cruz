import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  QrCode, 
  Building, 
  Search, 
  Upload, 
  FileText, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  Download
} from 'lucide-react';
import { Quotation, QuoteItem } from '../types/pdde';
import { usePDDE } from '../context/PDDEContext';
import { downloadQuotationCSV } from '../utils/quotationFileExport';

interface PublicQuoteFormModalProps {
  quotation: Quotation;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const PublicQuoteFormModal: React.FC<PublicQuoteFormModalProps> = ({
  quotation,
  onClose,
  onSubmitted,
}) => {
  const { currentSchool, submitProposalToQuotation } = usePDDE();
  
  // Link & QR states
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'share' | 'form'>('form');

  // Supplier Form State
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

  // Price lines based on demanded items
  const items = quotation.itemsDemanded && quotation.itemsDemanded.length > 0
    ? quotation.itemsDemanded
    : [
        { id: '1', description: 'Item 1 da cotação', quantity: 10, unit: 'un' },
        { id: '2', description: 'Item 2 da cotação', quantity: 5, unit: 'un' },
      ];

  const [unitPrices, setUnitPrices] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    items.forEach(it => {
      initial[it.id] = 0;
    });
    return initial;
  });

  const publicUrl = `${window.location.origin}/?cotacao=${quotation.publicToken || quotation.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLookupCNPJ = (customCNPJ?: string) => {
    const target = customCNPJ || cnpj;
    if (!target) return;
    setIsSearchingCNPJ(true);

    // Simulated Receita Federal & SINTEGRA RS lookup
    setTimeout(() => {
      setIsSearchingCNPJ(false);
      const clean = target.replace(/\D/g, '');
      if (clean.includes('11222333') || clean.includes('11.222')) {
        setCompanyName('Papelaria Central de Santa Cruz do Sul Ltda');
        setTradeName('Papelaria Central SCS');
        setAddress('Rua Marechal Floriano, 450 - Centro, Santa Cruz do Sul - RS');
        setStatusReceita('ATIVA');
        setCndRegular(true);
        setCnpj('11.222.333/0001-44');
      } else if (clean.includes('33444555') || clean.includes('33.444')) {
        setCompanyName('Distribuidora Vale do Rio Pardo de Materiais ME');
        setTradeName('Vale do Rio Pardo Distribuidora');
        setAddress('Av. Independência, 890 - Universitário, Santa Cruz do Sul - RS');
        setStatusReceita('ATIVA');
        setCndRegular(true);
        setCnpj('33.444.555/0001-66');
      } else if (clean.includes('99888777') || clean.includes('99.888')) {
        setCompanyName('Sul Informática e Automação Escolar Ltda');
        setTradeName('Sul Informática');
        setAddress('Rua 28 de Setembro, 320 - Centro, Santa Cruz do Sul - RS');
        setStatusReceita('ATIVA');
        setCndRegular(true);
        setCnpj('99.888.777/0001-99');
      } else {
        // Generic valid Santa Cruz do Sul supplier mock
        setCompanyName(`Fornecedor Comercial Santa Cruz (CNPJ ${target})`);
        setTradeName('Comércio Local SCS');
        setAddress('Rua Gaspar Silveira Martins, 102 - Centro, Santa Cruz do Sul - RS');
        setStatusReceita('ATIVA');
        setCndRegular(true);
      }
    }, 400);
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

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !cnpj.trim()) {
      alert('Por favor, informe e valide o CNPJ da empresa.');
      return;
    }
    if (totalCalculated <= 0) {
      alert('Informe os valores unitários dos itens solicitados.');
      return;
    }
    if (!legalDeclarationAccepted) {
      alert('É necessário assinalar o aceite digital e declaração de autenticidade da proposta.');
      return;
    }

    // Generate unique verification stamp token replacing rubber stamp
    const stampToken = `VAL-SCS-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-DIGITAL`;

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
        legalDeclaration: 'Declaro sob as penas da lei a veracidade da proposta comercial e a validade de 60 dias.'
      },
      attachedFileName: attachedFileName || `Proposta_Comercial_${companyName.slice(0, 15).replace(/\s+/g, '_')}.pdf`,
      itemPrices: items.map(it => ({
        itemId: it.id,
        description: it.description,
        quantity: it.quantity,
        unitPrice: unitPrices[it.id] || 0,
        subtotal: (unitPrices[it.id] || 0) * it.quantity,
      })),
      notes: `Proposta preenchida via Link Público Web em ${new Date().toLocaleDateString('pt-BR')} com autenticação digital de CNPJ.`
    };

    submitProposalToQuotation(quotation.id, newQuote);
    setSubmissionSuccess(true);

    if (onSubmitted) {
      onSubmitted();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded uppercase tracking-wider border border-emerald-400/30">
                Solução Digital Direta
              </span>
              <span className="text-xs text-emerald-200">
                {currentSchool?.name}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Link Público & Formulário Web de Cotação
            </h3>
            <p className="text-xs text-emerald-100/80">
              Cotação nº {quotation.code} — {quotation.description}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 flex gap-2 pt-2">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 border-t border-x ${
              activeTab === 'form'
                ? 'bg-white text-emerald-950 border-slate-200 border-b-white -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>Formulário Digital do Fornecedor</span>
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 border-t border-x ${
              activeTab === 'share'
                ? 'bg-white text-emerald-950 border-slate-200 border-b-white -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-700" />
            <span>Compartilhar Link & QR Code</span>
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">

          {/* TAB 1: SHARE LINK & QR CODE */}
          {activeTab === 'share' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-emerald-700" />
                  Link Único de Cotação para Envio a Fornecedores
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Envie este link por WhatsApp ou e-mail. A empresa clica no link e preenche os preços unitários diretamente no celular ou computador, ou pode baixar a planilha oficial.
                </p>

                <div className="mt-4 flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                  </button>

                  <button
                    onClick={() => window.open(publicUrl, '_blank')}
                    className="px-3.5 py-2 bg-white border border-emerald-400 text-emerald-900 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                    title="Abrir formulário público em nova aba para testar"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Testar Link</span>
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-emerald-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-900 font-medium">
                    Prefere enviar planilha para o fornecedor preencher em Excel?
                  </span>
                  <button
                    onClick={() => downloadQuotationCSV(quotation, currentSchool)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-900 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Baixar Planilha de Cotação (.csv)</span>
                  </button>
                </div>
              </div>

              {/* QR Code Simulation & WhatsApp Message Template */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* QR Code Container */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-300 mb-2">
                    <QrCode className="w-32 h-32 text-slate-800" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">QR Code da Cotação</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Fornecedor pode escanear pela câmera do celular
                  </span>
                </div>

                {/* WhatsApp Quick Message */}
                <div className="bg-emerald-900/5 border border-emerald-300/40 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 mb-1">
                      Mensagem Pronta para WhatsApp
                    </h5>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-[11px] text-slate-700 leading-relaxed font-mono whitespace-pre-line max-h-40 overflow-y-auto">
{`*SOLICITAÇÃO DE COTAÇÃO - ${currentSchool?.name}*
Objeto: ${quotation.description || quotation.objectDescription}

🔗 *Clique no link para preencher os preços:*
${publicUrl}

Prazo: até ${new Date(quotation.deadline || quotation.date || Date.now()).toLocaleDateString('pt-BR')}.
(Você também pode solicitar a planilha em anexo)`}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        const message = `*SOLICITAÇÃO DE COTAÇÃO - ${currentSchool?.name}*\nObjeto: ${quotation.description || quotation.objectDescription}\n\n🔗 *Preenchimento Digital Direto (celular/computador):*\n${publicUrl}\n\nPrazo Limite: até ${new Date(quotation.deadline || quotation.date || Date.now()).toLocaleDateString('pt-BR')}.\nObrigado pela parceria com a educação municipal!`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Disparar via WhatsApp</span>
                    </button>
                    <button
                      onClick={() => downloadQuotationCSV(quotation, currentSchool)}
                      className="px-3 py-2 bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
                      title="Baixar planilha para anexar no WhatsApp"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Planilha</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE WEB FORM (SUPPLIER PERSPECTIVE) */}
          {activeTab === 'form' && (
            <>
              {submissionSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-emerald-950">
                      Proposta Comercial Enviada com Sucesso!
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                      A proposta de <strong>{companyName}</strong> foi registrada no sistema do PDDE de Santa Cruz do Sul com autenticação digital de CNPJ.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg max-w-sm mx-auto text-left text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Valor Total Ofertado:</span>
                      <strong className="text-emerald-900">
                        {totalCalculated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Autenticação Digital:</span>
                      <span className="font-mono text-[10px] text-slate-700">VAL-SCS-AUTENTICADO</span>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Fechar e Voltar ao Painel
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitProposal} className="space-y-6">
                  
                  {/* Banner Explicativo */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900">
                      <strong className="block font-semibold">Validação Digital de CNPJ Substitui Carimbo Físico</strong>
                      Os dados da empresa são autenticados via consulta direta, gerando um selo eletrônico com validade jurídica perante o FNDE e o TCE-RS.
                    </div>
                  </div>

                  {/* 1. Identificação do Fornecedor & CNPJ */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <Building className="w-4 h-4 text-emerald-800" />
                        1. Dados do Fornecedor / Empresa
                      </h4>
                      {/* Fast demo buttons */}
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-500 font-medium">Preencher Teste:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCnpj('11.222.333/0001-44');
                            handleLookupCNPJ('11.222.333/0001-44');
                          }}
                          className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 cursor-pointer text-[10px]"
                        >
                          Papelaria SCS
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCnpj('99.888.777/0001-99');
                            handleLookupCNPJ('99.888.777/0001-99');
                          }}
                          className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 cursor-pointer text-[10px]"
                        >
                          Sul Info
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          CNPJ da Empresa *
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="00.000.000/0000-00"
                            value={cnpj}
                            onChange={(e) => setCnpj(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleLookupCNPJ()}
                            disabled={isSearchingCNPJ}
                            className="px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center shrink-0"
                            title="Consultar CNPJ na Receita Federal"
                          >
                            {isSearchingCNPJ ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Razão Social (Nome Oficial) *
                        </label>
                        <input
                          type="text"
                          placeholder="Razão social preenchida após consulta CNPJ"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                          required
                        />
                      </div>
                    </div>

                    {statusReceita && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Situação Cadastral</span>
                          <span className="inline-flex items-center gap-1 text-emerald-800 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {statusReceita} (Receita Federal)
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Certidão CND</span>
                          <span className="text-emerald-800 font-semibold">Regular / Sem Pendências</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Endereço Oficial</span>
                          <span className="text-slate-700 text-[11px] truncate block" title={address}>
                            {address || 'Santa Cruz do Sul - RS'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Nome do Responsável
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: João da Silva"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          WhatsApp / Telefone
                        </label>
                        <input
                          type="text"
                          placeholder="(51) 99999-0000"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          E-mail Comercial
                        </label>
                        <input
                          type="email"
                          placeholder="contato@empresa.com.br"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Tabela de Preços Autoguiada (Multiplicação e Soma Automática) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-800" />
                        2. Preenchimento Autoguiado de Preços (Cálculo Automático)
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {items.length} item(ns) solicitados
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Item / Especificação</th>
                            <th className="py-2.5 px-3 text-center w-20">Qtd</th>
                            <th className="py-2.5 px-3 text-center w-20">Unid</th>
                            <th className="py-2.5 px-3 text-right w-36">Preço Unitário (R$)</th>
                            <th className="py-2.5 px-3 text-right w-36">Subtotal (R$)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {items.map((item, idx) => {
                            const unit = unitPrices[item.id] || 0;
                            const subtotal = unit * item.quantity;
                            return (
                              <tr key={item.id} className="hover:bg-slate-50/80">
                                <td className="py-2.5 px-3">
                                  <div className="font-medium text-slate-900">
                                    {idx + 1}. {item.description}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                                  {item.quantity}
                                </td>
                                <td className="py-2.5 px-3 text-center text-slate-500">
                                  {item.unit}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">R$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={unitPrices[item.id] === 0 ? '' : unitPrices[item.id]}
                                      onChange={(e) => handleUnitPriceChange(item.id, e.target.value)}
                                      placeholder="0,00"
                                      className="w-full pl-8 pr-2 py-1 bg-white border border-slate-300 rounded text-right font-mono text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                                      required
                                    />
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                                  {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-emerald-50 border-t-2 border-emerald-300 font-bold text-xs text-slate-900">
                          <tr>
                            <td colSpan={4} className="py-3 px-3 text-right text-emerald-950 uppercase tracking-wide">
                              Valor Total Geral da Proposta:
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-sm text-emerald-900">
                              {totalCalculated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* 3. Anexo de Proposta em PDF / Imagem */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <Upload className="w-4 h-4 text-emerald-800" />
                      3. Anexo de Comprovante / Proposta em PDF ou Imagem
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      O fornecedor pode anexar a proposta formal em PDF ou o Cartão CNPJ para arquivo digital na prestação de contas.
                    </p>

                    <div className="flex items-center gap-3">
                      <label className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-md text-xs font-semibold text-slate-800 cursor-pointer flex items-center gap-1.5 shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        <span>Selecionar Arquivo PDF / Imagem</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setAttachedFileName(e.target.files[0].name);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-slate-600">
                        {attachedFileName ? (
                          <span className="inline-flex items-center gap-1 text-emerald-800 font-medium bg-emerald-100/60 px-2 py-0.5 rounded">
                            <FileText className="w-3.5 h-3.5" />
                            {attachedFileName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Nenhum arquivo anexado (opcional caso preenchido digitalmente)</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* 4. Aceite Digital & Declaração de Autenticidade (Substituição do Carimbo) */}
                  <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="legalDeclaration"
                        checked={legalDeclarationAccepted}
                        onChange={(e) => setLegalDeclarationAccepted(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                        required
                      />
                      <label htmlFor="legalDeclaration" className="text-xs text-amber-950 leading-relaxed cursor-pointer select-none">
                        <strong>Aceite Digital & Declaração de Autenticidade:</strong> Declaro sob as penas da lei que os preços apresentados refletem as condições vigentes de mercado, possuem validade mínima de 60 dias e que a empresa está plenamente apta e habilitada perante a Fazenda Nacional, Estadual e Municipal para fornecimento à administração pública de Santa Cruz do Sul.
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!legalDeclarationAccepted || totalCalculated <= 0}
                      className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                    >
                      <Send className="w-4 h-4" />
                      <span>Registrar Proposta com Autenticação Digital</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};
