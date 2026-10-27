import React, { useState } from 'react';
import { usePDDE } from '../context/PDDEContext';
import { AssetItem } from '../types/pdde';
import { formatBRL, formatDateBR } from '../utils/formatters';
import { 
  Package, 
  Printer, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Building, 
  X,
  FileCheck2
} from 'lucide-react';

export const AssetsView: React.FC = () => {
  const { currentSchool, selectedYear, schoolAssets, addAsset, updateAsset, deleteAsset } = usePDDE();

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    brandModel: '',
    serialNumber: '',
    quantity: 1,
    unitValue: '',
    location: 'Laboratório Pedagógico',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    tombamentoNumber: `PMSCS-PAT-${selectedYear}/`,
  });

  if (!currentSchool) return null;

  const totalAssetsValue = schoolAssets.reduce((acc, a) => acc + a.totalValue, 0);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(formData.quantity) || 1;
    const unit = parseFloat(formData.unitValue) || 0;
    const total = qty * unit;

    addAsset({
      schoolId: currentSchool.id,
      year: selectedYear,
      expenseId: `manual-${Date.now()}`,
      description: formData.description,
      brandModel: formData.brandModel,
      serialNumber: formData.serialNumber,
      quantity: qty,
      unitValue: unit,
      totalValue: total,
      location: formData.location,
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: formData.invoiceDate,
      tombamentoNumber: formData.tombamentoNumber || `PMSCS-PAT-${selectedYear}/${String(Math.floor(Math.random() * 8999 + 1000))}`,
      donatedToMunicipality: true,
    });

    setIsNewAssetModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Bens Permanentes e Termo de Doação (Capital)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro dos bens patrimoniais adquiridos para doação e tombamento junto ao patrimônio da Prefeitura de Santa Cruz do Sul
          </p>
        </div>

        <div className="flex items-center gap-2">
          {schoolAssets.length > 0 && (
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 hover:text-emerald-900 hover:border-emerald-600 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-emerald-700" />
              <span>Imprimir Termo de Doação</span>
            </button>
          )}

          <button
            onClick={() => {
              setFormData({
                description: '',
                brandModel: '',
                serialNumber: '',
                quantity: 1,
                unitValue: '',
                location: 'Laboratório Pedagógico',
                invoiceNumber: '',
                invoiceDate: new Date().toISOString().split('T')[0],
                tombamentoNumber: `PMSCS-PAT-${selectedYear}/${String(Math.floor(Math.random() * 8999 + 1000))}`,
              });
              setIsNewAssetModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-800 text-white rounded-md text-xs font-semibold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Bem Permanente</span>
          </button>
        </div>
      </div>

      {/* Legal requirement alert banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 flex items-start gap-3">
        <Building className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-slate-900 block">Norma de Incorporação ao Patrimônio Público Municipal:</strong>
          <p>
            Os bens adquiridos com recursos de Capital do PDDE pela Unidade Executora (CPM) devem ser formalmente 
            doados ao Município de Santa Cruz do Sul mediante <strong>Termo de Doação</strong>, com descrição de série e tombamento, 
            permanecendo em uso e guarda da escola beneficiada.
          </p>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {schoolAssets.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Nenhum bem de Capital cadastrado para este exercício. Os itens de despesas de Capital geram bens automaticamente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Tombamento Municipal</th>
                  <th className="py-3 px-4">Descrição do Bem / Equipamento</th>
                  <th className="py-3 px-4">Marca / Nº de Série</th>
                  <th className="py-3 px-4">Local na Escola</th>
                  <th className="py-3 px-4">NF de Origem</th>
                  <th className="py-3 px-4 text-center">Qtd</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schoolAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                        {asset.tombamentoNumber || 'Aguardando Código'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs">
                      {asset.description}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{asset.brandModel || 'Não informada'}</div>
                      {asset.serialNumber && (
                        <span className="font-mono text-[10px] text-slate-400 block">
                          S/N: {asset.serialNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {asset.location}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      NF {asset.invoiceNumber}
                      <span className="block text-[10px] text-slate-400">
                        {formatDateBR(asset.invoiceDate)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {asset.quantity}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                      {formatBRL(asset.totalValue)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Excluir o bem ${asset.description}?`)) {
                            deleteAsset(asset.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Excluir Bem"
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
                    Valor Total dos Bens a Doar ao Município:
                  </td>
                  <td className="py-3 px-4 font-mono text-right text-emerald-900">
                    {formatBRL(totalAssetsValue)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Adicionar Bem */}
      {isNewAssetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-slate-900 text-sm">
                Cadastrar Bem Permanente de Capital
              </h3>
              <button onClick={() => setIsNewAssetModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Descrição do Bem / Equipamento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Computador All-in-One 24 polegadas Core i5"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Marca / Modelo</label>
                  <input
                    type="text"
                    placeholder="Ex: Dell Inspiron 24"
                    value={formData.brandModel}
                    onChange={(e) => setFormData({ ...formData, brandModel: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Número de Série</label>
                  <input
                    type="text"
                    placeholder="Ex: BR5402919-DL"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Quantidade *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Valor Unitário (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.unitValue}
                    onChange={(e) => setFormData({ ...formData, unitValue: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 font-mono font-bold focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Localização na Escola</label>
                  <input
                    type="text"
                    placeholder="Ex: Sala de Informática"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Nº Nota Fiscal de Origem</label>
                  <input
                    type="text"
                    placeholder="Ex: 008912"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewAssetModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 text-white rounded font-semibold hover:bg-emerald-900 cursor-pointer shadow-xs"
                >
                  Salvar Bem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Print: Termo de Doação Oficial ao Município */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col my-8 border border-slate-200">
            <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl print:hidden">
              <span className="font-bold text-slate-800 text-xs">
                Termo de Doação e Tombamento de Bens (Pronto para Impressão)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-800 text-white rounded text-xs font-semibold hover:bg-emerald-900 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Termo de Doação</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto bg-white text-slate-900 text-xs font-serif leading-relaxed">
              {/* Header */}
              <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
                <h1 className="font-bold text-sm uppercase tracking-wide">
                  ESTADO DO RIO GRANDE DO SUL
                </h1>
                <h2 className="font-bold text-base uppercase">
                  PREFEITURA MUNICIPAL DE SANTA CRUZ DO SUL
                </h2>
                <h3 className="font-semibold text-xs uppercase text-slate-700">
                  SECRETARIA MUNICIPAL DE EDUCAÇÃO - SEE
                </h3>
                <div className="mt-3 inline-block font-sans font-bold text-xs uppercase bg-slate-100 border border-slate-300 px-4 py-1.5">
                  TERMO DE DOAÇÃO E INCORPORAÇÃO PATRIMONIAL DE BENS PERMANENTES
                </div>
              </div>

              {/* Text */}
              <div className="space-y-4 font-sans text-xs mb-6 text-justify">
                <p>
                  Pelo presente instrumento, a Unidade Executora Própria denominada <strong>{currentSchool.uexName}</strong>, 
                  inscrita no CNPJ sob o nº <strong>{currentSchool.uexCnpj}</strong>, neste ato representada por sua 
                  Presidente, <strong>{currentSchool.presidentName}</strong> (CPF {currentSchool.presidentCpf}), 
                  <strong> DOA ao MUNICÍPIO DE SANTA CRUZ DO SUL</strong>, pessoa jurídica de direito público interno, 
                  para incorporação ao acervo patrimonial da Secretaria Municipal de Educação (SEE), 
                  os bens permanentes abaixo descritos e caracterizados, adquiridos com recursos oriundos do 
                  Programa Dinheiro Direto na Escola (PDDE) no exercício de <strong>{selectedYear}</strong>:
                </p>

                <table className="w-full text-left border-collapse border border-slate-400 text-[11px] my-4">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="border border-slate-400 p-2 text-center w-10">Item</th>
                      <th className="border border-slate-400 p-2">Discriminação do Bem</th>
                      <th className="border border-slate-400 p-2">Marca / Série</th>
                      <th className="border border-slate-400 p-2 font-mono">Nota Fiscal</th>
                      <th className="border border-slate-400 p-2 text-center">Tombamento</th>
                      <th className="border border-slate-400 p-2 text-right">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolAssets.map((a, i) => (
                      <tr key={a.id}>
                        <td className="border border-slate-400 p-2 text-center">{i + 1}</td>
                        <td className="border border-slate-400 p-2 font-medium">{a.description}</td>
                        <td className="border border-slate-400 p-2">{a.brandModel} {a.serialNumber ? `(S/N: ${a.serialNumber})` : ''}</td>
                        <td className="border border-slate-400 p-2 font-mono">NF {a.invoiceNumber}</td>
                        <td className="border border-slate-400 p-2 text-center font-mono">{a.tombamentoNumber}</td>
                        <td className="border border-slate-400 p-2 font-mono text-right">{formatBRL(a.totalValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold">
                    <tr>
                      <td colSpan={5} className="border border-slate-400 p-2 text-right">
                        VALOR TOTAL DOS BENS DOADOS:
                      </td>
                      <td className="border border-slate-400 p-2 font-mono text-right">
                        {formatBRL(totalAssetsValue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <p>
                  Os bens doados encontram-se em perfeito estado de conservação e funcionamento, destinados à melhoria 
                  do ambiente pedagógico e atendimento dos estudantes da <strong>{currentSchool.name}</strong>, ficando sob 
                  a responsabilidade e guarda da referida escola municipal.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-10 font-sans text-xs space-y-12">
                <div className="grid grid-cols-2 gap-8 text-center">
                  <div>
                    <div className="border-t border-slate-800 pt-1 font-semibold">
                      {currentSchool.presidentName}
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      Doador: Presidente da UEx / CPM
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-slate-800 pt-1 font-semibold">
                      Secretaria Municipal de Educação
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      Donatário: Município de Santa Cruz do Sul
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-500">
                  Santa Cruz do Sul - RS, _____ de ____________________ de {selectedYear}.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
