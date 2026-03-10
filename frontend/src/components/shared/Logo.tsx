import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Shield size={18} className="text-accent" />
      <span className="text-[15px] font-semibold tracking-tight text-text-primary">
        Cerberus
      </span>
    </div>
  );
}
