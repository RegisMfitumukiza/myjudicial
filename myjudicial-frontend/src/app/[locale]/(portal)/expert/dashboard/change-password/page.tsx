"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";

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
    } catch (err: any) {
      setError(err?.message ?? "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">Change Password</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Update your account password</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-5">
        {(["current", "new", "confirm"] as const).map((field) => (
          <div key={field}>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {field === "current" ? "Current Password" : field === "new" ? "New Password" : "Confirm New Password"}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={show[field] ? "text" : "password"}
                value={field === "current" ? current : field === "new" ? newPass : confirm}
                onChange={(e) => {
                  const v = e.target.value;
                  if (field === "current") setCurrent(v);
                  else if (field === "new") setNewPass(v);
                  else setConfirm(v);
                }}
                className="h-11 w-full rounded-xl border border-brand-border/20 bg-white px-4 pl-10 pr-10 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                placeholder={
                  field === "current" ? "Enter current password" : field === "new" ? "Enter new password" : "Confirm new password"
                }
              />
              <button
                type="button"
                onClick={() => setShow({ ...show, [field]: !show[field] })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {show[field] ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        ))}

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={!allFilled || loading}
          className={`flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium text-white ${
            allFilled && !loading ? "bg-brand-blue hover:bg-brand-blue/90" : "cursor-not-allowed bg-gray-300 dark:bg-gray-600"
          }`}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Update Password
        </button>
      </form>
    </div>
  );
}
