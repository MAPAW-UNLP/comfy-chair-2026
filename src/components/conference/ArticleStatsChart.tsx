import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

export type ChartItem = {
  label: string;           // Texto que aparece (ej: "Aceptados", "Regular")
  value: number;           // El número/cantidad
  icon: LucideIcon;        // Ícono de lucide-react (CheckCircle2, FileText, etc.)
  colorClass: string;      // Clase de Tailwind para el color del texto/ícono
  gradientClass: string;   // Clase de Tailwind para el gradiente de la barra
};

type ArticleStatsChartProps = {
  title: string;              // Título del gráfico (ej: "Estado de los Artículos")
  items: ChartItem[];         // Array de items a mostrar (cada uno es una barra)
  capacity?: number;          // (Opcional) Capacidad máxima 
  capacityLabel?: string;     // (Opcional) Etiqueta para la capacidad
  capacityValue?: number;     // (Opcional) Valor actual vs capacidad
  showTotal?: boolean;        // (Opcional) Mostrar el total en el header (default: true)
}

export function ArticleStatsChart({ 
  title, 
  items, 
  capacity, 
  capacityLabel = 'Cupo máximo de artículos aceptados:', 
  capacityValue,
  showTotal = true 
}: ArticleStatsChartProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="p-6 bg-white shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          {showTotal && <span className="text-sm text-gray-500">Total: {total}</span>}
        </div>

        {/* Renderizar cada item */}
        {items.map((item, index) => {
          // Calcular el porcentaje de este item respecto al total
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          const Icon = item.icon;

          return (
            <div key={index} className="flex flex-col gap-2">
              {/* Fila superior: Ícono, label, valor y porcentaje */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${item.colorClass}`} />
                  <span className="font-medium text-gray-700">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${item.colorClass}`}>{item.value}</span>
                  <span className="text-xs text-gray-500">
                    ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              
              {/* Barra de progreso animada - Siempre mostrar el contenedor */}
              <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                {item.value > 0 && (
                  <div
                    className={`${item.gradientClass} h-full flex items-center justify-start px-3 transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                  >
                    {/* Mostrar el número dentro de la barra solo si hay suficiente espacio (>10%) */}
                    {percentage > 10 && (
                      <span className="text-xs font-semibold text-white">
                        {item.value}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}


        {/* Información adicional sobre capacidad */}
        {capacity !== undefined && capacity > 0 && capacityValue !== undefined && (
          <div className="mt-2 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{capacityLabel}</span>
              <span className="font-semibold text-gray-800">
                {capacityValue} / {capacity}
                {capacityValue > capacity && (
                  <span className="ml-2 text-xs text-orange-600 font-normal">
                    (Excedido)
                  </span>
                )}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out ${
                  capacityValue > capacity
                    ? 'bg-gradient-to-r from-orange-500 to-red-500'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}
                // Limitar el ancho al 100% aunque se exceda la capacidad
                style={{ width: `${Math.min((capacityValue / capacity) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
