import { Lead } from "@/types/lead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface CustomBrazilMapProps {
  leads: Lead[];
}

const CustomBrazilMap = ({ leads }: CustomBrazilMapProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calcular estatísticas por estado
  const estadosStats = leads.reduce((acc, lead) => {
    if (!acc[lead.estado]) {
      acc[lead.estado] = { total: 0, clientes: 0 };
    }
    acc[lead.estado].total += 1;
    if (lead.status === 'Cliente') {
      acc[lead.estado].clientes += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; clientes: number }>);

  // Ordenar estados por quantidade total de leads
  const estadosOrdenados = Object.entries(estadosStats)
    .sort(([, a], [, b]) => b.total - a.total);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const container = scrollContainerRef.current;
      if (direction === 'left') {
        container.scrollLeft -= scrollAmount;
      } else {
        container.scrollLeft += scrollAmount;
      }
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-foreground">Distribuição de Leads por Estado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {estadosOrdenados.map(([estado, stats]) => (
              <div 
                key={estado} 
                className="flex-none w-[250px] snap-start p-4 border rounded-lg bg-card"
              >
                <div className="text-center">
                  <h3 className="font-semibold text-foreground mb-2">
                    {estado}
                  </h3>
                  <div className="space-y-2">
                    <Badge variant="outline" className="w-full justify-center">
                      Total: {stats.total}
                    </Badge>
                    <Badge 
                      variant={stats.clientes > 0 ? "default" : "secondary"}
                      className="w-full justify-center"
                    >
                      Clientes: {stats.clientes}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute top-1/2 -left-4 -translate-y-1/2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              className="rounded-full shadow-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute top-1/2 -right-4 -translate-y-1/2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              className="rounded-full shadow-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomBrazilMap;