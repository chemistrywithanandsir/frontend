import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface LabEquipment {
  name: string;
  x: number;
  y: number;
  emoji: string;
  color: string;
}

const equipment: LabEquipment[] = [
  { name: 'Beaker', x: 100, y: 250, emoji: '🧪', color: '#3b82f6' },
  { name: 'Flask', x: 300, y: 200, emoji: '⚗️', color: '#8b5cf6' },
  { name: 'Test Tube', x: 500, y: 240, emoji: '🧫', color: '#ec4899' },
  { name: 'Microscope', x: 700, y: 220, emoji: '🔬', color: '#10b981' },
];

export function LabSimulation() {
  const [isPouring, setIsPouring] = useState(false);
  const [liquidLevel, setLiquidLevel] = useState(0);
  const [color, setColor] = useState('#3b82f6');

  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

  useEffect(() => {
    if (isPouring && liquidLevel < 100) {
      const timer = setTimeout(() => setLiquidLevel(liquidLevel + 2), 50);
      return () => clearTimeout(timer);
    }
  }, [isPouring, liquidLevel]);

  return (
    <div className="py-20 px-4 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-4">
            Virtual Lab Simulation
          </h2>
          <p className="text-xl text-gray-700">
            Practice lab techniques in a safe, virtual environment
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Virtual Lab Canvas */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative bg-white rounded-3xl shadow-2xl p-8 min-h-[500px]"
          >
            {/* Lab bench */}
            <div className="absolute bottom-8 left-8 right-8 h-2 bg-gradient-to-r from-amber-700 to-amber-800 rounded"></div>

            {/* Equipment */}
            {equipment.map((item, index) => (
              <motion.div
                key={index}
                className="absolute cursor-pointer"
                style={{ left: item.x, top: item.y }}
                drag
                dragConstraints={{ left: 0, right: 600, top: 0, bottom: 400 }}
                whileHover={{ scale: 1.2 }}
                whileDrag={{ scale: 1.3 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div
                  className="text-6xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.2,
                  }}
                >
                  {item.emoji}
                </motion.div>
                <div className="text-center text-sm font-semibold text-gray-700 mt-2">
                  {item.name}
                </div>
              </motion.div>
            ))}

            {/* Interactive Beaker */}
            <motion.div
              className="absolute"
              style={{ left: 250, top: 320 }}
              whileHover={{ scale: 1.05 }}
            >
              <svg width="150" height="180" viewBox="0 0 150 180">
                {/* Beaker outline */}
                <path
                  d="M 30 20 L 30 120 Q 30 160 75 160 Q 120 160 120 120 L 120 20 Z"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="3"
                />
                {/* Liquid */}
                <motion.path
                  d={`M 30 ${160 - liquidLevel} L 30 120 Q 30 160 75 160 Q 120 160 120 120 L 120 ${160 - liquidLevel} Z`}
                  fill={color}
                  opacity="0.6"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />
                {/* Measurement lines */}
                {[0, 25, 50, 75, 100].map((ml, i) => (
                  <g key={i}>
                    <line
                      x1="30"
                      y1={160 - ml}
                      x2="40"
                      y2={160 - ml}
                      stroke="#94a3b8"
                      strokeWidth="1"
                    />
                    <text
                      x="15"
                      y={165 - ml}
                      fontSize="10"
                      fill="#64748b"
                    >
                      {ml}
                    </text>
                  </g>
                ))}
              </svg>
            </motion.div>

            {/* Bubbles animation when pouring */}
            {isPouring && (
              <>
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white rounded-full opacity-70"
                    style={{
                      left: 280 + Math.random() * 60,
                      bottom: 100,
                    }}
                    animate={{
                      y: [-50, -150],
                      opacity: [0.7, 0],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">Lab Controls</h3>

              {/* Pour liquid button */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Pour Liquid
                </label>
                <motion.button
                  onClick={() => {
                    setIsPouring(true);
                    setTimeout(() => setIsPouring(false), 2000);
                  }}
                  disabled={liquidLevel >= 100}
                  className={`w-full py-4 rounded-xl font-bold text-white ${
                    liquidLevel >= 100
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}
                  whileHover={liquidLevel < 100 ? { scale: 1.02 } : {}}
                  whileTap={liquidLevel < 100 ? { scale: 0.98 } : {}}
                >
                  {isPouring ? 'Pouring...' : liquidLevel >= 100 ? 'Beaker Full' : 'Pour'}
                </motion.button>
              </div>

              {/* Empty beaker button */}
              <div className="mb-6">
                <motion.button
                  onClick={() => setLiquidLevel(0)}
                  className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-pink-500"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Empty Beaker
                </motion.button>
              </div>

              {/* Color selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Liquid Color
                </label>
                <div className="grid grid-cols-6 gap-3">
                  {colors.map((c, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setColor(c)}
                      className={`w-12 h-12 rounded-full border-4 ${
                        color === c ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: c }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
              </div>

              {/* Volume indicator */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  Current Volume
                </div>
                <div className="text-4xl font-bold text-blue-600">
                  {liquidLevel} mL
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${liquidLevel}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Lab Safety Tips */}
            <motion.div
              className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl shadow-xl p-8"
              whileHover={{ scale: 1.02 }}
            >
              <h4 className="text-xl font-bold text-amber-900 mb-3">
                💡 Lab Safety Tip
              </h4>
              <p className="text-amber-800">
                Always add acid to water, never water to acid. Remember: "Do as you oughta, add acid to water!"
              </p>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Experiments', value: '127' },
                { label: 'Equipment', value: '24' },
                { label: 'Techniques', value: '45' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg p-4 text-center"
                  whileHover={{ y: -5 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
