import Head from 'next/head'
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Leaf, Shield, Zap, Globe, ArrowRight, TrendingUp, Users, BarChart3 } from "lucide-react";

// In Next.js, static images from /public should just use absolute paths, e.g., "/assets/hero-bg.jpg"
const heroBg = "/assets/hero-bg.jpg";

const stats = [
  { label: "Carbon Credits Traded", value: "12,450+", icon: TrendingUp },
  { label: "Active Companies", value: "340+", icon: Users },
  { label: "Tonnes CO₂ Offset", value: "89,200", icon: BarChart3 },
];

const steps = [
  {
    icon: Leaf,
    title: "NGOs List Credits",
    description: "Verified NGOs tokenize their carbon offset projects and list credits on the blockchain.",
  },
  {
    icon: Shield,
    title: "Smart Contract Escrow",
    description: "Credits are secured in audited smart contracts ensuring transparent, trustless transactions.",
  },
  {
    icon: Zap,
    title: "Companies Purchase",
    description: "Companies buy credits with ETH, instantly receiving verifiable proof of offset on-chain.",
  },
  {
    icon: Globe,
    title: "Impact Tracked",
    description: "Every transaction is recorded immutably, creating a transparent global carbon ledger.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-outfit antialiased">
      <Head>
        <title>GreenChain - On-chain Carbon Markets</title>
        <meta name="description" content="Carbon Credit Marketplace" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Forest canopy" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-forest/80" />
        </div>
        <div className="container mx-auto px-4 relative z-10 pt-20">
          <motion.div
            className="max-w-3xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-emerald-glow mb-6">
              <Leaf className="h-4 w-4" /> Decentralized Carbon Markets
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-forest-foreground leading-tight mb-6">
              Trade Carbon Credits{" "}
              <span className="text-emerald-glow">On-Chain</span>
            </h1>
            <p className="text-lg sm:text-xl text-forest-foreground/70 max-w-2xl mb-10">
              GreenChain connects NGOs and companies through blockchain-powered carbon credit trading.
              Transparent, verifiable, and instant.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/market">
                <Button variant="hero" size="xl">
                  Explore Marketplace <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="xl" className="border-forest-foreground/30 text-forest-foreground hover:bg-forest-foreground/10">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                {...fadeUp}
                transition={{ duration: 0.6, delay: i * 0.15 }}
              >
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" {...fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From project verification to carbon offset — fully on-chain in four simple steps.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="glass-card rounded-2xl p-6 hover:shadow-card-hover transition-all duration-300 group"
                {...fadeUp}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div className="h-12 w-12 rounded-xl gradient-emerald flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <step.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 gradient-forest">
        <div className="container mx-auto px-4 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-bold text-forest-foreground mb-4">
              Ready to Offset Your Carbon Footprint?
            </h2>
            <p className="text-forest-foreground/70 max-w-xl mx-auto mb-8">
              Join hundreds of companies and NGOs already making an impact through verifiable on-chain carbon trading.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/register">
                <Button variant="hero" size="xl">
                  Create Account <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/market">
                <Button variant="outline" size="xl" className="border-forest-foreground/30 text-forest-foreground hover:bg-forest-foreground/10">
                  Browse Credits
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
