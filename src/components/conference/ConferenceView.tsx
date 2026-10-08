import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldSet, FieldTitle } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';
import { X } from 'lucide-react';
import type { FILES_ACCEPTED_CHOICES } from './ConferenceApp';

type VISTA_CHOICES = 'single blind' | 'double blind';

type ConferenceViewProp = {
  valorVisualizacion: VISTA_CHOICES;
  valorCountSources?: number;
  valorFilesAccepted?: FILES_ACCEPTED_CHOICES[];
  actualizarVista: (v: VISTA_CHOICES) => void;
  actualizarCountSources: (count: number) => void;
  actualizarFilesAccepted: (files: FILES_ACCEPTED_CHOICES[]) => void;
};

export function ConferenceView({
  valorVisualizacion,
  valorCountSources = 1,
  valorFilesAccepted = ['pdf'],
  actualizarVista,
  actualizarCountSources,
  actualizarFilesAccepted,
}: ConferenceViewProp) {
  const formatosPermitidos = [
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'DOCX' },
    { value: 'txt', label: 'TXT' },
  ];

  const files = valorFilesAccepted ?? ['pdf'];

  const handleSelectFormat = (val: FILES_ACCEPTED_CHOICES) => {
    if (!files.includes(val)) {
      actualizarFilesAccepted([...files, val]);
    }
  };

  const handleRemoveFormat = (formatToRemove: FILES_ACCEPTED_CHOICES) => {
    actualizarFilesAccepted(files.filter((f) => f !== formatToRemove));
  };

  return (
    <div className="lg:w-1/2 flex flex-col gap-5">
      <FieldGroup>
        <FieldSet>
          <FieldLabel
            className="font-semibold text-md"
            htmlFor="compute-environment-p8w"
          >
            Visualización
          </FieldLabel>
          <FieldDescription>
            Seleccione la visualización de los artículos.
          </FieldDescription>
          <RadioGroup
            value={valorVisualizacion}
            onValueChange={(v) => actualizarVista(v as VISTA_CHOICES)}
          >
            <FieldLabel htmlFor="single blind" className="cursor-pointer">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Single blind</FieldTitle>
                  <FieldDescription>
                    El revisor podrá ver el autor de los artículos de esta
                    conferencia, pero el autor no verá a los revisores.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="single blind" id="single blind" />
              </Field>
            </FieldLabel>

            <FieldLabel htmlFor="double blind" className="cursor-pointer">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Double blind</FieldTitle>
                  <FieldDescription>
                    Ni el revisor ni el autor verán quienes
                    escribieron/revisaron los artículos.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="double blind" id="double blind" />
              </Field>
            </FieldLabel>
          </RadioGroup>
        </FieldSet>

        {/* Selección de cantidad de fuentes con Select dentro de Field */}
        <Field>
          <FieldLabel>Cantidad de fuentes permitidas</FieldLabel>
          <Select
            value={String(valorCountSources)}
            onValueChange={(v) => actualizarCountSources(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar opción..." />
            </SelectTrigger>
            <SelectContent align="start" className="w-full">
              <SelectGroup>
                <SelectLabel>Cantidad de fuentes</SelectLabel>
                <SelectItem value="1">Una sola fuente</SelectItem>
                <SelectItem value="0">Muchas fuentes</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field className="min-h-[120px]">
          <FieldLabel>Formatos permitidos</FieldLabel>
          <Select
            value=""
            onValueChange={(v) => handleSelectFormat(v as FILES_ACCEPTED_CHOICES)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Agregar formato..." />
            </SelectTrigger>
            <SelectContent align="start" className="w-full">
              <SelectGroup>
                <SelectLabel>Formatos permitidos</SelectLabel>
                {formatosPermitidos.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Badges de formatos seleccionados con fallback a arreglo vacío si viene undefined */}
          <div className="flex flex-wrap gap-2 mt-2">
            {files.map((fmt) => (
              <div
                key={fmt}
                className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-3 py-1 rounded-lg text-sm shadow-sm"
              >
                <span className="uppercase font-medium text-slate-700">
                  {fmt}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFormat(fmt)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </Field>
      </FieldGroup>
    </div>
  );
}