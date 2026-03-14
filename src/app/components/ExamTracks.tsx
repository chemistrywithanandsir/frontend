import { motion } from "motion/react";
import { Target, TrendingUp, BookOpen, GraduationCap } from "lucide-react";

export function ExamTracks() {
  const tracks = [
    {
      icon: Target,
      title: "NEET Chemistry",
      description:
        "Comprehensive prep for NEET with 20+ years of PYQs, concept-focused notes, and NCERT alignment",
      features: [
        "NCERT-based foundation",
        "Previous Year Questions",
        "Biology-Chemistry integration",
      ],
      color: "from-sky-500 via-cyan-400 to-emerald-400",
      bgColor: "from-sky-500/10 via-cyan-500/5 to-emerald-500/10",
    },
    {
      icon: TrendingUp,
      title: "JEE Main Chemistry",
      description:
        "Chapter-wise practice with pattern-based approach for JEE Main shifts and numerical mastery",
      features: [
        "All shift variations",
        "Numerical problem focus",
        "Quick revision notes",
      ],
      color: "from-violet-500 via-indigo-500 to-sky-400",
      bgColor: "from-violet-500/10 via-indigo-500/5 to-sky-500/10",
    },
    {
      icon: Target,
      title: "JEE Advanced Chemistry",
      description:
        "Advanced problem-solving with multi-concept PYQs, integer-type questions and deep theory coverage.",
      features: [
        "Multi-step conceptual problems",
        "Integer & multi-correct practice",
        "Advanced theory-linked notes",
      ],
      color: "from-fuchsia-500 via-purple-500 to-indigo-400",
      bgColor: "from-fuchsia-500/10 via-purple-500/5 to-indigo-500/10",
    },
    {
      icon: GraduationCap,
      title: "CBSE Chemistry",
      description:
        "NCERT-first CBSE board preparation with focused PYQs, exemplar-style questions and crisp notes.",
      features: [
        "NCERT line-by-line coverage",
        "Board-style PYQs & examples",
        "High-scoring chapter notes",
      ],
      color: "from-emerald-400 via-teal-400 to-cyan-400",
      bgColor: "from-emerald-500/10 via-teal-500/5 to-cyan-500/10",
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-sky-500/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/40 rounded-full blur-3xl"></div>
        <div className="absolute -top-20 right-1/4 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/70 backdrop-blur-md rounded-full mb-4 border border-cyan-500/30 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]">
            <BookOpen className="text-cyan-300" size={18} />
            <span className="text-xs sm:text-sm font-medium text-slate-100">
              Choose Your Path
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 text-slate-50 tracking-tight">
            <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              Exam-Specific Tracks
            </span>
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Tailored chemistry preparation for NEET, JEE Main, JEE Advanced & CBSE
            with dedicated resources for each exam pattern.
          </p>
        </motion.div>

        {/* Exam Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tracks.map((track, index) => (
            <motion.div
              key={track.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group relative"
            >
              {/* Glow */}
              <div
                className={`absolute -inset-1 bg-gradient-to-br ${track.bgColor} rounded-3xl blur-2xl transition-all opacity-40 group-hover:opacity-80`}
              />

              <div className="relative overflow-hidden bg-slate-900/70 backdrop-blur-md rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all border border-slate-700/80">
                {/* Subtle top sheen */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent" />

                {/* Icon */}
                <motion.div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${track.color} flex items-center justify-center mb-6 shadow-[0_14px_40px_rgba(0,0,0,0.35)]`}
                  whileHover={{ rotate: 10, scale: 1.06 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16 }}
                >
                  <track.icon className="text-white" size={32} />
                </motion.div>

                {/* Content */}
                <h3 className="text-2xl font-bold mb-3 text-slate-50">
                  {track.title}
                </h3>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  {track.description}
                </p>

                {/* Features List */}
                <ul className="space-y-3 mb-6">
                  {track.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${track.color} mt-2`}
                      />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
