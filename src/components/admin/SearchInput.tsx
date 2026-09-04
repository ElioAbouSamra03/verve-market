"use client";

import { useEffect, useState } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

/** Debounced search box shared by every admin list screen (products,
 *  categories, users) so typing doesn't fire a request per keystroke. */
export function SearchInput({ value, onChange, placeholder = "Search…", debounceMs = 300 }: SearchInputProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, debounceMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <input
      type="search"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full max-w-xs rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-ink focus:outline-none"
    />
  );
}
