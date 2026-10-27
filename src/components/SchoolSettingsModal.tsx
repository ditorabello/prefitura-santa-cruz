import React, { useState } from 'react';
import { School, SchoolType } from '../types/pdde';
import { usePDDE } from '../context/PDDEContext';
import { X, Save, Building, User, Landmark } from 'lucide-react';

interface Props {
  school: School | undefined;
  onClose: () => void;
}

export const SchoolSettingsModal: React.FC<Props> = ({ school, onClose }) => {
  const { updateSchool } = usePDDE();

  if (!school) return null;

  const [formData, setFormData] = useState({
    name: school.name,
    type: school.type,
    inep: school.inep,
    neighborhood: school.neighborhood,
    address: school.address,
    studentCount: school.studentCount,
    uexName: school.uexName,
    uexCnpj: school.uexCnpj,
    presidentName: school.presidentName,
    presidentCpf: school.presidentCpf,
    treasurerName: school.treasurerName,
    treasurerCpf: school.treasurerCpf,
    fiscalCouncil1: school.fiscalCouncilMembers[0] || '',
    fiscalCouncil2: school.fiscalCouncilMembers[1] || '',
    fiscalCouncil3: school.fiscalCouncilMembers[2] || '',
    bank: school.bankAccount.bank,
    agency: school.bankAccount.agency,
    accountNumber: school.bankAccount.accountNumber,
    savingsAccount: school.bankAccount.savingsAccount,
    contactEmail: school.contactEmail,
    contactPhone: school.contactPhone,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchool(school.id, {
      name: formData.name,
      type: formData.type as SchoolType,
      inep: formData.inep,
      neighborhood: formData.neighborhood,
      address: formData.address,
      studentCount: Number(formData.studentCount),
      uexName: formData.uexName,
      uexCnpj: formData.uexCnpj,
      presidentName: formData.presidentName,
      presidentCpf: formData.presidentCpf,
      treasurerName: formData.treasurerName,
      treasurerCpf: formData.treasurerCpf,
      fiscalCouncilMembers: [
        formData.fiscalCouncil1,
        formData.fiscalCouncil2,
        formData.fiscalCouncil3,
      ].filter(Boolean),
      bankAccount: {
        bank: formData.bank,
        agency: formData.agency,
        accountNumber: formData.accountNumber,
        savingsAccount: formData.savingsAccount,
      },
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col my-8 border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Configurações da Escola e Unidade Executora (CPM)
            </h2>
            <p className="text-xs text-slate-500">
              Dados cadastrais utilizados na emissão dos anexos oficiais e termos de doação
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Section 1: Escola */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-200 text-slate-800 font-semibold">
              <Building className="w-4 h-4 text-emerald-700" />
              <span>Dados da Unidade Escolar</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-medium mb-1">Nome da Escola</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Etapa de Ensino</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SchoolType })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="EMEF">EMEF (Ensino Fundamental)</option>
                  <option value="EMEI">EMEI (Educação Infantil)</option>
                  <option value="CEMEJA">CEMEJA (EJA)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Código INEP</label>
                <input
                  type="text"
                  value={formData.inep}
                  onChange={(e) => setFormData({ ...formData, inep: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Bairro / Localidade</label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Matrículas Censo Escolar</label>
                <input
                  type="number"
                  value={formData.studentCount}
                  onChange={(e) => setFormData({ ...formData, studentCount: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-slate-700 font-medium mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Unidade Executora (CPM) */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-200 text-slate-800 font-semibold">
              <User className="w-4 h-4 text-emerald-700" />
              <span>Unidade Executora Própria (UEx / CPM) e Diretoria</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Razão Social do CPM / UEx</label>
                <input
                  type="text"
                  required
                  value={formData.uexName}
                  onChange={(e) => setFormData({ ...formData, uexName: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">CNPJ do CPM</label>
                <input
                  type="text"
                  required
                  value={formData.uexCnpj}
                  onChange={(e) => setFormData({ ...formData, uexCnpj: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Nome do(a) Presidente do CPM</label>
                <input
                  type="text"
                  required
                  value={formData.presidentName}
                  onChange={(e) => setFormData({ ...formData, presidentName: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">CPF do(a) Presidente</label>
                <input
                  type="text"
                  value={formData.presidentCpf}
                  onChange={(e) => setFormData({ ...formData, presidentCpf: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Nome do(a) Tesoureiro(a)</label>
                <input
                  type="text"
                  required
                  value={formData.treasurerName}
                  onChange={(e) => setFormData({ ...formData, treasurerName: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">CPF do(a) Tesoureiro(a)</label>
                <input
                  type="text"
                  value={formData.treasurerCpf}
                  onChange={(e) => setFormData({ ...formData, treasurerCpf: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Conselho Fiscal (3 membros) */}
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="block font-semibold text-slate-700 mb-2">Membros do Conselho Fiscal (Titulares)</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Membro 1"
                  value={formData.fiscalCouncil1}
                  onChange={(e) => setFormData({ ...formData, fiscalCouncil1: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Membro 2"
                  value={formData.fiscalCouncil2}
                  onChange={(e) => setFormData({ ...formData, fiscalCouncil2: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Membro 3"
                  value={formData.fiscalCouncil3}
                  onChange={(e) => setFormData({ ...formData, fiscalCouncil3: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Dados Bancários */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-200 text-slate-800 font-semibold">
              <Landmark className="w-4 h-4 text-emerald-700" />
              <span>Dados Bancários Específicos do PDDE</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Banco</label>
                <input
                  type="text"
                  value={formData.bank}
                  onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
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
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Conta Poupança / Aplicação</label>
                <input
                  type="text"
                  value={formData.savingsAccount}
                  onChange={(e) => setFormData({ ...formData, savingsAccount: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
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
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
