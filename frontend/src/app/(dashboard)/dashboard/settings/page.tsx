"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  AlertTriangle,
  Trash2,
  Loader2,
  ArrowUpRight,
  Crown,
  Zap,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tier config
// ---------------------------------------------------------------------------

const tierConfig = {
  free: {
    label: "Free",
    color: "text-text-secondary",
    bgColor: "bg-white/[0.06]",
    borderColor: "border-white/[0.08]",
    features: [
      { label: "Max Policies", value: "5" },
      { label: "Analytics Retention", value: "7 days" },
      { label: "Rate Checks", value: "10K/mo" },
      { label: "Support", value: "Community" },
    ],
  },
  pro: {
    label: "Pro",
    color: "text-accent",
    bgColor: "bg-accent/[0.08]",
    borderColor: "border-accent/[0.15]",
    features: [
      { label: "Max Policies", value: "50" },
      { label: "Analytics Retention", value: "30 days" },
      { label: "Rate Checks", value: "1M/mo" },
      { label: "Support", value: "Email" },
    ],
  },
  enterprise: {
    label: "Enterprise",
    color: "text-code-purple",
    bgColor: "bg-code-purple/[0.08]",
    borderColor: "border-code-purple/[0.15]",
    features: [
      { label: "Max Policies", value: "Unlimited" },
      { label: "Analytics Retention", value: "90 days" },
      { label: "Rate Checks", value: "Unlimited" },
      { label: "Support", value: "Priority" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Delete account dialog
// ---------------------------------------------------------------------------

function DeleteAccountDialog({
  tenantName,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  tenantName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");
  const canDelete = confirmText === tenantName;

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
          <div className="w-10 h-10 rounded-xl bg-red/[0.1] flex items-center justify-center">
            <AlertTriangle size={18} className="text-red" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-text-primary">
              Delete Account
            </h2>
            <p className="text-[13px] text-text-tertiary">
              This action is permanent and irreversible.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-red/[0.06] border border-red/[0.12] mb-4">
          <p className="text-[13px] text-red/90 leading-relaxed">
            Deleting your account will permanently remove all your policies,
            analytics data, and API keys. This action cannot be undone.
          </p>
        </div>

        <div className="mb-5">
          <label className="block text-[13px] font-medium text-text-secondary mb-2">
            Type <span className="font-mono text-text-primary">{tenantName}</span> to
            confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={tenantName}
            className="w-full h-10 px-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-red/40 focus:ring-1 focus:ring-red/20 transition-all duration-200"
          />
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
            disabled={!canDelete || isDeleting}
            className="flex-1 h-10 px-4 rounded-xl text-[13px] font-medium text-white bg-red/80 hover:bg-red border border-red/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <Loader2 size={15} className="animate-spin mx-auto" />
            ) : (
              "Delete account"
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

export default function SettingsPage() {
  const { tenant, logout } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentTier = tenant?.tier ?? "free";
  const tier = tierConfig[currentTier];

  function handleDeleteAccount() {
    setIsDeleting(true);
    // In production: api.deleteAccount() -> logout
    setTimeout(() => {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      logout();
    }, 1500);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-text-primary">
          Settings
        </h1>
        <p className="text-[14px] text-text-secondary mt-1">
          Manage your account and preferences.
        </p>
      </div>

      {/* Tenant profile */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mb-4"
      >
        <div className="flex items-center gap-3 mb-6">
          <User size={16} className="text-text-tertiary" />
          <h2 className="text-[15px] font-semibold text-text-primary">
            Profile
          </h2>
        </div>

        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-accent/[0.1] flex items-center justify-center shrink-0">
            <span className="text-[24px] font-semibold text-accent">
              {(tenant?.name ?? "T").charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-[18px] font-semibold text-text-primary">
                {tenant?.name ?? "Tenant"}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium uppercase tracking-wider",
                  tier.bgColor,
                  tier.color
                )}
              >
                {currentTier === "enterprise" && <Crown size={10} />}
                {currentTier === "pro" && <Zap size={10} />}
                {tier.label}
              </span>
            </div>

            <div className="space-y-2 mt-3">
              <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                <span className="text-[13px] text-text-secondary">
                  Tenant ID
                </span>
                <code className="text-[12px] font-mono text-text-primary">
                  {tenant?.id ?? "---"}
                </code>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                <span className="text-[13px] text-text-secondary">Name</span>
                <span className="text-[13px] text-text-primary">
                  {tenant?.name ?? "---"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                <span className="text-[13px] text-text-secondary">
                  Email
                </span>
                <code className="text-[12px] font-mono text-text-primary">
                  {tenant?.email ?? "---"}
                </code>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[13px] text-text-secondary">Status</span>
                <span className="inline-flex items-center gap-1.5 text-[13px] text-accent">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tier / Plan info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mb-4"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-text-tertiary" />
            <h2 className="text-[15px] font-semibold text-text-primary">
              Plan &amp; Limits
            </h2>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium uppercase tracking-wider",
              tier.bgColor,
              tier.color
            )}
          >
            {tier.label} Plan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {tier.features.map((feature) => (
            <div
              key={feature.label}
              className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl"
            >
              <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">
                {feature.label}
              </p>
              <p className="text-[15px] font-medium text-text-primary font-mono">
                {feature.value}
              </p>
            </div>
          ))}
        </div>

        {/* Upgrade CTA for free users */}
        {currentTier === "free" && (
          <div className="p-4 rounded-xl bg-accent/[0.04] border border-accent/[0.1]">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Zap size={16} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-text-primary mb-0.5">
                    Upgrade to Pro
                  </p>
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    Get 50 policies, 30-day analytics retention, and 1M rate
                    checks per month.
                  </p>
                </div>
              </div>
              <a
                href="#"
                className="shrink-0 ml-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-bg bg-accent hover:bg-accent-hover transition-all duration-200 btn-shimmer relative"
              >
                <span className="relative z-10">Upgrade</span>
                <ArrowUpRight size={13} className="relative z-10" />
              </a>
            </div>
          </div>
        )}

        {currentTier === "pro" && (
          <div className="p-4 rounded-xl bg-code-purple/[0.04] border border-code-purple/[0.1]">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Crown size={16} className="text-code-purple shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-text-primary mb-0.5">
                    Need more?
                  </p>
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    Enterprise plan offers unlimited policies, 90-day retention,
                    and priority support.
                  </p>
                </div>
              </div>
              <a
                href="#"
                className="shrink-0 ml-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-code-purple bg-code-purple/[0.1] hover:bg-code-purple/[0.15] border border-code-purple/[0.15] transition-all duration-200"
              >
                Contact Sales
                <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        )}

        {currentTier === "enterprise" && (
          <div className="flex items-center gap-2 text-[13px] text-accent">
            <Check size={14} />
            <span>You are on the highest tier with full access.</span>
          </div>
        )}
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="bg-white/[0.03] border border-red/[0.08] rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <AlertTriangle size={16} className="text-red" />
          <h2 className="text-[15px] font-semibold text-text-primary">
            Danger Zone
          </h2>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-red/[0.1] bg-red/[0.02]">
          <div>
            <p className="text-[14px] font-medium text-text-primary">
              Delete Account
            </p>
            <p className="text-[12px] text-text-secondary mt-0.5">
              Permanently delete your tenant and all associated data.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="shrink-0 ml-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-red bg-red/[0.08] hover:bg-red/[0.12] border border-red/[0.15] transition-all duration-200"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </motion.div>

      {/* Delete dialog */}
      <AnimatePresence>
        {showDeleteDialog && (
          <DeleteAccountDialog
            tenantName={tenant?.name ?? "Tenant"}
            onConfirm={handleDeleteAccount}
            onCancel={() => setShowDeleteDialog(false)}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
