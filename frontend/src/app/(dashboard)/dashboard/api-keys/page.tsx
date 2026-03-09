"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Eye, EyeOff, Copy, Check, Trash2 } from "lucide-react";
import { cn, copyToClipboard, timeAgo } from "@/lib/utils";

const mockKeys = [
  {
    id: "1",
    prefix: "ck_live_a",
    name: "Production",
    tier: "pro" as const,
    created_at: "2026-03-01T10:00:00Z",
    last_used: "2026-03-10T14:23:00Z",
  },
  {
    id: "2",
    prefix: "ck_test_b",
    name: "Development",
    tier: "free" as const,
    created_at: "2026-03-05T09:00:00Z",
    last_used: "2026-03-10T12:10:00Z",
  },
];

const tierStyles = {
  free: "text-text-secondary bg-surface-hover",
  pro: "text-cyan bg-cyan/10",
  enterprise: "text-amber bg-amber/10",
};

export default function ApiKeysPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyVisible, setNewKeyVisible] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [newKey] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    await copyToClipboard(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage authentication keys for your applications.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan text-obsidian text-sm font-medium hover:bg-cyan-dim transition-colors"
        >
          <Plus size={16} />
          Create Key
        </button>
      </div>

      {/* New key created banner */}
      <AnimatePresence>
        {newKey && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl border border-amber/30 bg-amber/5 mb-6"
          >
            <p className="text-sm font-medium text-amber mb-2">
              Store this API key securely — it won&apos;t be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-obsidian-light border border-border font-mono text-sm">
                {newKeyVisible ? newKey : "•".repeat(40)}
              </code>
              <button
                onClick={() => setNewKeyVisible(!newKeyVisible)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover"
              >
                {newKeyVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={() => handleCopy(newKey, "new")}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover"
              >
                {copied === "new" ? (
                  <Check size={16} className="text-green" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <h3 className="font-semibold mb-4">Create New API Key</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted font-mono uppercase tracking-wider mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Production API Key"
                    className="w-full px-3 py-2 rounded-lg bg-obsidian-light border border-border text-sm text-text-primary placeholder:text-text-muted focus:border-cyan focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted font-mono uppercase tracking-wider mb-1.5">
                    Tier
                  </label>
                  <select className="w-full px-3 py-2 rounded-lg bg-obsidian-light border border-border text-sm text-text-primary focus:border-cyan focus:outline-none">
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-5">
                <button className="px-4 py-2 rounded-lg bg-cyan text-obsidian text-sm font-medium hover:bg-cyan-dim transition-colors">
                  Generate Key
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

      {/* Keys list */}
      <div className="space-y-3">
        {mockKeys.map((key) => (
          <div
            key={key.id}
            className="p-5 rounded-xl border border-border bg-surface/30 hover:bg-surface/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="font-medium">{key.name}</span>
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded",
                        tierStyles[key.tier]
                      )}
                    >
                      {key.tier}
                    </span>
                  </div>
                  <code className="text-xs font-mono text-text-muted">
                    {key.prefix}{"•".repeat(24)}
                  </code>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right text-xs text-text-muted">
                  <div>Created {timeAgo(key.created_at)}</div>
                  <div>Last used {timeAgo(key.last_used)}</div>
                </div>
                <button
                  className="w-8 h-8 rounded flex items-center justify-center text-text-muted hover:text-red hover:bg-red/10 transition-colors"
                  title="Revoke key"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
