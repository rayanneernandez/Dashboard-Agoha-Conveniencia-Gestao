import { BrowserRouter as Router, Routes, Route, BrowserRouter } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MapPage from "./pages/MapPage";
import LeadsListPage from "./pages/LeadsListPage";
import { Toaster } from "sonner";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/leads" element={<LeadsListPage filter="leads" />} />
        <Route path="/clientes" element={<LeadsListPage filter="clientes" />} />
        <Route path="/quentes" element={<LeadsListPage filter="quentes" />} />
        <Route path="/ativos" element={<LeadsListPage filter="ativos" />} />
        <Route path="/inativos" element={<LeadsListPage filter="inativos" />} />
        <Route path="/mapa" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
