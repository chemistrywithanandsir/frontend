import { motion } from 'motion/react';
import { useState } from 'react';
import { Play } from 'lucide-react';

const experiments = [
  {
    title: 'Elephant Toothpaste',
    description: 'Rapid decomposition of hydrogen peroxide creates an impressive foam eruption',
    difficulty: 'Beginner',
    duration: '15 min',
    category: 'Chemical Reactions',
    color: 'from-blue-500 to-cyan-500',
    reactants: ['H₂O₂', 'KI', 'Soap'],
    products: ['H₂O', 'O₂', 'Heat'],
  },
  {
    title: 'Rainbow Fire',
    description: 'Different metal salts produce beautiful colored flames',
    difficulty: 'Intermediate',
    duration: '20 min',
    category: 'Spectroscopy',
    color: 'from-orange-500 to-red-500',
    reactants: ['Metal Salts', 'Alcohol'],
    products: ['Light', 'Heat', 'CO₂'],
  },
  {
    title: 'Crystal Garden',
    description: 'Grow colorful crystals using supersaturated solutions',
    difficulty: 'Beginner',
    duration: '2-3 days',
    category: 'Crystallization',
    color: 'from-purple-500 to-pink-500',
    reactants: ['Salt', 'Water', 'Food Coloring'],
    products: ['Crystals'],
  },
  {
    title: 'Liquid Nitrogen Ice Cream',
    description: 'Rapidly freeze ice cream using liquid nitrogen',
    difficulty: 'Advanced',
    duration: '10 min',
    category: 'Phase Changes',
    color: 'from-cyan-500 to-blue-500',
    reactants: ['Cream', 'Sugar', 'N₂(l)'],
    products: ['Ice Cream', 'N₂(g)'],
  },
  {
    title: 'pH Rainbow',
    description: 'Create a colorful pH indicator using red cabbage',
    difficulty: 'Beginner',
    duration: '30 min',
    category: 'Acid-Base',
    color: 'from-green-500 to-teal-500',
    reactants: ['Cabbage', 'Acids', 'Bases'],
    products: ['pH Indicator'],
  },
  {
    title: 'Luminol Reaction',
    description: 'Produce blue chemiluminescence in the dark',
    difficulty: 'Advanced',
    duration: '25 min',
    category: 'Chemiluminescence',
    color: 'from-indigo-500 to-purple-500',
    reactants: ['Luminol', 'H₂O₂', 'Base'],
    products: ['Light', 'N₂'],
  },
];

export function InteractiveExperiments() {
  const [selectedExperiment, setSelectedExperiment] = useState<number | null>(null);

  return (
    <div className="py-20 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-white mb-4">
            Interactive Experiments
          </h2>
          <p className="text-xl text-gray-300">
            Explore hands-on chemistry experiments with step-by-step guidance
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiments.map((experiment, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <motion.div
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${experiment.color} p-[2px]`}
                whileHover={{ scale: 1.03 }}
                onClick={() => setSelectedExperiment(selectedExperiment === index ? null : index)}
              >
                <div className="bg-slate-900 rounded-3xl p-6 h-full cursor-pointer">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {experiment.title}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${experiment.color} text-white`}>
                        {experiment.category}
                      </span>
                    </div>
                    <motion.div
                      className={`p-3 rounded-full bg-gradient-to-r ${experiment.color}`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Play className="w-5 h-5 text-white" />
                    </motion.div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-sm mb-4">
                    {experiment.description}
                  </p>

                  {/* Info tags */}
                  <div className="flex gap-3 mb-4">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white">
                      {experiment.difficulty}
                    </span>
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white">
                      {experiment.duration}
                    </span>
                  </div>

                  {/* Chemical Equation Preview */}
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: selectedExperiment === index ? 'auto' : 0,
                      opacity: selectedExperiment === index ? 1 : 0,
                    }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-white/10">
                      <div className="mb-3">
                        <div className="text-xs text-gray-400 mb-1">Reactants:</div>
                        <div className="flex flex-wrap gap-2">
                          {experiment.reactants.map((reactant, i) => (
                            <motion.span
                              key={i}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm"
                            >
                              {reactant}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Products:</div>
                        <div className="flex flex-wrap gap-2">
                          {experiment.products.map((product, i) => (
                            <motion.span
                              key={i}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-sm"
                            >
                              {product}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Animated border pulse */}
                  {selectedExperiment === index && (
                    <motion.div
                      className="absolute inset-0 rounded-3xl"
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(139, 92, 246, 0.5)',
                          '0 0 40px rgba(139, 92, 246, 0.8)',
                          '0 0 20px rgba(139, 92, 246, 0.5)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Safety Notice */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 p-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-3xl border border-yellow-500/30"
        >
          <h3 className="text-2xl font-bold text-white mb-3">⚠️ Safety First!</h3>
          <p className="text-gray-300">
            Always conduct experiments under adult supervision, wear appropriate safety equipment,
            and follow all safety protocols. Never attempt dangerous experiments without proper training.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
