import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@workspace/replit-auth-web";
import { motion } from "framer-motion";
import { GraduationCap, Sparkles, Lock, Palette } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="overflow-hidden">
          <div className="bg-primary text-primary-foreground p-6 flex items-center gap-3">
            <div className="p-2 bg-primary-foreground/15 rounded-lg">
              <GraduationCap size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">Study Planner</h1>
              <p className="text-sm opacity-90">Your personal study companion</p>
            </div>
          </div>
          <CardContent className="p-6 space-y-5">
            <p className="text-muted-foreground">
              Sign in to keep your tasks, schedule, themes, and password vault in sync across all your devices.
            </p>
            <div className="space-y-2.5 text-sm">
              <Feature icon={<Sparkles size={16} />} title="46+ themes & full color customization" />
              <Feature icon={<Palette size={16} />} title="Build your own theme with color pickers" />
              <Feature icon={<Lock size={16} />} title="Secure password vault with 2FA support" />
            </div>
            <Button onClick={login} className="w-full h-11 text-base">
              Sign in with Replit
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Your data is private to your account.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function Feature({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 text-foreground">
      <span className="p-1.5 rounded-md bg-primary/10 text-primary">{icon}</span>
      <span>{title}</span>
    </div>
  );
}
