import React from "react";
import { motion } from "motion/react";
import { Instagram, Youtube, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-950/95 text-slate-300">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-xs md:text-sm">
          <p className="font-medium text-slate-200">© {currentYear} Chemistry By Anand</p>
          <p className="text-slate-500 mt-0.5">
            Focused chemistry preparation for NEET, JEE Main, JEE Advanced & CBSE.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:gap-6">
          <div className="flex items-center gap-4 text-xs md:text-sm">
            <Link
              to="/privacy"
              className="hover:text-cyan-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              to="/terms"
              className="hover:text-cyan-300 transition-colors"
            >
              Terms &amp; Conditions
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <motion.a
              href="https://www.instagram.com/chemistrybyanand.in/"
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.1, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full bg-slate-900/80 border border-slate-700 hover:border-pink-400/60 hover:text-pink-400 transition-colors"
              aria-label="Chemistry By Anand on Instagram"
            >
              <Instagram className="w-4 h-4" />
            </motion.a>
            <motion.a
              href="https://www.youtube.com/@ChemistryCoachAnand"
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.1, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full bg-slate-900/80 border border-slate-700 hover:border-red-500/70 hover:text-red-500 transition-colors"
              aria-label="Chemistry By Anand on YouTube"
            >
              <Youtube className="w-4 h-4" />
            </motion.a>
            <motion.a
              href="https://www.linkedin.com/in/anandchemistry/"
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.1, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full bg-slate-900/80 border border-slate-700 hover:border-sky-500/70 hover:text-sky-500 transition-colors"
              aria-label="Chemistry By Anand on LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  );
}