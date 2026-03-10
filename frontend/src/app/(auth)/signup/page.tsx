"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  User,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { CerberusApiError } from "@/lib/api";
import type { SignupResponse } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SignupResponse | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signup(name.trim(), email.trim(), password);
      setResult(res);
    } catch (err) {
      if (err instanceof CerberusApiError) {
        setError(err.detail || "Account creation failed.");
      } else {
        setError("Unable to connect. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Success: show API key
  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="glass-strong rounded-2xl p-8">
          <div className="mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/[0.12] flex items-center justify-center mb-4">
              <ShieldAlert size={20} className="text-accent" />
            </div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-text-primary mb-1.5">
              Save your API key
            </h1>
            <p className="text-[14px] text-text-secondary leading-relaxed">
              This is your API key for programmatic access. It will only be shown once.
            </p>
          </div>

          <div className="relative group">
            <div className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl">
              <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2">
                Your API Key
              </p>
              <code className="block text-[13px] font-mono text-accent break-all leading-relaxed">
                {result.api_key}
              </code>
            </div>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-200"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                    <Check size={14} className="text-accent" />
                  </motion.div>
                ) : (
                  <motion.div key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                    <Copy size={14} className="text-text-secondary" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber/[0.06] border border-amber/[0.12] mt-4">
            <AlertCircle size={15} className="text-amber shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber/80 leading-relaxed">
              Store this key securely. You can always log in with your email and password,
              but this API key cannot be retrieved again.
            </p>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-text-tertiary">Account</span>
              <span className="text-text-secondary">{result.tenant.email}</span>
            </div>
            <div className="flex items-center justify-between text-[13px] mt-1.5">
              <span className="text-text-tertiary">Tier</span>
              <span className="text-text-secondary capitalize">{result.tenant.tier}</span>
            </div>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="relative w-full h-11 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-bg text-[14px] font-medium rounded-xl transition-all duration-200 mt-6 btn-shimmer"
          >
            <span className="relative z-10">Continue to dashboard</span>
            <ArrowRight size={15} className="relative z-10" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Signup form
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="glass-strong rounded-2xl p-8">
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-text-primary mb-1.5">
            Create an account
          </h1>
          <p className="text-[14px] text-text-secondary leading-relaxed">
            Start rate limiting your APIs in minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-[13px] font-medium text-text-secondary mb-2">
              Organization name
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (error) setError(null); }}
                placeholder="Acme Inc."
                autoFocus
                className="w-full h-11 pl-10 pr-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-[13px] font-medium text-text-secondary mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full h-11 pl-10 pr-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-text-secondary mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                className="w-full h-11 pl-10 pr-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-red/[0.08] border border-red/[0.15]"
            >
              <AlertCircle size={15} className="text-red shrink-0 mt-0.5" />
              <p className="text-[13px] text-red leading-relaxed">{error}</p>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="relative w-full h-11 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-bg text-[14px] font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed btn-shimmer"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin relative z-10" />
            ) : (
              <>
                <span className="relative z-10">Create account</span>
                <ArrowRight size={15} className="relative z-10" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[12px] text-text-tertiary">or</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        <p className="text-center text-[13px] text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">
            Log in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
