import { useEffect, useState } from "react"
import { getAllSessions, type Session } from "@/services/sessionServices"
import { useNavigate } from "@tanstack/react-router"

export function SelectSessionChair() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllSessions()
        setSessions(data)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const selectSession = (sessionId: number) => {
    localStorage.setItem("selectedSession", String(sessionId))
    navigate({ to: "/chairs/panel-session" })
  }

  if (loading) {
    return <div className="p-10 text-center">Cargando sesiones...</div>
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50"> 

      <div
        className="w-full text-white py-4 px-6 text-center shadow-md"
        style={{ backgroundColor: "#555353ff" }}
      >
        <h1 className="text-2xl font-bold">
          Seleccione una sesión
        </h1>
      </div>

      <div className="max-w-4xl w-full mx-auto p-6 md:p-10 flex-grow">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => selectSession(s.id)}
              className="p-6 rounded-xl shadow-xl border border-gray-200 bg-white hover:bg-gray-50 transition transform hover:scale-[1.02] text-left duration-300"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-1">{s.title}</h2>
              <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  Deadline: {s.deadline}
                </p>
                <p className="text-sm text-gray-600">
                  Capacidad: {s.capacity}
                </p>
                <p className="text-sm text-gray-600">
                  Conferencia: {s.conference?.title}
                </p>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}