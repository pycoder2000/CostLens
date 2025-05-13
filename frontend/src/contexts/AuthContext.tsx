"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";

interface User {
  id: number;
  email: string;
  role: string;
  team_id: number | null;
  access_token: string;
  token_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login with:", email);
      const response = await axios.post<User>(
        `${process.env.NEXT_PUBLIC_API_URL}/login`,
        {
          email,
          password,
        }
      );

      const userData = response.data;
      console.log("Login successful, user data:", userData);
      setUser(userData);

      // Store in localStorage
      localStorage.setItem("user", JSON.stringify(userData));

      // Also set cookie for middleware
      document.cookie = `user=${JSON.stringify(userData)}; path=/; max-age=${
        60 * 60 * 24 * 7
      }`; // 1 week
      console.log("User cookie set for middleware");

      // Redirect using window.location for more reliable redirect
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    // Clear cookie too
    document.cookie = "user=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
