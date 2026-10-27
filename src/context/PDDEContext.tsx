import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  School, 
  Transfer, 
  BankYield, 
  Quotation, 
  Expense, 
  AssetItem, 
  CouncilOpinion, 
  ProgramType, 
  Category,
  AccountStatus,
  DiligenceItem,
  AuditCheckResult,
  SupplierDirectoryItem,
  QuoteItem,
  DemocraticEvaluation,
  DirectorshipRequirements,
  DemocraticIndicatorCode
} from '../types/pdde';
import { 
  INITIAL_SCHOOLS, 
  INITIAL_TRANSFERS, 
  INITIAL_YIELDS, 
  INITIAL_QUOTATIONS, 
  INITIAL_EXPENSES, 
  INITIAL_ASSETS, 
  INITIAL_COUNCIL_OPINIONS,
  INITIAL_DILIGENCES,
  INITIAL_SUPPLIERS
} from '../data/mockData';
import {
  INITIAL_DIRECTORSHIP_REQUIREMENTS,
  generateSystemGuidanceForSchool
} from '../data/democraticManagementData';

interface FinancialSummary {
  totalRevenue: number;
  totalTransfers: number;
  totalYields: number;
  totalExpenses: number;
  balance: number;
  byCategory: {
    custeioRevenue: number;
    custeioExpenses: number;
    custeioBalance: number;
    capitalRevenue: number;
    capitalExpenses: number;
    capitalBalance: number;
  };
  byProgram: Record<ProgramType, {
    transfers: number;
    yields: number;
    expenses: number;
    balance: number;
  }>;
}

interface ComplianceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  actionTab?: string;
  fixAction?: () => void;
}

interface PDDEContextType {
  // Navigation & selection
  activeViewMode: 'school' | 'see';
  setActiveViewMode: (mode: 'school' | 'see') => void;
  selectedSchoolId: string;
  setSelectedSchoolId: (id: string) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Current entity
  currentSchool: School | undefined;

  // Data
  schools: School[];
  transfers: Transfer[];
  yields: BankYield[];
  quotations: Quotation[];
  expenses: Expense[];
  assets: AssetItem[];
  councilOpinions: Record<string, CouncilOpinion>;
  diligences: DiligenceItem[];
  suppliers: SupplierDirectoryItem[];

  // Filtered for current school & year
  schoolTransfers: Transfer[];
  schoolYields: BankYield[];
  schoolQuotations: Quotation[];
  schoolExpenses: Expense[];
  schoolAssets: AssetItem[];
  schoolCouncilOpinion: CouncilOpinion | undefined;
  schoolDiligences: DiligenceItem[];

  // Calculations & metrics
  financialSummary: FinancialSummary;
  complianceAlerts: ComplianceAlert[];
  auditChecks: AuditCheckResult[];

  // Mutators
  addSchool: (school: Omit<School, 'id'>) => void;
  updateSchool: (id: string, data: Partial<School>) => void;
  updateSchoolStatus: (id: string, status: AccountStatus, seeNotes?: string) => void;
  
  addTransfer: (transfer: Omit<Transfer, 'id'>) => void;
  deleteTransfer: (id: string) => void;

  addYield: (yieldItem: Omit<BankYield, 'id'>) => void;
  deleteYield: (id: string) => void;

  addQuotation: (quotation: Omit<Quotation, 'id'>) => void;
  updateQuotation: (id: string, quotation: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;
  submitProposalToQuotation: (quotationId: string, quote: QuoteItem) => void;
  getQuotationByToken: (token: string) => Quotation | undefined;

  // Supplier directory
  addSupplier: (supplier: Omit<SupplierDirectoryItem, 'id'>) => void;
  updateSupplier: (id: string, supplier: Partial<SupplierDirectoryItem>) => void;
  deleteSupplier: (id: string) => void;

  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  toggleReconciled: (id: string) => void;
  reconcileAllExpenses: () => void;

  addAsset: (asset: Omit<AssetItem, 'id'>) => void;
  updateAsset: (id: string, asset: Partial<AssetItem>) => void;
  deleteAsset: (id: string) => void;
  syncCapitalAssets: () => void;

  saveCouncilOpinion: (opinion: CouncilOpinion) => void;
  autoFixCouncilOpinion: () => void;

  // Diligences
  addDiligence: (diligence: Omit<DiligenceItem, 'id' | 'status'>) => void;
  respondDiligence: (id: string, response: string) => void;
  resolveDiligence: (id: string, notes?: string) => void;

  // Gestão Democrática (Lei Municipal Nº 9.738/2024)
  democraticEvaluations: Record<string, DemocraticEvaluation>;
  directorshipRequirements: Record<string, DirectorshipRequirements>;
  saveDemocraticEvaluation: (evaluation: DemocraticEvaluation) => void;
  resetDemocraticEvaluationToGuidance: (schoolId: string, semester?: string) => DemocraticEvaluation;
  updateDirectorshipRequirements: (schoolId: string, updates: Partial<DirectorshipRequirements>) => void;
  getDemocraticEvaluationForSchool: (schoolId: string, semester?: string) => DemocraticEvaluation;

  // Utilities
  exportDataJSON: () => void;
  importDataJSON: (jsonStr: string) => boolean;
  resetToDefault: () => void;
}

const STORAGE_KEY = 'pdde_santacruz_data_v2';

const PDDEContext = createContext<PDDEContextType | null>(null);

export const PDDEProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load state from localStorage or defaults
  const [schools, setSchools] = useState<School[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_schools`);
    if (!saved) return INITIAL_SCHOOLS;
    try {
      const parsed: School[] = JSON.parse(saved);
      return parsed.map(s => {
        const init = INITIAL_SCHOOLS.find(i => i.id === s.id);
        return {
          ...init,
          ...s,
          enabledPrograms: s.enabledPrograms || init?.enabledPrograms || ['PDDE_MUNICIPAL', 'PDDE_BASICO_FNDE'],
          censusBreakdown: s.censusBreakdown || init?.censusBreakdown || {
            infantil: 0,
            anosIniciais: s.studentCount ? Math.floor(s.studentCount * 0.6) : 0,
            anosFinais: s.studentCount ? Math.floor(s.studentCount * 0.4) : 0,
            eja: 0,
            especial: 5
          },
          principalName: s.principalName || init?.principalName || 'Diretor(a) Geral',
          principalRegistration: s.principalRegistration || init?.principalRegistration || '0000-0',
          systemUserLogin: s.systemUserLogin || init?.systemUserLogin || s.id.replace(/-/g, '.'),
          accessStatus: s.accessStatus || 'ativo',
          zone: s.zone || 'Urbana',
        };
      });
    } catch {
      return INITIAL_SCHOOLS;
    }
  });

  const [transfers, setTransfers] = useState<Transfer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_transfers`);
    return saved ? JSON.parse(saved) : INITIAL_TRANSFERS;
  });

  const [yields, setYields] = useState<BankYield[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_yields`);
    return saved ? JSON.parse(saved) : INITIAL_YIELDS;
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_quotations`);
    return saved ? JSON.parse(saved) : INITIAL_QUOTATIONS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_expenses`);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [assets, setAssets] = useState<AssetItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_assets`);
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });

  const [councilOpinions, setCouncilOpinions] = useState<Record<string, CouncilOpinion>>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_opinions`);
    return saved ? JSON.parse(saved) : INITIAL_COUNCIL_OPINIONS;
  });

  const [diligences, setDiligences] = useState<DiligenceItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_diligences`);
    return saved ? JSON.parse(saved) : INITIAL_DILIGENCES;
  });

  const [suppliers, setSuppliers] = useState<SupplierDirectoryItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_suppliers`);
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  // Gestão Democrática (Lei Municipal nº 9.738/2024)
  const [directorshipRequirements, setDirectorshipRequirements] = useState<Record<string, DirectorshipRequirements>>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_directorship_reqs`);
    if (saved) return JSON.parse(saved);
    const initialMap: Record<string, DirectorshipRequirements> = {};
    INITIAL_DIRECTORSHIP_REQUIREMENTS.forEach(req => {
      initialMap[req.schoolId] = req;
    });
    return initialMap;
  });

  const [democraticEvaluations, setDemocraticEvaluations] = useState<Record<string, DemocraticEvaluation>>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_dem_evaluations`);
    return saved ? JSON.parse(saved) : {};
  });

  // UI state
  const [activeViewMode, setActiveViewMode] = useState<'school' | 'see'>('school');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('emef-menino-deus');
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Persistence
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_schools`, JSON.stringify(schools));
  }, [schools]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_transfers`, JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_yields`, JSON.stringify(yields));
  }, [yields]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_quotations`, JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_assets`, JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_opinions`, JSON.stringify(councilOpinions));
  }, [councilOpinions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_diligences`, JSON.stringify(diligences));
  }, [diligences]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_suppliers`, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_directorship_reqs`, JSON.stringify(directorshipRequirements));
  }, [directorshipRequirements]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_dem_evaluations`, JSON.stringify(democraticEvaluations));
  }, [democraticEvaluations]);

  // Derived filtered data for current selected school & year
  const currentSchool = useMemo(() => {
    return schools.find(s => s.id === selectedSchoolId) || schools[0];
  }, [schools, selectedSchoolId]);

  const schoolTransfers = useMemo(() => {
    return transfers.filter(t => t.schoolId === selectedSchoolId && t.year === selectedYear);
  }, [transfers, selectedSchoolId, selectedYear]);

  const schoolYields = useMemo(() => {
    return yields.filter(y => y.schoolId === selectedSchoolId && y.year === selectedYear);
  }, [yields, selectedSchoolId, selectedYear]);

  const schoolQuotations = useMemo(() => {
    return quotations.filter(q => q.schoolId === selectedSchoolId && q.year === selectedYear);
  }, [quotations, selectedSchoolId, selectedYear]);

  const schoolExpenses = useMemo(() => {
    return expenses.filter(e => e.schoolId === selectedSchoolId && e.year === selectedYear);
  }, [expenses, selectedSchoolId, selectedYear]);

  const schoolAssets = useMemo(() => {
    return assets.filter(a => a.schoolId === selectedSchoolId && a.year === selectedYear);
  }, [assets, selectedSchoolId, selectedYear]);

  const schoolCouncilOpinion = useMemo(() => {
    const key = `${selectedSchoolId}-${selectedYear}`;
    return councilOpinions[key];
  }, [councilOpinions, selectedSchoolId, selectedYear]);

  const schoolDiligences = useMemo(() => {
    return diligences.filter(d => d.schoolId === selectedSchoolId && d.year === selectedYear);
  }, [diligences, selectedSchoolId, selectedYear]);

  // Financial Summary calculations
  const financialSummary = useMemo<FinancialSummary>(() => {
    const totalTransfers = schoolTransfers.reduce((acc, t) => acc + t.value, 0);
    const totalYields = schoolYields.reduce((acc, y) => acc + y.value, 0);
    const totalRevenue = totalTransfers + totalYields;
    const totalExpenses = schoolExpenses.reduce((acc, e) => acc + e.netValue, 0);
    const balance = totalRevenue - totalExpenses;

    const custeioTransfers = schoolTransfers.filter(t => t.category === 'CUSTEIO').reduce((acc, t) => acc + t.value, 0);
    const custeioYields = schoolYields.filter(y => y.category === 'CUSTEIO').reduce((acc, y) => acc + y.value, 0);
    const custeioRevenue = custeioTransfers + custeioYields;
    const custeioExpenses = schoolExpenses.filter(e => e.category === 'CUSTEIO').reduce((acc, e) => acc + e.netValue, 0);
    const custeioBalance = custeioRevenue - custeioExpenses;

    const capitalTransfers = schoolTransfers.filter(t => t.category === 'CAPITAL').reduce((acc, t) => acc + t.value, 0);
    const capitalYields = schoolYields.filter(y => y.category === 'CAPITAL').reduce((acc, y) => acc + y.value, 0);
    const capitalRevenue = capitalTransfers + capitalYields;
    const capitalExpenses = schoolExpenses.filter(e => e.category === 'CAPITAL').reduce((acc, e) => acc + e.netValue, 0);
    const capitalBalance = capitalRevenue - capitalExpenses;

    const programs: ProgramType[] = [
      'PDDE_MUNICIPAL',
      'PDDE_BASICO_FNDE',
      'PDDE_EDUCACAO_CONECTADA',
      'PDDE_ESTRUTURA',
      'PDDE_TEMPO_INTEGRAL',
    ];

    const byProgram = {} as Record<ProgramType, { transfers: number; yields: number; expenses: number; balance: number }>;

    programs.forEach(prog => {
      const pTransfers = schoolTransfers.filter(t => t.program === prog).reduce((acc, t) => acc + t.value, 0);
      const pYields = schoolYields.filter(y => y.program === prog).reduce((acc, y) => acc + y.value, 0);
      const pExpenses = schoolExpenses.filter(e => e.program === prog).reduce((acc, e) => acc + e.netValue, 0);
      byProgram[prog] = {
        transfers: pTransfers,
        yields: pYields,
        expenses: pExpenses,
        balance: (pTransfers + pYields) - pExpenses,
      };
    });

    return {
      totalRevenue,
      totalTransfers,
      totalYields,
      totalExpenses,
      balance,
      byCategory: {
        custeioRevenue,
        custeioExpenses,
        custeioBalance,
        capitalRevenue,
        capitalExpenses,
        capitalBalance,
      },
      byProgram,
    };
  }, [schoolTransfers, schoolYields, schoolExpenses]);

  // Deep Automated Audit Engine
  const auditChecks = useMemo<AuditCheckResult[]>(() => {
    const checks: AuditCheckResult[] = [];

    // 1. Check Pesquisa de Preços (Mínimo 3 Cotações ou Justificativa de Praça Restrita/Fornecedor Exclusivo)
    schoolQuotations.forEach(q => {
      if (q.quotes.length < 3) {
        if (q.allowSingleQuote && q.singleQuoteJustification && q.singleQuoteJustification.trim().length >= 10) {
          checks.push({
            id: `audit-quotation-${q.id}`,
            category: 'cotações',
            severity: 'conforme',
            title: `Cotação ${q.code} com apresentação excepcional (${q.quotes.length} orçamento/s)`,
            description: `Apresentação de menos de 3 orçamentos devidamente justificada (${q.singleQuoteReason || 'Inviabilidade de fornecedores adicionais'}). Justificativa: "${q.singleQuoteJustification}".`,
            legalBasis: 'Parecer Normativo FNDE / Art. 14 § 2º Resolução CD/FNDE nº 15/2021 c/c Lei 14.133/2021 (Inviabilidade de competição na praça local)',
            status: 'justificado',
            actionTab: 'quotations',
            affectedItem: q.code,
          });
        } else {
          checks.push({
            id: `audit-quotation-${q.id}`,
            category: 'cotações',
            severity: 'bloqueante',
            title: `Cotação ${q.code} com menos de 3 orçamentos`,
            description: `A pesquisa possui apenas ${q.quotes.length} proposta(s). A Resolução FNDE e Decreto Municipal exigem no mínimo 3 cotações de empresas distintas ou justificativa formal de inviabilidade de praça local.`,
            legalBasis: 'Art. 14 da Resolução CD/FNDE nº 15/2021 c/c Lei 8.666/93 / Lei 14.133/2021',
            status: 'pendente',
            actionTab: 'quotations',
            affectedItem: q.code,
          });
        }
      }
      const invalidCND = q.quotes.filter(item => !item.cndRegular);
      if (invalidCND.length > 0) {
        checks.push({
          id: `audit-cnd-${q.id}`,
          category: 'cotações',
          severity: 'advertencia',
          title: `Fornecedor cotado sem certidão CND regular em ${q.code}`,
          description: `${invalidCND.map(f => f.companyName).join(', ')} possui pendência de certidão de regularidade fiscal.`,
          legalBasis: 'Art. 29 da Lei 8.666/93 (Habilitação Fiscal)',
          status: 'pendente',
          actionTab: 'quotations',
          affectedItem: q.code,
        });
      }
    });

    // 2. Check Despesas de Capital vs Bens no Termo de Doação
    const capitalExpenses = schoolExpenses.filter(e => e.category === 'CAPITAL');
    const capitalExpenseTotal = capitalExpenses.reduce((acc, e) => acc + e.netValue, 0);
    const assetItemsTotal = schoolAssets.reduce((acc, a) => acc + a.totalValue, 0);
    if (capitalExpenses.length > 0 && Math.abs(capitalExpenseTotal - assetItemsTotal) > 1) {
      checks.push({
        id: 'audit-capital-assets',
        category: 'patrimonio',
        severity: 'bloqueante',
        title: 'Bens de Capital pendentes de inclusão no Termo de Doação',
        description: `Total pago em bens permanentes (R$ ${capitalExpenseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) difere do total cadastrado no Termo de Doação ao Município (R$ ${assetItemsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
        legalBasis: 'Decreto Municipal de Tombamento e Patrimônio de Santa Cruz do Sul',
        status: 'pendente',
        actionTab: 'assets',
      });
    }

    // 3. Check Conciliação Bancária
    const unreconciled = schoolExpenses.filter(e => !e.reconciled);
    if (unreconciled.length > 0) {
      checks.push({
        id: 'audit-unreconciled',
        category: 'banco',
        severity: 'advertencia',
        title: `${unreconciled.length} despesa(s) não conciliadas no extrato`,
        description: 'Constam pagamentos sem conferência contra o extrato da conta corrente do Banco do Brasil.',
        legalBasis: 'Normas de Auditoria Contábil Pública / Tribunal de Contas (TCE-RS)',
        status: 'pendente',
        actionTab: 'reconciliation',
      });
    }

    // 4. Check Rendimentos da Poupança
    if (schoolYields.length === 0 && schoolTransfers.length > 0) {
      checks.push({
        id: 'audit-no-yields',
        category: 'saldo',
        severity: 'advertencia',
        title: 'Nenhum rendimento de aplicação financeira cadastrado',
        description: 'Os recursos depositados na conta devem ser mantidos em poupança ou aplicação financeira oficial e seus rendimentos devem constar no Anexo I.',
        legalBasis: 'Art. 13 da Resolução CD/FNDE nº 15/2021',
        status: 'pendente',
        actionTab: 'transfers',
      });
    }

    // 5. Check Saldo Negativo
    if (financialSummary.balance < 0) {
      checks.push({
        id: 'audit-negative-balance',
        category: 'saldo',
        severity: 'bloqueante',
        title: 'Déficit / Saldo Contábil Negativo',
        description: `As despesas excedem a receita disponível em R$ ${Math.abs(financialSummary.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. É vedada a realização de despesa sem prévia disponibilidade de caixa.`,
        legalBasis: 'Lei de Responsabilidade Fiscal (LC 101/2000, Art. 42)',
        status: 'pendente',
        actionTab: 'expenses',
      });
    }

    // 6. Check Conselho Fiscal
    if (!schoolCouncilOpinion) {
      checks.push({
        id: 'audit-council-missing',
        category: 'conselho',
        severity: 'bloqueante',
        title: 'Ausência do Parecer Conclusivo do Conselho Fiscal',
        description: 'A prestação de contas não pode ser homologada pela SEE sem a ata formal com parecer aprovativo dos membros do Conselho Fiscal do CPM.',
        legalBasis: 'Estatuto Padrão do CPM c/c Decreto Municipal',
        status: 'pendente',
        actionTab: 'reports',
      });
    } else if (schoolCouncilOpinion.fiscalCouncilSignatures.filter(Boolean).length < 3) {
      checks.push({
        id: 'audit-council-quorum',
        category: 'conselho',
        severity: 'advertencia',
        title: 'Quórum incompleto de assinaturas no Conselho Fiscal',
        description: `Constam apenas ${schoolCouncilOpinion.fiscalCouncilSignatures.filter(Boolean).length} de 3 assinaturas de conselheiros titulares.`,
        legalBasis: 'Estatuto Social da UEx / CPM',
        status: 'pendente',
        actionTab: 'reports',
      });
    }

    // 7. Check Diligências Pendentes da SEE
    const pendingDiligences = schoolDiligences.filter(d => d.status === 'pendente');
    if (pendingDiligences.length > 0) {
      checks.push({
        id: 'audit-pending-diligences',
        category: 'despesas',
        severity: 'bloqueante',
        title: `${pendingDiligences.length} diligência(s) pendente(s) da Secretaria de Educação`,
        description: 'Existem apontamentos da equipe técnica da SEE aguardando resposta ou comprovação pela escola.',
        legalBasis: 'Controle Interno - Secretaria Municipal de Educação de Santa Cruz do Sul',
        status: 'pendente',
        actionTab: 'audit',
      });
    }

    return checks;
  }, [schoolQuotations, schoolExpenses, schoolAssets, schoolYields, schoolTransfers, financialSummary, schoolCouncilOpinion, schoolDiligences]);

  // Quick Compliance alerts
  const complianceAlerts = useMemo<ComplianceAlert[]>(() => {
    return auditChecks.map(check => ({
      id: check.id,
      type: check.severity === 'bloqueante' ? 'error' : check.severity === 'advertencia' ? 'warning' : 'info',
      title: check.title,
      message: check.description,
      actionTab: check.actionTab,
    }));
  }, [auditChecks]);

  // Actions
  const addSchool = (schoolData: Omit<School, 'id'>) => {
    const id = `escola-${Date.now()}`;
    const newSchool: School = { ...schoolData, id };
    setSchools(prev => [...prev, newSchool]);
    setSelectedSchoolId(id);
  };

  const updateSchool = (id: string, data: Partial<School>) => {
    setSchools(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
  };

  const updateSchoolStatus = (id: string, status: AccountStatus, seeNotes?: string) => {
    setSchools(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status,
          ...(seeNotes !== undefined ? { seeNotes } : {}),
          lastReviewDate: new Date().toISOString().split('T')[0],
        };
      }
      return s;
    }));
  };

  const addTransfer = (item: Omit<Transfer, 'id'>) => {
    const newTransfer: Transfer = { ...item, id: `tr-${Date.now()}` };
    setTransfers(prev => [newTransfer, ...prev]);
  };

  const deleteTransfer = (id: string) => {
    setTransfers(prev => prev.filter(t => t.id !== id));
  };

  const addYield = (item: Omit<BankYield, 'id'>) => {
    const newYield: BankYield = { ...item, id: `yd-${Date.now()}` };
    setYields(prev => [newYield, ...prev]);
  };

  const deleteYield = (id: string) => {
    setYields(prev => prev.filter(y => y.id !== id));
  };

  const addQuotation = (item: Omit<Quotation, 'id'>) => {
    const newQuotation: Quotation = { ...item, id: `cot-${Date.now()}` };
    setQuotations(prev => [newQuotation, ...prev]);
  };

  const updateQuotation = (id: string, data: Partial<Quotation>) => {
    setQuotations(prev => prev.map(q => (q.id === id ? { ...q, ...data } : q)));
  };

  const deleteQuotation = (id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
  };

  const submitProposalToQuotation = (quotationId: string, quote: QuoteItem) => {
    setQuotations(prev => prev.map(q => {
      if (q.id === quotationId) {
        const existingIdx = q.quotes.findIndex(item => item.cnpj === quote.cnpj);
        let updatedQuotes = [...q.quotes];
        if (existingIdx >= 0) {
          updatedQuotes[existingIdx] = quote;
        } else {
          updatedQuotes.push(quote);
        }
        // Auto-select lowest price quote among valid CND (or lowest overall)
        const sorted = [...updatedQuotes].sort((a, b) => {
          const valA = a.proposalValue || a.totalValue || 0;
          const valB = b.proposalValue || b.totalValue || 0;
          return valA - valB;
        });
        const lowest = sorted[0];
        const lowestVal = lowest ? (lowest.proposalValue || lowest.totalValue || 0) : 0;
        const lowestIdx = lowest ? updatedQuotes.findIndex(x => x.cnpj === lowest.cnpj) : 0;
        const isCompleted = updatedQuotes.length >= 3 || (q.allowSingleQuote && updatedQuotes.length >= 1);
        return {
          ...q,
          quotes: updatedQuotes,
          selectedQuoteId: lowest?.id,
          winningQuoteIndex: lowestIdx >= 0 ? lowestIdx : 0,
          finalValue: lowestVal,
          status: (isCompleted ? 'concluida' : 'em_andamento') as 'concluida' | 'em_andamento',
        };
      }
      return q;
    }));
  };

  const getQuotationByToken = (token: string): Quotation | undefined => {
    if (!token) return undefined;
    const clean = token.trim().toLowerCase();
    return quotations.find(q =>
      (q.publicToken && q.publicToken.toLowerCase() === clean) ||
      q.id.toLowerCase() === clean ||
      q.code.toLowerCase() === clean ||
      q.code.toLowerCase().replace(/[^a-z0-9]/g, '-') === clean ||
      (q.publicToken && q.publicToken.toLowerCase().includes(clean))
    ) || quotations[0];
  };

  const addSupplier = (item: Omit<SupplierDirectoryItem, 'id'>) => {
    const newSupplier: SupplierDirectoryItem = { ...item, id: `sup-${Date.now()}` };
    setSuppliers(prev => [newSupplier, ...prev]);
  };

  const updateSupplier = (id: string, data: Partial<SupplierDirectoryItem>) => {
    setSuppliers(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const addExpense = (item: Omit<Expense, 'id'>) => {
    const newExpense: Expense = { ...item, id: `exp-${Date.now()}` };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => (e.id === id ? { ...e, ...data } : e)));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const toggleReconciled = (id: string) => {
    setExpenses(prev => prev.map(e => (e.id === id ? { ...e, reconciled: !e.reconciled } : e)));
  };

  const reconcileAllExpenses = () => {
    setExpenses(prev => prev.map(e => {
      if (e.schoolId === selectedSchoolId && e.year === selectedYear) {
        return { ...e, reconciled: true };
      }
      return e;
    }));
  };

  const addAsset = (item: Omit<AssetItem, 'id'>) => {
    const newAsset: AssetItem = { ...item, id: `ast-${Date.now()}` };
    setAssets(prev => [newAsset, ...prev]);
  };

  const updateAsset = (id: string, data: Partial<AssetItem>) => {
    setAssets(prev => prev.map(a => (a.id === id ? { ...a, ...data } : a)));
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  // Auto-sync missing capital assets from capital expenses
  const syncCapitalAssets = () => {
    const capitalExpenses = schoolExpenses.filter(e => e.category === 'CAPITAL');
    const existingExpenseIds = new Set(schoolAssets.map(a => a.expenseId));
    
    capitalExpenses.forEach(exp => {
      if (!existingExpenseIds.has(exp.id)) {
        addAsset({
          schoolId: selectedSchoolId,
          year: selectedYear,
          expenseId: exp.id,
          description: exp.description || 'Equipamento de Capital',
          brandModel: 'Conforme NF',
          quantity: 1,
          unitValue: exp.netValue,
          totalValue: exp.netValue,
          location: 'Sede da Escola Municipal',
          invoiceNumber: exp.invoiceNumber,
          invoiceDate: exp.invoiceDate,
          tombamentoNumber: `PMSCS-PAT-${selectedYear}/${String(Math.floor(Math.random() * 8999 + 1000))}`,
          donatedToMunicipality: true,
        });
      }
    });
  };

  const saveCouncilOpinion = (opinion: CouncilOpinion) => {
    const key = `${opinion.schoolId}-${opinion.year}`;
    setCouncilOpinions(prev => ({
      ...prev,
      [key]: opinion,
    }));
  };

  const autoFixCouncilOpinion = () => {
    if (!currentSchool) return;
    saveCouncilOpinion({
      schoolId: currentSchool.id,
      year: selectedYear,
      meetingDate: new Date().toISOString().split('T')[0],
      opinionType: 'APROVADO',
      observations: `O Conselho Fiscal do ${currentSchool.uexName} reuniu-se ordinariamente e conferiu todos os extratos bancários, comprovantes de despesa, notas fiscais e tomadas de preços do exercício de ${selectedYear}, emitindo parecer favorável à aprovação integral das contas.`,
      signedByPresident: true,
      signedByTreasurer: true,
      fiscalCouncilSignatures: [true, true, true],
    });
  };

  // Diligences mutators
  const addDiligence = (item: Omit<DiligenceItem, 'id' | 'status'>) => {
    const newDil: DiligenceItem = {
      ...item,
      id: `dil-${Date.now()}`,
      status: 'pendente',
    };
    setDiligences(prev => [newDil, ...prev]);
    updateSchoolStatus(item.schoolId, 'diligencia', `Diligência aberta: ${item.subject}`);
  };

  const respondDiligence = (id: string, response: string) => {
    setDiligences(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          schoolResponse: response,
          responseDate: new Date().toISOString().split('T')[0],
          status: 'respondida',
        };
      }
      return d;
    }));
  };

  const resolveDiligence = (id: string, notes?: string) => {
    setDiligences(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status: 'homologada',
          reviewedBySEE: notes || 'Homologada e sanada pela auditoria da SEE.',
        };
      }
      return d;
    }));
  };

  // Export / Import
  const exportDataJSON = () => {
    const data = {
      version: 2,
      exportDate: new Date().toISOString(),
      schools,
      transfers,
      yields,
      quotations,
      expenses,
      assets,
      councilOpinions,
      diligences,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_pdde_santacruz_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.schools && parsed.transfers && parsed.expenses) {
        setSchools(parsed.schools);
        setTransfers(parsed.transfers);
        setYields(parsed.yields || []);
        setQuotations(parsed.quotations || []);
        setExpenses(parsed.expenses);
        setAssets(parsed.assets || []);
        setCouncilOpinions(parsed.councilOpinions || {});
        setDiligences(parsed.diligences || INITIAL_DILIGENCES);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Import error:', err);
      return false;
    }
  };

  const resetToDefault = () => {
    if (confirm('Deseja restaurar todos os dados padrão do sistema do PDDE de Santa Cruz do Sul? Suas alterações serão substituídas pelos registros iniciais.')) {
      setSchools(INITIAL_SCHOOLS);
      setTransfers(INITIAL_TRANSFERS);
      setYields(INITIAL_YIELDS);
      setQuotations(INITIAL_QUOTATIONS);
      setExpenses(INITIAL_EXPENSES);
      setAssets(INITIAL_ASSETS);
      setCouncilOpinions(INITIAL_COUNCIL_OPINIONS);
      setDiligences(INITIAL_DILIGENCES);
      setSelectedSchoolId('emef-menino-deus');
      setSelectedYear(2024);
      setActiveTab('dashboard');
    }
  };

  // Gestão Democrática (Lei Municipal nº 9.738/2024)
  const getDemocraticEvaluationForSchool = (schoolId: string, semester = '2024/2'): DemocraticEvaluation => {
    const key = `${schoolId}-${semester}`;
    if (democraticEvaluations[key]) {
      return democraticEvaluations[key];
    }
    const targetSchool = schools.find(s => s.id === schoolId) || schools[0];
    const targetDiligences = diligences.filter(d => d.schoolId === schoolId);
    return generateSystemGuidanceForSchool(targetSchool, targetDiligences, expenses, assets, semester);
  };

  const saveDemocraticEvaluation = (evaluation: DemocraticEvaluation) => {
    const key = `${evaluation.schoolId}-${evaluation.semester}`;
    setDemocraticEvaluations(prev => ({
      ...prev,
      [key]: {
        ...evaluation,
        lastUpdated: new Date().toISOString(),
      }
    }));
  };

  const resetDemocraticEvaluationToGuidance = (schoolId: string, semester = '2024/2'): DemocraticEvaluation => {
    const targetSchool = schools.find(s => s.id === schoolId) || schools[0];
    const targetDiligences = diligences.filter(d => d.schoolId === schoolId);
    const fresh = generateSystemGuidanceForSchool(targetSchool, targetDiligences, expenses, assets, semester);
    saveDemocraticEvaluation(fresh);
    return fresh;
  };

  const updateDirectorshipRequirements = (schoolId: string, updates: Partial<DirectorshipRequirements>) => {
    setDirectorshipRequirements(prev => {
      const current = prev[schoolId] || {
        schoolId,
        schoolName: schools.find(s => s.id === schoolId)?.name || 'Escola Municipal',
        directorName: schools.find(s => s.id === schoolId)?.presidentName || 'Diretor Escolar',
        isEffectiveMagisterio: true,
        passedProbationaryPeriod: true,
        hasPostGraduationOrPedagogy: true,
        has180hManagementCourses: true,
        completedCourseHours: 180,
        hasCleanRecordAndCertificates: true,
        schoolManagementPlanSubmitted: true,
        cpmFiscalRegularity: true,
        isEligible: true,
        lastAuditedDate: new Date().toISOString().split('T')[0],
      };
      const merged: DirectorshipRequirements = {
        ...current,
        ...updates,
        lastAuditedDate: new Date().toISOString().split('T')[0],
      };
      merged.isEligible = Boolean(
        merged.isEffectiveMagisterio &&
        merged.passedProbationaryPeriod &&
        merged.hasPostGraduationOrPedagogy &&
        merged.has180hManagementCourses &&
        merged.hasCleanRecordAndCertificates &&
        merged.schoolManagementPlanSubmitted
      );
      return {
        ...prev,
        [schoolId]: merged,
      };
    });
  };

  return (
    <PDDEContext.Provider
      value={{
        activeViewMode,
        setActiveViewMode,
        selectedSchoolId,
        setSelectedSchoolId,
        selectedYear,
        setSelectedYear,
        activeTab,
        setActiveTab,
        currentSchool,
        schools,
        transfers,
        yields,
        quotations,
        expenses,
        assets,
        councilOpinions,
        diligences,
        suppliers,
        schoolTransfers,
        schoolYields,
        schoolQuotations,
        schoolExpenses,
        schoolAssets,
        schoolCouncilOpinion,
        schoolDiligences,
        financialSummary,
        complianceAlerts,
        auditChecks,
        addSchool,
        updateSchool,
        updateSchoolStatus,
        addTransfer,
        deleteTransfer,
        addYield,
        deleteYield,
        addQuotation,
        updateQuotation,
        deleteQuotation,
        submitProposalToQuotation,
        getQuotationByToken,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addExpense,
        updateExpense,
        deleteExpense,
        toggleReconciled,
        reconcileAllExpenses,
        addAsset,
        updateAsset,
        deleteAsset,
        syncCapitalAssets,
        saveCouncilOpinion,
        autoFixCouncilOpinion,
        addDiligence,
        respondDiligence,
        resolveDiligence,
        democraticEvaluations,
        directorshipRequirements,
        saveDemocraticEvaluation,
        resetDemocraticEvaluationToGuidance,
        updateDirectorshipRequirements,
        getDemocraticEvaluationForSchool,
        exportDataJSON,
        importDataJSON,
        resetToDefault,
      }}
    >
      {children}
    </PDDEContext.Provider>
  );
};

export const usePDDE = () => {
  const context = useContext(PDDEContext);
  if (!context) {
    throw new Error('usePDDE must be used within a PDDEProvider');
  }
  return context;
};
