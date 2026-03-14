import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface Atom {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export function MoleculeVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedMolecule, setSelectedMolecule] = useState<'water' | 'methane' | 'co2' | 'ammonia'>('water');

  const molecules = {
    water: {
      name: 'Water',
      formula: 'H₂O',
      description: 'Essential for all known forms of life',
      color: 'from-blue-400 to-cyan-400',
    },
    methane: {
      name: 'Methane',
      formula: 'CH₄',
      description: 'Simplest hydrocarbon and main component of natural gas',
      color: 'from-green-400 to-emerald-400',
    },
    co2: {
      name: 'Carbon Dioxide',
      formula: 'CO₂',
      description: 'Important greenhouse gas in Earth\'s atmosphere',
      color: 'from-gray-400 to-slate-400',
    },
    ammonia: {
      name: 'Ammonia',
      formula: 'NH₃',
      description: 'Used in fertilizers and cleaning products',
      color: 'from-purple-400 to-violet-400',
    },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    let atoms: Atom[] = [];
    let connections: [number, number][] = [];

    // Initialize atoms based on selected molecule
    const initMolecule = () => {
      atoms = [];
      connections = [];

      const centerX = width / 2;
      const centerY = height / 2;

      if (selectedMolecule === 'water') {
        // H2O structure
        atoms = [
          { x: centerX, y: centerY, vx: 0, vy: 0, radius: 30, color: '#ef4444' }, // O
          { x: centerX - 60, y: centerY + 40, vx: 0, vy: 0, radius: 15, color: '#93c5fd' }, // H
          { x: centerX + 60, y: centerY + 40, vx: 0, vy: 0, radius: 15, color: '#93c5fd' }, // H
        ];
        connections = [[0, 1], [0, 2]];
      } else if (selectedMolecule === 'methane') {
        // CH4 structure
        atoms = [
          { x: centerX, y: centerY, vx: 0, vy: 0, radius: 25, color: '#6b7280' }, // C
          { x: centerX - 50, y: centerY - 50, vx: 0, vy: 0, radius: 15, color: '#93c5fd' }, // H
          { x: centerX + 50, y: centerY - 50, vx: 0, vy: 0, radius: 15, color: '#93c5fd' }, // H
          { x: centerX - 50, y: centerY + 50, vx: 0, vy: 0, radius: 15, color: '#93c5fd' }, // H
          { x: centerX + 50, y: centerY + 50, vx: 0, vy: 0, radius: 15, color: '#93c5fd' }, // H
        ];
        connections = [[0, 1], [0, 2], [0, 3], [0, 4]];
      } else if (selectedMolecule === 'co2') {
        // CO2 structure (linear)
        atoms = [
          { x: centerX, y: centerY, vx: 0, vy: 0, radius: 25, color: '#6b7280' }, // C
          { x: centerX - 80, y: centerY, vx: 0, vy: 0, radius: 30, color: '#ef4444' }, // O
          { x: centerX + 80, y: centerY, vx: 0, vy: 0, radius: 30, color: '#ef4444' }, // O
        ];
        connections = [[0, 1], [0, 2]];
      } else if (selectedMolecule === 'ammonia') {
        // NH3 structure
        atoms = [
          { x: centerX, y: centerY, vx: 0, vy: 0, radius: 28, color: '#3b82f6' }, // N
          { x: centerX - 60, y: centerY + 40, vx: 0, vy: 0, radius: 15, color: '#93c5fd' }, // H
          { x: centerX + 60, y: centerY + 40, vx: 0, vy: 0, radius: 15, color: '#93c5fd' }, // H
          { x: centerX, y: centerY - 60, vx: 0, vy: 0, radius: 15, color: '#93c5fd' }, // H
        ];
        connections = [[0, 1], [0, 2], [0, 3]];
      }
    };

    initMolecule();

    let animationId: number;
    let rotation = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      rotation += 0.01;

      // Rotate molecules
      const centerX = width / 2;
      const centerY = height / 2;

      atoms.forEach((atom, i) => {
        if (i !== 0) {
          const dx = atom.x - centerX;
          const dy = atom.y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) + 0.01;
          
          atom.x = centerX + Math.cos(angle) * distance;
          atom.y = centerY + Math.sin(angle) * distance;
        }
      });

      // Draw connections
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      connections.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(atoms[i].x, atoms[i].y);
        ctx.lineTo(atoms[j].x, atoms[j].y);
        ctx.stroke();
      });

      // Draw atoms
      atoms.forEach((atom) => {
        ctx.beginPath();
        ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
        ctx.fillStyle = atom.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Add glow effect
        const gradient = ctx.createRadialGradient(
          atom.x, atom.y, 0,
          atom.x, atom.y, atom.radius
        );
        gradient.addColorStop(0, atom.color + 'aa');
        gradient.addColorStop(1, atom.color + '00');
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [selectedMolecule]);

  return (
    <div className="py-20 px-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            3D Molecule Visualization
          </h2>
          <p className="text-xl text-gray-700">
            Interact with molecular structures in real-time
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Canvas */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-2xl p-8"
          >
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="w-full"
            />
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">Select Molecule</h3>
              <div className="space-y-4">
                {Object.entries(molecules).map(([key, molecule]) => (
                  <motion.button
                    key={key}
                    onClick={() => setSelectedMolecule(key as any)}
                    className={`w-full text-left p-6 rounded-2xl transition-all ${
                      selectedMolecule === key
                        ? `bg-gradient-to-r ${molecule.color} text-white shadow-lg`
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="font-bold text-xl mb-1">{molecule.name}</div>
                    <div className="text-2xl font-bold mb-2">{molecule.formula}</div>
                    <div className={`text-sm ${selectedMolecule === key ? 'text-white/90' : 'text-gray-600'}`}>
                      {molecule.description}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.div
              className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl shadow-2xl p-8 text-white"
              whileHover={{ scale: 1.02 }}
            >
              <h4 className="text-xl font-bold mb-3">Did you know?</h4>
              <p className="text-white/90">
                Molecules are constantly in motion, vibrating and rotating even at absolute zero due to quantum effects!
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
