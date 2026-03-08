import Link from "next/link";
import { Button } from "@/components/ui/button";
import WalletConnect from "./WalletConnect";
import { Leaf, Menu, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/router";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/market", label: "Marketplace" },
  { to: "/dashboard", label: "Dashboard" },
];

const Navbar = () => {
  const router = useRouter();
const location = { pathname: router.pathname };
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-glass-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg gradient-emerald flex items-center justify-center">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-gradient">GreenChain</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.to} href={link.to}>
              <Button
                variant={location.pathname === link.to ? "secondary" : "ghost"}
                size="sm"
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <WalletConnect />
          <Link href="/login">
            <Button variant="outline" size="sm">Sign In</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass-card border-t border-glass-border p-4 space-y-2">
          {navLinks.map((link) => (
            <Link key={link.to} href={link.to} onClick={() => setMobileOpen(false)}>
              <Button
                variant={location.pathname === link.to ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                {link.label}
              </Button>
            </Link>
          ))}
          <div className="pt-2 space-y-2">
            <WalletConnect />
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full">Sign In</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
