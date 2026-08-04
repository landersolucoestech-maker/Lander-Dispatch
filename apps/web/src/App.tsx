import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/shared/components/ui/toaster';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect, useLocation } from 'wouter';
import { useAuth } from '@workspace/auth-web';
import { Shell } from '@/shared/components/layout/Shell';

// Pages
import Login from '@/modules/auth/pages/LoginPage';
import DashboardPage from '@/modules/dashboard/pages/DashboardPage';
import LoadsListPage from '@/modules/loads/pages/LoadsListPage';
import LoadNewPage from '@/modules/loads/pages/LoadNewPage';
import LoadDetailPage from '@/modules/loads/pages/LoadDetailPage';
import CarriersListPage from '@/modules/carriers/pages/CarriersListPage';
import CarrierNewPage from '@/modules/carriers/pages/CarrierNewPage';
import CarrierDetailPage from '@/modules/carriers/pages/CarrierDetailPage';
import BrokersListPage from '@/modules/brokers/pages/BrokersListPage';
import BrokerNewPage from '@/modules/brokers/pages/BrokerNewPage';
import BrokerDetailPage from '@/modules/brokers/pages/BrokerDetailPage';
import CRMPage from '@/modules/crm/pages/CRMPage';
import LeadDetailPage from '@/modules/crm/pages/LeadDetailPage';
import ContactDetailPage from '@/modules/crm/pages/ContactDetailPage';
import InvoicesListPage from '@/modules/accounting/pages/InvoicesListPage';
import InvoiceDetailPage from '@/modules/accounting/pages/InvoiceDetailPage';
import TransactionsListPage from '@/modules/accounting/pages/TransactionsListPage';
import TransactionDetailPage from '@/modules/accounting/pages/TransactionDetailPage';
import ProfitLossPage from '@/modules/accounting/pages/ProfitLossPage';
import ReportsPage from '@/modules/reports/pages/ReportsPage';
import SettingsPage from '@/modules/settings/pages/SettingsPage';

const queryClient = new QueryClient();

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
        <span className="font-mono text-sm text-muted-foreground">INITIALIZING...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  return (
    <Shell>
      <Switch>
        <Route path="/" component={() => <Redirect to="/dashboard" />} />
        <Route path="/login" component={() => <Redirect to="/dashboard" />} />
        <Route path="/dashboard" component={DashboardPage} />

        <Route path="/loads" component={LoadsListPage} />
        <Route path="/loads/new" component={LoadNewPage} />
        <Route path="/loads/:loadId" component={LoadDetailPage} />

        <Route path="/carriers" component={CarriersListPage} />
        <Route path="/carriers/new" component={CarrierNewPage} />
        <Route path="/carriers/:carrierId" component={CarrierDetailPage} />

        <Route path="/brokers" component={BrokersListPage} />
        <Route path="/brokers/new" component={BrokerNewPage} />
        <Route path="/brokers/:brokerId" component={BrokerDetailPage} />

        <Route path="/crm" component={CRMPage} />
        <Route path="/crm/leads/:leadId" component={LeadDetailPage} />
        <Route path="/crm/contacts/:contactId" component={ContactDetailPage} />

        <Route path="/accounting/invoices" component={InvoicesListPage} />
        <Route path="/accounting/invoices/:invoiceId" component={InvoiceDetailPage} />
        <Route path="/accounting/transactions" component={TransactionsListPage} />
        <Route path="/accounting/transactions/:transactionId" component={TransactionDetailPage} />
        <Route path="/accounting/profit-loss" component={ProfitLossPage} />

        <Route path="/reports" component={ReportsPage} />
        <Route path="/settings" component={SettingsPage} />

        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
