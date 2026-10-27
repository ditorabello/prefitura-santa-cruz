import React, { useState } from 'react';
import { usePDDE } from '../context/PDDEContext';
import { 
  School, 
  SchoolType, 
  ProgramType, 
  PROGRAM_LABELS, 
  SchoolCensusBreakdown,
  SchoolLinkedBankAccount 
} from '../types/pdde';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  UserCheck, 
  Users, 
  Key, 
  Landmark, 
  GraduationCap, 
  CheckCircle2, 
  X, 
  Save, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  FileSpreadsheet,
  ExternalLink,
  Lock,
  Unlock,
  Check,
  Copy
} from 'lucide-react';

const ALL_PROGRAMS: ProgramType[] = [
  'PDDE_MUNICIPAL',
  'PDDE_BASICO_FNDE',
  'PDDE_EDUCACAO_CONECTADA',
  'PDDE_ESTRUTURA',
  'PDDE_TEMPO_INTEGRAL'
];

export const SchoolRegistrationView: React.FC = () => {
  const { 
    schools, 
    addSchool, 
    updateSchool, 
    setSelectedSchoolId, 
    setActiveViewMode, 
    setActiveTab 
  } = usePDDE();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'geral' | 'direcao' | 'cpm' | 'censo' | 'programas' | 'banco'>('geral');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Form State
  const defaultFormData: Omit<School, 'id'> = {
    name: '',
    type: 'EMEF',
    inep: '',
    neighborhood: '',
    address: '',
    zone: 'Urbana',
    studentCount: 0,
    censusYear: 2024,
    censusBreakdown: {
      infantil: 0,
      anosIniciais: 0,
      anosFinais: 0,
      eja: 0,
      especial: 0,
    },
    uexName: '',
    uexCnpj: '',
    presidentName: '',
    presidentCpf: '',
    presidentRg: '',
    presidentTermStart: '2023-01-01',
    presidentTermEnd: '2024-12-31',
    treasurerName: '',
    treasurerCpf: '',
    fiscalCouncilMembers: ['', '', ''],
    principalName: '',
    principalRegistration: '',
    principalAppointmentAct: '',
    vicePrincipals: [],
    systemUserLogin: '',
    systemUserEmail: '',
    accessStatus: 'ativo',
    enabledPrograms: ['PDDE_MUNICIPAL', 'PDDE_BASICO_FNDE'],
    bankAccount: {
      bank: 'Banco do Brasil (001)',
      agency: '0180-5',
      accountNumber: '',
      savingsAccount: '',
      pixKey: '',
    },
    bankAccountsList: [],
    status: 'em_elaboracao',
    contactEmail: '',
    contactPhone: '',
    seeNotes: '',
  };

  const [formData, setFormData] = useState<Omit<School, 'id'>>(defaultFormData);
  const [vicePrincipalInput, setVicePrincipalInput] = useState('');

  // Open modal for new school
  const handleOpenNewSchoolModal = () => {
    setEditingSchoolId(null);
    setFormData({
      ...defaultFormData,
      systemUserLogin: `emef.escola${schools.length + 1}`,
      contactEmail: `escola${schools.length + 1}@educa.santacruz.rs.gov.br`,
      uexName: `Círculo de Pais e Mestres da Escola Municipal`,
      bankAccount: {
        bank: 'Banco do Brasil (001)',
        agency: '0180-5',
        accountNumber: `${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(Math.random() * 9)}`,
        savingsAccount: `51.${Math.floor(10000 + Math.random() * 90000)}-0`,
        pixKey: '',
      }
    });
    setVicePrincipalInput('');
    setActiveFormTab('geral');
    setIsModalOpen(true);
  };

  // Open modal for editing existing school
  const handleOpenEditSchoolModal = (school: School) => {
    setEditingSchoolId(school.id);
    setFormData({
      name: school.name,
      type: school.type,
      inep: school.inep,
      neighborhood: school.neighborhood,
      address: school.address,
      zone: school.zone || 'Urbana',
      studentCount: school.studentCount,
      censusYear: school.censusYear || 2024,
      censusBreakdown: school.censusBreakdown || {
        infantil: 0,
        anosIniciais: Math.floor(school.studentCount * 0.6),
        anosFinais: Math.floor(school.studentCount * 0.4),
        eja: 0,
        especial: 5,
      },
      uexName: school.uexName,
      uexCnpj: school.uexCnpj,
      presidentName: school.presidentName,
      presidentCpf: school.presidentCpf,
      presidentRg: school.presidentRg || '',
      presidentTermStart: school.presidentTermStart || '2023-01-01',
      presidentTermEnd: school.presidentTermEnd || '2024-12-31',
      treasurerName: school.treasurerName,
      treasurerCpf: school.treasurerCpf,
      fiscalCouncilMembers: school.fiscalCouncilMembers.length >= 3 
        ? school.fiscalCouncilMembers 
        : [...school.fiscalCouncilMembers, '', '', ''].slice(0, 3),
      principalName: school.principalName || '',
      principalRegistration: school.principalRegistration || '',
      principalAppointmentAct: school.principalAppointmentAct || '',
      vicePrincipals: school.vicePrincipals || [],
      systemUserLogin: school.systemUserLogin || school.id.replace(/-/g, '.'),
      systemUserEmail: school.systemUserEmail || school.contactEmail,
      accessStatus: school.accessStatus || 'ativo',
      enabledPrograms: school.enabledPrograms || ['PDDE_MUNICIPAL', 'PDDE_BASICO_FNDE'],
      bankAccount: school.bankAccount,
      bankAccountsList: school.bankAccountsList || [],
      status: school.status,
      contactEmail: school.contactEmail,
      contactPhone: school.contactPhone,
      seeNotes: school.seeNotes,
    });
    setVicePrincipalInput((school.vicePrincipals || []).join(', '));
    setActiveFormTab('geral');
    setIsModalOpen(true);
  };

  // Toggle program enabled
  const handleToggleProgram = (prog: ProgramType) => {
    const current = formData.enabledPrograms || [];
    if (current.includes(prog)) {
      setFormData(prev => ({
        ...prev,
        enabledPrograms: current.filter(p => p !== prog),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        enabledPrograms: [...current, prog],
      }));
    }
  };

  // Update census breakdown field and recompute total
  const handleCensusChange = (field: keyof SchoolCensusBreakdown, val: number) => {
    const current = formData.censusBreakdown || {
      infantil: 0,
      anosIniciais: 0,
      anosFinais: 0,
      eja: 0,
      especial: 0,
    };
    const updated = { ...current, [field]: Math.max(0, val) };
    const total = updated.infantil + updated.anosIniciais + updated.anosFinais + updated.eja + updated.especial;
    setFormData(prev => ({
      ...prev,
      censusBreakdown: updated,
      studentCount: total,
    }));
  };

  // Toggle school access status
  const handleToggleSchoolAccess = (school: School) => {
    const newStatus = school.accessStatus === 'ativo' ? 'bloqueado' : 'ativo';
    updateSchool(school.id, { accessStatus: newStatus });
  };

  // Submit modal form
  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Por favor, informe o nome da escola.');
      setActiveFormTab('geral');
      return;
    }

    const viceList = vicePrincipalInput
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);

    const payload: Omit<School, 'id'> = {
      ...formData,
      vicePrincipals: viceList,
      systemUserEmail: formData.systemUserEmail || formData.contactEmail,
      bankAccount: {
        ...formData.bankAccount,
        pixKey: formData.bankAccount.pixKey || formData.uexCnpj,
      }
    };

    if (editingSchoolId) {
      updateSchool(editingSchoolId, payload);
    } else {
      addSchool(payload);
    }

    setIsModalOpen(false);
  };

  const handleInspectSchool = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setActiveViewMode('school');
    setActiveTab('dashboard');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Filtered schools
  const filteredSchools = schools.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.inep.includes(searchTerm) ||
      (s.principalName && s.principalName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.presidentName && s.presidentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.systemUserLogin && s.systemUserLogin.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || s.type === typeFilter;
    const matchesZone = zoneFilter === 'all' || (s.zone || 'Urbana') === zoneFilter;
    const matchesProgram = programFilter === 'all' || (s.enabledPrograms && s.enabledPrograms.includes(programFilter as ProgramType));

    return matchesSearch && matchesType && matchesZone && matchesProgram;
  });

  const totalStudents = schools.reduce((acc, s) => acc + (s.studentCount || 0), 0);
  const activeAccessCount = schools.filter(s => (s.accessStatus || 'ativo') === 'ativo').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white rounded-xl p-5 shadow-xs border border-emerald-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold tracking-wide uppercase mb-1">
            <Building2 className="w-4 h-4" />
            <span>Secretaria Municipal de Educação · Setor de Gestão e Auditoria</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Cadastro Geral & Gestão das Escolas Municipais
          </h2>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl">
            Gerenciamento centralizado de dados institucionais, credenciais de login, diretorias de CPM, matrículas do Censo Escolar, programas habilitados e contas do Banco do Brasil.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewSchoolModal}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Escola</span>
          </button>
        </div>
      </div>

      {/* Network Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium block mb-1">Total de Escolas na Rede</span>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {schools.length} Unidades
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {schools.filter(s => s.type === 'EMEF').length} EMEFs · {schools.filter(s => s.type === 'EMEI').length} EMEIs · {schools.filter(s => s.type === 'CEMEJA').length} CEMEJA
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium block mb-1">Total de Alunos (Censo Escolar)</span>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {totalStudents.toLocaleString('pt-BR')} Alunos
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Base para cálculo dos repasses per capita do PDDE
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium block mb-1">Acessos ao Sistema (Logins)</span>
          <div className="text-2xl font-bold font-mono text-sky-700">
            {activeAccessCount} de {schools.length} Ativos
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Contas de diretores e tesoureiros habilitadas
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium block mb-1">Unidades Executoras (CPMs)</span>
          <div className="text-2xl font-bold font-mono text-indigo-700">
            100% com CNPJ Próprio
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Contas ativas vinculadas no Banco do Brasil
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por escola, diretor, presidente CPM, login ou INEP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-800 text-xs focus:outline-none"
            >
              <option value="all">Todos os Tipos ({schools.length})</option>
              <option value="EMEF">Apenas EMEF (Fundamental)</option>
              <option value="EMEI">Apenas EMEI (Infantil)</option>
              <option value="CEMEJA">Apenas CEMEJA</option>
            </select>
          </div>

          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-800 text-xs focus:outline-none"
          >
            <option value="all">Todas as Zonas</option>
            <option value="Urbana">Zona Urbana</option>
            <option value="Rural">Zona Rural</option>
          </select>

          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-800 text-xs focus:outline-none"
          >
            <option value="all">Todos os Programas</option>
            <option value="PDDE_MUNICIPAL">PDDE Municipal</option>
            <option value="PDDE_BASICO_FNDE">PDDE Básico FNDE</option>
            <option value="PDDE_EDUCACAO_CONECTADA">Educação Conectada</option>
            <option value="PDDE_ESTRUTURA">PDDE Estrutura</option>
            <option value="PDDE_TEMPO_INTEGRAL">Tempo Integral</option>
          </select>
        </div>
      </div>

      {/* Copy notification */}
      {copyFeedback && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{copyFeedback} copiado com sucesso para a área de transferência!</span>
        </div>
      )}

      {/* Schools Cards List */}
      <div className="space-y-4">
        {filteredSchools.map((school) => {
          const breakdown = school.censusBreakdown || {
            infantil: 0,
            anosIniciais: Math.floor((school.studentCount || 0) * 0.6),
            anosFinais: Math.floor((school.studentCount || 0) * 0.4),
            eja: 0,
            especial: 5,
          };
          const enabledProgs = school.enabledPrograms || ['PDDE_MUNICIPAL', 'PDDE_BASICO_FNDE'];
          const isAccessActive = (school.accessStatus || 'ativo') === 'ativo';

          return (
            <div 
              key={school.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-sm">
                    {school.type}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{school.name}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {school.zone || 'Urbana'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        INEP: {school.inep}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {school.address} · {school.neighborhood}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSchoolAccess(school)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      isAccessActive 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100' 
                        : 'bg-red-50 text-red-800 border border-red-300 hover:bg-red-100'
                    }`}
                    title="Clique para alternar o status de acesso"
                  >
                    {isAccessActive ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Login Ativo</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-red-600" />
                        <span>Login Bloqueado</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEditSchoolModal(school)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Editar Cadastro</span>
                  </button>

                  <button
                    onClick={() => handleInspectSchool(school.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-all cursor-pointer shadow-2xs"
                  >
                    <span>Acessar Prestação</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body Grid */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {/* Col 1: Direção & Login */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase text-[10px]">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Direção & Credenciais</span>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{school.principalName || 'Não informado'}</div>
                    <div className="text-[11px] text-slate-500">
                      Matrícula: <span className="font-mono">{school.principalRegistration || '0000-0'}</span>
                    </div>
                    {school.principalAppointmentAct && (
                      <div className="text-[10px] text-slate-400 italic">
                        {school.principalAppointmentAct}
                      </div>
                    )}
                  </div>

                  <div className="p-2 bg-slate-50 rounded border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Login:</span>
                      <div className="flex items-center gap-1">
                        <code className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {school.systemUserLogin || school.id.replace(/-/g, '.')}
                        </code>
                        <button 
                          onClick={() => copyToClipboard(school.systemUserLogin || school.id.replace(/-/g, '.'), 'Login')}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Copiar login"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate" title={school.contactEmail}>
                      {school.contactEmail}
                    </div>
                  </div>
                </div>

                {/* Col 2: CPM & Unidade Executora */}
                <div className="space-y-2 md:pl-4 pt-3 md:pt-0">
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase text-[10px]">
                    <Users className="w-3.5 h-3.5 text-sky-700" />
                    <span>Unidade Executora (CPM)</span>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 line-clamp-1" title={school.uexName}>
                      {school.uexName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      CNPJ: {school.uexCnpj}
                    </div>
                  </div>

                  <div className="space-y-0.5 text-[11px]">
                    <div className="text-slate-700">
                      <span className="text-slate-400">Presidente:</span> <strong className="text-slate-900">{school.presidentName}</strong>
                    </div>
                    <div className="text-slate-500 font-mono text-[10px]">
                      CPF: {school.presidentCpf}
                    </div>
                    <div className="text-slate-700">
                      <span className="text-slate-400">Tesoureiro:</span> {school.treasurerName}
                    </div>
                    {school.presidentTermEnd && (
                      <div className="text-[10px] text-slate-400">
                        Mandato até: {school.presidentTermEnd}
                      </div>
                    )}
                  </div>
                </div>

                {/* Col 3: Censo Escolar */}
                <div className="space-y-2 md:pl-4 pt-3 md:pt-0">
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase text-[10px]">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                    <span>Matrículas no Censo ({school.censusYear || 2024})</span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold font-mono text-slate-900">
                      {school.studentCount}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">alunos matriculados</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[10px] bg-slate-50 p-2 rounded border border-slate-200">
                    {breakdown.infantil > 0 && (
                      <div>Infantil: <strong className="font-mono">{breakdown.infantil}</strong></div>
                    )}
                    {breakdown.anosIniciais > 0 && (
                      <div>1º ao 5º: <strong className="font-mono">{breakdown.anosIniciais}</strong></div>
                    )}
                    {breakdown.anosFinais > 0 && (
                      <div>6º ao 9º: <strong className="font-mono">{breakdown.anosFinais}</strong></div>
                    )}
                    {breakdown.eja > 0 && (
                      <div>EJA: <strong className="font-mono">{breakdown.eja}</strong></div>
                    )}
                    <div>Especial (AEE): <strong className="font-mono">{breakdown.especial}</strong></div>
                  </div>
                </div>

                {/* Col 4: Contas Bancárias & Programas */}
                <div className="space-y-2 md:pl-4 pt-3 md:pt-0">
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase text-[10px]">
                    <Landmark className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Conta BB & Programas</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded border border-slate-200 space-y-1 font-mono text-[11px]">
                    <div className="text-slate-800 font-bold">
                      BB Ag: {school.bankAccount.agency}
                    </div>
                    <div className="text-slate-700">
                      CC: {school.bankAccount.accountNumber}
                    </div>
                    {school.bankAccount.savingsAccount && (
                      <div className="text-slate-500 text-[10px]">
                        Poup: {school.bankAccount.savingsAccount}
                      </div>
                    )}
                    {school.bankAccount.pixKey && (
                      <div className="text-slate-500 text-[10px] truncate" title={school.bankAccount.pixKey}>
                        PIX: {school.bankAccount.pixKey}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {enabledProgs.map((prog) => {
                      const info = PROGRAM_LABELS[prog];
                      return (
                        <span 
                          key={prog}
                          className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                        >
                          {info ? info.label.split('(')[0].trim() : prog}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Cadastro / Edição Completa da Escola */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingSchoolId ? 'Editar Cadastro da Escola' : 'Cadastrar Nova Escola Municipal'}
                </h3>
                <p className="text-xs text-slate-500">
                  Preencha os dados oficiais de identificação, diretoria de CPM, censo escolar, login e contas bancárias
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="flex border-b border-slate-200 bg-white px-4 pt-2 overflow-x-auto gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveFormTab('geral')}
                className={`px-3 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeFormTab === 'geral' 
                    ? 'border-emerald-700 text-emerald-800 font-bold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Identificação & Contato
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('direcao')}
                className={`px-3 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeFormTab === 'direcao' 
                    ? 'border-emerald-700 text-emerald-800 font-bold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Direção & Login
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('cpm')}
                className={`px-3 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeFormTab === 'cpm' 
                    ? 'border-emerald-700 text-emerald-800 font-bold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Unidade Executora (CPM)
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('censo')}
                className={`px-3 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeFormTab === 'censo' 
                    ? 'border-emerald-700 text-emerald-800 font-bold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                4. Matrículas Censo MEC
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('programas')}
                className={`px-3 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeFormTab === 'programas' 
                    ? 'border-emerald-700 text-emerald-800 font-bold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                5. Programas Habilitados
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('banco')}
                className={`px-3 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeFormTab === 'banco' 
                    ? 'border-emerald-700 text-emerald-800 font-bold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                6. Contas Banco do Brasil
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveSchool} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* TAB 1: GERAL */}
              {activeFormTab === 'geral' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nome Oficial da Escola *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: EMEF Menino Deus"
                        className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Tipo de Unidade Escolar
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as SchoolType })}
                        className="w-full border border-slate-300 rounded px-3 py-2 bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      >
                        <option value="EMEF">EMEF - Ensino Fundamental</option>
                        <option value="EMEI">EMEI - Educação Infantil</option>
                        <option value="CEMEJA">CEMEJA - Educação Jovens e Adultos</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Código INEP (MEC - 8 dígitos)
                      </label>
                      <input
                        type="text"
                        maxLength={8}
                        value={formData.inep}
                        onChange={(e) => setFormData({ ...formData, inep: e.target.value })}
                        placeholder="Ex: 43058912"
                        className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Zona de Localização
                      </label>
                      <select
                        value={formData.zone || 'Urbana'}
                        onChange={(e) => setFormData({ ...formData, zone: e.target.value as 'Urbana' | 'Rural' })}
                        className="w-full border border-slate-300 rounded px-3 py-2 bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      >
                        <option value="Urbana">Zona Urbana</option>
                        <option value="Rural">Zona Rural</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Bairro / Distrito
                      </label>
                      <input
                        type="text"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        placeholder="Ex: Menino Deus"
                        className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Endereço Completo
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Ex: Rua São José, 1420 - Santa Cruz do Sul - RS"
                      className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        E-mail Institucional (@educa.santacruz.rs.gov.br)
                      </label>
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="emefexemplo@educa.santacruz.rs.gov.br"
                        className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Telefone de Contato / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="(51) 3715-0000"
                        className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DIREÇÃO & LOGIN */}
              {activeFormTab === 'direcao' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900 text-xs">
                    <strong>Lei Municipal nº 9.738/2024:</strong> O Diretor escolar responde solidariamente pela regularidade formal das prestações de contas juntamente com o presidente do CPM.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nome do(a) Diretor(a) Geral *
                      </label>
                      <input
                        type="text"
                        value={formData.principalName || ''}
                        onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                        placeholder="Ex: Profª. Maria Helena dos Santos"
                        className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Matrícula Funcional SEME
                      </label>
                      <input
                        type="text"
                        value={formData.principalRegistration || ''}
                        onChange={(e) => setFormData({ ...formData, principalRegistration: e.target.value })}
                        placeholder="Ex: 9841-2"
                        className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Portaria de Designação / Posse
                      </label>
                      <input
                        type="text"
                        value={formData.principalAppointmentAct || ''}
                        onChange={(e) => setFormData({ ...formData, principalAppointmentAct: e.target.value })}
                        placeholder="Ex: Portaria SEME nº 042/2023"
                        className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Vice-Diretor(es) (separados por vírgula)
                      </label>
                      <input
                        type="text"
                        value={vicePrincipalInput}
                        onChange={(e) => setVicePrincipalInput(e.target.value)}
                        placeholder="Ex: Prof. André Luís Kist, Profª. Claudia Frozza"
                        className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-emerald-700" />
                      <span>Credenciais de Acesso ao Sistema</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Usuário de Login no Sistema
                        </label>
                        <input
                          type="text"
                          value={formData.systemUserLogin || ''}
                          onChange={(e) => setFormData({ ...formData, systemUserLogin: e.target.value.toLowerCase().trim() })}
                          placeholder="emef.meninodeus"
                          className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          E-mail para Redefinição de Senha
                        </label>
                        <input
                          type="email"
                          value={formData.systemUserEmail || formData.contactEmail}
                          onChange={(e) => setFormData({ ...formData, systemUserEmail: e.target.value })}
                          placeholder="direcao@educa.santacruz.rs.gov.br"
                          className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Status do Acesso
                        </label>
                        <select
                          value={formData.accessStatus || 'ativo'}
                          onChange={(e) => setFormData({ ...formData, accessStatus: e.target.value as 'ativo' | 'bloqueado' | 'em_auditoria' })}
                          className="w-full border border-slate-300 rounded px-3 py-2 bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        >
                          <option value="ativo">Habilitado / Ativo</option>
                          <option value="bloqueado">Bloqueado Temporariamente</option>
                          <option value="em_auditoria">Em Auditoria Técnica</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CPM & UNIDADE EXECUTORA */}
              {activeFormTab === 'cpm' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Razão Social da UEx (CPM / APEEF) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.uexName}
                        onChange={(e) => setFormData({ ...formData, uexName: e.target.value })}
                        placeholder="Ex: Círculo de Pais e Mestres da EMEF Menino Deus - CPM"
                        className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        CNPJ da Unidade Executora *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.uexCnpj}
                        onChange={(e) => setFormData({ ...formData, uexCnpj: e.target.value })}
                        placeholder="00.000.000/0001-00"
                        className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Presidente do CPM *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.presidentName}
                        onChange={(e) => setFormData({ ...formData, presidentName: e.target.value })}
                        placeholder="Ex: Clarice Marlene Weber"
                        className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        CPF do Presidente *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.presidentCpf}
                        onChange={(e) => setFormData({ ...formData, presidentCpf: e.target.value })}
                        placeholder="000.000.000-00"
                        className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        RG do Presidente
                      </label>
                      <input
                        type="text"
                        value={formData.presidentRg || ''}
                        onChange={(e) => setFormData({ ...formData, presidentRg: e.target.value })}
                        placeholder="0000000000"
                        className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Tesoureiro(a) do CPM
                      </label>
                      <input
                        type="text"
                        value={formData.treasurerName}
                        onChange={(e) => setFormData({ ...formData, treasurerName: e.target.value })}
                        placeholder="Ex: Renato Luis Schmidt"
                        className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        CPF do Tesoureiro
                      </label>
                      <input
                        type="text"
                        value={formData.treasurerCpf}
                        onChange={(e) => setFormData({ ...formData, treasurerCpf: e.target.value })}
                        placeholder="000.000.000-00"
                        className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Início do Mandato da Diretoria
                      </label>
                      <input
                        type="date"
                        value={formData.presidentTermStart || '2023-01-01'}
                        onChange={(e) => setFormData({ ...formData, presidentTermStart: e.target.value })}
                        className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Término do Mandato da Diretoria
                      </label>
                      <input
                        type="date"
                        value={formData.presidentTermEnd || '2024-12-31'}
                        onChange={(e) => setFormData({ ...formData, presidentTermEnd: e.target.value })}
                        className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Membros do Conselho Fiscal (Titulares 1, 2 e 3)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={formData.fiscalCouncilMembers[0] || ''}
                        onChange={(e) => {
                          const m = [...formData.fiscalCouncilMembers];
                          m[0] = e.target.value;
                          setFormData({ ...formData, fiscalCouncilMembers: m });
                        }}
                        placeholder="1º Titular do Conselho Fiscal"
                        className="border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={formData.fiscalCouncilMembers[1] || ''}
                        onChange={(e) => {
                          const m = [...formData.fiscalCouncilMembers];
                          m[1] = e.target.value;
                          setFormData({ ...formData, fiscalCouncilMembers: m });
                        }}
                        placeholder="2º Titular do Conselho Fiscal"
                        className="border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={formData.fiscalCouncilMembers[2] || ''}
                        onChange={(e) => {
                          const m = [...formData.fiscalCouncilMembers];
                          m[2] = e.target.value;
                          setFormData({ ...formData, fiscalCouncilMembers: m });
                        }}
                        placeholder="3º Titular do Conselho Fiscal"
                        className="border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CENSO ESCOLAR */}
              {activeFormTab === 'censo' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-xs">
                    <strong>Censo Escolar Oficial (MEC/INEP):</strong> As matrículas declaradas determinam o valor de repasse anual das parcelas de custeio e capital do PDDE Municipal e dos programas federais do FNDE.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Ano de Referência do Censo
                        </label>
                        <input
                          type="number"
                          value={formData.censusYear || 2024}
                          onChange={(e) => setFormData({ ...formData, censusYear: parseInt(e.target.value) || 2024 })}
                          className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Educação Infantil (Creche e Pré-escola)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={formData.censusBreakdown?.infantil || 0}
                          onChange={(e) => handleCensusChange('infantil', parseInt(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Ensino Fundamental - Anos Iniciais (1º ao 5º ano)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={formData.censusBreakdown?.anosIniciais || 0}
                          onChange={(e) => handleCensusChange('anosIniciais', parseInt(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Ensino Fundamental - Anos Finais (6º ao 9º ano)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={formData.censusBreakdown?.anosFinais || 0}
                          onChange={(e) => handleCensusChange('anosFinais', parseInt(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Educação de Jovens e Adultos (EJA)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={formData.censusBreakdown?.eja || 0}
                          onChange={(e) => handleCensusChange('eja', parseInt(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Educação Especial (Atendimento Educacional Especializado)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={formData.censusBreakdown?.especial || 0}
                          onChange={(e) => handleCensusChange('especial', parseInt(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-xs block font-sans">Total Geral de Matrículas Calculadas</span>
                      <div className="text-2xl font-bold font-mono text-emerald-400">
                        {formData.studentCount} Alunos
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-300">
                      <div>Estimativa de Repasse Municipal Anual:</div>
                      <div className="text-sm font-bold font-mono text-white">
                        R$ {(formData.studentCount * 65 + 4000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PROGRAMAS HABILITADOS */}
              {activeFormTab === 'programas' && (
                <div className="space-y-4">
                  <div className="text-slate-600 text-xs">
                    Marque os programas nos quais esta unidade escolar está habilitada para receber e gerenciar recursos:
                  </div>

                  <div className="space-y-2">
                    {ALL_PROGRAMS.map((prog) => {
                      const isEnabled = (formData.enabledPrograms || []).includes(prog);
                      const info = PROGRAM_LABELS[prog];

                      return (
                        <div
                          key={prog}
                          onClick={() => handleToggleProgram(prog)}
                          className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isEnabled 
                              ? 'bg-emerald-50/70 border-emerald-400 shadow-2xs' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => {}} // handled by parent div
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            />
                            <div>
                              <div className="font-bold text-slate-900">
                                {info ? info.label : prog}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Esfera: <span className="font-semibold text-slate-700">{info?.origin}</span> · Prestação de contas via sistema
                              </div>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isEnabled 
                              ? 'bg-emerald-200 text-emerald-900' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isEnabled ? 'Habilitado' : 'Inativo'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: CONTAS BANCO DO BRASIL */}
              {activeFormTab === 'banco' && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-900 text-xs">
                    <strong>Contas Oficiais no Banco do Brasil (001):</strong> Por exigência do FNDE e da SEME Santa Cruz do Sul, os recursos devem transitar exclusivamente em conta corrente vinculada com aplicação automática em poupança.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Instituição Financeira
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Banco do Brasil (001)"
                        className="w-full border border-slate-200 bg-slate-100 rounded px-3 py-2 text-slate-600 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Agência Bancária (com dígito)
                      </label>
                      <input
                        type="text"
                        value={formData.bankAccount.agency}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankAccount: { ...formData.bankAccount, agency: e.target.value }
                        })}
                        placeholder="0180-5"
                        className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Conta Corrente Principal (com dígito) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.bankAccount.accountNumber}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankAccount: { ...formData.bankAccount, accountNumber: e.target.value }
                        })}
                        placeholder="14.280-9"
                        className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Subconta Poupança / Aplicação Financeira
                      </label>
                      <input
                        type="text"
                        value={formData.bankAccount.savingsAccount}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankAccount: { ...formData.bankAccount, savingsAccount: e.target.value }
                        })}
                        placeholder="51.014.280-9"
                        className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Chave PIX Oficial da UEx (CNPJ ou E-mail cadastrado no BB)
                    </label>
                    <input
                      type="text"
                      value={formData.bankAccount.pixKey || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankAccount: { ...formData.bankAccount, pixKey: e.target.value }
                      })}
                      placeholder="Ex: 91.823.456/0001-20 ou pix.meninodeus@bb.com.br"
                      className="w-full border border-slate-300 rounded px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-5 py-2 rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingSchoolId ? 'Salvar Alterações' : 'Cadastrar Escola'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
