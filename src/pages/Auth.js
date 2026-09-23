import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export function Login() {
    const [email, setEmail] = useState("demo@demo.local");
    const [password, setPassword] = useState("Demo@123");
    const [err, setErr] = useState("");
    const { login } = useAuth();
    const nav = useNavigate();
    const go = async () => { try {
        await login(email, password);
        nav("/");
    }
    catch (e) {
        setErr(e.response?.data?.error || "Login failed");
    } };
    return _jsxs("div", { className: "max-w-sm mx-auto bg-white dark:bg-slate-900 border rounded-xl p-6 space-y-3", children: [_jsx("h1", { className: "font-bold text-lg", children: "Login" }), err && _jsx("p", { className: "text-red-600 text-sm", children: err }), _jsx("input", { value: email, onChange: (e) => setEmail(e.target.value), className: "w-full border rounded px-3 py-2 text-sm", placeholder: "Email" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full border rounded px-3 py-2 text-sm", placeholder: "Password" }), _jsx("button", { onClick: go, className: "w-full bg-blue-600 text-white rounded py-2 text-sm", children: "Login" }), _jsxs("p", { className: "text-xs", children: ["No account? ", _jsx(Link, { to: "/register", className: "text-blue-600", children: "Register" })] })] });
}
export function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [err, setErr] = useState("");
    const { register } = useAuth();
    const nav = useNavigate();
    const go = async () => { try {
        await register(email, password, name);
        nav("/");
    }
    catch (e) {
        setErr(e.response?.data?.error || "Register failed");
    } };
    return _jsxs("div", { className: "max-w-sm mx-auto bg-white dark:bg-slate-900 border rounded-xl p-6 space-y-3", children: [_jsx("h1", { className: "font-bold text-lg", children: "Register" }), err && _jsx("p", { className: "text-red-600 text-sm", children: err }), _jsx("input", { value: name, onChange: (e) => setName(e.target.value), className: "w-full border rounded px-3 py-2 text-sm", placeholder: "Name" }), _jsx("input", { value: email, onChange: (e) => setEmail(e.target.value), className: "w-full border rounded px-3 py-2 text-sm", placeholder: "Email" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full border rounded px-3 py-2 text-sm", placeholder: "Password (min 6)" }), _jsx("button", { onClick: go, className: "w-full bg-blue-600 text-white rounded py-2 text-sm", children: "Register" })] });
}
