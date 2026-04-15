"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  debounceMs?: number;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onDebouncedChange,
  debounceMs = 300,
  placeholder = "Search",
  className,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    if (!onDebouncedChange) return;

    const timer = setTimeout(() => {
      onDebouncedChange(internalValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onDebouncedChange]);

  return (
    <div className={cn("flex items-center gap-2 rounded-lg border border-white/10 bg-[var(--surface)] px-3 py-2", className)}>
      <input
        value={internalValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          setInternalValue(nextValue);
          onChange(nextValue);
        }}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-white placeholder:text-white/45 outline-none"
      />
      {internalValue ? (
        <button
          type="button"
          onClick={() => {
            setInternalValue("");
            onChange("");
            onDebouncedChange?.("");
          }}
          className="text-xs text-white/60"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
