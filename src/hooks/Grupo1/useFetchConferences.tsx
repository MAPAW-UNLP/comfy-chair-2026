// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Hook para leer todas las conferencias activas
//
// -------------------------------------------------------------------------------------- 

import { useEffect, useState } from "react";
import { getActiveConferences } from "@/services/conferenceServices";
import type { Conference } from "@/components/conference/ConferenceApp";

export function useFetchConferences() {
  const [conferenceList, setConferences] = useState<Conference[]>([]);
  const [loadingConferences, setLoadingConferences] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const list = await getActiveConferences();
        setConferences(list);
      } catch {
        console.error("Error al obtener las conferencias");
      } finally {
        setLoadingConferences(false);
      }
    }

    fetch();
  }, []);

  return { conferenceList, loadingConferences };
}
