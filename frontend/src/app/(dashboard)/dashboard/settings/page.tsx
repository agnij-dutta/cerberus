"use client";

import { useState } from "react";
import { Save, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const [tenantName, setTenantName] = useState("my-app");
  const [failMode, setFailMode] = useState("open");
  const [cacheTTL, setCacheTTL] = useState("30");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">
          Configure your Cerberus tenant settings.
        </p>
      </div>

      <div className="space-y-8 max-w-2xl">
        {/* General */}
        <section className="p-6 rounded-xl border border-border bg-surface/30">
          <h3 className="font-semibold mb-4">General</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted font-mono uppercase tracking-wider mb-1.5">
                Tenant Name
              </label>
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-light border border-border text-sm text-text-primary focus:border-cyan focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Rate Limiting */}
        <section className="p-6 rounded-xl border border-border bg-surface/30">
          <h3 className="font-semibold mb-4">Rate Limiting Behavior</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted font-mono uppercase tracking-wider mb-1.5">
                Failure Mode
              </label>
              <select
                value={failMode}
                onChange={(e) => setFailMode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-light border border-border text-sm text-text-primary focus:border-cyan focus:outline-none"
              >
                <option value="open">Fail Open (allow when Redis is down)</option>
                <option value="closed">Fail Closed (deny when Redis is down)</option>
              </select>
              <p className="text-xs text-text-muted mt-1.5">
                Fail open is recommended — it&apos;s better to temporarily allow
                extra requests than to cause an outage.
              </p>
            </div>

            <div>
              <label className="block text-xs text-text-muted font-mono uppercase tracking-wider mb-1.5">
                Policy Cache TTL (seconds)
              </label>
              <input
                type="number"
                value={cacheTTL}
                onChange={(e) => setCacheTTL(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-light border border-border text-sm text-text-primary focus:border-cyan focus:outline-none"
              />
              <p className="text-xs text-text-muted mt-1.5">
                How long policy definitions are cached locally. Lower values mean
                faster policy updates, higher values mean less Redis traffic.
              </p>
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section className="p-6 rounded-xl border border-red/20 bg-red/5">
          <h3 className="font-semibold text-red mb-4">Danger Zone</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Flush All Rate Limit Keys</p>
              <p className="text-xs text-text-muted mt-0.5">
                Reset all active rate limit counters. This cannot be undone.
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red/30 text-sm text-red hover:bg-red/10 transition-colors">
              <RefreshCw size={14} />
              Flush Keys
            </button>
          </div>
        </section>

        {/* Save */}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan text-obsidian text-sm font-medium hover:bg-cyan-dim transition-colors"
        >
          <Save size={14} />
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
