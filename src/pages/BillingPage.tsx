import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillingDashboardTab } from "@/components/billing/BillingDashboardTab";
import { GenerateBillTab } from "@/components/billing/GenerateBillTab";
import { CustomInvoiceTab } from "@/components/billing/CustomInvoiceTab";
import { InvoiceRegisterTab } from "@/components/billing/InvoiceRegisterTab";
import { FabricMasterTab } from "@/components/billing/FabricMasterTab";
import { FabricConsumptionTab } from "@/components/billing/FabricConsumptionTab";
import { ReportsTab } from "@/components/billing/ReportsTab";
import { BillingSettingsTab } from "@/components/billing/BillingSettingsTab";
import { InvoicePrintModal } from "@/components/billing/InvoicePrintModal";
import type { Invoice, BillingConfig } from "@/types/billingModule";
import { getBillingConfig } from "@/services/billingModuleService";
import {
  LayoutDashboard,
  FileCheck2,
  PlusCircle,
  FileText,
  Layers,
  Scissors,
  BarChart3,
  Settings,
} from "lucide-react";

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<Invoice | null>(null);
  const [config, setConfig] = useState<BillingConfig | null>(null);

  useEffect(() => {
    getBillingConfig().then(setConfig).catch(() => {});
  }, []);

  const handleInvoiceCreated = (invoice: Invoice) => {
    setSelectedInvoiceForView(invoice);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoiceForView(invoice);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-xl h-auto flex flex-nowrap min-w-max gap-1">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 text-slate-300"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </TabsTrigger>

            <TabsTrigger
              value="generate"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 text-slate-300"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              Generate Bill
            </TabsTrigger>

            <TabsTrigger
              value="custom"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 text-slate-300"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Manual Invoice
            </TabsTrigger>

            <TabsTrigger
              value="invoices"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 text-slate-300"
            >
              <FileText className="w-3.5 h-3.5" />
              Invoice Register
            </TabsTrigger>

            <TabsTrigger
              value="fabrics"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 text-slate-300"
            >
              <Layers className="w-3.5 h-3.5" />
              Fabric Master
            </TabsTrigger>

            <TabsTrigger
              value="consumption"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 text-slate-300"
            >
              <Scissors className="w-3.5 h-3.5" />
              Consumption Rules
            </TabsTrigger>

            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 text-slate-300"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              GST & Reports
            </TabsTrigger>

            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 text-slate-300"
            >
              <Settings className="w-3.5 h-3.5" />
              Tax & Settings
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents */}
        <TabsContent value="dashboard" className="m-0 focus-visible:outline-none">
          <BillingDashboardTab onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="generate" className="m-0 focus-visible:outline-none">
          <GenerateBillTab onInvoiceCreated={handleInvoiceCreated} />
        </TabsContent>

        <TabsContent value="custom" className="m-0 focus-visible:outline-none">
          <CustomInvoiceTab onInvoiceCreated={handleInvoiceCreated} />
        </TabsContent>

        <TabsContent value="invoices" className="m-0 focus-visible:outline-none">
          <InvoiceRegisterTab onViewInvoice={handleViewInvoice} />
        </TabsContent>

        <TabsContent value="fabrics" className="m-0 focus-visible:outline-none">
          <FabricMasterTab />
        </TabsContent>

        <TabsContent value="consumption" className="m-0 focus-visible:outline-none">
          <FabricConsumptionTab />
        </TabsContent>

        <TabsContent value="reports" className="m-0 focus-visible:outline-none">
          <ReportsTab />
        </TabsContent>

        <TabsContent value="settings" className="m-0 focus-visible:outline-none">
          <BillingSettingsTab />
        </TabsContent>
      </Tabs>

      {/* Global Invoice Print / View Modal */}
      <InvoicePrintModal
        isOpen={!!selectedInvoiceForView}
        onClose={() => setSelectedInvoiceForView(null)}
        invoice={selectedInvoiceForView}
        config={config}
      />
    </div>
  );
}
