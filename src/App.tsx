/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PDDEProvider, usePDDE } from './context/PDDEContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { TransfersView } from './components/TransfersView';
import { QuotationsView } from './components/QuotationsView';
import { ExpensesView } from './components/ExpensesView';
import { AssetsView } from './components/AssetsView';
import { ReconciliationView } from './components/ReconciliationView';
import { OfficialReportsView } from './components/OfficialReportsView';
import { SEEMonitorView } from './components/SEEMonitorView';
import { ProblemSolverView } from './components/ProblemSolverView';
import { SupplierPublicPortal } from './components/SupplierPublicPortal';

function getInitialQuoteToken(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('cotacao') || params.get('token') || params.get('quote');
  if (fromQuery) return fromQuery;

  const pathname = window.location.pathname;
  if (pathname.includes('/cotacao/')) {
    const parts = pathname.split('/cotacao/');
    if (parts[1]) return parts[1].split('/')[0].split('?')[0];
  }

  const hash = window.location.hash;
  if (hash.includes('cotacao=')) {
    const match = hash.match(/cotacao=([^&]+)/);
    if (match && match[1]) return decodeURIComponent(match[1]);
  }
  return null;
}

const MainContent: React.FC = () => {
  const { activeViewMode, activeTab } = usePDDE();

  if (activeViewMode === 'see' && activeTab !== 'audit') {
    return <SEEMonitorView />;
  }

  switch (activeTab) {
    case 'transfers':
      return <TransfersView />;
    case 'quotations':
      return <QuotationsView />;
    case 'expenses':
      return <ExpensesView />;
    case 'assets':
      return <AssetsView />;
    case 'reconciliation':
      return <ReconciliationView />;
    case 'reports':
      return <OfficialReportsView />;
    case 'audit':
      return <ProblemSolverView />;
    case 'dashboard':
    default:
      return <DashboardView />;
  }
};

const AppShell: React.FC = () => {
  const [publicQuoteToken, setPublicQuoteToken] = useState<string | null>(getInitialQuoteToken());

  useEffect(() => {
    const checkToken = () => {
      setPublicQuoteToken(getInitialQuoteToken());
    };
    window.addEventListener('popstate', checkToken);
    window.addEventListener('hashchange', checkToken);
    return () => {
      window.removeEventListener('popstate', checkToken);
      window.removeEventListener('hashchange', checkToken);
    };
  }, []);

  // When opened via WhatsApp or public quotation link, show direct supplier portal!
  if (publicQuoteToken) {
    return (
      <SupplierPublicPortal 
        token={publicQuoteToken} 
        onExit={() => setPublicQuoteToken(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <Header />
      <Navigation />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <MainContent />
      </main>

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5 text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-700">
              Prefeitura Municipal de Santa Cruz do Sul / RS
            </span>
            <span className="mx-2 text-slate-300">·</span>
            <span>Secretaria Municipal de Educação (SEE)</span>
            <span className="mx-2 text-slate-300">·</span>
            <span>Praça da Bandeira, s/n - Centro</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Setor de Prestação de Contas e Apoio aos CPMs</span>
            <span>·</span>
            <span>(51) 3715-2443</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <PDDEProvider>
      <AppShell />
    </PDDEProvider>
  );
}
