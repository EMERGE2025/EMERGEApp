"use client";

import { useState } from "react";
import { auth } from "@/utils/firebase";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";

export default function RegisterResponder() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Get the currently logged-in admin's auth token
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be logged in as an admin.");
      }
      const token = await currentUser.getIdToken(true); // true = force refresh

      // 2. Call your new Vercel API Route
      const response = await fetch("/api/registerResponder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Send the token for verification
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to register responder.");
      }

      setSuccess(result.message);
      setEmail(""); // Clear the form
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Register New Responder
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Responder's Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="responder@example.com"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            required
          />
        </div>

        {/* --- DYNAMIC MESSAGES --- */}
        {success && (
          <div className="p-3 rounded-md bg-green-50 text-green-700">
            {success}
          </div>
        )}
        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-700">{error}</div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400"
          >
            {isLoading && (
              <CircleNotch size={20} className="animate-spin -ml-1 mr-2" />
            )}
            {isLoading ? "Registering..." : "Send Registration Invite"}
          </button>
        </div>
      </form>
    </div>
  );
}
