import { motion } from "framer-motion";
import { Link } from "wouter";
import { Check, Sun, Moon, Monitor, BookOpen, ArrowRight } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { COLOR_THEMES } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Settings() {
  const { theme, setTheme, colorTheme } = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = { hidden: { y: 12, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <motion.div className="space-y-10 max-w-2xl" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Customise your Study Planner.</p>
      </motion.div>

      {/* ── Appearance link ─────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground">
            46+ themes, custom theme creator, fonts, density, sidebar layout — all in one place.
          </p>
        </div>
        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">
                  Active theme: <span className="text-primary">{COLOR_THEMES.find((t) => t.id === colorTheme)?.name ?? "Custom"}</span>
                </p>
                <p className="text-xs text-muted-foreground">Open the Customize page for full controls.</p>
              </div>
            </div>
            <a href={`${import.meta.env.BASE_URL}customize`}>
              <Button size="sm">Open Customize</Button>
            </a>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Light / Dark ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Light / Dark</h2>
          <p className="text-sm text-muted-foreground">Some themes override this — try them both.</p>
        </div>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((m) => {
            const Icon = m === "light" ? Sun : m === "dark" ? Moon : Monitor;
            return (
              <Button
                key={m}
                variant={theme === m ? "default" : "outline"}
                onClick={() => setTheme(m)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Subjects link ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Subjects</h2>
          <p className="text-sm text-muted-foreground">
            Subjects now have their own page.
          </p>
        </div>
        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Manage your subjects</p>
                <p className="text-xs text-muted-foreground">
                  Add, edit, or remove subjects. Each account has its own list.
                </p>
              </div>
            </div>
            <Link href="/subjects">
              <Button size="sm" data-testid="link-open-subjects">
                Open <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
