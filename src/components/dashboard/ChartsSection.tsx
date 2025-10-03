import React, { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { Lead } from "@/types/lead";

interface ChartsSectionProps {
  leads: Lead[];
  dashboardRef: React.RefObject<HTMLDivElement>; // Apenas para exportar
}

const ACTIVE_COLORS = ["#A3023D", "#EB1E61", "#008E49", "#FF6900"];
const INACTIVE_COLORS = ["#FF6900", "#008E49", "#EB1E61", "#A3023D"];
const REGION_COLORS: Record<string, string> = {
  Norte: "#3b82f6",
  Nordeste: "#f97316",
  "Centro-Oeste": "#eab308",
  Sudeste: "#22c55e",
  Sul: "#8b5cf6",
};

const TEMPERATURE_COLORS = {
  "Quente": "#EB1E61",
  "Morno": "#FF6900",
  "Frio": "#008E49"
};

const ChartsSection = ({ leads, dashboardRef }: ChartsSectionProps) => {
  // Dados agregados por estado e temperatura
  const estadosData = leads.reduce(
    (acc, lead) => {
      const estadoExistente = acc.find((item) => item.estado === lead.estado);
      if (estadoExistente) {
        estadoExistente.total += 1;
        if (lead.temperatura === "Quente") estadoExistente.quentes += 1;
        else if (lead.temperatura === "Morno") estadoExistente.mornos += 1;
        else if (lead.temperatura === "Frio") estadoExistente.frios += 1;
      } else {
        acc.push({
          estado: lead.estado,
          total: 1,
          quentes: lead.temperatura === "Quente" ? 1 : 0,
          mornos: lead.temperatura === "Morno" ? 1 : 0,
          frios: lead.temperatura === "Frio" ? 1 : 0,
        });
      }
      return acc;
    },
    [] as Array<{ 
      estado: string; 
      total: number; 
      quentes: number; 
      mornos: number; 
      frios: number;
    }>
  ).sort((a, b) => b.total - a.total)
   .slice(0, 8);

  // Dados agregados por região
  const regiaoData = leads.reduce((acc, lead) => {
    acc[lead.regiao] = (acc[lead.regiao] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(regiaoData).map(([regiao, total]) => ({
    name: regiao,
    value: total,
    percentage: leads.length > 0 ? ((total / leads.length) * 100).toFixed(1) : "0",
  }));

  return (
    <div ref={dashboardRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Barras */}
      <Card className="shadow-card border-0 card-hover">
        <CardHeader className="bg-gradient-total text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>Leads por Estado</CardTitle>
          </div>
          <CardDescription className="text-white/90">
            Distribuição de leads por temperatura em cada estado
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={estadosData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="estado" stroke="#333" fontSize={12} />
              <YAxis stroke="#333" fontSize={12} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="quentes" stackId="a" name="Quentes" fill={TEMPERATURE_COLORS["Quente"]} />
              <Bar dataKey="mornos" stackId="a" name="Mornos" fill={TEMPERATURE_COLORS["Morno"]} />
              <Bar dataKey="frios" stackId="a" name="Frios" fill={TEMPERATURE_COLORS["Frio"]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Pizza */}
      <Card className="shadow-card border-0 card-hover">
        <CardHeader className="bg-gradient-success text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            <CardTitle>Distribuição por Região</CardTitle>
          </div>
          <CardDescription className="text-white/90">
            Percentual de leads por região do Brasil
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ index }) => `${pieData[index].name} (${pieData[index].percentage}%)`}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={REGION_COLORS[entry.name as keyof typeof REGION_COLORS] || "#8884d8"}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartsSection;
