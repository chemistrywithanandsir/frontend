import React from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  Beaker,
  Atom,
  FlaskConical,
  Microscope,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Hero() {
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle } = useAuth();
  const floatingIcons = [
    { Icon: Beaker, delay: 0, x: -260, y: -140 },
    { Icon: Atom, delay: 0.2, x: 260, y: -120 },
    { Icon: FlaskConical, delay: 0.4, x: -260, y: 140 },
    { Icon: Microscope, delay: 0.6, x: 260, y: 160 },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-40"
            initial={{
              x:
                Math.random() *
                (typeof window !== "undefined" ? window.innerWidth : 1200),
              y:
                Math.random() *
                (typeof window !== "undefined" ? window.innerHeight : 800),
            }}
            animate={{
              y: "-20%",
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: Math.random() * 10 + 15,
              repeat: Infinity,
              repeatType: "mirror",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 px-4 max-w-5xl mx-auto">
        {/* Floating chemistry icons */}
        <div className="absolute inset-0 pointer-events-none">
          {floatingIcons.map(({ Icon, delay, x, y }, index) => (
            <motion.div
              key={index}
              className="absolute top-1/2 left-1/2"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{
                opacity: [0.1, 0.4, 0.1],
                scale: [0.9, 1.05, 0.9],
                x: [x, x + 24, x],
                y: [y, y - 24, y],
              }}
              transition={{
                duration: 6,
                delay,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <Icon size={56} className="text-cyan-400/40" />
            </motion.div>
          ))}
        </div>

        {/* Centered content card */}
        <div className="relative mx-auto max-w-3xl text-center -translate-y-4 md:-translate-y-5">
          {/* Soft glow behind content */}
          <div className="pointer-events-none absolute -inset-20 rounded-[40px] bg-gradient-to-br from-cyan-500/15 via-sky-500/5 to-indigo-500/10 blur-3xl" />

          {/* Branding Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-full shadow-lg mb-6 border border-cyan-500/40"
          >
            <Atom className="text-cyan-400" size={18} />
            <span className="text-xs sm:text-sm font-medium text-slate-100">
              Simplifying Chemistry for Competitive Success!
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="-mt-2 md:-mt-3 text-[2.6rem] leading-tight md:text-[3.5rem] lg:text-6xl md:leading-tight font-extrabold mb-5 tracking-tight"
          >
            <span className="relative inline-block">
              {/* Glow behind the title */}
              <span className="pointer-events-none absolute -inset-1 md:-inset-1.5 rounded-[1.75rem] bg-gradient-to-r from-cyan-500/40 via-sky-400/30 to-emerald-400/40 blur-2xl opacity-70" />

              <span className="relative inline-flex flex-col gap-1">

                <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(45,212,191,0.55)]">
                  Chemistry By Anand Sir
                </span>
              </span>
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.24 }}
            className="mb-6 mx-auto text-center"
          >
            <p className="whitespace-nowrap text-xs sm:text-sm md:text-base font-semibold text-cyan-100/95 leading-relaxed">
              Mentor of AIR 635 (JEE Mains) • AIR 69, 161, 297 (JEE Advanced) • NEET AIR 151 &amp; Many More
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-2xl text-slate-100 mb-4"
          >
            Master Competitive Exams Chemistry with Chapter-Wise PYQs, Premium
            Notes & Smart Tests.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-sm md:text-base text-slate-300 mb-10 max-w-2xl mx-auto"
          >
            Your Complete Chemistry Preparation Platform with 7+ Years of Expert
            Teaching Experience from Top Institutes like ALLEN, Aakash &
            Narayana.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              type="button"
              disabled={loading}
              onClick={() => {
                if (user) {
                  navigate("/dashboard/pyq");
                  return;
                }
                void signInWithGoogle("/dashboard");
              }}
              whileHover={{
                scale: 1.04,
                boxShadow: "0 22px 45px rgba(34,211,238,0.35)",
              }}
              whileTap={{ scale: 0.96 }}
              className="group px-8 py-4 bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 text-slate-950 rounded-full font-semibold shadow-xl transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <BookOpen size={20} />
              {loading ? "Loading…" : "Start Learning Free"}
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </motion.button>
          </motion.div>
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-sky-600 mb-2">
              7+
            </div>
            <div className="text-sm text-slate-300">Years Teaching</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-sky-600 mb-2">
              10,000+
            </div>
            <div className="text-sm text-slate-300">Students Taught</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-sky-600 mb-2">
              50%
            </div>
            <div className="text-sm text-slate-300">Average Classroom <br /> Selection Ratio</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}