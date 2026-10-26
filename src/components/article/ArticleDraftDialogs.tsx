// --------------------------------------------------------------------------------------
//
// Grupo 2 - Diálogos del flujo de borradores: confirmar la subida de un artículo y
// avisar que hay cambios sin guardar al salir del formulario.
//
// --------------------------------------------------------------------------------------

import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface SubmitConfirmDialogProps {
  open: boolean;
  deadlineLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// Confirmación antes de pasar un borrador a "Recibido"
export function SubmitConfirmDialog({ open, deadlineLabel, loading, onCancel, onConfirm }: SubmitConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Subir artículo?</AlertDialogTitle>
          <AlertDialogDescription>
            Una vez subido, el artículo pasa a estado "Recibido"
            {deadlineLabel ? ` y solo podrás modificarlo hasta el deadline (${deadlineLabel}).` : "."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" className="flex-1 cursor-pointer" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="outline" className="flex-1 bg-slate-900 text-white cursor-pointer" onClick={onConfirm} disabled={loading}>
            {loading ? "Subiendo..." : "Subir"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface UnsavedChangesDialogProps {
  open: boolean;
  saving?: boolean;
  onLeave: () => void;
  onStay: () => void;
  // Si no se pasa, el diálogo solo ofrece salir o quedarse
  onSaveDraft?: () => void;
}

// Aviso al salir del formulario con cambios sin guardar
export function UnsavedChangesDialog({ open, saving, onLeave, onStay, onSaveDraft }: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onStay()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
          <AlertDialogDescription>
            Tenés cambios sin guardar en este artículo. Si salís ahora, se van a perder.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" className="flex-1 cursor-pointer" onClick={onLeave} disabled={saving}>
            Salir sin guardar
          </Button>
          {onSaveDraft ? (
            <Button variant="outline" className="flex-1 bg-slate-900 text-white cursor-pointer" onClick={onSaveDraft} disabled={saving}>
              {saving ? "Guardando..." : "Guardar borrador"}
            </Button>
          ) : (
            <Button variant="outline" className="flex-1 bg-slate-900 text-white cursor-pointer" onClick={onStay}>
              Seguir editando
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
