import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  Send, 
  Plus, 
  Share2, 
  Copy, 
  Check, 
  Filter,
  ExternalLink,
  MessageSquare,
  Download
} from 'lucide-react';
import { Quotation, SupplierDirectoryItem } from '../types/pdde';
import { usePDDE } from '../context/PDDEContext';
import { downloadQuotationCSV } from '../utils/quotationFileExport';

interface SupplierDirectoryModalProps {
  quotation?: Quotation;
  onClose: () => void;
  onDispatched?: () => void;
}

export const SupplierDirectoryModal: React.FC<SupplierDirectoryModalProps> = ({
  quotation,
  onClose,
  onDispatched,
}) => {
  const { suppliers, addSupplier, currentSchool } = usePDDE();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [copiedBatchText, setCopiedBatchText] = useState(false);

  // New supplier form state
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newTradeName, setNewTradeName] = useState('');
  const [newCnpj, setNewCnpj] = useState('');
  const [newCategory, setNewCategory] = useState('Papelaria & Material Escolar');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('Santa Cruz do Sul - RS');
  const [newContactPerson, setNewContactPerson] = useState('');

  const categories = [
    'TODOS',
    'Papelaria & Material Escolar',
    'Limpeza & Higiene',
    'Informática & Tecnologia',
    'Obras & Manutenção',
    'Móveis & Equipamentos',
    'Alimentos & Copa',
  ];

  const filteredSuppliers = suppliers.filter(s => {
    const matchesCategory = selectedCategory === 'TODOS' || s.category === selectedCategory;
    const matchesSearch = 
      s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.cnpj.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const toggleSelectSupplier = (id: string) => {
    setSelectedSupplierIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectThreeOfCategory = () => {
    const list = filteredSuppliers.slice(0, 3).map(s => s.id);
    setSelectedSupplierIds(list);
  };

  const selectedSuppliers = suppliers.filter(s => selectedSupplierIds.includes(s.id));

  const quoteUrl = quotation 
    ? `${window.location.origin}/?cotacao=${quotation.publicToken || quotation.id}`
    : `${window.location.origin}/`;

  const itemsText = quotation?.itemsDemanded && quotation.itemsDemanded.length > 0
    ? quotation.itemsDemanded.map((it, idx) => `• ${it.quantity} ${it.unit} - ${it.description}`).join('\n')
    : '• Itens e quantidades discriminados no formulário oficial da cotação.';

  const batchMessageText = `*SOLICITAÇÃO OFICIAL DE ORÇAMENTO - PDDE SANTA CRUZ DO SUL*\n\n` +
    `Olá! A unidade escolar *${currentSchool?.name || 'Escola Municipal de Santa Cruz do Sul'}* convida sua empresa a apresentar cotação de preços para:\n` +
    `📋 *Objeto:* ${quotation?.description || 'Aquisição de materiais para a escola'}\n\n` +
    `📦 *Itens Solicitados:*\n${itemsText}\n\n` +
    `🔗 *Preenchimento Digital Direto pelo Celular/Computador:*\n${quoteUrl}\n\n` +
    `📎 *Planilha Oficial:* Disponível para preenchimento em anexo.\n\n` +
    `📅 *Prazo Limite:* ${quotation?.deadline ? new Date(quotation.deadline).toLocaleDateString('pt-BR') : '5 dias úteis'}\n` +
    `O sistema já preenche o cabeçalho automático via CNPJ e calcula os subtotais. Obrigado pela parceria com a educação municipal!`;

  const handleCopyBatch = () => {
    navigator.clipboard.writeText(batchMessageText);
    setCopiedBatchText(true);
    setTimeout(() => setCopiedBatchText(false), 2500);
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName || !newCnpj) {
      alert('Preencha os campos obrigatórios.');
      return;
    }
    addSupplier({
      companyName: newCompanyName,
      tradeName: newTradeName || newCompanyName,
      cnpj: newCnpj,
      category: newCategory,
      phone: newPhone || '(51) 3715-0000',
      email: newEmail || 'contato@fornecedor.com.br',
      address: newAddress,
      city: 'Santa Cruz do Sul',
      cndValid: true,
      contactPerson: newContactPerson || 'Gerente Comercial',
    });
    setShowAddSupplierModal(false);
    // Reset form
    setNewCompanyName('');
    setNewTradeName('');
    setNewCnpj('');
    setNewPhone('');
    setNewEmail('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded uppercase tracking-wider border border-emerald-400/30">
                Santa Cruz do Sul
              </span>
              <span className="text-xs text-emerald-200">
                Diretório Municipal de Empresas Parceiras
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Banco de Fornecedores Locais Pré-Cadastrados
            </h3>
            <p className="text-xs text-emerald-100/80">
              Selecione 3 empresas para disparo em lote de solicitações de orçamento via WhatsApp e E-mail
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Filters & Actions */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por razão social ou CNPJ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 w-64 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-700"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectThreeOfCategory}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              title="Selecionar as 3 primeiras empresas da categoria filtrada"
            >
              Selecionar 3 Deste Segmento
            </button>
            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              <span>Novo Fornecedor</span>
            </button>
          </div>
        </div>

        {/* Selected Counter & Batch Dispatch Banner */}
        <div className="px-5 py-3 bg-emerald-50/90 border-b border-emerald-200 flex items-center justify-between">
          <div className="text-xs text-emerald-950 font-medium">
            <strong>{selectedSupplierIds.length}</strong> empresa(s) selecionada(s) para esta solicitação.
            {selectedSupplierIds.length >= 3 && (
              <span className="ml-2 text-emerald-800 font-semibold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Mínimo legal de 3 propostas garantido para a concorrência
              </span>
            )}
          </div>

          <button
            disabled={selectedSupplierIds.length === 0}
            onClick={() => setShowBatchModal(true)}
            className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Disparar Solicitação de Orçamento ({selectedSupplierIds.length})</span>
          </button>
        </div>

        {/* Suppliers List */}
        <div className="p-5 max-h-[55vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSuppliers.map((supplier) => {
              const isSelected = selectedSupplierIds.includes(supplier.id);
              return (
                <div
                  key={supplier.id}
                  onClick={() => toggleSelectSupplier(supplier.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {supplier.tradeName}
                        </h4>
                        <div className="text-[11px] text-slate-600 font-normal">
                          {supplier.companyName}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            CNPJ: {supplier.cnpj}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                            {supplier.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{supplier.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{supplier.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-xs">
              Nenhum fornecedor encontrado para o filtro informado.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Total cadastrado: {suppliers.length} empresas de Santa Cruz do Sul</span>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>

      {/* BATCH DISPATCH MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-800" />
                  Disparo em Lote para {selectedSuppliers.length} Fornecedor(es)
                </h4>
                <p className="text-xs text-slate-500">
                  Notifique simultaneamente as empresas selecionadas para receber suas propostas comerciais.
                </p>
              </div>
              <button 
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of recipients */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide block">
                Empresas Destinatárias:
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedSuppliers.map(s => (
                  <span key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded text-xs font-medium">
                    <Building2 className="w-3 h-3 text-emerald-700" />
                    {s.tradeName} ({s.phone})
                  </span>
                ))}
              </div>
            </div>

            {/* Message Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                  Mensagem Automática com Link de Cotação:
                </span>
                <div className="flex items-center gap-3">
                  {quotation && (
                    <button
                      type="button"
                      onClick={() => downloadQuotationCSV(quotation, currentSchool)}
                      className="text-xs text-slate-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                      title="Baixar planilha de cotação para enviar em anexo pelo WhatsApp"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Baixar Planilha (.csv)</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyBatch}
                    className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBatchText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBatchText ? 'Copiada!' : 'Copiar Texto'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                {batchMessageText}
              </div>
            </div>

            {/* Actions for WhatsApp Web */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-semibold text-slate-800 block">
                Disparar diretamente nos WhatsApps dos Fornecedores:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {selectedSuppliers.map((s) => {
                  const phoneStr = s.phone || s.whatsapp || '(51) 3715-0000';
                  const cleanPhone = phoneStr.replace(/\D/g, '');
                  const waNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                  const encoded = encodeURIComponent(batchMessageText);
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        window.open(`https://wa.me/${waNumber}?text=${encoded}`, '_blank');
                      }}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="truncate text-left">
                        <span className="block font-bold truncate">{s.tradeName}</span>
                        <span className="text-[10px] text-slate-500">{phoneStr}</span>
                      </div>
                      <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0 ml-1" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  setShowBatchModal(false);
                  onClose();
                  if (onDispatched) onDispatched();
                }}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Concluir e Retornar ao Módulo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW SUPPLIER MODAL */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <form onSubmit={handleCreateSupplier} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-sm font-bold text-slate-900">
                Cadastrar Fornecedor Local de Santa Cruz do Sul
              </h4>
              <button 
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Razão Social *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome empresarial completo"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  placeholder="Nome comercial"
                  value={newTradeName}
                  onChange={(e) => setNewTradeName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  CNPJ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="00.000.000/0000-00"
                  value={newCnpj}
                  onChange={(e) => setNewCnpj(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Segmento / Categoria
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none"
                >
                  {categories.filter(c => c !== 'TODOS').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="(51) 3715-0000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  E-mail Comercial
                </label>
                <input
                  type="email"
                  placeholder="vendas@fornecedor.com.br"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Contato Comercial
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Oliveira"
                  value={newContactPerson}
                  onChange={(e) => setNewContactPerson(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Endereço em Santa Cruz do Sul
                </label>
                <input
                  type="text"
                  placeholder="Rua, número, bairro"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Salvar Fornecedor
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
