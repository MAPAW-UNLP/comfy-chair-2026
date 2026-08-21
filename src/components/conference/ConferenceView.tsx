import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldSet, FieldTitle } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useEffect, useState } from 'react';

type VISTA_CHOICES = 'single blind' | 'double blind' | 'completo';

type ConferenceViewProp = {
  valorVisualizacion?: VISTA_CHOICES;
  actualizarVista: (v: VISTA_CHOICES) => void;
};

export function ConferenceView({
  valorVisualizacion,
  actualizarVista,
}: ConferenceViewProp) {
  const [valorSeleccionado, setValorSeleccionado] =
    useState<VISTA_CHOICES>('single blind');

  useEffect(() => {
    actualizarVista(valorSeleccionado);
  }, [valorSeleccionado]);

  useEffect(() => {
    if (valorVisualizacion) setValorSeleccionado(valorVisualizacion);
  }, [valorVisualizacion]);

  return (
    <div className="lg:w-1/2">
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
            value={valorSeleccionado}
            onValueChange={(v) => setValorSeleccionado(v as VISTA_CHOICES)}
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

            <FieldLabel htmlFor="completo" className="cursor-pointer">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Completo</FieldTitle>
                  <FieldDescription>
                    Tanto el revisor como el autor verán quienes
                    escribieron/revisaron los artículos.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="completo" id="completo" />
              </Field>
            </FieldLabel>
          </RadioGroup>
        </FieldSet>
      </FieldGroup>
    </div>
  );
}
