import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Route, Router as WouterRouter, Switch } from 'wouter';
import { useAuth } from '@workspace/auth-web';

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
import DriverDetailPage from '@/modules/crm/pages/DriverDetailPage';
import AgendaPage from '@/modules/agenda/pages/AgendaPage';
import ChatPage from '@/modules/chat/pages/ChatPage';
import TasksPage from '@/modules/tasks/pages/TasksPage';
import MarketingOverviewPage from '@/modules/marketing/pages/MarketingOverviewPage';
import MarketingBriefingPage from '@/modules/marketing/pages/MarketingBriefingPage';
import MarketingCalendarPage from '@/modules/marketing/pages/MarketingCalendarPage';
import MarketingCampaignsPage from '@/modules/marketing/pages/MarketingCampaignsPage';
import MarketingAiCreativePage from '@/modules/marketing/pages/MarketingAiCreativePage';
import MarketingMetricsPage from '@/modules/marketing/pages/MarketingMetricsPage';
import MarketingTasksPage from '@/modules/marketing/pages/MarketingTasksPage';
import InvoicesListPage from '@/modules/accounting/pages/InvoicesListPage';
import InvoiceDetailPage from '@/modules/accounting/pages/InvoiceDetailPage';
import TransactionsListPage from '@/modules/accounting/pages/TransactionsListPage';
import TransactionDetailPage from '@/modules/accounting/pages/TransactionDetailPage';
import ProfitLossPage from '@/modules/accounting/pages/ProfitLossPage';
import DocumentsPage from '@/modules/documents/pages/DocumentsPage';
import AuditLogPage from '@/modules/documents/pages/AuditLogPage';
import ReportsPage from '@/modules/reports/pages/ReportsPage';
import SettingsPage from '@/modules/settings/pages/SettingsPage';
import NotFound from '@/pages/not-found';
import { Shell } from '@/shared/components/layout/Shell';
import { Toaster } from '@/shared/components/ui/toaster';
import { TooltipProvider } from '@/shared/components/ui/tooltip';

const queryClient = new QueryClient();

function AppRouter() {
  const { isAuthenticated, isLoading, sessionError } = useAuth();
  if (isLoading) return <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background"><span className="text-sm font-medium text-muted-foreground">Loading Lander Dispatch…</span></div>;
  if (sessionError) return <main className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5"><h1 className="text-xl font-semibold text-slate-950">Unable to connect to the API</h1><p className="mt-2 text-sm leading-6 text-slate-600">The application could not verify your session. Confirm that the API is running and try again.</p><button type="button" onClick={() => window.location.reload()} className="mt-6 h-11 w-full rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200">Try again</button></section></main>;
  if (!isAuthenticated) return <Switch><Route path="/login" component={Login} /><Route><Redirect to="/login" /></Route></Switch>;

  return <Shell><Switch>
    <Route path="/" component={() => <Redirect to="/dashboard" />} />
    <Route path="/login" component={() => <Redirect to="/dashboard" />} />
    <Route path="/dashboard" component={DashboardPage} />
    <Route path="/loads" component={LoadsListPage} /><Route path="/loads/new" component={LoadNewPage} /><Route path="/loads/:loadId" component={LoadDetailPage} />
    <Route path="/carriers" component={CarriersListPage} /><Route path="/carriers/new" component={CarrierNewPage} /><Route path="/carriers/:carrierId" component={CarrierDetailPage} />
    <Route path="/brokers" component={BrokersListPage} /><Route path="/brokers/new" component={BrokerNewPage} /><Route path="/brokers/:brokerId" component={BrokerDetailPage} />
    <Route path="/crm" component={CRMPage} /><Route path="/crm/leads/:leadId" component={LeadDetailPage} /><Route path="/crm/contacts/:contactId" component={ContactDetailPage} /><Route path="/crm/drivers/:driverId" component={DriverDetailPage} />
    <Route path="/agenda" component={AgendaPage} />
    <Route path="/chat" component={ChatPage} />
    <Route path="/tasks" component={TasksPage} />
    <Route path="/marketing" component={() => <Redirect to="/marketing/overview" />} />
    <Route path="/marketing/overview" component={MarketingOverviewPage} />
    <Route path="/marketing/briefing" component={MarketingBriefingPage} />
    <Route path="/marketing/calendar" component={MarketingCalendarPage} />
    <Route path="/marketing/campaigns" component={MarketingCampaignsPage} />
    <Route path="/marketing/ai-creative" component={MarketingAiCreativePage} />
    <Route path="/marketing/metrics" component={MarketingMetricsPage} />
    <Route path="/marketing/tasks" component={MarketingTasksPage} />
    <Route path="/accounting/invoices" component={InvoicesListPage} /><Route path="/accounting/invoices/:invoiceId" component={InvoiceDetailPage} /><Route path="/accounting/transactions" component={TransactionsListPage} /><Route path="/accounting/transactions/:transactionId" component={TransactionDetailPage} /><Route path="/accounting/profit-loss" component={ProfitLossPage} />
    <Route path="/documents" component={DocumentsPage} /><Route path="/audit-log" component={AuditLogPage} /><Route path="/reports" component={ReportsPage} /><Route path="/settings" component={SettingsPage} />
    <Route component={NotFound} />
  </Switch></Shell>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><AppRouter /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;
