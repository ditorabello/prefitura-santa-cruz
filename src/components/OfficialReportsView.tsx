import React, { useState } from 'react';
import { usePDDE } from '../context/PDDEContext';
import { CouncilOpinion } from '../types/pdde';
import { formatBRL, formatDateBR, formatCNPJ, formatCPF } from '../utils/formatters';
import { 
  FileCheck2, 
  Printer, 
  FileText, 
  Save, 
  CheckCircle, 
  Award, 
  HelpCircle,
  Building,
  CheckCircle2
} from 'lucide-react';

export const OfficialReportsView: React.FC = () => {
  const { 
    currentSchool, 
    selectedYear, 
    schoolTransfers, 
    schoolYields, 
    schoolExpenses, 
    schoolAssets, 
    schoolCouncilOpinion,
    saveCouncilOpinion,
    updateSchoolStatus,
    financialSummary 
  } = usePDDE();

  const [activeReportTab, setActiveReportTab] = useState<'anexo1' | 'anexo2' | 'parecer' | 'folha_rosto'>('anexo1');

  // Council opinion form state
  const [opinionData, setOpinionData] = useState<CouncilOpinion>(() => {
    return schoolCouncilOpinion || {
      schoolId: currentSchool?.id || '',
      year: selectedYear,
      meetingDate: new Date().toISOString().split('T')[0],
      opinionType: 'APROVADO',
      observations: `O Conselho Fiscal do ${currentSchool?.uexName || 'CPM'} reuniu-se ordinariamente e examinou minuciosamente todos os extratos bancários, notas fiscais, mapas de cotação e comprovantes de pagamento do exercício de ${selectedYear}. Constatou-se a exata correspondência dos saldos e a aplicação estrita nas finalidades pedagógicas e de manutenção escolar, recomendando a aprovação integral das contas.`,
      signedByPresident: true,
      signedByTreasurer: true,
      fiscalCouncilSignatures: [true, true, true],
    };
  });

  const [saveFeedback, setSaveFeedback] = useState(false);

  if (!currentSchool) return null;

  const handleSaveOpinion = (e: React.FormEvent) => {
    e.preventDefault();
    saveCouncilOpinion(opinionData);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 3000);
  };

  const handleSendToSEE = () => {
    if (confirm('Deseja enviar formalmente esta prestação de contas à Secretaria Municipal de Educação (SEE) de Santa Cruz do Sul? O status mudará para "Enviado à SEE" para análise técnica.')) {
      updateSchoolStatus(currentSchool.id, 'enviado_see', 'Prestação de contas formalmente enviada pela escola à SEE para homologação.');
      alert('Prestação de contas enviada com sucesso para a Secretaria Municipal de Educação.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Dossiê Oficial de Prestação de Contas (SEE & FNDE)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Geração dos formulários padronizados para assinatura física, protocolo na Secretaria Municipal de Educação e SiGPC
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-emerald-800 text-white rounded-md text-xs font-semibold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório Selecionado</span>
          </button>

          {currentSchool.status !== 'aprovado' && currentSchool.status !== 'enviado_see' && (
            <button
              onClick={handleSendToSEE}
              className="px-3.5 py-2 bg-sky-800 text-white rounded-md text-xs font-semibold hover:bg-sky-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Enviar Dossiê à SEE</span>
            </button>
          )}
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-medium print:hidden">
        <button
          onClick={() => setActiveReportTab('anexo1')}
          className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
            activeReportTab === 'anexo1'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Anexo I - Demonstrativo da Receita e Despesa (DRE)
        </button>

        <button
          onClick={() => setActiveReportTab('anexo2')}
          className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
            activeReportTab === 'anexo2'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Anexo II - Relação de Pagamentos Efetuados
        </button>

        <button
          onClick={() => setActiveReportTab('parecer')}
          className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
            activeReportTab === 'parecer'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Parecer Conclusivo do Conselho Fiscal (CPM)
        </button>

        <button
          onClick={() => setActiveReportTab('folha_rosto')}
          className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
            activeReportTab === 'folha_rosto'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Folha de Rosto / Protocolo Geral SEE
        </button>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER (Styled like formal A4 paper) */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs max-w-5xl mx-auto text-slate-900 font-serif leading-relaxed text-xs">
        {/* Institutional Municipal Header */}
        <div className="text-center pb-4 border-b-2 border-slate-900 mb-6 font-sans">
          <div className="text-xs uppercase tracking-widest text-slate-600 font-semibold">
            ESTADO DO RIO GRANDE DO SUL
          </div>
          <h1 className="text-base font-bold uppercase tracking-tight text-slate-950 mt-0.5">
            PREFEITURA MUNICIPAL DE SANTA CRUZ DO SUL
          </h1>
          <h2 className="text-xs uppercase font-semibold text-slate-700">
            SECRETARIA MUNICIPAL DE EDUCAÇÃO - SEE
          </h2>
          <div className="text-[11px] text-slate-500 mt-1">
            Programa Dinheiro Direto na Escola (PDDE Municipal e Federal) · Exercício {selectedYear}
          </div>
        </div>

        {/* 1. ANEXO I: DEMONSTRATIVO DA RECEITA E DA DESPESA */}
        {activeReportTab === 'anexo1' && (
          <div className="space-y-6 font-sans">
            <div className="text-center">
              <h3 className="font-bold text-sm uppercase bg-slate-100 border border-slate-300 py-1.5 px-4 inline-block">
                ANEXO I - DEMONSTRATIVO DA RECEITA E DA DESPESA E DO RENDIMENTO DE APLICAÇÃO FINANCEIRA
              </h3>
            </div>

            {/* Entity Identification */}
            <div className="border border-slate-400 p-3 rounded space-y-1.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div><strong>Unidade Executora (UEx):</strong> {currentSchool.uexName}</div>
                <div><strong>CNPJ do CPM:</strong> {formatCNPJ(currentSchool.uexCnpj)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><strong>Unidade Escolar:</strong> {currentSchool.name}</div>
                <div><strong>Município / UF:</strong> Santa Cruz do Sul - RS</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><strong>Banco / Agência / Conta:</strong> {currentSchool.bankAccount.bank} · Ag {currentSchool.bankAccount.agency} · CC {currentSchool.bankAccount.accountNumber}</div>
                <div><strong>Exercício de Referência:</strong> {selectedYear}</div>
              </div>
            </div>

            {/* Financial Summary Table */}
            <table className="w-full text-left border-collapse border border-slate-400 text-xs">
              <thead className="bg-slate-100 font-bold">
                <tr>
                  <th className="border border-slate-400 p-2.5">DISCRIMINAÇÃO</th>
                  <th className="border border-slate-400 p-2.5 text-right">CUSTEIO (R$)</th>
                  <th className="border border-slate-400 p-2.5 text-right">CAPITAL (R$)</th>
                  <th className="border border-slate-400 p-2.5 text-right">TOTAL GERAL (R$)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-400 p-2">1. Saldo Anterior (Exercício Anterior)</td>
                  <td className="border border-slate-400 p-2 text-right font-mono">R$ 0,00</td>
                  <td className="border border-slate-400 p-2 text-right font-mono">R$ 0,00</td>
                  <td className="border border-slate-400 p-2 text-right font-mono">R$ 0,00</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">2. Repasses Creditados no Exercício (Municipal + FNDE)</td>
                  <td className="border border-slate-400 p-2 text-right font-mono">
                    {formatBRL(schoolTransfers.filter(t => t.category === 'CUSTEIO').reduce((acc, t) => acc + t.value, 0))}
                  </td>
                  <td className="border border-slate-400 p-2 text-right font-mono">
                    {formatBRL(schoolTransfers.filter(t => t.category === 'CAPITAL').reduce((acc, t) => acc + t.value, 0))}
                  </td>
                  <td className="border border-slate-400 p-2 text-right font-mono font-bold">
                    {formatBRL(financialSummary.totalTransfers)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">3. Rendimentos de Aplicação Financeira</td>
                  <td className="border border-slate-400 p-2 text-right font-mono">
                    {formatBRL(schoolYields.filter(y => y.category === 'CUSTEIO').reduce((acc, y) => acc + y.value, 0))}
                  </td>
                  <td className="border border-slate-400 p-2 text-right font-mono">
                    {formatBRL(schoolYields.filter(y => y.category === 'CAPITAL').reduce((acc, y) => acc + y.value, 0))}
                  </td>
                  <td className="border border-slate-400 p-2 text-right font-mono">
                    {formatBRL(financialSummary.totalYields)}
                  </td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="border border-slate-400 p-2">4. TOTAL DOS RECURSOS DISPONÍVEIS (1 + 2 + 3)</td>
                  <td className="border border-slate-400 p-2 text-right font-mono">
                    {formatBRL(financialSummary.byCategory.custeioRevenue)}
                  </td>
                  <td className="border border-slate-400 p-2 text-right font-mono">
                    {formatBRL(financialSummary.byCategory.capitalRevenue)}
                  </td>
                  <td className="border border-slate-400 p-2 text-right font-mono text-emerald-900">
                    {formatBRL(financialSummary.totalRevenue)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">5. Despesas Realizadas / Pagamentos Efetuados</td>
                  <td className="border border-slate-400 p-2 text-right font-mono text-red-700">
                    -{formatBRL(financialSummary.byCategory.custeioExpenses)}
                  </td>
                  <td className="border border-slate-400 p-2 text-right font-mono text-red-700">
                    -{formatBRL(financialSummary.byCategory.capitalExpenses)}
                  </td>
                  <td className="border border-slate-400 p-2 text-right font-mono font-bold text-red-700">
                    -{formatBRL(financialSummary.totalExpenses)}
                  </td>
                </tr>
                <tr className="bg-slate-100 font-bold">
                  <td className="border border-slate-400 p-2.5">6. SALDO A REPROGRAMAR PARA O EXERCÍCIO SEGUINTE (4 - 5)</td>
                  <td className="border border-slate-400 p-2.5 text-right font-mono text-slate-900">
                    {formatBRL(financialSummary.byCategory.custeioBalance)}
                  </td>
                  <td className="border border-slate-400 p-2.5 text-right font-mono text-slate-900">
                    {formatBRL(financialSummary.byCategory.capitalBalance)}
                  </td>
                  <td className="border border-slate-400 p-2.5 text-right font-mono text-emerald-900 text-sm">
                    {formatBRL(financialSummary.balance)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Declaration and Signatures */}
            <div className="pt-8 space-y-12">
              <p className="text-justify text-xs text-slate-700">
                Declaramos, sob as penas da lei, que as despesas constantes deste demonstrativo foram regularmente realizadas 
                em benefício da comunidade escolar, com estrita observância das normas do PDDE e comprovação arquivada nesta escola.
              </p>

              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-t border-slate-800 pt-1.5 font-semibold">
                    {currentSchool.presidentName}
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Presidente do {currentSchool.uexName} (CPF {formatCPF(currentSchool.presidentCpf)})
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-800 pt-1.5 font-semibold">
                    {currentSchool.treasurerName}
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Tesoureiro(a) do CPM (CPF {formatCPF(currentSchool.treasurerCpf)})
                  </div>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500">
                Santa Cruz do Sul - RS, _____ de ____________________ de {selectedYear}.
              </div>
            </div>
          </div>
        )}

        {/* 2. ANEXO II: RELAÇÃO DE PAGAMENTOS EFETUADOS */}
        {activeReportTab === 'anexo2' && (
          <div className="space-y-6 font-sans">
            <div className="text-center">
              <h3 className="font-bold text-sm uppercase bg-slate-100 border border-slate-300 py-1.5 px-4 inline-block">
                ANEXO II - RELAÇÃO DE PAGAMENTOS EFETUADOS
              </h3>
            </div>

            <div className="border border-slate-400 p-2.5 rounded text-xs grid grid-cols-2 gap-2">
              <div><strong>UEx / CPM:</strong> {currentSchool.uexName}</div>
              <div><strong>CNPJ:</strong> {formatCNPJ(currentSchool.uexCnpj)}</div>
              <div><strong>Escola:</strong> {currentSchool.name}</div>
              <div><strong>Exercício:</strong> {selectedYear}</div>
            </div>

            <table className="w-full text-left border-collapse border border-slate-400 text-[11px]">
              <thead className="bg-slate-100 font-bold">
                <tr>
                  <th className="border border-slate-400 p-2 text-center w-10">Item</th>
                  <th className="border border-slate-400 p-2">Nome do Favorecido / Razão Social</th>
                  <th className="border border-slate-400 p-2 font-mono">CNPJ / CPF</th>
                  <th className="border border-slate-400 p-2">Nº Doc Fiscal</th>
                  <th className="border border-slate-400 p-2">Data Emissão</th>
                  <th className="border border-slate-400 p-2">Forma / Nº Transação</th>
                  <th className="border border-slate-400 p-2 text-center">Rubrica</th>
                  <th className="border border-slate-400 p-2 text-right">Valor Pago (R$)</th>
                </tr>
              </thead>
              <tbody>
                {schoolExpenses.map((exp, idx) => (
                  <tr key={exp.id}>
                    <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-400 p-2 font-medium">{exp.supplierName}</td>
                    <td className="border border-slate-400 p-2 font-mono">{formatCNPJ(exp.supplierCnpjCpf)}</td>
                    <td className="border border-slate-400 p-2 font-mono">NF {exp.invoiceNumber}</td>
                    <td className="border border-slate-400 p-2">{formatDateBR(exp.invoiceDate)}</td>
                    <td className="border border-slate-400 p-2 font-mono text-[10px]">{exp.paymentMethod} {exp.paymentDocNumber}</td>
                    <td className="border border-slate-400 p-2 text-center text-[10px] font-bold">{exp.category}</td>
                    <td className="border border-slate-400 p-2 font-mono text-right font-bold">{formatBRL(exp.netValue)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold">
                <tr>
                  <td colSpan={7} className="border border-slate-400 p-2 text-right">
                    TOTAL DOS PAGAMENTOS EFETUADOS:
                  </td>
                  <td className="border border-slate-400 p-2 font-mono text-right text-emerald-950">
                    {formatBRL(financialSummary.totalExpenses)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Signatures */}
            <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="border-t border-slate-800 pt-1 font-semibold">{currentSchool.presidentName}</div>
                <div className="text-slate-600 text-[11px]">Presidente da UEx / CPM</div>
              </div>
              <div>
                <div className="border-t border-slate-800 pt-1 font-semibold">{currentSchool.treasurerName}</div>
                <div className="text-slate-600 text-[11px]">Tesoureiro(a) do CPM</div>
              </div>
            </div>
          </div>
        )}

        {/* 3. PARECER CONCLUSIVO DO CONSELHO FISCAL */}
        {activeReportTab === 'parecer' && (
          <div className="space-y-6 font-sans">
            <div className="text-center">
              <h3 className="font-bold text-sm uppercase bg-slate-100 border border-slate-300 py-1.5 px-4 inline-block">
                PARECER CONCLUSIVO DO CONSELHO FISCAL DO CPM
              </h3>
            </div>

            <form onSubmit={handleSaveOpinion} className="space-y-4">
              <div className="border border-slate-300 p-3 rounded bg-slate-50 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Data da Reunião Ordinária do Conselho</label>
                    <input
                      type="date"
                      value={opinionData.meetingDate}
                      onChange={(e) => setOpinionData({ ...opinionData, meetingDate: e.target.value })}
                      className="border border-slate-300 rounded px-2.5 py-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Conclusão do Parecer</label>
                    <select
                      value={opinionData.opinionType}
                      onChange={(e) => setOpinionData({ ...opinionData, opinionType: e.target.value as any })}
                      className="border border-slate-300 rounded px-2.5 py-1 bg-white font-bold"
                    >
                      <option value="APROVADO">APROVADO INTEGRALMENTE (Sem Ressalvas)</option>
                      <option value="APROVADO_COM_RESSALVAS">Aprovado com Ressalvas Justificadas</option>
                      <option value="REJEITADO">Rejeitado por Inconsistência Contábil</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Texto Conclusivo da Ata</label>
                  <textarea
                    rows={4}
                    value={opinionData.observations}
                    onChange={(e) => setOpinionData({ ...opinionData, observations: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 bg-white text-xs leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end pt-1 print:hidden">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-800 text-white rounded font-semibold text-xs hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Parecer do Conselho</span>
                  </button>
                </div>

                {saveFeedback && (
                  <div className="text-emerald-700 font-semibold text-xs text-right">
                    Parecer do Conselho Fiscal atualizado com sucesso!
                  </div>
                )}
              </div>

              {/* Printable Body of Opinion */}
              <div className="pt-4 space-y-8 text-xs leading-relaxed">
                <p className="text-justify">
                  Aos <strong>{formatDateBR(opinionData.meetingDate)}</strong>, reuniram-se os membros do Conselho Fiscal da 
                  Unidade Executora Própria (<strong>{currentSchool.uexName}</strong>), vinculada à 
                  <strong> {currentSchool.name}</strong>, para proceder à análise e exame da prestação de contas dos recursos 
                  financeiros repassados no exercício de <strong>{selectedYear}</strong>, relativos ao Programa Dinheiro Direto na Escola 
                  (PDDE Municipal e FNDE).
                </p>

                <p className="text-justify">
                  Após cuidadosa conferência dos livros, extratos da conta bancária mantida no Banco do Brasil, 
                  comprovantes fiscais de compras, mapas comparativos de preços e termos de tombamento de bens patrimoniais, 
                  este colegiado emite o seguinte parecer: 
                  <strong className="uppercase"> {opinionData.opinionType === 'APROVADO' ? 'APROVAÇÃO REGULAR E INTEGRAL' : opinionData.opinionType}</strong>.
                </p>

                {/* Signatures of the 3 council members */}
                <div className="pt-8 space-y-6">
                  <div className="font-semibold text-slate-800 text-center">
                    MEMBROS TITULARES DO CONSELHO FISCAL DO CPM:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs pt-4">
                    {currentSchool.fiscalCouncilMembers.map((member, i) => (
                      <div key={i}>
                        <div className="border-t border-slate-800 pt-1 font-semibold">{member}</div>
                        <div className="text-slate-500 text-[10px]">Conselheiro(a) Fiscal Titular</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-8 text-center text-xs pt-6">
                    <div>
                      <div className="border-t border-slate-800 pt-1 font-semibold">{currentSchool.presidentName}</div>
                      <div className="text-slate-500 text-[10px]">Presidente da UEx / CPM</div>
                    </div>
                    <div>
                      <div className="border-t border-slate-800 pt-1 font-semibold">{currentSchool.treasurerName}</div>
                      <div className="text-slate-500 text-[10px]">Tesoureiro(a) da UEx / CPM</div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* 4. FOLHA DE ROSTO / PROTOCOLO GERAL SEE */}
        {activeReportTab === 'folha_rosto' && (
          <div className="space-y-6 font-sans">
            <div className="text-center">
              <h3 className="font-bold text-sm uppercase bg-slate-100 border border-slate-300 py-1.5 px-4 inline-block">
                FOLHA DE ROSTO E PROTOCOLO GERAL DE PRESTAÇÃO DE CONTAS - SEE
              </h3>
            </div>

            <div className="border-2 border-slate-400 p-5 rounded space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200">
                <div><strong>Unidade Escolar:</strong> {currentSchool.name} ({currentSchool.type})</div>
                <div><strong>INEP:</strong> {currentSchool.inep}</div>
                <div><strong>Localidade / Bairro:</strong> {currentSchool.neighborhood}</div>
                <div><strong>Exercício Fiscal:</strong> {selectedYear}</div>
                <div><strong>Nº de Alunos Atendidos:</strong> {currentSchool.studentCount} matrículas (Censo)</div>
                <div><strong>Telefone / Contato:</strong> {currentSchool.contactPhone}</div>
              </div>

              <div>
                <strong className="block mb-1 text-slate-800">Checklist dos Documentos Encaminhados na Pasta:</strong>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Ofício de Encaminhamento assinado pela Direção</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Demonstrativo da Receita e Despesa (Anexo I)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Relação de Pagamentos Efetuados (Anexo II)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Termo de Doação dos Bens Adquiridos em Capital</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Notas Fiscais originais com carimbo de ateste</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Comprovantes de Débito Bancário e PIX</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Extratos Bancários integrais da conta do BB</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Ata com Parecer do Conselho Fiscal do CPM</span>
                  </div>
                </div>
              </div>

              {/* Protocol Stamp Field */}
              <div className="border border-dashed border-slate-400 p-4 rounded bg-slate-50 text-center space-y-2 mt-4">
                <span className="font-bold text-slate-800 block text-xs">
                  CAMPO EXCLUSIVO PARA CARIMBO E PROTOCOLO DA SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEE)
                </span>
                <p className="text-[10px] text-slate-500">
                  Data de Recebimento: _____/_____/_________ · Responsável pelo Recebimento: ____________________________________
                </p>
                <div className="text-[10px] text-slate-500">
                  Processo Administrativo nº: __________________________ / PMSCS
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
