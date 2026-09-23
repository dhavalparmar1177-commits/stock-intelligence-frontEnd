import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";
const Ctx = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (localStorage.getItem("accessToken"))
            api.get("/auth/me").then((r) => setUser(r.data)).catch(() => localStorage.clear()).finally(() => setLoading(false));
        else
            setLoading(false);
    }, []);
    const login = async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        const me = await api.get("/auth/me");
        setUser(me.data);
    };
    const register = async (email, password, name) => {
        const { data } = await api.post("/auth/register", { email, password, name });
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        const me = await api.get("/auth/me");
        setUser(me.data);
    };
    const logout = async () => {
        try {
            await api.post("/auth/logout", { refreshToken: localStorage.getItem("refreshToken") });
        }
        catch { }
        localStorage.clear();
        setUser(null);
    };
    return _jsx(Ctx.Provider, { value: { user, loading, login, register, logout }, children: children });
}
export const useAuth = () => useContext(Ctx);
