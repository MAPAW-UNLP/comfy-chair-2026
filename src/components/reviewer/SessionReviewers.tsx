import { useEffect, useState } from "react";

// Definimos el tipo del revisor
interface Revisor {
  id: number;
  username: string;
}

export function SessionReviewers() {
  const [revisores, setRevisores] = useState<Revisor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviewers = async () => {
      // Obtenemos el ID de la sesión del localStorage (igual que en tu PanelSessionChair)
      const sessionIdString = localStorage.getItem("selectedSession");
      if (!sessionIdString) return;

      try {
        // TODO: Aquí irá el fetch a tu backend de Django real cuando esté listo.
        // Ejemplo: const response = await fetch(`http://localhost:8000/api/sessions/${sessionIdString}/reviewers/`);
        // const data = await response.json();
        
        // MOCK DE DATOS: Usamos datos falsos temporalmente para que veas que funciona la búsqueda
        const mockData = [
          { id: 1, username: "user1" },
          { id: 2, username: "user2" },
          { id: 3, username: "alan_turing" },
          { id: 4, username: "ada_lovelace" }
        ];
        
        // Simulamos el tiempo de carga de una API
        setTimeout(() => {
          setRevisores(mockData);
          setLoading(false);
        }, 500);

      } catch (error) {
        console.error("Error obteniendo revisores:", error);
        setLoading(false);
      }
    };

    fetchReviewers();
  }, []);

  // Lógica de búsqueda (ignora mayúsculas y minúsculas)
  const filteredReviewers = revisores.filter((revisor) =>
    revisor.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Revisores de la Sesión</h1>

      {/* Input de Búsqueda */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre de usuario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
        />
      </div>

      {/* Lista de Revisores */}
      {loading ? (
        <p className="text-center text-gray-500 animate-pulse font-semibold text-xl">Cargando revisores...</p>
      ) : (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
          {filteredReviewers.length > 0 ? (
            filteredReviewers.map((revisor) => (
              <div key={revisor.id} className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 flex justify-between items-center transition">
                <span className="font-semibold text-gray-800 text-lg">{revisor.username}</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full font-medium">Revisor</span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              No se encontraron revisores que coincidan con "{searchTerm}".
            </div>
          )}
          
          {/* Contador en el pie de la lista */}
          <div className="bg-slate-800 text-white p-3 text-center text-sm">
            Mostrando {filteredReviewers.length} de {revisores.length} revisores
          </div>
        </div>
      )}
    </div>
  );
}