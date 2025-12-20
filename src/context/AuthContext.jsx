// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { loginBusiness, signupBusiness, getBusinessMe } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [business, setBusiness] = useState(null);
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  // --------------------------
  // INIT (load from localStorage)
  // --------------------------
  useEffect(() => {
    async function init() {
      const storedToken = localStorage.getItem("pureai_token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        setToken(storedToken);

        const data = await getBusinessMe();
        setBusiness(data.business);
        setAgent(data.agent);
      } catch (err) {
        console.error("Invalid or expired token:", err);
        localStorage.removeItem("pureai_token");
        setToken(null);
        setBusiness(null);
        setAgent(null);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // --------------------------
  // SIGNUP
  // --------------------------
  async function signup({ businessName, email, password, businessType }) {
    const data = await signupBusiness({
      businessName,
      email,
      password,
      businessType,
    });

    localStorage.setItem("pureai_token", data.token);
    setToken(data.token);
    setBusiness(data.business);

    const me = await getBusinessMe();
    setAgent(me.agent);

    return data;
  }

  // --------------------------
  // LOGIN
  // --------------------------
  async function login({ email, password }) {
    const data = await loginBusiness({ email, password });

    localStorage.setItem("pureai_token", data.token);
    setToken(data.token);
    setBusiness(data.business);

    const me = await getBusinessMe();
    setAgent(me.agent);

    return data;
  }

  // --------------------------
  // LOGOUT
  // --------------------------
  function logout() {
    localStorage.removeItem("pureai_token");
    setToken(null);
    setBusiness(null);
    setAgent(null);
  }

  const value = {
    token,
    business,
    agent,
    loading,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}