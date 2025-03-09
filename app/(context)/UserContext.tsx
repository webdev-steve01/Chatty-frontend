// context/UserContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// Define context type
interface UserContextType {
  email: string;
  setEmail: (name: string) => void;
}

// Create context with default values
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component to wrap the app
export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [email, setEmail] = useState<string>("");

  return (
    <UserContext.Provider value={{ email, setEmail }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for using the UserContext
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
