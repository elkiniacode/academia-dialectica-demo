"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function ClientLoginForm() {
  const router = useRouter();
  const { update } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  useEffect(() => {
    router.prefetch("/client/dashboard");
    router.prefetch("/admin/balance");
  }, [router]);

  async function doLogin(user: string, pass: string, isDemo?: string) {
    setError("");
    setLoading(true);
    if (isDemo) setActiveDemo(isDemo);

    const result = await signIn("credentials", {
      username: user,
      password: pass,
      redirect: false,
    });

    if (result?.error) {
      setError("Usuario o contraseña incorrectos");
      setLoading(false);
      setActiveDemo(null);
      return;
    }

    await update();

    const res = await fetch("/api/auth/session");
    const session = await res.json();

    setLoading(false);
    setActiveDemo(null);

    if (session?.role === "ADMIN") {
      const now = new Date();
      router.push(
        `/admin/balance?year=${now.getFullYear()}&month=${now.getMonth() + 1}`
      );
    } else {
      router.push("/client/dashboard");
    }
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await doLogin(username.trim(), password);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Usuario
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="tu.usuario"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-lg transition-colors font-semibold"
      >
        {loading && !activeDemo ? "Ingresando..." : "Iniciar sesión"}
      </button>

      {/* Demo quick-fill divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-4 text-gray-400 font-medium tracking-wider">
            Acceso rápido demo
          </span>
        </div>
      </div>

      {/* Demo quick-fill buttons */}
      <button
        type="button"
        onClick={() => doLogin("bart", "ab676767", "bart")}
        disabled={loading}
        className="w-full py-2.5 px-4 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group"
      >
        <span className="group-hover:scale-110 transition-transform">🎓</span>
        {activeDemo === "bart"
          ? "Preparando mochila..."
          : "Entrar como Bart (Estudiante)"}
      </button>
      <button
        type="button"
        onClick={() => doLogin("Big Boss (BB)", "platzi2026", "admin")}
        disabled={loading}
        className="w-full py-2.5 px-4 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group"
      >
        <span className="group-hover:scale-110 transition-transform">🛡️</span>
        {activeDemo === "admin"
          ? "Iniciando protocolo..."
          : "Acceso Big Boss (Admin)"}
      </button>
    </form>
  );
}
