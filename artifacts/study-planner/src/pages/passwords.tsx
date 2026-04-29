import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  KeyRound, Plus, Eye, EyeOff, Copy, Trash2, Pencil, Globe, User as UserIcon,
  Shield, ShieldCheck, Search, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type PasswordItem = {
  id: number;
  name: string;
  website: string | null;
  username: string | null;
  hasPassword: boolean;
  hasTwoFactor: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  name: string;
  website: string;
  username: string;
  password: string;
  twoFactorSecret: string;
};

const EMPTY_FORM: FormState = { name: "", website: "", username: "", password: "", twoFactorSecret: "" };

async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api${path}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  if (r.status === 204) return undefined as T;
  return r.json();
}

export default function Passwords() {
  const { toast } = useToast();
  const [items, setItems] = useState<PasswordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<PasswordItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [revealed, setRevealed] = useState<Record<number, { password?: string | null; twoFactorSecret?: string | null }>>({});
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [show2faSecret, setShow2faSecret] = useState(false);
  const [totps, setTotps] = useState<Record<number, { code: string; remaining: number }>>({});

  async function load() {
    setLoading(true);
    try {
      setItems(await api<PasswordItem[]>("/passwords"));
    } catch {
      toast({ title: "Failed to load passwords", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // Auto-refresh TOTP codes for revealed items
  useEffect(() => {
    const ids = items.filter((i) => i.hasTwoFactor).map((i) => i.id);
    if (!ids.length) return;
    let cancelled = false;
    async function refresh() {
      const next: Record<number, { code: string; remaining: number }> = {};
      await Promise.all(ids.map(async (id) => {
        try {
          const t = await api<{ code: string; remaining: number }>(`/passwords/${id}/totp`);
          next[id] = t;
        } catch {}
      }));
      if (!cancelled) setTotps(next);
    }
    refresh();
    const iv = setInterval(refresh, 1000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [items]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowFormPassword(false);
    setShow2faSecret(false);
    setDialog(true);
  }

  async function openEdit(it: PasswordItem) {
    setEditing(it);
    setShowFormPassword(false);
    setShow2faSecret(false);
    let revealedData: { password?: string | null; twoFactorSecret?: string | null } = {};
    if (it.hasPassword || it.hasTwoFactor) {
      try {
        revealedData = await api<typeof revealedData>(`/passwords/${it.id}/reveal`);
      } catch {}
    }
    setForm({
      name: it.name,
      website: it.website || "",
      username: it.username || "",
      password: revealedData.password || "",
      twoFactorSecret: revealedData.twoFactorSecret || "",
    });
    setDialog(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    try {
      const body = JSON.stringify({
        name: form.name,
        website: form.website,
        username: form.username,
        password: form.password,
        twoFactorSecret: form.twoFactorSecret,
      });
      if (editing) {
        await api(`/passwords/${editing.id}`, { method: "PATCH", body });
        toast({ title: "Password updated" });
      } else {
        await api("/passwords", { method: "POST", body });
        toast({ title: "Password saved" });
      }
      setDialog(false);
      load();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  }

  async function remove(it: PasswordItem) {
    if (!confirm(`Delete "${it.name}"?`)) return;
    try {
      await api(`/passwords/${it.id}`, { method: "DELETE" });
      toast({ title: "Password removed", variant: "destructive" });
      setRevealed((r) => { const n = { ...r }; delete n[it.id]; return n; });
      load();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  async function toggleReveal(it: PasswordItem) {
    if (revealed[it.id]) {
      setRevealed((r) => { const n = { ...r }; delete n[it.id]; return n; });
      return;
    }
    try {
      const data = await api<{ password: string | null; twoFactorSecret: string | null }>(`/passwords/${it.id}/reveal`);
      setRevealed((r) => ({ ...r, [it.id]: data }));
    } catch {
      toast({ title: "Failed to reveal", variant: "destructive" });
    }
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copied` });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }

  function generatePassword() {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=";
    const arr = new Uint32Array(20);
    crypto.getRandomValues(arr);
    const pw = Array.from(arr).map((n) => charset[n % charset.length]).join("");
    setForm((f) => ({ ...f, password: pw }));
    setShowFormPassword(true);
  }

  const filtered = items.filter((it) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      it.name.toLowerCase().includes(q) ||
      (it.website || "").toLowerCase().includes(q) ||
      (it.username || "").toLowerCase().includes(q)
    );
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <KeyRound className="text-primary" size={28} /> Passwords
          </h1>
          <p className="text-muted-foreground">
            Encrypted vault. Only you can see these — kept private to your account.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} className="mr-1.5" /> New password
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, website, or username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          {items.length === 0 ? (
            <div className="space-y-3">
              <KeyRound size={36} className="mx-auto opacity-30" />
              <p>No passwords yet. Add your first one to keep it safe.</p>
              <Button onClick={openNew} variant="outline"><Plus size={14} className="mr-1.5" /> Add password</Button>
            </div>
          ) : "No matches."}
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((it) => {
            const rev = revealed[it.id];
            const totp = totps[it.id];
            return (
              <Card key={it.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">{it.name}</h3>
                        {it.hasTwoFactor && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                            <ShieldCheck size={11} /> 2FA
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        {it.website && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Globe size={13} className="flex-shrink-0" />
                            <a href={it.website.startsWith("http") ? it.website : `https://${it.website}`}
                               target="_blank" rel="noreferrer"
                               className="hover:text-primary truncate inline-flex items-center gap-1">
                              {it.website}
                              <ExternalLink size={11} />
                            </a>
                          </div>
                        )}
                        {it.username && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <UserIcon size={13} className="flex-shrink-0" />
                            <span className="truncate">{it.username}</span>
                            <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => copy(it.username!, "Username")}>
                              <Copy size={12} />
                            </Button>
                          </div>
                        )}
                        {it.hasPassword && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Password:</span>
                            <code className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
                              {rev?.password ? rev.password : "••••••••••"}
                            </code>
                            <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => toggleReveal(it)} title={rev ? "Hide" : "Reveal"}>
                              {rev ? <EyeOff size={12} /> : <Eye size={12} />}
                            </Button>
                            {rev?.password && (
                              <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => copy(rev.password!, "Password")}>
                                <Copy size={12} />
                              </Button>
                            )}
                          </div>
                        )}
                        {totp && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <Shield size={13} className="text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">2FA code:</span>
                            <code className="font-mono font-bold text-base text-primary tracking-wider">
                              {totp.code.slice(0, 3)} {totp.code.slice(3)}
                            </code>
                            <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => copy(totp.code, "2FA code")}>
                              <Copy size={12} />
                            </Button>
                            <span className="text-xs text-muted-foreground">expires in {totp.remaining}s</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(it)} title="Edit"><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(it)} title="Delete"><Trash2 size={14} className="text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit password" : "New password"}</DialogTitle>
            <DialogDescription>
              Stored encrypted on the server. Only password name is required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Password Name <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. GitHub" autoFocus />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="github.com" />
            </div>
            <div>
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="user@example.com" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Password</Label>
                <Button type="button" variant="ghost" size="sm" className="h-7" onClick={generatePassword}>Generate strong</Button>
              </div>
              <div className="relative">
                <Input
                  type={showFormPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowFormPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showFormPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1"><Shield size={13}/> 2FA TOTP secret (optional)</Label>
              <div className="relative">
                <Input
                  type={show2faSecret ? "text" : "password"}
                  value={form.twoFactorSecret}
                  onChange={(e) => setForm({ ...form, twoFactorSecret: e.target.value.replace(/\s/g, "") })}
                  placeholder="JBSWY3DPEHPK3PXP"
                  className="pr-10 font-mono text-sm"
                />
                <button type="button" onClick={() => setShow2faSecret((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show2faSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Base32 secret from your 2FA setup screen. We'll generate live 6-digit codes for you.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Add password"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
