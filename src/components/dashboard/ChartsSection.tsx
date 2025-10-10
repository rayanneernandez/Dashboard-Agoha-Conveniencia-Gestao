import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Lead } from "@/types/lead";

interface ChartsSectionProps {
  leads: Lead[];
  dashboardRef?: React.RefObject<HTMLDivElement>;
}

const TEMPERATURE_COLORS = {
  Quente: "#EB1E61",
  Morno: "#FF6900",
  Frio: "#008E49",
};

const REGION_COLORS: Record<string, string> = {
  Norte: "#3b82f6",
  Nordeste: "#f97316",
  "Centro-Oeste": "#eab308",
  Sudeste: "#22c55e",
  Sul: "#8b5cf6",
};

const ChartsSection: React.FC<ChartsSectionProps> = ({ leads }) => {
  const leadList = leads || [];

  const estadosData = leadList.reduce(
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
    [] as Array<{ estado: string; total: number; quentes: number; mornos: number; frios: number }>
  )
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return (
    <div className="w-full h-full">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: TEMPERATURE_COLORS.Frio }}></div>
        <span className="text-sm">Frios</span>
        <div className="w-3 h-3 rounded-sm ml-4" style={{ backgroundColor: TEMPERATURE_COLORS.Morno }}></div>
        <span className="text-sm">Mornos</span>
        <div className="w-3 h-3 rounded-sm ml-4" style={{ backgroundColor: TEMPERATURE_COLORS.Quente }}></div>
        <span className="text-sm">Quentes</span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={estadosData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" vertical={false} />
          <XAxis dataKey="estado" stroke="#333" fontSize={12} />
          <YAxis stroke="#333" fontSize={12} />
          <Tooltip />
          <Bar dataKey="frios" stackId="a" name="Frios" fill={TEMPERATURE_COLORS.Frio} />
          <Bar dataKey="mornos" stackId="a" name="Mornos" fill={TEMPERATURE_COLORS.Morno} />
          <Bar dataKey="quentes" stackId="a" name="Quentes" fill={TEMPERATURE_COLORS.Quente} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RegionPieChart = ({ leads }: { leads: Lead[] }) => {
  const leadList = leads || [];

  const regiaoData = leadList.reduce((acc, lead) => {
    acc[lead.regiao] = (acc[lead.regiao] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(regiaoData).map(([regiao, total]) => ({
    name: regiao,
    value: total,
    percentage: leadList.length > 0 ? ((total / leadList.length) * 100).toFixed(1) : "0",
  }));

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={120}
            innerRadius={60}
            dataKey="value"
            label={({ name, percentage }) => `${name} (${percentage}%)`}
            labelLine={true}
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
    </div>
  );
};

export default ChartsSection;
