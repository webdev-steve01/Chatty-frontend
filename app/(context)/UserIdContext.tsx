"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// Define the shape of the context data
interface UserIdContextType {
  userId: string;
  setUserId: (id: string) => void;
}

// Create context with default values
const UserIdContext = createContext<UserIdContextType | undefined>(undefined);

// Provider component to wrap your app
export const UserIdProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [userId, setUserId] = useState<string>("");

  return (
    <UserIdContext.Provider value={{ userId, setUserId }}>
      {children}
    </UserIdContext.Provider>
  );
};

// Custom hook to access the context
export const useUserId = (): UserIdContextType => {
  const context = useContext(UserIdContext);
  if (!context) {
    throw new Error("useUserId must be used within a UserIdProvider");
  }
  return context;
};
