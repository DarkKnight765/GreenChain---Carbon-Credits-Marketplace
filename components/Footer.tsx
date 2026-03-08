import { Leaf } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card py-12">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-primary" />
          <span className="font-bold text-gradient">GreenChain</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 GreenChain. Building a sustainable future on-chain.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
