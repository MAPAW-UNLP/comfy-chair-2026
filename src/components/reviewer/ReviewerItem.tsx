"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import type { ReviewerInfo } from "@/services/reviewerServices"
import { toast } from "sonner"

type ReviewerWithInterest = ReviewerInfo & {
  email: string;
  interest: "interesado" | "quizas" | "no_interesado" | "ninguno";
};

interface RevisorProps {
  reviewer: ReviewerWithInterest;
  assigned?: boolean
  onAssign?: () => boolean | Promise<boolean>
  onRemove?: () => void | Promise<void>
}

const interestMap: Record<string, string> = {
  interesed: "Interesado",
  quizas: "Quizás",
  no_interesado: "No interesado",
  ninguno: "No indicó",
}

export const ReviewerItem: React.FC<RevisorProps> = ({
  reviewer,
  assigned = false,
  onAssign,
  onRemove,
}) => {
  const [isAssigned, setIsAssigned] = useState(assigned)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsAssigned(assigned)
  }, [assigned])

  const getColorState = () => {
    switch (reviewer.interest) {
      case "interesado":
        return { backgroundColor: "hsla(141, 81%, 66%, 1.00)" }
      case "quizas":
        return { backgroundColor: "hsl(52.8 98.3% 76.9%)" }
      case "no_interesado":
        return { backgroundColor: "hsl(0 90.6% 70.8%)" }
      default:
        return { backgroundColor: "hsl(240 4.9% 83.9%)" }
    }
  }

  const handleClick = async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      if (!isAssigned) {
        if (!onAssign) return
        const success = await onAssign()
        if (success) {
          setIsAssigned(true)
          toast.success(`El revisor ${reviewer.full_name} fue asignado con éxito`)
        }
      } else {
        if (!onRemove) return
        await onRemove()
        setIsAssigned(false)
        toast.error(`El revisor ${reviewer.full_name} fue desasignado`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`w-screen flex items-center justify-between py-6 border-b border-black relative left-1/2 right-1/2 -translate-x-1/2 px-8 cursor-pointer transition 
        ${isAssigned ? "hover:bg-red-100" : "hover:bg-green-100"}`}
    >
      <div className="flex-1 text-center mr-4 flex flex-col items-center">
        <p className="text-xl font-bold tracking-wide">{reviewer.full_name}</p>
        <span
          className="mt-2 h-9 w-30 flex items-center justify-center rounded-md text-sm font-bold text-black border border-black"
          style={getColorState()}
        >
          {interestMap[reviewer.interest] || "No indicó"}
        </span>
      </div>
      <div
        className={`flex items-center justify-center gap-2 px-2 py-0.5 rounded-lg text-lg font-bold border border-black transition select-none 
          ${isAssigned
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-green-600 text-white hover:bg-green-700"}`}
        style={{ width: "145px", textAlign: "center" }}
      >
        {isAssigned ? <Trash2 size={20} /> : <Plus size={20} />}
        <span>{isAssigned ? "Desasignar" : "Asignar"}</span>
      </div>
    </div>
  )
}
