"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function AdminDashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Couldn't load the dashboard"
      message="Something went wrong while loading store data. Please try again."
      onRetry={reset}
    />
  );
}
