"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { fetchWithAuth } from "@/lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const guest_session_id = Cookies.get("guest_session_id");

    try {
      const response = await fetchWithAuth("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          guest_session_id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Registration failed");
      }

      const { access_token, session_id } = await response.json();
      Cookies.set("auth_token", access_token, { expires: 7 }); // 7 days

      // Update the guest_session_id cookie so the frontend points to the merged main timeline
      if (session_id) {
        Cookies.set("guest_session_id", session_id, { expires: 365, path: "/" });
      }

      // Hard refresh to reload layout and fetch user
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center bg-background p-4 pt-[90px] min-h-0 overflow-y-auto">
      <div className="w-full max-w-md space-y-8 bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-white/50">
        <div>
          <h2 className="mt-6 text-center text-3xl font-medium tracking-wide text-sage-dark">
            注册新账户
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-2xl">{error}</div>}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="block text-sm font-medium text-sage-dark">邮箱</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-2xl border border-sage-light/50 bg-white/50 px-4 py-2.5 text-sage-dark placeholder-sage-muted focus:border-sage-primary focus:outline-none focus:ring-1 focus:ring-sage-primary transition-colors sm:text-sm"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sage-dark">密码</label>
              <input
                type="password"
                required
                className="mt-1 block w-full rounded-2xl border border-sage-light/50 bg-white/50 px-4 py-2.5 text-sage-dark placeholder-sage-muted focus:border-sage-primary focus:outline-none focus:ring-1 focus:ring-sage-primary transition-colors sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-full border border-transparent bg-sage-primary py-2.5 px-4 text-sm font-medium text-white hover:bg-sage-dark focus:outline-none focus:ring-2 focus:ring-sage-primary focus:ring-offset-2 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? "注册中..." : "注册"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
