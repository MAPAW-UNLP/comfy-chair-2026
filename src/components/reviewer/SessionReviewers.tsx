import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

// 1. Actualizar los tipos para coincidir con tu models.py
interface Revisor {
  id: number;
  full_name: string;
  email: string;
}

export function SessionReviewers() {
  const navigate = useNavigate();
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
            'Authorization': token ? `Bearer ${token}` : '', 
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

  // Función para manejar el envío de la invitación
  const handleInvite = async (userId: number) => {
    const sessionIdString = localStorage.getItem("selectedSession");
    const token = localStorage.getItem("authToken");

    if (!sessionIdString) return;

    try {
      // Importante: Ajusta esta URL según cómo registres la vista InviteReviewerAPI en tu urls.py de Django
      const response = await fetch(`http://localhost:8000/api/sessions/${sessionIdString}/invite/${userId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });

      if (response.ok) {
        alert("Invitación enviada con éxito");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Error al invitar al revisor");
      }
    } catch (error) {
      console.error("Error enviando invitación:", error);
      alert("Error de conexión al intentar enviar la invitación.");
    }
  };

  // 3. Filtrar usando full_name o email en lugar de username
  const filteredReviewers = revisores.filter((revisor) =>
    revisor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    revisor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      
      {/* Botón de volver atrás */}
      <button 
        onClick={() => navigate({ to: '/chairs/panel-session' })}
        className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
      >
        <ArrowLeft size={18} />
        Volver a la sesión
      </button>

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
                
                {/* Botón Invitar en lugar del Badge */}
                <button 
                  onClick={() => handleInvite(revisor.id)}
                  className="bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition shadow-sm"
                >
                  Invitar
                </button>

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