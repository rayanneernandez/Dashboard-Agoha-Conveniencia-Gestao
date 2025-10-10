import { useState, useRef } from "react";
import { Lead, LeadFormData } from "@/types/lead";
import AIChat from "@/components/dashboard/AIChat";
import SideMenu from "@/components/dashboard/SideMenu";
import LeadForm from "@/components/dashboard/LeadForm";

interface DashboardLayoutProps {
  children: React.ReactNode;
  leads: Lead[];
  onAddLead?: (leadData: LeadFormData) => void;
  onImportLeads?: (importedLeads: Lead[]) => void;
}

const DashboardLayout = ({ children, leads, onAddLead, onImportLeads }: DashboardLayoutProps) => {
  const [openLeadForm, setOpenLeadForm] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Cabeçalho */}
      <div className="bg-[#660629] text-white p-3 flex justify-between items-center">
        <div className="flex items-center gap-6 ml-10">
          <img src="/logo.png" alt="AgHora" className="h-7" />
          <div>
            <h1 className="text-lg font-semibold">Dashboard de Leads</h1>
            <p className="text-xs opacity-80">AgHora Conveniência</p>
          </div>
        </div>

        <button
          onClick={() => setOpenLeadForm(true)}
          className="bg-white text-[#660629] px-3 py-1 rounded-md flex items-center gap-1 text-sm font-medium hover:bg-gray-100 transition"
        >
          <span className="font-bold text-lg">+</span> Novo Lead
        </button>
      </div>

      {/* Menu lateral */}
      <SideMenu 
        leads={leads} 
        dashboardRef={dashboardRef}
        onImportLeads={onImportLeads}
      />

      {/* Conteúdo */}
      <main className="relative z-0" ref={dashboardRef}>
        {children}
      </main>

      {/* Chat e Modal */}
      <AIChat leads={leads} />
      <LeadForm
        open={openLeadForm}
        onOpenChange={setOpenLeadForm}
        onAddLead={onAddLead}
      />
    </div>
  );
};

export default DashboardLayout;
