import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// Grupo 3 (2026): mock. El envío de la consulta queda para la sprint 3.
type ContactSupportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
}

const REASONS = [
  { value: 'motivo', label: 'Conocer el motivo' },
  { value: 'habilitacion', label: 'Solicitar la habilitación' },
  { value: 'otro', label: 'Otro' },
]

export function ContactSupportDialog({ open, onOpenChange, email }: ContactSupportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Contactar al soporte</DialogTitle>
          <DialogDescription>
            Contanos qué necesitás y te vamos a responder por email.
          </DialogDescription>
        </DialogHeader>
        <SupportForm email={email} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function SupportForm({ email, onClose }: { email: string; onClose: () => void }) {
  const [reason, setReason] = useState('motivo')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`Tu consulta fue enviada. Te vamos a responder a ${email}.`)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="support-email">Email</Label>
        <Input
          id="support-email"
          type="email"
          readOnly
          className="border-gray-400 bg-muted text-muted-foreground cursor-default"
          value={email}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="support-reason">Motivo</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger id="support-reason" className="w-full border-gray-400">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REASONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="support-message">Mensaje</Label>
        <Textarea
          id="support-message"
          required
          rows={4}
          className="border-gray-400"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">Enviar</Button>
      </DialogFooter>
    </form>
  )
}
