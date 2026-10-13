import { useEffect, useState } from "react";

// 1. Actualizar los tipos para coincidir con tu models.py
interface Revisor {
  id: number;
  full_name: string;
  email: string;
}

export function SessionReviewers() {
  const [revisores, setRevisores] = useState<Revisor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviewers = async () => {
      const sessionIdString = localStorage.getItem("selectedSession");
      
      const token = localStorage.getItem("authToken"); 

      if (!sessionIdString) return;

      try {
        const response = await fetch(`http://localhost:8000/user/sessions/${sessionIdString}/reviewers/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Agregamos el header de autorización:
            'Authorization': token ? `Bearer ${token}` : '', // O `Bearer ${token}` dependiendo de tu conf de DRF
          }
        });
        
        if (!response.ok) {
           console.error("Error del servidor:", response.status);
           throw new Error('Error al obtener los datos');
        }
        
        const data = await response.json();
        setRevisores(data);
      } catch (error) {
        console.error("Error obteniendo revisores:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewers();
  }, []);

  // 3. Filtrar usando full_name o email en lugar de username
  const filteredReviewers = revisores.filter((revisor) =>
    revisor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    revisor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Revisores de la Sesión</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
        />
      </div>

      {loading ? (
        <p className="text-center text-gray-500 animate-pulse font-semibold text-xl">Cargando revisores...</p>
      ) : (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
          {filteredReviewers.length > 0 ? (
            filteredReviewers.map((revisor) => (
              <div key={revisor.id} className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 flex justify-between items-center transition">
                <div>
                  {/* 4. Mostrar full_name y email */}
                  <div className="font-semibold text-gray-800 text-lg">{revisor.full_name}</div>
                  <div className="text-sm text-gray-500">{revisor.email}</div>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full font-medium">Revisor</span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              No se encontraron revisores que coincidan con "{searchTerm}".
            </div>
          )}
          
          <div className="bg-slate-800 text-white p-3 text-center text-sm">
            Mostrando {filteredReviewers.length} de {revisores.length} revisores
          </div>
        </div>
      )}
    </div>
  );
}