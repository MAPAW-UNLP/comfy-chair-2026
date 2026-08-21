// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Componente para mostrar un diálogo de alerta para confirmar la eliminación de un artículo ya aceptado
//
// -------------------------------------------------------------------------------------- 

// Importaciones
import { toast } from "sonner"
import api from "@/services/api"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { checkDeletionRequestExists } from "@/services/articleServices"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription } from "@/components/ui/alert-dialog"
import { AlertDialogFooter, AlertDialogHeader, AlertDialogTrigger, AlertDialogTitle } from "@/components/ui/alert-dialog"

// Lo que espera recibir el componente
interface ArticleDeleteAcceptedProps {
  trigger: React.ReactNode
  articleId: number
  onConfirm: () => void
}

//Cuerpo del Componente
export default function ArticleDeleteAccepted({ trigger, articleId, onConfirm }: ArticleDeleteAcceptedProps) {

  // Estados del componente
  const [descripcion, setDescripcion] = useState("")
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false);

  //------------------------------------------------------------
  // Manejo de la confirmación de eliminación
  //------------------------------------------------------------
  const handleConfirm = async () => {
    if (descripcion.trim() === "") {
      setError("motivo de la solicitud requerido")
      return
    }
    setError("")
    setLoading(true);
    try {
      const requestData = { article_id: articleId, description: descripcion.trim() };
      await api.post("/api/article-deletion-request/", requestData, { headers: { "Content-Type": "application/json" }});
      toast.success('Solicitud de baja enviada correctamente!', { duration: 5000 });
      onConfirm?.();
      setOpen(false)
    } catch (err: any) {
      console.error("Error al enviar la solicitud:", err);
      setError(err.response?.data?.detail || "Error al enviar la solicitud");
    } finally {
      setLoading(false);
    }
  }

  //------------------------------------------------------------
  // Manejo del clic en el trigger para abrir el diálogo
  //------------------------------------------------------------
  const handleTriggerClick = async (e: React.SyntheticEvent) => {
    e.preventDefault(); // evitamos abrir el dialog automáticamente
    const exists = await checkDeletionRequestExists(articleId);
    if (exists) {
      toast.error("Este artículo ya tiene una solicitud de baja pendiente", { duration: 5000 });
      return;
    }
    setOpen(true); // si no existe, abrimos el dialog
  };

  //------------------------------------------------------------
  // Renderizado del componente
  //------------------------------------------------------------
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <div onClick={handleTriggerClick}>
          {trigger}
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Solicitar Baja de Articulo</AlertDialogTitle>
          <AlertDialogDescription>
            Tu artículo ya ha sido aceptado en la conferencia.  
            Si deseas solicitar su baja, por favor proporcioná un motivo claro para fundamentar tu pedido.
            <br /><br />
            Esta solicitud será enviada a los chairs de la sesión, quienes evaluarán si corresponde aprobar o rechazar la baja.  
            Tené en cuenta que la aprobación no está garantizada, los chairs pueden denegar la solicitud si consideran que afecta al programa o a la organización de la sesión.
            <br /><br />
            Por ello, es importante detallar adecuadamente las razones de tu pedido.
          </AlertDialogDescription>
        </AlertDialogHeader>
          <div className="flex-1 flex flex-col gap-2">
            <Label htmlFor="mensaje">Motivo {error && <p className="text-destructive">{error}</p>}</Label>
            <Textarea id="mensaje" placeholder="Hasta 300 caracteres..." rows={10} maxLength={300} onChange={(e) => (setDescripcion(e.target.value), setError(""))}/>
          </div>
        <AlertDialogFooter>
          {/* Boton de cancelar */}
          <AlertDialogCancel asChild>
            <Button variant="outline" className="bg-zinc-500 text-white">
              Cancelar
            </Button>
          </AlertDialogCancel>
          {/* Boton de confirmar eliminacion */}
          <Button variant="outline" className="bg-slate-900 text-white" onClick={handleConfirm} disabled={loading}>
            Confirmar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

}
