import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, passwordsTable } from "@workspace/db";
import { encrypt, decrypt } from "../lib/crypto";
import * as OTPAuth from "otpauth";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

function toClientPassword(row: typeof passwordsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    website: row.website,
    username: row.username,
    hasPassword: !!row.encryptedPassword,
    hasTwoFactor: !!row.encryptedTwoFactorSecret,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

router.get("/passwords", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const rows = await db
    .select()
    .from(passwordsTable)
    .where(eq(passwordsTable.userId, req.user!.id))
    .orderBy(passwordsTable.name);
  res.json(rows.map(toClientPassword));
});

router.post("/passwords", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { name, website, username, password, twoFactorSecret } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Password name is required" });
    return;
  }
  const [row] = await db
    .insert(passwordsTable)
    .values({
      userId: req.user!.id,
      name: name.trim(),
      website: website?.trim() || null,
      username: username?.trim() || null,
      encryptedPassword: password ? encrypt(password) : null,
      encryptedTwoFactorSecret: twoFactorSecret ? encrypt(twoFactorSecret) : null,
    })
    .returning();
  res.status(201).json(toClientPassword(row));
});

router.get("/passwords/:id/reveal", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const id = parseInt(String(req.params.id), 10);
  const [row] = await db
    .select()
    .from(passwordsTable)
    .where(and(eq(passwordsTable.id, id), eq(passwordsTable.userId, req.user!.id)));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    password: row.encryptedPassword ? decrypt(row.encryptedPassword) : null,
    twoFactorSecret: row.encryptedTwoFactorSecret ? decrypt(row.encryptedTwoFactorSecret) : null,
  });
});

router.get("/passwords/:id/totp", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const id = parseInt(String(req.params.id), 10);
  const [row] = await db
    .select()
    .from(passwordsTable)
    .where(and(eq(passwordsTable.id, id), eq(passwordsTable.userId, req.user!.id)));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  if (!row.encryptedTwoFactorSecret) { res.status(400).json({ error: "No 2FA secret stored" }); return; }
  const secret = decrypt(row.encryptedTwoFactorSecret);
  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret), digits: 6, period: 30 });
  const code = totp.generate();
  const remaining = 30 - (Math.floor(Date.now() / 1000) % 30);
  res.json({ code, remaining });
});

router.patch("/passwords/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const id = parseInt(String(req.params.id), 10);
  const [existing] = await db
    .select()
    .from(passwordsTable)
    .where(and(eq(passwordsTable.id, id), eq(passwordsTable.userId, req.user!.id)));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const { name, website, username, password, twoFactorSecret } = req.body;
  const updates: Partial<typeof passwordsTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (name !== undefined) updates.name = name.trim();
  if (website !== undefined) updates.website = website?.trim() || null;
  if (username !== undefined) updates.username = username?.trim() || null;
  if (password !== undefined) updates.encryptedPassword = password ? encrypt(password) : null;
  if (twoFactorSecret !== undefined) updates.encryptedTwoFactorSecret = twoFactorSecret ? encrypt(twoFactorSecret) : null;

  const [row] = await db
    .update(passwordsTable)
    .set(updates)
    .where(eq(passwordsTable.id, id))
    .returning();
  res.json(toClientPassword(row));
});

router.delete("/passwords/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const id = parseInt(String(req.params.id), 10);
  const [existing] = await db
    .select()
    .from(passwordsTable)
    .where(and(eq(passwordsTable.id, id), eq(passwordsTable.userId, req.user!.id)));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  await db.delete(passwordsTable).where(eq(passwordsTable.id, id));
  res.status(204).send();
});

export default router;
