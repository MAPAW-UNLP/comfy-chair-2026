// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Hook para leer una conferencia especifica por su ID
//
// -------------------------------------------------------------------------------------- 

import { useEffect, useState } from "react";
import { getConferenceById } from "@/services/conferenceServices";
import type { Conference } from "@/components/conference/ConferenceApp";

export function useFetchConference(id: number) {
  const [conference, setConference] = useState<Conference | null>(null);
  const [loadingConference, setLoadingConference] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getConferenceById(id);
        setConference(data);
      } catch {
        console.error("Error al obtener la conferencia");
        setConference(null);
      } finally {
        setLoadingConference(false);
      }
    }

    fetch();
  }, [id]);

  return { conference, loadingConference };
}
