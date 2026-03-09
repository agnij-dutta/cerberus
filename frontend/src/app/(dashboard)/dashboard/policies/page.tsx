"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Clock,
  Zap,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data
const mockPolicies = [
  {
    id: "1",
    name: "api-default",
    algorithm: "sliding_window" as const,
    limit: 100,
    window_seconds: 60,
    refill_rate: null,
    is_active: true,
    created_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "2",
    name: "strict",
    algorithm: "sliding_window" as const,
    limit: 10,
    window_seconds: 60,
    refill_rate: null,
    is_active: true,
    created_at: "2026-03-02T14:30:00Z",
  },
  {
    id: "3",
    name: "burst-friendly",
    algorithm: "token_bucket" as const,
    limit: 50,
    window_seconds: 60,
    refill_rate: 5.0,
    is_active: true,
    created_at: "2026-03-05T09:15:00Z",
  },
  {
    id: "4",
    name: "legacy-compat",
    algorithm: "sliding_window" as const,
    limit: 1000,
    window_seconds: 3600,
    refill_rate: null,
    is_active: false,
    created_at: "2026-02-15T16:00:00Z",
  },
];

export default function PoliciesPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = mockPolicies.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Policies</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage rate limit policies for your applications.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan text-obsidian text-sm font-medium hover:bg-cyan-dim transition-colors"
        >
          <Plus size={16} />
          New Policy
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-6 rounded-xl border border-cyan/20 bg-surface/50">
              <h3 className="font-semibold mb-4">Create New Policy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted font-mono uppercase tracking-wider mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="api-default"
                    className="w-full px-3 py-2 rounded-lg bg-obsidian-light border border-border text-sm text-text-primary placeholder:text-text-muted focus:border-cyan focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted font-mono uppercase tracking-wider mb-1.5">
                    Algorithm
                  </label>
                  <select className="w-full px-3 py-2 rounded-lg bg-obsidian-light border border-border text-sm text-text-primary focus:border-cyan focus:outline-none">
                    <option value="sliding_window">Sliding Window</option>
                    <option value="token_bucket">Token Bucket</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted font-mono uppercase tracking-wider mb-1.5">
                    Limit
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full px-3 py-2 rounded-lg bg-obsidian-light border border-border text-sm text-text-primary placeholder:text-text-muted focus:border-cyan focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted font-mono uppercase tracking-wider mb-1.5">
                    Window (seconds)
                  </label>
                  <input
                    type="number"
                    placeholder="60"
                    className="w-full px-3 py-2 rounded-lg bg-obsidian-light border border-border text-sm text-text-primary placeholder:text-text-muted focus:border-cyan focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-5">
                <button className="px-4 py-2 rounded-lg bg-cyan text-obsidian text-sm font-medium hover:bg-cyan-dim transition-colors">
                  Create Policy
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search policies..."
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface/30 border border-border text-sm text-text-primary placeholder:text-text-muted focus:border-cyan focus:outline-none"
        />
      </div>

      {/* Policies table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface/50 text-left">
              <th className="px-5 py-3 text-xs font-mono uppercase tracking-wider text-text-muted">
                Name
              </th>
              <th className="px-5 py-3 text-xs font-mono uppercase tracking-wider text-text-muted">
                Algorithm
              </th>
              <th className="px-5 py-3 text-xs font-mono uppercase tracking-wider text-text-muted">
                Limit
              </th>
              <th className="px-5 py-3 text-xs font-mono uppercase tracking-wider text-text-muted">
                Window
              </th>
              <th className="px-5 py-3 text-xs font-mono uppercase tracking-wider text-text-muted">
                Status
              </th>
              <th className="px-5 py-3 text-xs font-mono uppercase tracking-wider text-text-muted w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((policy) => (
              <tr
                key={policy.id}
                className="hover:bg-surface-hover/50 transition-colors"
              >
                <td className="px-5 py-3">
                  <code className="font-mono text-cyan">{policy.name}</code>
                </td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    {policy.algorithm === "sliding_window" ? (
                      <Clock size={13} />
                    ) : (
                      <Zap size={13} />
                    )}
                    {policy.algorithm === "sliding_window"
                      ? "Sliding Window"
                      : "Token Bucket"}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-text-primary">
                  {policy.limit}
                </td>
                <td className="px-5 py-3 text-text-secondary">
                  {policy.window_seconds}s
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded",
                      policy.is_active
                        ? "text-green bg-green/10"
                        : "text-text-muted bg-surface-hover"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        policy.is_active ? "bg-green" : "bg-text-muted"
                      )}
                    />
                    {policy.is_active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:text-red hover:bg-red/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
