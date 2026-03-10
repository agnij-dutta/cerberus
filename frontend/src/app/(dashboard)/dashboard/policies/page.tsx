"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Loader2,
  ScrollText,
  Trash2,
  Pencil,
  X,
  AlertCircle,
  Clock,
  Gauge,
  ToggleLeft,
  ToggleRight,
  Search,
} from "lucide-react";
import { api, CerberusApiError } from "@/lib/api";
import type { Policy, PolicyCreateData, PolicyUpdateData } from "@/lib/api";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function PolicySkeleton() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-4 w-36 bg-white/[0.06] rounded" />
            <div className="h-5 w-14 bg-white/[0.04] rounded-md" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-5 w-24 bg-white/[0.04] rounded-md" />
            <div className="h-4 w-20 bg-white/[0.04] rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation dialog
// ---------------------------------------------------------------------------

function DeleteConfirmDialog({
  policyName,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  policyName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[400px] glass-strong rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red/[0.1] flex items-center justify-center">
            <Trash2 size={18} className="text-red" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-text-primary">
              Delete policy
            </h2>
            <p className="text-[13px] text-text-tertiary">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="text-[14px] text-text-secondary mb-5 leading-relaxed">
          Are you sure you want to delete{" "}
          <span className="font-medium text-text-primary">{policyName}</span>?
          All rate limiting using this policy will stop immediately.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-10 px-4 rounded-xl text-[13px] font-medium text-text-secondary bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 h-10 px-4 rounded-xl text-[13px] font-medium text-white bg-red/80 hover:bg-red border border-red/30 transition-all duration-200 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 size={15} className="animate-spin mx-auto" />
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Create / Edit modal
// ---------------------------------------------------------------------------

function PolicyFormModal({
  mode,
  initial,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  initial?: Policy;
  onClose: () => void;
  onSaved: (policy: Policy) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [algorithm, setAlgorithm] = useState<"sliding_window" | "token_bucket">(
    initial?.algorithm ?? "sliding_window"
  );
  const [limit, setLimit] = useState(String(initial?.limit ?? 100));
  const [windowSeconds, setWindowSeconds] = useState(
    String(initial?.window_seconds ?? 60)
  );
  const [refillRate, setRefillRate] = useState(
    String(initial?.refill_rate ?? 10)
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    const parsedLimit = parseInt(limit, 10);
    const parsedWindow = parseInt(windowSeconds, 10);
    if (!parsedLimit || parsedLimit < 1) {
      setError("Limit must be a positive number.");
      return;
    }
    if (!parsedWindow || parsedWindow < 1) {
      setError("Window must be at least 1 second.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "create") {
        const data: PolicyCreateData = {
          name: name.trim(),
          algorithm,
          limit: parsedLimit,
          window_seconds: parsedWindow,
        };
        if (algorithm === "token_bucket") {
          data.refill_rate = parseFloat(refillRate) || 10;
        }
        const policy = await api.createPolicy(data);
        onSaved(policy);
      } else if (initial) {
        const data: PolicyUpdateData = {
          name: name.trim(),
          limit: parsedLimit,
          window_seconds: parsedWindow,
        };
        if (algorithm === "token_bucket") {
          data.refill_rate = parseFloat(refillRate) || 10;
        }
        const policy = await api.updatePolicy(initial.id, data);
        onSaved(policy);
      }
    } catch (err) {
      if (err instanceof CerberusApiError) {
        setError(err.detail);
      } else {
        setError(mode === "create" ? "Failed to create policy." : "Failed to update policy.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[480px] glass-strong rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-semibold text-text-primary">
            {mode === "create" ? "Create policy" : "Edit policy"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-tertiary hover:text-text-secondary transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Default API limit"
              autoFocus
              className="w-full h-10 px-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
            />
          </div>

          {/* Algorithm */}
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">
              Algorithm
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["sliding_window", "token_bucket"] as const).map((algo) => (
                <button
                  key={algo}
                  type="button"
                  onClick={() => setAlgorithm(algo)}
                  disabled={mode === "edit"}
                  className={cn(
                    "px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 border",
                    algorithm === algo
                      ? "bg-accent/[0.1] border-accent/30 text-accent"
                      : "bg-white/[0.02] border-white/[0.06] text-text-secondary hover:bg-white/[0.04]",
                    mode === "edit" && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {algo === "sliding_window" ? "Sliding Window" : "Token Bucket"}
                </button>
              ))}
            </div>
            {mode === "edit" && (
              <p className="text-[11px] text-text-tertiary mt-1.5">
                Algorithm cannot be changed after creation.
              </p>
            )}
          </div>

          {/* Limit */}
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">
              {algorithm === "sliding_window"
                ? "Max requests"
                : "Bucket capacity"}
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              min={1}
              className="w-full h-10 px-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[14px] text-text-primary font-mono focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
            />
          </div>

          {/* Window seconds */}
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">
              Window (seconds)
            </label>
            <input
              type="number"
              value={windowSeconds}
              onChange={(e) => setWindowSeconds(e.target.value)}
              min={1}
              max={86400}
              className="w-full h-10 px-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[14px] text-text-primary font-mono focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
            />
          </div>

          {/* Refill rate (token bucket only) */}
          <AnimatePresence>
            {algorithm === "token_bucket" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-[13px] font-medium text-text-secondary mb-2">
                  Refill rate (tokens/sec)
                </label>
                <input
                  type="number"
                  value={refillRate}
                  onChange={(e) => setRefillRate(e.target.value)}
                  min={0.01}
                  step={0.01}
                  className="w-full h-10 px-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[14px] text-text-primary font-mono focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red/[0.08] border border-red/[0.15]">
              <AlertCircle size={15} className="text-red shrink-0 mt-0.5" />
              <p className="text-[13px] text-red">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 px-4 rounded-xl text-[13px] font-medium text-text-secondary bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="relative flex-1 h-10 px-4 rounded-xl text-[13px] font-medium text-bg bg-accent hover:bg-accent-hover transition-all duration-200 disabled:opacity-50 btn-shimmer"
            >
              {submitting ? (
                <Loader2
                  size={15}
                  className="animate-spin mx-auto relative z-10"
                />
              ) : (
                <span className="relative z-10">
                  {mode === "create" ? "Create" : "Save changes"}
                </span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatWindow(seconds: number): string {
  if (seconds >= 86400) return `${(seconds / 86400).toFixed(0)}d`;
  if (seconds >= 3600) return `${(seconds / 3600).toFixed(0)}h`;
  if (seconds >= 60) return `${(seconds / 60).toFixed(0)}m`;
  return `${seconds}s`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState<{
    mode: "create" | "edit";
    policy?: Policy;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Policy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await api.listPolicies();
      setPolicies(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load policies.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deletePolicy(deleteTarget.id);
      setPolicies((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // silently fail
    } finally {
      setIsDeleting(false);
    }
  }

  function handleCreated(policy: Policy) {
    setPolicies((prev) => [policy, ...prev]);
    setShowModal(null);
  }

  function handleUpdated(policy: Policy) {
    setPolicies((prev) =>
      prev.map((p) => (p.id === policy.id ? policy : p))
    );
    setShowModal(null);
  }

  async function handleToggleActive(policy: Policy) {
    try {
      const updated = await api.updatePolicy(policy.id, {
        is_active: !policy.is_active,
      });
      setPolicies((prev) =>
        prev.map((p) => (p.id === policy.id ? updated : p))
      );
    } catch {
      // silently fail
    }
  }

  const filtered = search.trim()
    ? policies.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : policies;

  // Loading skeleton
  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-7 w-32 bg-white/[0.06] rounded animate-pulse mb-2" />
            <div className="h-4 w-56 bg-white/[0.04] rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-white/[0.06] rounded-xl animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <PolicySkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <AlertCircle size={32} className="mx-auto text-red mb-4" />
        <p className="text-[15px] text-text-secondary mb-2">
          Failed to load policies
        </p>
        <p className="text-[13px] text-text-tertiary">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-text-primary">
            Policies
          </h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Manage your rate-limiting policies.
          </p>
        </div>
        <button
          onClick={() => setShowModal({ mode: "create" })}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-bg text-[13px] font-medium rounded-xl transition-all duration-200 btn-shimmer relative"
        >
          <Plus size={15} className="relative z-10" />
          <span className="relative z-10">New policy</span>
        </button>
      </div>

      {/* Search */}
      {policies.length > 0 && (
        <div className="mb-5">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search policies..."
              className="w-full h-10 pl-10 pr-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-white/[0.12] transition-all duration-200"
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <PolicyFormModal
            mode={showModal.mode}
            initial={showModal.policy}
            onClose={() => setShowModal(null)}
            onSaved={showModal.mode === "create" ? handleCreated : handleUpdated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmDialog
            policyName={deleteTarget.name}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>

      {/* Policy list */}
      {policies.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-12 text-center"
        >
          <ScrollText
            size={32}
            className="mx-auto text-text-tertiary mb-4"
          />
          <p className="text-[15px] text-text-secondary mb-2">
            No policies yet
          </p>
          <p className="text-[13px] text-text-tertiary mb-6">
            Create your first rate-limiting policy to get started.
          </p>
          <button
            onClick={() => setShowModal({ mode: "create" })}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-bg text-[13px] font-medium rounded-xl transition-all duration-200 btn-shimmer relative"
          >
            <Plus size={15} className="relative z-10" />
            <span className="relative z-10">Create your first policy</span>
          </button>
        </motion.div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-12 text-center">
          <Search size={32} className="mx-auto text-text-tertiary mb-4" />
          <p className="text-[15px] text-text-secondary">
            No policies match &ldquo;{search}&rdquo;
          </p>
        </div>
      ) : (
        /* Table */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3.5 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Algorithm
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Limit
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Window
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-5 py-3.5 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((policy, i) => (
                  <motion.tr
                    key={policy.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                    className="group hover:bg-white/[0.02] transition-colors duration-150"
                  >
                    <td className="px-5 py-4">
                      <span className="font-medium text-text-primary">
                        {policy.name}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[12px] px-2 py-0.5 bg-white/[0.04] rounded-md text-text-secondary">
                        {policy.algorithm === "token_bucket" ? (
                          <Gauge size={11} />
                        ) : (
                          <Clock size={11} />
                        )}
                        {policy.algorithm.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-text-primary">
                        {policy.limit.toLocaleString()}
                      </span>
                      <span className="text-text-tertiary"> req</span>
                      {policy.refill_rate !== null && (
                        <span className="text-text-tertiary ml-1.5 text-[11px]">
                          ({policy.refill_rate} tok/s)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-text-secondary">
                        {formatWindow(policy.window_seconds)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleActive(policy)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium uppercase tracking-wider transition-colors duration-200",
                          policy.is_active
                            ? "bg-accent/[0.1] text-accent hover:bg-accent/[0.15]"
                            : "bg-white/[0.04] text-text-tertiary hover:bg-white/[0.06]"
                        )}
                        title={
                          policy.is_active
                            ? "Click to deactivate"
                            : "Click to activate"
                        }
                      >
                        {policy.is_active ? (
                          <ToggleRight size={13} />
                        ) : (
                          <ToggleLeft size={13} />
                        )}
                        {policy.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() =>
                            setShowModal({ mode: "edit", policy })
                          }
                          className="p-2 rounded-lg hover:bg-white/[0.06] text-text-tertiary hover:text-text-secondary transition-all duration-200"
                          title="Edit policy"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(policy)}
                          className="p-2 rounded-lg hover:bg-red/[0.08] text-text-tertiary hover:text-red transition-all duration-200"
                          title="Delete policy"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between">
            <span className="text-[12px] text-text-tertiary">
              {filtered.length} {filtered.length === 1 ? "policy" : "policies"}
              {search && ` matching "${search}"`}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
