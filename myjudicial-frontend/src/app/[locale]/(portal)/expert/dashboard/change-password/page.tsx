"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allFilled = current && newPass && confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPass.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPass !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/auth/admin/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
      });
      toast.success("Password changed successfully");
      setCurrent("");
      setNewPass("");
      setConfirm("");
    } catch {
      setError("Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Change Password</h1>
        <p className="text-sm text-muted-foreground">Update your account password</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-5">
        {(["current", "new", "confirm"] as const).map((field) => (
          <div key={field}>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {field === "current" ? "Current Password" : field === "new" ? "New Password" : "Confirm New Password"}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type={show[field] ? "text" : "password"}
                value={field === "current" ? current : field === "new" ? newPass : confirm}
                onChange={(e) => {
                  const v = e.target.value;
                  if (field === "current") setCurrent(v);
                  else if (field === "new") setNewPass(v);
                  else setConfirm(v);
                }}
                className="h-11 rounded-xl pl-10 pr-10"
                placeholder={
                  field === "current" ? "Enter current password" : field === "new" ? "Enter new password" : "Confirm new password"
                }
              />
              <button
                type="button"
                onClick={() => setShow({ ...show, [field]: !show[field] })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show[field] ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>
        ))}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" disabled={!allFilled || loading} className="w-full">
          {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          Update Password
        </Button>
      </form>
    </div>
  );
}
