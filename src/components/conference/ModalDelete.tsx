import React, { useState } from 'react';
import { Button } from '../ui/button';
import { useNavigate } from '@tanstack/react-router';

type ModalEliminarProps = {
  onDelete: () => Promise<void>
  title: string;
  isConference?: boolean;
  cerrar: (value: React.SetStateAction<boolean>) => void;
};

function ModalEliminar({
  onDelete,
  title,
  isConference,
  cerrar,
}: ModalEliminarProps) {
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const confirmarEliminar = async () => {
    setDeleting(true);
    try {
      onDelete()
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar');
    } finally {
      setDeleting(false);
      cerrar(false);
    }
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border-2 border-gray-300">
        <h3 className="text-lg font-bold mb-4">Confirmar eliminación</h3>
        <p className="mb-6">
          ¿Estás seguro que deseas eliminar la{' '}
          {isConference ? 'conferencia' : 'sesión'} "{title}"? Esta acción no se
          puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={cerrar}
            className="cursor-pointer"
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={confirmarEliminar}
            className="cursor-pointer bg-red-900 text-white hover:bg-red-700"
            disabled={deleting}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ModalEliminar;
