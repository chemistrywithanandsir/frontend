import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { X, Check, Brain, TrendingUp, Target, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function ProblemSolution() {
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle } = useAuth();
  const problems = [
    {
      icon: X,
      text: 'Forgetting concepts after a few days',
      color: 'text-red-500',
    },
    {
      icon: X,
      text: 'No proper chapter-wise practice structure',
      color: 'text-red-500',
    },
    {
      icon: X,
      text: 'Random YouTube videos with no continuity',
      color: 'text-red-500',
    },
    {
      icon: X,
      text: 'Unable to track weak areas',
      color: 'text-red-500',
    },
  ];

  const solutions = [
    {
      icon: Check,
      title: 'Spaced Repetition',
      description: 'Smart revision system ensures concepts stay fresh',
    },
    {
      icon: Brain,
      title: 'Organized Learning',
      description: 'Chapter-wise structure with clear progression',
    },
    {
      icon: TrendingUp,
      title: 'Performance Analytics',
      description: 'Track your progress and identify weak topics',
    },
    {
      icon: Target,
      title: 'Focused Prep',
      description: 'Single mentor approach with consistent methodology',
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/70 rounded-full mb-4 border border-red-500/40">
            <Zap className="text-red-400" size={20} />
            <span className="text-sm font-medium text-slate-100">
              The Truth About Traditional Study
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-50">
            <span className="bg-gradient-to-r from-red-400 to-cyan-400 bg-clip-text text-transparent">
              Why Normal Study Fails
            </span>
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Most students struggle not because they don't work hard, but
            because they lack the right system
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Problems Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-gradient-to-br from-red-900/40 to-orange-900/20 rounded-3xl p-8 border border-red-800/60">
              <h3 className="text-2xl font-bold mb-6 text-slate-50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                  <X className="text-white" size={20} />
                </div>
                Common Problems
              </h3>

              <div className="space-y-4">
                {problems.map((problem, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-start gap-3 bg-slate-900/80 rounded-xl p-4 shadow-sm border border-red-900/40"
                  >
                    <problem.icon
                      className={`${problem.color} flex-shrink-0 mt-0.5`}
                      size={20}
                    />
                    <span className="text-slate-200">{problem.text}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-6 p-4 bg-slate-900/90 rounded-xl border border-red-700/60"
              >
                <p className="text-sm text-slate-300 italic">
                  "I studied hard but couldn't remember anything during the
                  exam" - Every student's nightmare
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Solutions Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-gradient-to-br from-emerald-900/40 to-cyan-900/20 rounded-3xl p-8 border border-emerald-700/70">
              <h3 className="text-2xl font-bold mb-6 text-slate-50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="text-white" size={20} />
                </div>
                Our Solution
              </h3>

              <div className="space-y-6">
                {solutions.map((solution, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-slate-900/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-emerald-700/60"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <solution.icon className="text-white" size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-50 mb-1">
                          {solution.title}
                        </h4>
                        <p className="text-sm text-slate-300">
                          {solution.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-6 p-4 bg-gradient-to-r from-sky-500 to-emerald-500 rounded-xl text-white"
              >
                <p className="text-sm font-semibold">
                  ✨ A structured system that builds knowledge layer by layer,
                  ensuring long-term retention
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <motion.button
            type="button"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
            onClick={() => {
              if (user) {
                navigate("/dashboard");
                return;
              }
              void signInWithGoogle("/dashboard");
            }}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 text-slate-950 rounded-full font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Loading…" : "Start Your Structured Journey Today"}
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
