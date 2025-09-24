import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { Lead } from "@/types/lead";

interface ChartsSectionProps {
  leads: Lead[];
}

const ChartsSection = ({ leads }: ChartsSectionProps) => {
  // Dados para gráfico de barras por estado
  const estadosData = leads.reduce((acc, lead) => {
    const estadoExistente = acc.find(item => item.estado === lead.estado);
    if (estadoExistente) {
      estadoExistente.total += 1;
      if (lead.status === 'Ativo') estadoExistente.ativos += 1;
      else estadoExistente.inativos += 1;
    } else {
      acc.push({
        estado: lead.estado,
        total: 1,
        ativos: lead.status === 'Ativo' ? 1 : 0,
        inativos: lead.status === 'Inativo' ? 1 : 0,
      });
    }
    return acc;
  }, [] as Array<{ estado: string; total: number; ativos: number; inativos: number; }>)
  .sort((a, b) => b.total - a.total)
  .slice(0, 8); // Top 8 estados

  // Dados para gráfico de pizza - distribuição por região
  const regiaoData = leads.reduce((acc, lead) => {
    acc[lead.regiao] = (acc[lead.regiao] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(regiaoData).map(([regiao, total]) => ({
    name: regiao,
    value: total,
    percentage: leads.length > 0 ? ((total / leads.length) * 100).toFixed(1) : '0'
  }));

  const COLORS = {
    'Norte': '#3b82f6',
    'Nordeste': '#f97316', 
    'Centro-Oeste': '#eab308',
    'Sudeste': '#22c55e',
    'Sul': '#8b5cf6'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Barras - Leads por Estado */}
      <Card className="shadow-card border-0">
        <CardHeader className="bg-gradient-total text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>Leads por Estado</CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80">
            Distribuição de leads ativos e inativos por estado
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={estadosData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="estado" 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--card-foreground))'
                }}
              />
              <Bar 
                dataKey="ativos" 
                stackId="a" 
                fill="hsl(var(--success))" 
                name="Ativos"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="inativos" 
                stackId="a" 
                fill="hsl(var(--danger))" 
                name="Inativos"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Pizza - Distribuição por Região */}
      <Card className="shadow-card border-0">
        <CardHeader className="bg-gradient-success text-success-foreground rounded-t-lg">
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            <CardTitle>Distribuição por Região</CardTitle>
          </div>
          <CardDescription className="text-success-foreground/80">
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
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${name} (${percentage}%)`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--card-foreground))'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legenda customizada */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] }}
                ></div>
                <span>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartsSection;