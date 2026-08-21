// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Hook para leer todos los usuarios
//
// -------------------------------------------------------------------------------------- 

import { useEffect, useState } from "react";
import { getAllUsers, type User } from "@/services/userServices";

export function useFetchUsers() {
  const [userList, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch {
        console.error("Error al obtener los usuarios");
      } finally {
        setLoadingUsers(false);
      }
    }

    fetch();
  }, []);

  return { userList, loadingUsers };
}
