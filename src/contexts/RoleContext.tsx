import React, { createContext, useContext, useEffect, useState } from "react";

export type SelectedRole = {
  role: string;
  conferenceId: number;
  conferenceName: string;
};

type RoleContextType = {
  selectedRole: SelectedRole | null;
  setSelectedRole: (r: SelectedRole | null) => void;
  clearSelectedRole: () => void;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedRole, setSelectedRoleState] = useState<SelectedRole | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("comfychair:selectedRole");
      if (raw) setSelectedRoleState(JSON.parse(raw));
    } catch {}
  }, []);

  const setSelectedRole = (r: SelectedRole | null) => {
    setSelectedRoleState(r);
    try {
      if (r) localStorage.setItem("comfychair:selectedRole", JSON.stringify(r));
      else localStorage.removeItem("comfychair:selectedRole");
    } catch {}
  };

  const clearSelectedRole = () => setSelectedRole(null);

  return (
    <RoleContext.Provider value={{ selectedRole, setSelectedRole, clearSelectedRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return ctx;
}