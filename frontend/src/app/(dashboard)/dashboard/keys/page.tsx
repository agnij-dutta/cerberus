"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getStoredApiKey } from "@/lib/api";

// ---------------------------------------------------------------------------
// Regenerate confirmation dialog
// ---------------------------------------------------------------------------

function RegenerateDialog({
  onConfirm,
  onCancel,
  isRegenerating,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isRegenerating: boolean;
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
        className="w-full max-w-[440px] glass-strong rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber/[0.1] flex items-center justify-center">
            <AlertTriangle size={18} className="text-amber" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-text-primary">
              Regenerate API Key
            </h2>
            <p className="text-[13px] text-text-tertiary">
              This will invalidate your current key.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber/[0.06] border border-amber/[0.12] mb-5">
          <p className="text-[13px] text-amber/90 leading-relaxed">
            Your current API key will be permanently revoked. All existing
            integrations using this key will stop working immediately. Make sure
            to update your applications with the new key.
          </p>
        </div>

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
            disabled={isRegenerating}
            className="flex-1 h-10 px-4 rounded-xl text-[13px] font-medium text-bg bg-amber/80 hover:bg-amber border border-amber/30 transition-all duration-200 disabled:opacity-50"
          >
            {isRegenerating ? (
              <Loader2 size={15} className="animate-spin mx-auto" />
            ) : (
              "Regenerate"
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ApiKeysPage() {
  const { tenant } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const token = getStoredApiKey();
  const prefix = token?.substring(0, 8) ?? "cerb_xx";

  // Masked display
  const maskedToken = token
    ? showKey
      ? token
      : `${token.substring(0, 8)}${"*".repeat(
          Math.min(token.length - 8, 32)
        )}`
    : "No key stored";

  // Created date (approximate from tenant)
  const createdAt = tenant?.created_at
    ? new Date(tenant.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  async function handleCopy() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  }

  function handleRegenerate() {
    setIsRegenerating(true);
    // In a real app, this would call an API endpoint.
    // For now, simulate with a timeout.
    setTimeout(() => {
      setIsRegenerating(false);
      setShowRegenerate(false);
      // In production: api.regenerateKey() -> store new key -> update context
    }, 1500);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-text-primary">
          API Keys
        </h1>
        <p className="text-[14px] text-text-secondary mt-1">
          Manage your API key for authenticating requests.
        </p>
      </div>

      {/* Current API Key card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/[0.1] flex items-center justify-center shrink-0">
            <Key size={18} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-[15px] font-medium text-text-primary">
                Current API Key
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent/[0.1] text-[11px] font-medium text-accent uppercase tracking-wider">
                Active
              </span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <p className="text-[13px] text-text-secondary">
                Prefix:{" "}
                <code className="font-mono text-text-primary">{prefix}</code>
              </p>
              <span className="text-[11px] text-text-tertiary">|</span>
              <p className="text-[13px] text-text-secondary">
                Created: {createdAt}
              </p>
            </div>

            {/* Key display */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <code className="flex-1 text-[12px] font-mono text-text-secondary truncate select-all">
                  {maskedToken}
                </code>
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="shrink-0 p-1 rounded-md hover:bg-white/[0.06] text-text-tertiary hover:text-text-secondary transition-all duration-200"
                  title={showKey ? "Hide key" : "Reveal key"}
                >
                  {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 h-10 px-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-text-secondary hover:text-text-primary transition-all duration-200 flex items-center gap-2 text-[12px] font-medium"
                title="Copy full key"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-accent" />
                    <span className="text-accent">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Regenerate key */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mt-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw size={16} className="text-text-tertiary" />
            <div>
              <h3 className="text-[15px] font-medium text-text-primary">
                Regenerate Key
              </h3>
              <p className="text-[13px] text-text-tertiary mt-0.5">
                Generate a new API key and revoke the current one.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowRegenerate(true)}
            className="px-4 py-2 rounded-xl text-[13px] font-medium text-amber bg-amber/[0.08] hover:bg-amber/[0.12] border border-amber/[0.15] transition-all duration-200"
          >
            Regenerate
          </button>
        </div>
      </motion.div>

      {/* Security warning */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="mt-4 p-4 rounded-xl bg-amber/[0.04] border border-amber/[0.08]"
      >
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-amber shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-medium text-amber/90 mb-1">
              Keep your API key secure
            </p>
            <ul className="text-[12px] text-text-secondary leading-relaxed space-y-1">
              <li>
                Never expose your API key in client-side code or public repositories.
              </li>
              <li>
                Store it securely using environment variables or a secrets manager.
              </li>
              <li>
                The full key is only shown once at creation. If lost, regenerate a new one.
              </li>
              <li>
                Rotate your key periodically for enhanced security.
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Usage instructions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mt-4"
      >
        <h3 className="text-[15px] font-medium text-text-primary mb-3">
          Usage
        </h3>
        <p className="text-[13px] text-text-secondary mb-4 leading-relaxed">
          Include your API key in the{" "}
          <code className="font-mono text-text-primary px-1.5 py-0.5 bg-white/[0.04] rounded">
            X-API-Key
          </code>{" "}
          header of every request:
        </p>
        <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
          <pre className="text-[12px] font-mono text-text-secondary leading-relaxed overflow-x-auto">
            <code>
              <span className="text-accent">curl</span>
              {" -X POST https://api.cerberus.io/v1/check \\\n"}
              {"  -H "}
              <span className="text-code-blue">
                &quot;Content-Type: application/json&quot;
              </span>
              {" \\\n"}
              {"  -H "}
              <span className="text-code-blue">
                &quot;X-API-Key: {prefix}...&quot;
              </span>
              {" \\\n"}
              {"  -d "}
              <span className="text-code-orange">
                {
                  "'{\"policy_id\": \"...\", \"identifier\": \"user-123\"}'"
                }
              </span>
            </code>
          </pre>
        </div>
      </motion.div>

      {/* Regenerate dialog */}
      <AnimatePresence>
        {showRegenerate && (
          <RegenerateDialog
            onConfirm={handleRegenerate}
            onCancel={() => setShowRegenerate(false)}
            isRegenerating={isRegenerating}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
