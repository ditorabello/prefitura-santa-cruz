import React, { useState } from 'react';
import { SchoolType } from '../types/pdde';
import { usePDDE } from '../context/PDDEContext';
import { X, PlusCircle } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const NewSchoolModal: React.FC<Props> = ({ onClose }) => {
  const { addSchool } = usePDDE();

  const [formData, setFormData] = useState({
    name: '',
    type: 'EMEF' as SchoolType,
    inep: '',
    neighborhood: '',
    address: '',
    studentCount: 300,
    uexName: '',
    uexCnpj: '',
    presidentName: '',
    presidentCpf: '',
    treasurerName: '',
    treasurerCpf: '',
    fiscalCouncil1: '',
    fiscalCouncil2: '',
    fiscalCouncil3: '',
    bank: 'Banco do Brasil (001)',
    agency: '0180-5',
    accountNumber: '',
    savingsAccount: '',
    contactEmail: '',
    contactPhone: '(51) ',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    addSchool({
      name: formData.name,
      type: formData.type,
      inep: formData.inep,
      neighborhood: formData.neighborhood,
      address: formData.address,
      studentCount: Number(formData.studentCount) || 1,
      uexName: formData.uexName || `Círculo de Pais e Mestres da ${formData.name}`,
      uexCnpj: formData.uexCnpj || '00.000.000/0001-00',
      presidentName: formData.presidentName,
      presidentCpf: formData.presidentCpf,
      treasurerName: formData.treasurerName,
      treasurerCpf: formData.treasurerCpf,
      fiscalCouncilMembers: [
        formData.fiscalCouncil1 || 'Conselheiro 1',
        formData.fiscalCouncil2 || 'Conselheiro 2',
        formData.fiscalCouncil3 || 'Conselheiro 3',
      ],
      bankAccount: {
        bank: formData.bank,
        agency: formData.agency,
        accountNumber: formData.accountNumber || '00.000-0',
        savingsAccount: formData.savingsAccount || '51.000.000-0',
      },
      status: 'em_elaboracao',
      contactEmail: formData.contactEmail || `escola@educa.santacruz.rs.gov.br`,
      contactPhone: formData.contactPhone || '(51) 3715-0000',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col my-8 border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Cadastrar Nova Escola Municipal
            </h2>
            <p className="text-xs text-slate-500">
              Incluir nova EMEF, EMEI ou Núcleo na rede municipal de Santa Cruz do Sul
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-slate-700 font-medium mb-1">Nome da Escola *</label>
              <input
                type="text"
                required
                placeholder="Ex: EMEF São Canísio"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Tipo de Unidade</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as SchoolType })}
                className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="EMEF">EMEF (Fundamental)</option>
                <option value="EMEI">EMEI (Infantil)</option>
                <option value="CEMEJA">CEMEJA (EJA)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Bairro / Localidade</label>
              <input
                type="text"
                placeholder="Ex: Bairro Dona Carlota"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Código INEP</label>
              <input
                type="text"
                placeholder="Ex: 43059999"
                value={formData.inep}
                onChange={(e) => setFormData({ ...formData, inep: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Nº Matrículas (Censo)</label>
              <input
                type="number"
                value={formData.studentCount}
                onChange={(e) => setFormData({ ...formData, studentCount: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-2">Unidade Executora (CPM / Associação)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Nome da UEx / CPM</label>
                <input
                  type="text"
                  placeholder="Ex: Círculo de Pais e Mestres da EMEF São Canísio"
                  value={formData.uexName}
                  onChange={(e) => setFormData({ ...formData, uexName: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">CNPJ do CPM</label>
                <input
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={formData.uexCnpj}
                  onChange={(e) => setFormData({ ...formData, uexCnpj: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Presidente do CPM</label>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={formData.presidentName}
                  onChange={(e) => setFormData({ ...formData, presidentName: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Tesoureiro(a) do CPM</label>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={formData.treasurerName}
                  onChange={(e) => setFormData({ ...formData, treasurerName: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-2">Conta Bancária do PDDE</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Agência</label>
                <input
                  type="text"
                  value={formData.agency}
                  onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Conta Corrente</label>
                <input
                  type="text"
                  placeholder="Ex: 15.340-2"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Conta Poupança</label>
                <input
                  type="text"
                  placeholder="Ex: 51.015.340-2"
                  value={formData.savingsAccount}
                  onChange={(e) => setFormData({ ...formData, savingsAccount: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-800 text-white rounded-md hover:bg-emerald-900 transition-colors font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Cadastrar Escola
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
