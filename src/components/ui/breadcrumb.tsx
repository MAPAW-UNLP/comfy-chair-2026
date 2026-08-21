// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Componente para mostrar un breadcrumb de navegación
//
// -------------------------------------------------------------------------------------- 

import { Link } from '@tanstack/react-router'

type Crumb = { label: string; to?: string }

interface BreadcrumbProps {
  items: Crumb[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  if (!items || items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="text-base text-muted-foreground">
      <ol className="flex items-center gap-2">
        {items.map((it, idx) => {
          const isLast = idx === items.length - 1
          return (
            <li key={idx} className="flex items-center gap-2">
              {it.to && !isLast ? (
                <Link to={it.to} className="hover:underline text-slate-700">
                  {it.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? "font-semibold text-slate-900 max-w-[150px] sm:max-w-[350px] md:max-w-[500px] lg:max-w-[750px] truncate overflow-hidden whitespace-nowrap block"
                      : "text-slate-600"
                  }
                  title={isLast ? it.label : undefined} // tooltip con el texto real
                >
                  {it.label}
                </span>
              )}

              {!isLast && <span className="text-slate-400">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
