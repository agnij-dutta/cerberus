"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = "bash",
  filename,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        "relative group rounded-xl border border-border bg-obsidian-light overflow-hidden",
        className
      )}
    >
      {/* Header */}
      {(filename || language) && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-green/40" />
            </div>
            {filename && (
              <span className="text-xs text-text-muted font-mono">
                {filename}
              </span>
            )}
          </div>
          <span className="text-xs text-text-muted/60 font-mono uppercase">
            {language}
          </span>
        </div>
      )}

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={cn(
          "absolute top-2.5 right-2.5 w-8 h-8 rounded-lg flex items-center justify-center",
          "text-text-muted hover:text-text-primary hover:bg-surface-hover",
          "opacity-0 group-hover:opacity-100 transition-all",
          filename && "top-[3.25rem]"
        )}
        aria-label="Copy code"
      >
        {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
      </button>

      {/* Code */}
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono leading-relaxed text-text-secondary">
          {code}
        </code>
      </pre>
    </div>
  );
}
