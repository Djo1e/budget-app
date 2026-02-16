"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Landmark, Wallet, LogOut, Check, Pencil, X } from "lucide-react";

export default function SettingsPage() {
  const { isLoading, userProfile } = useAuthGuard();
  const updateName = useMutation(api.users.updateName);
  const router = useRouter();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  if (isLoading || !userProfile) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const handleEditName = () => {
    setNameValue(userProfile.name);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    try {
      await updateName({ name: trimmed });
      setEditingName(false);
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.replace("/login");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xs font-mono tracking-[0.2em] uppercase">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-[0.2em] uppercase">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  className="h-8 w-48"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveName}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingName(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{userProfile.name}</span>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleEditName} data-testid="edit-name">
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{userProfile.email}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Currency</span>
            <Badge variant="secondary">{userProfile.currency}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-[0.2em] uppercase">Manage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link
            href="/accounts"
            className="flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors"
          >
            <Landmark className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Manage Accounts</span>
          </Link>
          <Link
            href="/budget"
            className="flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors"
          >
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Manage Categories</span>
          </Link>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={handleSignOut}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
