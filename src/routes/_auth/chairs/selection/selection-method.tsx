import { createFileRoute } from '@tanstack/react-router';
import { SelectionMethod } from '@/components/selection/SelectionMethod';

// Tipo para los parámetros de búsqueda
type SearchParams = {
  method: 'cutoff' | 'threshold'; 
  value: string;
};

// validateSearch para leer/inicializar los parámetros
export const Route = createFileRoute('/_auth/chairs/selection/selection-method')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const method = search.method as 'cutoff' | 'threshold' | undefined;
    const value = search.value as string | undefined;
    return {
      // Valores por defecto si no están presentes o son inválidos
      method: (method === 'cutoff' || method === 'threshold') ? method : 'cutoff',
      value: value ?? '', 
    };
  },
});

function RouteComponent() {
  return <SelectionMethod />;
}
