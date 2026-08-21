# ArticleStatsChart Component

Componente de gráfico de barras horizontales para visualizar el estado de los artículos (aceptados vs rechazados) en una sesión de conferencia.

## Características

- **Barras horizontales animadas** con gradientes de color
- **Indicadores visuales** con iconos de check (aceptados) y X (rechazados)
- **Porcentajes calculados** automáticamente
- **Capacidad de la sesión** con indicador de exceso
- **Diseño responsivo** usando shadcn/ui components
- **Animaciones suaves** con transiciones CSS

## Uso

```tsx
import { ArticleStatsChart } from '@/components/conference/ArticleStatsChart';

// Ejemplo básico
<ArticleStatsChart 
  accepted={15} 
  rejected={5}
/>

// Con capacidad de sesión
<ArticleStatsChart 
  accepted={25} 
  rejected={10}
  capacity={20}
/>
```

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `accepted` | `number` | Sí | Número de artículos aceptados |
| `rejected` | `number` | Sí | Número de artículos rechazados |
| `capacity` | `number` | No | Capacidad máxima de artículos aceptados |

## Visualización

El componente muestra:

1. **Encabezado**: "Estado de los Artículos" con el total
2. **Barra de aceptados**: Color verde con gradiente, muestra número y porcentaje
3. **Barra de rechazados**: Color rojo con gradiente, muestra número y porcentaje
4. **Indicador de capacidad** (opcional): Muestra cuántos artículos se han aceptado respecto a la capacidad máxima
   - Si se excede la capacidad, muestra un indicador de advertencia en naranja/rojo

## Integración

El componente está integrado en:

- **Statistics.tsx**: Se muestra en la pestaña de estadísticas de una sesión
- **ASession.tsx**: Calcula automáticamente los artículos aceptados/rechazados del estado de los artículos

## Estilos

Utiliza:
- **shadcn/ui Card** para el contenedor
- **lucide-react** para los iconos
- **Tailwind CSS** para estilos y animaciones
- **Gradientes CSS** para las barras de progreso
