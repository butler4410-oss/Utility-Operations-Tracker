import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import ClientDetail from "@/pages/client-detail";
import Tracking from "@/pages/tracking";
import PrintVolume from "@/pages/print-volume";
import Surveys from "@/pages/surveys";
import Reports from "@/pages/reports";
import Admin from "@/pages/admin";
import CallCenter from "@/pages/call-center";
import RecentActivity from "@/pages/recent-activity";
import DataFileStatus from "@/pages/data-file-status";
import ImportReports from "@/pages/import-reports";
import QAProofs from "@/pages/qa-proofs";
import ConfirmationHolds from "@/pages/confirmation-holds";
import MailCompliancePage from "@/pages/mail-compliance-page";
import RunDetail from "@/pages/run-detail";
import JobTrax from "@/pages/jobtax";
import BillMessages from "@/pages/bill-messages";
import EBill from "@/pages/ebill";
import Upload from "@/pages/upload";
import ClientServices from "@/pages/client-services";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Dashboard} />
      <Route path="/recent-activity" component={RecentActivity} />
      <Route path="/data-file-status" component={DataFileStatus} />
      <Route path="/runs/:id" component={RunDetail} />
      <Route path="/import-reports" component={ImportReports} />
      <Route path="/qa-proofs" component={QAProofs} />
      <Route path="/confirmation-holds" component={ConfirmationHolds} />
      <Route path="/mail-compliance" component={MailCompliancePage} />
      <Route path="/jobtax" component={JobTrax} />
      <Route path="/bill-messages" component={BillMessages} />
      <Route path="/ebill" component={EBill} />
      <Route path="/upload" component={Upload} />
      <Route path="/client-services" component={ClientServices} />
      <Route path="/clients" component={Clients} />
      <Route path="/clients/:id" component={ClientDetail} />
      <Route path="/tracking" component={Tracking} />
      <Route path="/print-volume" component={PrintVolume} />
      <Route path="/surveys" component={Surveys} />
      <Route path="/call-center" component={CallCenter} />
      <Route path="/reports" component={Reports} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
