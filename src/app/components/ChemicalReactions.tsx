import { motion, useMotionValue, useTransform } from "motion/react";
import { useState, useEffect } from "react";

const reactions = [
  {
    name: 'Combustion',
    equation: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
    description: 'Complete combustion of methane produces carbon dioxide and water',
    type: 'Exothermic',
    color: 'from-red-500 to-orange-500',
  },
  {
    name: 'Neutralization',
    equation: 'HCl + NaOH → NaCl + H₂O',
    description: 'Acid-base reaction forming salt and water',
    type: 'Exothermic',
    color: 'from-blue-500 to-green-500',
  },
  {
    name: 'Photosynthesis',
    equation: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
    description: 'Plants convert light energy into chemical energy',
    type: 'Endothermic',
    color: 'from-green-500 to-teal-500',
  },
  {
    name: 'Rusting',
    equation: '4Fe + 3O₂ → 2Fe₂O₃',
    description: 'Iron oxidation in the presence of oxygen',
    type: 'Exothermic',
    color: 'from-orange-500 to-red-500',
  },
];

export function ChemicalReactions() {
  const [activeReaction, setActiveReaction] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReaction((prev) => (prev + 1) % reactions.length);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-20 px-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-4 text-slate-50">
            Chemical Reactions
          </h2>
          <p className="text-xl text-slate-300">
            Watch reactions come to life with animated visualizations
          </p>
        </motion.div>

        {/* Main Reaction Display */}
        <div className="max-w-5xl mx-auto mb-12">
          <motion.div
            key={activeReaction}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${reactions[activeReaction].color} p-12 shadow-2xl`}
          >
            {/* Animated particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 bg-white rounded-full"
                  initial={{
                    x: '50%',
                    y: '50%',
                    opacity: 0.7,
                  }}
                  animate={{
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    opacity: [0.7, 0],
                    scale: [1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.05,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <motion.h3
                className="text-3xl font-bold text-white mb-6 text-center"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                {reactions[activeReaction].name}
              </motion.h3>

              {/* Chemical Equation */}
              <motion.div
                className="text-4xl md:text-5xl font-bold text-white text-center mb-6 font-mono"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {reactions[activeReaction].equation}
              </motion.div>

              <motion.p
                className="text-xl text-white/90 text-center mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {reactions[activeReaction].description}
              </motion.p>

              <motion.div
                className="flex justify-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <span className="px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-semibold">
                  {reactions[activeReaction].type} Reaction
                </span>
              </motion.div>

              {/* Energy Animation */}
              {isAnimating && (
                <motion.div
                  className="absolute inset-0 bg-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </div>
          </motion.div>

          {/* Reaction Selector */}
          <div className="flex justify-center gap-3 mt-8">
            {reactions.map((reaction, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setActiveReaction(index);
                  setIsAnimating(true);
                  setTimeout(() => setIsAnimating(false), 1500);
                }}
                className={`w-4 h-4 rounded-full transition-all ${
                  activeReaction === index ? 'w-12 bg-purple-600' : 'bg-purple-300'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </div>

        {/* Reaction Types Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              type: 'Synthesis',
              formula: 'A + B → AB',
              example: '2H₂ + O₂ → 2H₂O',
              color: 'from-blue-400 to-cyan-400',
            },
            {
              type: 'Decomposition',
              formula: 'AB → A + B',
              example: '2H₂O → 2H₂ + O₂',
              color: 'from-purple-400 to-pink-400',
            },
            {
              type: 'Single Replacement',
              formula: 'A + BC → AC + B',
              example: 'Zn + 2HCl → ZnCl₂ + H₂',
              color: 'from-green-400 to-emerald-400',
            },
            {
              type: 'Double Replacement',
              formula: 'AB + CD → AD + CB',
              example: 'AgNO₃ + NaCl → AgCl + NaNO₃',
              color: 'from-orange-400 to-red-400',
            },
          ].map((reactionType, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${reactionType.color} p-6 shadow-xl`}
            >
              <h4 className="text-xl font-bold text-white mb-3">
                {reactionType.type}
              </h4>
              <div className="font-mono text-white/90 mb-3 text-lg">
                {reactionType.formula}
              </div>
              <div className="text-sm text-white/80 font-mono">
                {reactionType.example}
              </div>

              {/* Decorative elements */}
              <motion.div
                className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
