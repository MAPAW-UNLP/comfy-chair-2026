// --------------------------------------------------------------------------------------
//
// Botón de selección de archivo (input oculto + botón que muestra el nombre elegido).
// Extraído de ArticleForm, donde este mismo patrón estaba duplicado para main_file y
// source_file. Lo reusan ArticleForm y CameraReadyForm.
//
// --------------------------------------------------------------------------------------

import { useRef } from "react";
import { Button } from "@/components/ui/button";

type FileSelectButtonProps = {
  label: string;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  /** Texto a mostrar en el botón (nombre del archivo elegido, el ya guardado, o el placeholder) */
  displayText: string;
  /** Si ya hay un archivo (elegido o guardado), para pintar el botón en verde */
  hasFile?: boolean;
  onFilesSelected: (files: File[]) => void;
};

export function FileSelectButton({
  label,
  accept,
  multiple = false,
  disabled = false,
  hasError = false,
  displayText,
  hasFile = false,
  onFilesSelected,
}: FileSelectButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files;
    if (!selected || selected.length === 0) return;
    onFilesSelected(Array.from(selected));
    // Permite volver a elegir el mismo archivo si se corrige y se reintenta
    event.target.value = "";
  };

  return (
    <div className="flex-1 grid items-start gap-2">
      <input
        type="file"
        ref={inputRef}
        onChange={handleChange}
        accept={accept}
        multiple={multiple}
        className="hidden"
        aria-label={label}
      />
      <Button
        variant="outline"
        onClick={handleClick}
        type="button"
        disabled={disabled}
        className={`w-full text-white transition-colors truncate ${
          hasError
            ? "bg-red-600 hover:bg-red-700"
            : hasFile
            ? "bg-lime-900 hover:bg-lime-950"
            : "bg-slate-900 hover:bg-slate-800"
        }`}
      >
        {displayText}
      </Button>
    </div>
  );
}
