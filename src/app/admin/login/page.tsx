"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/admin/FormField";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/api/admin/auth/login", { password });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl text-ink">
            Verve<span className="text-moss-700">Admin</span>
          </p>
          <p className="mt-1 text-sm text-ink/60">Sign in to manage the store.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-white p-6 shadow-card">
          <TextField
            label="Admin password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error ?? undefined}
          />
          <Button type="submit" className="mt-5 w-full" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
