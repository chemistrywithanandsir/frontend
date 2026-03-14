import { motion } from 'motion/react';
import { BookOpen, ChevronRight, Atom, Beaker, FlaskConical } from 'lucide-react';

export function ContentPreview() {
  const neetChapters = [
    'Basic Concepts & Stoichiometry',
    'Atomic Structure',
    'Chemical Bonding',
    'States of Matter',
    'Thermodynamics',
    'Chemical Equilibrium',
    'Ionic Equilibrium',
    'Redox Reactions',
  ];

  const jeeChapters = [
    'Chemical Kinetics',
    'Electrochemistry',
    'Surface Chemistry',
    'Coordination Compounds',
    'Metallurgy',
    'Organic Chemistry Basics',
    'Reaction Mechanisms',
    'Biomolecules',
  ];

  const categories = [
    {
      title: 'NEET Chemistry',
      icon: Beaker,
      chapters: neetChapters,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      description: 'Complete NCERT-based coverage with PYQs',
    },
    {
      title: 'JEE Chemistry',
      icon: FlaskConical,
      chapters: jeeChapters,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      description: 'Advanced concepts with numerical focus',
    },
  ];

  return (
    <section className="py-20 px-4 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            <Atom size={40} />
          </motion.div>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-4">
            <BookOpen className="text-purple-600" size={20} />
            <span className="text-sm font-medium text-purple-700">Structured Content</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Chapter-wise Chemistry Coverage
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Every chapter from Class 11-12 with NEET & JEE alignment
          </p>
        </motion.div>

        {/* Category Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {categories.map((category, idx) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="group"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className={`absolute -inset-1 bg-gradient-to-br ${category.color} rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity`} />

                {/* Card */}
                <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all overflow-hidden border border-gray-100">
                  {/* Header */}
                  <div className={`bg-gradient-to-br ${category.bgColor} p-6 border-b border-gray-100`}>
                    <div className="flex items-center gap-4 mb-2">
                      <motion.div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      >
                        <category.icon className="text-white" size={28} />
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">{category.title}</h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Chapters List */}
                  <div className="p-6">
                    <div className="space-y-2 mb-4">
                      {category.chapters.slice(0, 6).map((chapter, index) => (
                        <motion.div
                          key={chapter}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          whileHover={{ x: 5 }}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all cursor-pointer group/item"
                        >
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${category.color}`} />
                          <span className="text-sm text-gray-700 flex-1">{chapter}</span>
                          <ChevronRight
                            size={16}
                            className="text-gray-400 group-hover/item:text-purple-600 transition-colors"
                          />
                        </motion.div>
                      ))}
                    </div>

                    {/* View All Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full py-3 bg-gradient-to-r ${category.color} text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2`}
                    >
                      View All Chapters
                      <ChevronRight size={18} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* NCERT Support Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 md:p-12 border-2 border-green-100"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full mb-4 shadow-sm">
                <BookOpen className="text-green-600" size={18} />
                <span className="text-sm font-medium text-green-700">NCERT Foundation</span>
              </div>
              <h3 className="text-3xl font-bold mb-4 text-gray-800">
                Complete NCERT Coverage
              </h3>
              <p className="text-gray-600 mb-6">
                Direct mapping from NCERT Class 11 & 12 chapters to our notes, solutions, and practice questions. Build your foundation right!
              </p>
              <ul className="space-y-3">
                {['Chapter-wise NCERT solutions', 'Intext & exercise questions', 'Additional practice problems', 'Exam-focused explanations'].map((item, index) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="text-white" size={14} />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
                <div className="text-sm text-gray-600">NCERT Coverage</div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">Physical Chemistry</span>
                  <span className="text-sm font-bold text-green-600">✓ Complete</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">Organic Chemistry</span>
                  <span className="text-sm font-bold text-green-600">✓ Complete</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">Inorganic Chemistry</span>
                  <span className="text-sm font-bold text-green-600">✓ Complete</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
