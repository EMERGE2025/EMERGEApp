"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/utils/firebase";
import { doc, getDoc } from "firebase/firestore";

// 1. UPDATED: Add userRole to the context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  userRole: "admin" | "responder" | "user" | null;
  locationID: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

interface UserRole {
  role: "admin" | "responder" | "user" | null;
}

export const AuthProvider = ({
  children,
}: AuthProviderProps): React.ReactElement => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<UserRole["role"]>(null);

  const [locationID, setLocationID] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        setUser(user);

        try {
          const idTokenResult = await user.getIdTokenResult(true);
          const role = (idTokenResult.claims.role as string) || "user";

          if (role === "admin") {
            setUserRole("admin");
          } else if (role === "responder") {
            setUserRole("responder");
          } else {
            setUserRole("user");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole("user");
          setLocationID(null);
        }

        const userDocRef = doc(db, "ADMINISTRATORS", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setLocationID(userDoc.data()?.locationID || null);
        } else {
          // This might happen for a user who isn't an admin or responder
          setLocationID(null);
        }
      } else {
        // User is logged out here
        setUser(null);
        setUserRole(null);
        setLocationID(null);
      }
      setLoading(false);
    });

    return (): void => unsubscribe();
  }, []);

  const logout = async (): Promise<void> => {
    await signOut(auth);
  };

  const value: AuthContextType = {
    user,
    loading,
    logout,
    userRole,
    locationID,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
