import { API_BASE_URL } from "../../config/apiConfig.js";

export default function ErrorState({ error }) {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-[0_18px_50px_rgba(220,38,38,0.08)]">
      <p className="font-semibold text-red-800">Could not load dashboard data.</p>
      <p className="mt-1 leading-6">
        Make sure the FastAPI backend is running at {API_BASE_URL}.
        {error ? ` Details: ${error}` : null}
      </p>
    </section>
  );
}
