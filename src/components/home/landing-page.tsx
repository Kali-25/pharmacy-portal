'use client';

import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useInView,
} from 'framer-motion';
import { useRef, useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import {
  Pill,
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
  Shield,
  CheckCircle,
  BarChart3,
} from 'lucide-react';

/* ---------- 3D Tilt Card ---------- */
function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseY = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseY, [-150, 150], [10, -10]);
  const rotateY = useTransform(mouseX, [-150, 150], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div style={{ perspective: 1200 }}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ---------- Animated Counter ---------- */
function AnimatedCounter({ value, suffix = '', decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1800;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * value);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, value]);

  return (
    <span ref={ref} className="font-mono">
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ---------- Floating Background Pills ---------- */
function FloatingPills() {
  const pills = [
    { left: '5%', top: '25%', delay: 0, dur: 7, size: 'w-10 h-5' },
    { left: '88%', top: '18%', delay: 1.5, dur: 8, size: 'w-14 h-7' },
    { left: '12%', top: '65%', delay: 0.8, dur: 6, size: 'w-8 h-4' },
    { left: '82%', top: '55%', delay: 2, dur: 9, size: 'w-12 h-6' },
    { left: '45%', top: '8%', delay: 1, dur: 7.5, size: 'w-10 h-5' },
    { left: '70%', top: '80%', delay: 0.3, dur: 6.5, size: 'w-8 h-4' },
    { left: '25%', top: '85%', delay: 1.8, dur: 8.5, size: 'w-12 h-6' },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pills.map((pill, i) => (
        <motion.div
          key={i}
          className={`absolute ${pill.size}`}
          style={{ left: pill.left, top: pill.top }}
          animate={{ y: [0, -40, 0], rotate: [0, 15, 0], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: pill.dur, delay: pill.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="h-full w-full rounded-full bg-gradient-to-r from-primary/40 to-accent/40 blur-[2px]" />
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- Section Wrapper for scroll animations ---------- */
function Section({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Main Landing Page ---------- */
export function LandingPage() {
  const features = [
    {
      icon: Package,
      title: 'Inventory Management',
      desc: 'Track medicines, batches, and stock levels in real-time. Bulk edit, barcode-ready, and multi-category support.',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: AlertTriangle,
      title: 'Expiry Tracking',
      desc: 'Never let medicines expire unnoticed. Color-coded alerts for batches expiring in 30, 60, and 90 days with FIFO selling.',
      color: 'bg-red-100 text-red-600',
    },
    {
      icon: ShoppingCart,
      title: 'Point of Sale',
      desc: 'Fast checkout with automatic FIFO batch selection, tax calculation, discounts, and multiple payment methods.',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      desc: 'Real-time KPIs, sales trends, inventory health scoring, and top-selling medicine insights at a glance.',
      color: 'bg-amber-100 text-amber-600',
    },
  ];

  const stats = [
    { value: 15, suffix: '+', label: 'Medicines Tracked', decimals: 0 },
    { value: 25, suffix: '+', label: 'Active Batches', decimals: 0 },
    { value: 99.9, suffix: '%', label: 'Stock Accuracy', decimals: 1 },
    { value: 24, suffix: '/7', label: 'Real-time Monitoring', decimals: 0 },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-green-50 via-white to-blue-50">
      <FloatingPills />

      {/* ---------- Navigation ---------- */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed top-0 z-50 w-full border-b border-border/50 bg-card/70 backdrop-blur-lg"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-md shadow-primary/20">
              <Pill className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">PharmaCare</span>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 cursor-pointer"
          >
            Sign In <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.nav>

      {/* ---------- Hero Section ---------- */}
      <section className="relative flex min-h-screen items-center px-6 pt-20">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left: Text content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"
            >
              <Shield className="h-3.5 w-3.5 text-primary" />
              WCAG-AAA Accessible - Healthcare-grade Security
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-5xl font-bold leading-tight text-foreground sm:text-6xl"
            >
              The future of{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                pharmacy
              </span>{' '}
              management
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 max-w-lg text-lg text-muted-foreground"
            >
              Track inventory, monitor expiry dates, process sales, and analyze performance
              all in one beautifully designed, accessible platform built for modern pharmacies.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:shadow-2xl hover:shadow-primary/30 hover:brightness-110 cursor-pointer"
              >
                Sign In to Portal <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-7 py-3.5 text-base font-semibold text-foreground shadow-sm transition-all hover:bg-muted hover:shadow-md cursor-pointer"
              >
                Explore Features
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 flex items-center gap-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" /> Real-time updates
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" /> FIFO expiry tracking
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" /> Role-based access
              </div>
            </motion.div>
          </motion.div>

          {/* Right: 3D Dashboard Preview Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <TiltCard className="rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-primary/10">
                {/* Mini Dashboard Header */}
                <div style={{ transform: 'translateZ(50px)' }} className="mb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Inventory Health</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-mono text-3xl font-bold text-primary">87%</span>
                        <span className="text-xs font-medium text-green-600">Healthy</span>
                      </div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Pill className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </div>

                {/* Mini KPI Cards */}
                <div style={{ transform: 'translateZ(30px)' }} className="mb-5 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Medicines', value: '1,247', color: 'text-primary' },
                    { label: 'Low Stock', value: '23', color: 'text-amber-600' },
                    { label: 'Expiring', value: '15', color: 'text-red-600' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                      <p className={`mt-1 font-mono text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                    </div>
                  ))}
                </div>

                {/* Mini Chart Bars */}
                <div style={{ transform: 'translateZ(20px)' }}>
                  <p className="mb-2 text-xs text-muted-foreground">Stock Status</p>
                  <div className="flex h-24 items-end gap-2">
                    {[
                      { h: '85%', c: 'bg-primary' },
                      { h: '45%', c: 'bg-yellow-400' },
                      { h: '30%', c: 'bg-amber-500' },
                      { h: '20%', c: 'bg-red-500' },
                      { h: '10%', c: 'bg-red-800' },
                    ].map((bar, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: bar.h }}
                        transition={{ delay: 1 + i * 0.15, duration: 0.6, ease: 'easeOut' }}
                        className={`flex-1 rounded-t ${bar.c}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Mini Activity Feed */}
                <div style={{ transform: 'translateZ(15px)' }} className="mt-5 space-y-2">
                  {[
                    { text: 'INV-1016 completed', time: '2m ago' },
                    { text: 'Paracetamol low stock', time: '15m ago' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                      <span className="text-xs text-foreground">{item.text}</span>
                      <span className="text-[10px] text-muted-foreground">{item.time}</span>
                    </div>
                  ))}
                </div>
              </TiltCard>
            </motion.div>

            {/* Glow effect behind card */}
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* ---------- Features Section ---------- */}
      <section id="features" className="relative px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Section className="mb-14 text-center">
            <h2 className="text-4xl font-bold text-foreground">
              Everything you need to run your{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                pharmacy
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              A complete suite of tools designed for modern pharmacy operations, from
              inventory to analytics.
            </p>
          </Section>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <TiltCard className="group h-full rounded-2xl border border-border bg-card p-6 shadow-lg transition-shadow hover:shadow-xl">
                    <div style={{ transform: 'translateZ(40px)' }}>
                      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${feature.color}`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- Stats Section ---------- */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Section>
            <div className="grid grid-cols-2 gap-6 rounded-2xl border border-border bg-card p-10 shadow-xl lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl font-bold text-primary sm:text-5xl">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ---------- CTA Section ---------- */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <Section>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent p-12 text-center shadow-2xl">
              {/* Decorative pills */}
              <motion.div
                className="absolute -right-10 -top-10 h-32 w-64 rounded-full bg-white/10 blur-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-10 -left-10 h-32 w-64 rounded-full bg-white/10 blur-2xl"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              <h2 className="relative text-3xl font-bold text-white sm:text-4xl">
                Ready to streamline your pharmacy?
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/80">
                Sign in to access your dashboard, manage inventory, track expiry dates,
                and process sales in real-time.
              </p>
              <Link
                href="/login"
                className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary shadow-xl transition-all hover:shadow-2xl hover:scale-105 cursor-pointer"
              >
                Sign In Now <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </Section>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-border bg-card px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Pill className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">PharmaCare Portal</span>
          </div>
          <p className="text-sm text-muted-foreground">
            v1.0 - Pharmacy Management System - Built with Next.js & Framer Motion
          </p>
        </div>
      </footer>
    </div>
  );
}
