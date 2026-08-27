"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function ProductsError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="We couldn't load the catalog"
      message="Something went wrong while fetching products. Please try again."
      onRetry={reset}
    />
  );
}
