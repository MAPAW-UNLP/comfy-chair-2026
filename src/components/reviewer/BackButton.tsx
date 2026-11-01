// src/components/reviewer/BackButton.tsx
// Botón de volver de solo ícono.
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  /** Qué hacer al apretarlo (normalmente, navegar a la pantalla anterior). */
  onClick: () => void;
  /**
   * Texto para lectores de pantalla y para el tooltip del mouse.
   * El botón no muestra texto: sin esto no se entendería qué hace.
   */
  label?: string;
  className?: string;
}

export function BackButton({
  onClick,
  label = "Volver",
  className,
}: BackButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={className}
    >
      <ArrowLeft className="size-5" />
    </Button>
  );
}
