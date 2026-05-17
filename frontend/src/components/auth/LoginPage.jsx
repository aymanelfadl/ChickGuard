import { useState } from "react";
import { LockKeyhole, Sprout } from "lucide-react";

export default function LoginPage({ onLogin, isLoading, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await onLogin(email, password);
    } catch {
      // useAuth owns the visible error state.
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-[#CFE8D7] bg-white p-6 shadow-[0_24px_70px_rgba(20,83,45,0.12)] sm:p-8">
        <div className="mb-7">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#14532D]">
            <Sprout className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-[#102A1C]">Dashboard Login</h1>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Sign in to view poultry health intelligence, alerts, and device readings.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-[#102A1C]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FBF8] px-4 py-3 text-sm text-[#102A1C] outline-none transition focus:border-[#16A34A] focus:ring-4 focus:ring-[#DCFCE7]"
              placeholder="admin@example.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#102A1C]">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FBF8] px-4 py-3 text-sm text-[#102A1C] outline-none transition focus:border-[#16A34A] focus:ring-4 focus:ring-[#DCFCE7]"
              placeholder="Enter your password"
            />
          </label>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#DC2626]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#14532D] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(20,83,45,0.24)] transition hover:bg-[#166534] disabled:cursor-not-allowed disabled:bg-[#94A3B8] disabled:shadow-none"
          >
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}
