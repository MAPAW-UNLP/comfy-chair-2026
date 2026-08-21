import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X } from 'lucide-react';
import { UserCombobox } from '@/components/combobox/UserCombobox';
import { getCommonUsers, type User } from '@/services/userServices';
import CustomCalendar from './CustomCalendar';
import type { Conference } from './ConferenceApp';
import { toast } from 'sonner';

// Tipos
type SelectionMethod = 'corte_fijo' | 'mejores';

export type SessionFormData = {
  title: string;
  deadline: Date | undefined;
  capacity: number;
  selectionMethod: SelectionMethod;
  percentage?: number | undefined; // Para corte fijo
  threshold?: number | undefined; // Para mejores
  chairs: User[]; // Lista de chairs
};

type SessionFormProps = {
  initialData?: Partial<SessionFormData>;
  onSubmit: (data: SessionFormData) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitButtonText?: string;
  conference: Conference
};

export default function SessionForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitButtonText = 'Guardar',
  conference
}: SessionFormProps) {
  // Estados del formulario
  const [title, setTitle] = useState<string>(initialData?.title || '');
  const [deadline, setDeadline] = useState<Date | undefined>(
    initialData?.deadline
  );
  const [capacity, setCapacity] = useState<string>(
    initialData?.capacity?.toString() || ''
  );
  const [selectionMethod, setSelectionMethod] = useState<SelectionMethod>(
    initialData?.selectionMethod || 'corte_fijo'
  );
  const [percentage, setPercentage] = useState<string>(
    initialData?.percentage?.toString() || '50'
  );
  const [threshold, setThreshold] = useState<string>(
    initialData?.threshold?.toString() || '-1'
  );
  const [chairs, setChairs] = useState<User[]>(initialData?.chairs || []);
  const [users, setUsers] = useState<User[]>([]);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getCommonUsers();
      const filteredData= data.filter(user => !conference.chairs?.includes(user.id))
      setUsers(filteredData);
    };
    fetchUsers();
  }, []);

  // Manejo de chairs
  const handleAddChair = (userId: number) => {
    const chair = users.find((u) => u.id === userId);
    if (chair && !chairs.some((ch) => ch.id === chair.id)) {
      setChairs([...chairs, chair]);
    }
  };

  const handleDeleteChair = (userId: number) => {
    setChairs(chairs.filter((ch) => ch.id !== userId));
  };

  // Validación y submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!title.trim()) {
      return;
    }
    if (!deadline) {
      toast.error("Se requiere un deadline para la sesión.")
      return;
    }
    const capacityNum = parseInt(capacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      return;
    }

    const formData: SessionFormData = {
      title: title.trim(),
      deadline,
      capacity: capacityNum,
      selectionMethod,
      chairs,
    };

    // Agregar el campo correspondiente según el método de selección
    if (selectionMethod === 'corte_fijo') {
      const percentageNum = parseInt(percentage);
      if (isNaN(percentageNum) || percentageNum <= 0 || percentageNum > 100) {
        return;
      }
      formData.percentage = percentageNum;
    } else {
      const thresholdNum = parseFloat(threshold);
      if (isNaN(thresholdNum)) {
        return;
      }
      formData.threshold = thresholdNum;
    }

    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 max-h-[80vh] overflow-auto px-5"
    >
      <div className="flex flex-col lg:flex-row justify-between gap-6 w-full">
        {/* Columna Izquierda */}
        <div className="flex flex-col gap-3 lg:w-1/2">
          {/* Nombre de la sesión */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Nombre de la sesión</label>
            <input
              className="border rounded px-2 py-1 bg-white"
              id="title"
              placeholder="Ingrese el nombre..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Deadline */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Deadline</label>
            <CustomCalendar date={deadline} setDate={setDeadline} conference={conference}/>
          </div>

          {/* Cupo de artículos aceptados */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold" htmlFor="capacity">
              Cupo de artículos aceptados
            </label>
            <input
              className="no-spinner border rounded px-2 py-1 bg-white"
              id="capacity"
              type="number"
              placeholder="Ingrese el cupo..."
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min="1"
              max="999"
              required
            />
          </div>

          {/* Chairs */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Chairs</label>
            <UserCombobox
              users={users}
              onValueChange={handleAddChair}
              isChair={true}
              backgroundWhite={true}
            />
            <div className="max-h-[150px] overflow-auto flex flex-col gap-2">
              {chairs.map((ch) => (
                <div
                  key={ch.id}
                  className="flex justify-between items-center bg-gray-100 px-3 py-1 rounded-lg shadow-sm w-full"
                >
                  <span className="truncate">
                    {ch.full_name} ({ch.email})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteChair(ch.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha - Método de Selección */}
        <div className="flex flex-col gap-2 lg:w-1/2">
          <label className="font-semibold">Método de Selección</label>
          <p className="text-sm text-gray-600 mb-2">
            Seleccione el método de selección de artículos.
          </p>
          <RadioGroup
            value={selectionMethod}
            onValueChange={(value) =>
              setSelectionMethod(value as SelectionMethod)
            }
          >
            {/* Corte fijo */}
            <div className="p-4 rounded-lg border-2 border-gray-300 bg-white hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="corte_fijo"
                  id="corte_fijo"
                  className="border-2 border-black"
                />
                <label htmlFor="corte_fijo" className="cursor-pointer font-semibold">
                  Porcentaje
                </label>
              </div>
              <p className="text-sm text-gray-600 mt-2 ml-6">
                Se aceptarán los artículos en orden decreciente de puntaje hasta completar el porcentaje indicado.
              </p>
              {selectionMethod === 'corte_fijo' && (
                <div className="mt-3 ml-6 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      className="no-spinner border rounded px-2 py-1 w-24 bg-white"
                      id="percentage"
                      type="number"
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                      min="1"
                      max="100"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Mejores */}
            <div className="p-4 rounded-lg border-2 border-gray-300 bg-white hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="mejores"
                  id="mejores"
                  className="border-2 border-black"
                />
                <label htmlFor="mejores" className="cursor-pointer font-semibold">
                  Puntaje minimo
                </label>
              </div>
              <p className="text-sm text-gray-600 mt-2 ml-6">
                Se aceptarán todos los artículos cuya calificación sea superior al umbral indicado.
              </p>
              {selectionMethod === 'mejores' && (
                <div className="mt-3 ml-6 flex flex-col gap-2">
                  <input
                    className="no-spinner border rounded px-2 py-1 w-24 bg-white"
                    id="threshold"
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    min="-3"
                    max="3"
                    step="0.01"
                  />
                </div>
              )}
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="cursor-pointer bg-gray-500 hover:bg-gray-400 text-white border-2 border-gray-600 shadow-md"
          size="lg"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          variant="secondary"
          size="lg"
          className="cursor-pointer bg-slate-900 text-white hover:bg-slate-700 border-2 border-slate-950 shadow-md"
        >
          {isLoading ? 'Guardando...' : submitButtonText}
        </Button>
      </div>
    </form>
  );
}
