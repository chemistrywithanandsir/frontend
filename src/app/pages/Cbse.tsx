import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { ClipboardList, FileText, BookOpen, BookMarked, FlaskConical, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const CBSE_ACTION_CARDS = [
  { icon: ClipboardList, label: "Subject Wise PYQs",           to: "/dashboard/pyq"   },
  { icon: FileText,      label: "Chapterwise Notes",           to: "/dashboard/notes" },
  { icon: BookOpen,      label: "Subject Wise Notes",          to: "/dashboard/notes" },
  { icon: BookMarked,    label: "Complete Theoretical Notes",  to: "/dashboard/notes" },
  { icon: FlaskConical,  label: "Important Reactions",         to: "/dashboard/notes" },
] as const;

export function CbsePage() {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-300 mb-8"
        >
          ← Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-50 mb-2 leading-tight">
            <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              CBSE Chemistry
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            NCERT-first board preparation — PYQs, structured notes & exam-oriented practice
          </p>
        </motion.div>

        {/* Quick-access action cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Explore CBSE Resources</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {CBSE_ACTION_CARDS.map(({ icon: Icon, label, to }) => (
              <motion.button
                key={label}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (user) {
                    navigate(to);
                  } else {
                    void signInWithGoogle();
                  }
                }}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-5 text-center shadow-md hover:border-emerald-500/50 hover:bg-slate-900 transition-all cursor-pointer"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 group-hover:from-emerald-500/30 group-hover:to-teal-500/30 transition-all">
                  <Icon size={22} className="text-emerald-300" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-200 leading-snug">
                  {label}
                </span>
                {!user && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-500 group-hover:text-emerald-400 transition-colors">
                    <LogIn size={10} />
                    Sign in
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

