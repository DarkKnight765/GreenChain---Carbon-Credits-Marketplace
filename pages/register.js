import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Leaf, UserPlus } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("company");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const res = await fetch("/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    if (res.ok) {
      router.push("/login");
    } else {
      setErrorMsg("Registration failed. Email might exist.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-emerald p-4 font-outfit antialiased">
      <motion.div
        className="w-full max-w-md glass-card rounded-3xl p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="h-10 w-10 rounded-xl gradient-forest flex items-center justify-center">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-gradient">GreenChain</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground text-center mb-2">Create an Account</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">Join the decentralized carbon market</p>

        {errorMsg && <p className="text-destructive text-sm text-center mb-4">{errorMsg}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-3 pt-2">
            <Label>Account Type</Label>
            <RadioGroup defaultValue="company" value={role} onValueChange={setRole} className="flex flex-row gap-4">
              <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-xl flex-1 border border-border">
                <RadioGroupItem value="company" id="company" />
                <Label htmlFor="company" className="font-medium cursor-pointer">Company</Label>
              </div>
              <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-xl flex-1 border border-border">
                <RadioGroupItem value="ngo" id="ngo" />
                <Label htmlFor="ngo" className="font-medium cursor-pointer">NGO</Label>
              </div>
            </RadioGroup>
          </div>

          <Button type="submit" variant="hero" className="w-full mt-4" size="lg">
            <UserPlus className="h-4 w-4 mr-2" /> Register
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
