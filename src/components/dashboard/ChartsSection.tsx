import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { Lead } from "@/types/lead";
import { brandColors, chartColors } from "@/lib/colors";

interface ChartsSectionProps {
  leads: Lead[];
}

// Paleta principal
const ACTIVE_COLORS = ["#A3023D", "#EB1E61", "#008E49", "#FF6900"];
// Paleta alternativa para Inativos
const INACTIVE_COLORS = ["#FF6900", "#008E49", "#EB1E61", "#A3023D"];

const ChartsSection = ({ leads }: ChartsSectionProps) => {
  // --- Gráfico de barras por estado ---
  const estadosData = leads
    .reduce((acc, lead) => {
      const estadoExistente = acc.find((item) => item.estado === lead.estado);
      if (estadoExistente) {
        estadoExistente.total += 1;
        if (lead.status === "Ativo") estadoExistente.ativos += 1;
        else estadoExistente.inativos += 1;
      } else {
        acc.push({
          estado: lead.estado,
          total: 1,
          ativos: lead.status === "Ativo" ? 1 : 0,
          inativos: lead.status === "Inativo" ? 1 : 0,
        });
      }
      return acc;
    }, [] as Array<{ estado: string; total: number; ativos: number; inativos: number }> )
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // --- Gráfico de pizza por região ---
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Barras - Leads por Estado */}
      <Card className="shadow-card border-0 card-hover">
        <CardHeader className="rounded-t-lg text-white bg-gradient-total">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>Leads por Estado</CardTitle>
          </div>
          <CardDescription className="text-white/90">
            Distribuição de leads ativos e inativos por estado
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={estadosData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="estado" stroke="#333" fontSize={12} />
              <YAxis stroke="#333" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  color: "#333",
                }}
              />
              <Legend verticalAlign="top" height={36} />
              
              {/* Barras Ativos */}
              <Bar dataKey="ativos" stackId="a" name="Ativos" radius={[4,4,0,0]}>
                {estadosData.map((entry, index) => (
                  <Cell key={entry.estado} fill={ACTIVE_COLORS[index % ACTIVE_COLORS.length]} />
                ))}
              </Bar>
              
              {/* Barras Inativos */}
              <Bar dataKey="inativos" stackId="a" name="Inativos" radius={[4,4,0,0]}>
                {estadosData.map((entry, index) => (
                  <Cell key={entry.estado} fill={INACTIVE_COLORS[index % INACTIVE_COLORS.length]} />
                ))}
              </Bar>

            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Pizza - Distribuição por Região */}
      <Card className="shadow-card border-0 card-hover">
        <CardHeader className="rounded-t-lg text-white bg-gradient-success">
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
                label={({ index }) => {
                  const entry = pieData[index];
                  return `${entry.name} (${entry.percentage}%)`;
                }}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={ACTIVE_COLORS[index % ACTIVE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  color: "#333",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legenda */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: ACTIVE_COLORS[index % ACTIVE_COLORS.length] }}
                ></div>
                <span>
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartsSection;
