import { motion } from "motion/react";
import { FileText, BookOpen, ClipboardList, CheckCircle2 } from "lucide-react";

export function ProductsSection() {
  const products = [
    {
      icon: ClipboardList,
      title: "Chapter-wise PYQs",
      to: "/dashboard/pyq",
      description:
        "Practice previous year questions organized by chapter, topic, and exam pattern",
      features: [
        "NEET & JEE papers (2005-2025)",
        "Tagged by year, shift & difficulty",
        "Practice & test modes",
        "Detailed solutions",
      ],
      gradient: "from-sky-500 to-indigo-500",
    },
    {
      icon: BookOpen,
      title: "Premium Notes",
      to: "/dashboard/notes",
      description:
        "High-quality handwritten & digital notes for every chemistry chapter",
      features: [
        "Physical, Organic & Inorganic",
        "Concept maps & flowcharts",
        "Quick revision sheets",
        "Important reactions & mechanisms",
      ],
      gradient: "from-violet-500 to-sky-500",
    },
    {
      icon: FileText,
      title: "Smart Revision Tests",
      to: "/courses",
      description:
        "Smart tests based on your weak areas and exam patterns (coming soon)",
      features: [
        "Chapter-wise & full syllabus",
        "Performance analytics",
        "Time management practice",
        "Personalized recommendations",
      ],
      gradient: "from-emerald-500 to-cyan-500",
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-300 rounded-full"
            initial={{
              x:
                Math.random() *
                (typeof window !== "undefined" ? window.innerWidth : 1200),
              y:
                Math.random() *
                (typeof window !== "undefined" ? window.innerHeight : 800),
              opacity: 0.3,
            }}
            animate={{
              y: [null, Math.random() * -120],
            }}
            transition={{
              duration: Math.random() * 6 + 6,
              repeat: Infinity,
              repeatType: "loop",
            }}
          />
        ))}
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full mb-4 shadow-md border border-slate-700">
            <CheckCircle2 className="text-cyan-300" size={20} />
            <span className="text-sm font-medium text-slate-100">
              Complete Study Package
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-50">
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              Everything You Need to Excel
            </span>
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Comprehensive resources designed to help you master chemistry
            concepts and ace your exams
          </p>
        </motion.div>

        {/* Product Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {products.map((product, index) => (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group"
            >
              <div className="relative h-full">
                {/* Glow effect */}
                <motion.div
                  className={`absolute -inset-1 bg-gradient-to-br ${product.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity`}
                  animate={{
                    opacity: [0, 0.2, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                />

                {/* Card */}
                <div className="relative h-full bg-slate-900/80 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all border border-slate-700">
                  {/* Icon container */}
                  <motion.div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${product.gradient} flex items-center justify-center mb-6 shadow-md`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <product.icon className="text-white" size={32} />
                  </motion.div>

                  {/* Title and description */}
                  <h3 className="text-2xl font-bold mb-3 text-slate-50">
                    {product.title}
                  </h3>
                  <p className="text-slate-300 mb-6">{product.description}</p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {product.features.map((feature) => (
                      <motion.li
                        key={feature}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle2
                          className={`text-cyan-300 flex-shrink-0 mt-0.5`}
                          size={18}
                        />
                        <span className="text-sm text-slate-200">
                          {feature}
                        </span>
                      </motion.li>
                    ))}
                  </ul>

                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
