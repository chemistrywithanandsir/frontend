import { motion } from 'motion/react';
import { useState } from 'react';

const elements = [
  // Period 1
  { symbol: 'H', name: 'Hydrogen', number: 1, category: 'nonmetal', x: 0, y: 0 },
  { symbol: 'He', name: 'Helium', number: 2, category: 'noble-gas', x: 17, y: 0 },
  
  // Period 2
  { symbol: 'Li', name: 'Lithium', number: 3, category: 'alkali', x: 0, y: 1 },
  { symbol: 'Be', name: 'Beryllium', number: 4, category: 'alkaline', x: 1, y: 1 },
  { symbol: 'B', name: 'Boron', number: 5, category: 'metalloid', x: 12, y: 1 },
  { symbol: 'C', name: 'Carbon', number: 6, category: 'nonmetal', x: 13, y: 1 },
  { symbol: 'N', name: 'Nitrogen', number: 7, category: 'nonmetal', x: 14, y: 1 },
  { symbol: 'O', name: 'Oxygen', number: 8, category: 'nonmetal', x: 15, y: 1 },
  { symbol: 'F', name: 'Fluorine', number: 9, category: 'halogen', x: 16, y: 1 },
  { symbol: 'Ne', name: 'Neon', number: 10, category: 'noble-gas', x: 17, y: 1 },
  
  // Period 3
  { symbol: 'Na', name: 'Sodium', number: 11, category: 'alkali', x: 0, y: 2 },
  { symbol: 'Mg', name: 'Magnesium', number: 12, category: 'alkaline', x: 1, y: 2 },
  { symbol: 'Al', name: 'Aluminum', number: 13, category: 'post-transition', x: 12, y: 2 },
  { symbol: 'Si', name: 'Silicon', number: 14, category: 'metalloid', x: 13, y: 2 },
  { symbol: 'P', name: 'Phosphorus', number: 15, category: 'nonmetal', x: 14, y: 2 },
  { symbol: 'S', name: 'Sulfur', number: 16, category: 'nonmetal', x: 15, y: 2 },
  { symbol: 'Cl', name: 'Chlorine', number: 17, category: 'halogen', x: 16, y: 2 },
  { symbol: 'Ar', name: 'Argon', number: 18, category: 'noble-gas', x: 17, y: 2 },
  
  // Period 4
  { symbol: 'K', name: 'Potassium', number: 19, category: 'alkali', x: 0, y: 3 },
  { symbol: 'Ca', name: 'Calcium', number: 20, category: 'alkaline', x: 1, y: 3 },
  { symbol: 'Sc', name: 'Scandium', number: 21, category: 'transition', x: 2, y: 3 },
  { symbol: 'Ti', name: 'Titanium', number: 22, category: 'transition', x: 3, y: 3 },
  { symbol: 'V', name: 'Vanadium', number: 23, category: 'transition', x: 4, y: 3 },
  { symbol: 'Cr', name: 'Chromium', number: 24, category: 'transition', x: 5, y: 3 },
  { symbol: 'Mn', name: 'Manganese', number: 25, category: 'transition', x: 6, y: 3 },
  { symbol: 'Fe', name: 'Iron', number: 26, category: 'transition', x: 7, y: 3 },
  { symbol: 'Co', name: 'Cobalt', number: 27, category: 'transition', x: 8, y: 3 },
  { symbol: 'Ni', name: 'Nickel', number: 28, category: 'transition', x: 9, y: 3 },
  { symbol: 'Cu', name: 'Copper', number: 29, category: 'transition', x: 10, y: 3 },
  { symbol: 'Zn', name: 'Zinc', number: 30, category: 'transition', x: 11, y: 3 },
  { symbol: 'Ga', name: 'Gallium', number: 31, category: 'post-transition', x: 12, y: 3 },
  { symbol: 'Ge', name: 'Germanium', number: 32, category: 'metalloid', x: 13, y: 3 },
  { symbol: 'As', name: 'Arsenic', number: 33, category: 'metalloid', x: 14, y: 3 },
  { symbol: 'Se', name: 'Selenium', number: 34, category: 'nonmetal', x: 15, y: 3 },
  { symbol: 'Br', name: 'Bromine', number: 35, category: 'halogen', x: 16, y: 3 },
  { symbol: 'Kr', name: 'Krypton', number: 36, category: 'noble-gas', x: 17, y: 3 },
  
  // Period 5
  { symbol: 'Rb', name: 'Rubidium', number: 37, category: 'alkali', x: 0, y: 4 },
  { symbol: 'Sr', name: 'Strontium', number: 38, category: 'alkaline', x: 1, y: 4 },
  { symbol: 'Y', name: 'Yttrium', number: 39, category: 'transition', x: 2, y: 4 },
  { symbol: 'Zr', name: 'Zirconium', number: 40, category: 'transition', x: 3, y: 4 },
  { symbol: 'Nb', name: 'Niobium', number: 41, category: 'transition', x: 4, y: 4 },
  { symbol: 'Mo', name: 'Molybdenum', number: 42, category: 'transition', x: 5, y: 4 },
  { symbol: 'Tc', name: 'Technetium', number: 43, category: 'transition', x: 6, y: 4 },
  { symbol: 'Ru', name: 'Ruthenium', number: 44, category: 'transition', x: 7, y: 4 },
  { symbol: 'Rh', name: 'Rhodium', number: 45, category: 'transition', x: 8, y: 4 },
  { symbol: 'Pd', name: 'Palladium', number: 46, category: 'transition', x: 9, y: 4 },
  { symbol: 'Ag', name: 'Silver', number: 47, category: 'transition', x: 10, y: 4 },
  { symbol: 'Cd', name: 'Cadmium', number: 48, category: 'transition', x: 11, y: 4 },
  { symbol: 'In', name: 'Indium', number: 49, category: 'post-transition', x: 12, y: 4 },
  { symbol: 'Sn', name: 'Tin', number: 50, category: 'post-transition', x: 13, y: 4 },
  { symbol: 'Sb', name: 'Antimony', number: 51, category: 'metalloid', x: 14, y: 4 },
  { symbol: 'Te', name: 'Tellurium', number: 52, category: 'metalloid', x: 15, y: 4 },
  { symbol: 'I', name: 'Iodine', number: 53, category: 'halogen', x: 16, y: 4 },
  { symbol: 'Xe', name: 'Xenon', number: 54, category: 'noble-gas', x: 17, y: 4 },
  
  // Period 6
  { symbol: 'Cs', name: 'Cesium', number: 55, category: 'alkali', x: 0, y: 5 },
  { symbol: 'Ba', name: 'Barium', number: 56, category: 'alkaline', x: 1, y: 5 },
  { symbol: '*', name: 'Lanthanides', number: 57, category: 'lanthanide', x: 2, y: 5 },
  { symbol: 'Hf', name: 'Hafnium', number: 72, category: 'transition', x: 3, y: 5 },
  { symbol: 'Ta', name: 'Tantalum', number: 73, category: 'transition', x: 4, y: 5 },
  { symbol: 'W', name: 'Tungsten', number: 74, category: 'transition', x: 5, y: 5 },
  { symbol: 'Re', name: 'Rhenium', number: 75, category: 'transition', x: 6, y: 5 },
  { symbol: 'Os', name: 'Osmium', number: 76, category: 'transition', x: 7, y: 5 },
  { symbol: 'Ir', name: 'Iridium', number: 77, category: 'transition', x: 8, y: 5 },
  { symbol: 'Pt', name: 'Platinum', number: 78, category: 'transition', x: 9, y: 5 },
  { symbol: 'Au', name: 'Gold', number: 79, category: 'transition', x: 10, y: 5 },
  { symbol: 'Hg', name: 'Mercury', number: 80, category: 'transition', x: 11, y: 5 },
  { symbol: 'Tl', name: 'Thallium', number: 81, category: 'post-transition', x: 12, y: 5 },
  { symbol: 'Pb', name: 'Lead', number: 82, category: 'post-transition', x: 13, y: 5 },
  { symbol: 'Bi', name: 'Bismuth', number: 83, category: 'post-transition', x: 14, y: 5 },
  { symbol: 'Po', name: 'Polonium', number: 84, category: 'metalloid', x: 15, y: 5 },
  { symbol: 'At', name: 'Astatine', number: 85, category: 'halogen', x: 16, y: 5 },
  { symbol: 'Rn', name: 'Radon', number: 86, category: 'noble-gas', x: 17, y: 5 },
  
  // Period 7
  { symbol: 'Fr', name: 'Francium', number: 87, category: 'alkali', x: 0, y: 6 },
  { symbol: 'Ra', name: 'Radium', number: 88, category: 'alkaline', x: 1, y: 6 },
  { symbol: '**', name: 'Actinides', number: 89, category: 'actinide', x: 2, y: 6 },
  { symbol: 'Rf', name: 'Rutherfordium', number: 104, category: 'transition', x: 3, y: 6 },
  { symbol: 'Db', name: 'Dubnium', number: 105, category: 'transition', x: 4, y: 6 },
  { symbol: 'Sg', name: 'Seaborgium', number: 106, category: 'transition', x: 5, y: 6 },
  { symbol: 'Bh', name: 'Bohrium', number: 107, category: 'transition', x: 6, y: 6 },
  { symbol: 'Hs', name: 'Hassium', number: 108, category: 'transition', x: 7, y: 6 },
  { symbol: 'Mt', name: 'Meitnerium', number: 109, category: 'transition', x: 8, y: 6 },
  { symbol: 'Ds', name: 'Darmstadtium', number: 110, category: 'transition', x: 9, y: 6 },
  { symbol: 'Rg', name: 'Roentgenium', number: 111, category: 'transition', x: 10, y: 6 },
  { symbol: 'Cn', name: 'Copernicium', number: 112, category: 'transition', x: 11, y: 6 },
  { symbol: 'Nh', name: 'Nihonium', number: 113, category: 'post-transition', x: 12, y: 6 },
  { symbol: 'Fl', name: 'Flerovium', number: 114, category: 'post-transition', x: 13, y: 6 },
  { symbol: 'Mc', name: 'Moscovium', number: 115, category: 'post-transition', x: 14, y: 6 },
  { symbol: 'Lv', name: 'Livermorium', number: 116, category: 'post-transition', x: 15, y: 6 },
  { symbol: 'Ts', name: 'Tennessine', number: 117, category: 'halogen', x: 16, y: 6 },
  { symbol: 'Og', name: 'Oganesson', number: 118, category: 'noble-gas', x: 17, y: 6 },

  // Lanthanides (separate row)
  { symbol: 'La', name: 'Lanthanum', number: 57, category: 'lanthanide', x: 3, y: 8 },
  { symbol: 'Ce', name: 'Cerium', number: 58, category: 'lanthanide', x: 4, y: 8 },
  { symbol: 'Pr', name: 'Praseodymium', number: 59, category: 'lanthanide', x: 5, y: 8 },
  { symbol: 'Nd', name: 'Neodymium', number: 60, category: 'lanthanide', x: 6, y: 8 },
  { symbol: 'Pm', name: 'Promethium', number: 61, category: 'lanthanide', x: 7, y: 8 },
  { symbol: 'Sm', name: 'Samarium', number: 62, category: 'lanthanide', x: 8, y: 8 },
  { symbol: 'Eu', name: 'Europium', number: 63, category: 'lanthanide', x: 9, y: 8 },
  { symbol: 'Gd', name: 'Gadolinium', number: 64, category: 'lanthanide', x: 10, y: 8 },
  { symbol: 'Tb', name: 'Terbium', number: 65, category: 'lanthanide', x: 11, y: 8 },
  { symbol: 'Dy', name: 'Dysprosium', number: 66, category: 'lanthanide', x: 12, y: 8 },
  { symbol: 'Ho', name: 'Holmium', number: 67, category: 'lanthanide', x: 13, y: 8 },
  { symbol: 'Er', name: 'Erbium', number: 68, category: 'lanthanide', x: 14, y: 8 },
  { symbol: 'Tm', name: 'Thulium', number: 69, category: 'lanthanide', x: 15, y: 8 },
  { symbol: 'Yb', name: 'Ytterbium', number: 70, category: 'lanthanide', x: 16, y: 8 },
  { symbol: 'Lu', name: 'Lutetium', number: 71, category: 'lanthanide', x: 17, y: 8 },

  // Actinides (separate row)
  { symbol: 'Ac', name: 'Actinium', number: 89, category: 'actinide', x: 3, y: 9 },
  { symbol: 'Th', name: 'Thorium', number: 90, category: 'actinide', x: 4, y: 9 },
  { symbol: 'Pa', name: 'Protactinium', number: 91, category: 'actinide', x: 5, y: 9 },
  { symbol: 'U', name: 'Uranium', number: 92, category: 'actinide', x: 6, y: 9 },
  { symbol: 'Np', name: 'Neptunium', number: 93, category: 'actinide', x: 7, y: 9 },
  { symbol: 'Pu', name: 'Plutonium', number: 94, category: 'actinide', x: 8, y: 9 },
  { symbol: 'Am', name: 'Americium', number: 95, category: 'actinide', x: 9, y: 9 },
  { symbol: 'Cm', name: 'Curium', number: 96, category: 'actinide', x: 10, y: 9 },
  { symbol: 'Bk', name: 'Berkelium', number: 97, category: 'actinide', x: 11, y: 9 },
  { symbol: 'Cf', name: 'Californium', number: 98, category: 'actinide', x: 12, y: 9 },
  { symbol: 'Es', name: 'Einsteinium', number: 99, category: 'actinide', x: 13, y: 9 },
  { symbol: 'Fm', name: 'Fermium', number: 100, category: 'actinide', x: 14, y: 9 },
  { symbol: 'Md', name: 'Mendelevium', number: 101, category: 'actinide', x: 15, y: 9 },
  { symbol: 'No', name: 'Nobelium', number: 102, category: 'actinide', x: 16, y: 9 },
  { symbol: 'Lr', name: 'Lawrencium', number: 103, category: 'actinide', x: 17, y: 9 },
];

const categoryColors: Record<string, string> = {
  'alkali': 'bg-orange-400',
  'alkaline': 'bg-amber-400',
  'transition': 'bg-yellow-300',
  'post-transition': 'bg-emerald-400',
  'metalloid': 'bg-teal-400',
  'nonmetal': 'bg-blue-400',
  'halogen': 'bg-cyan-400',
  'noble-gas': 'bg-purple-400',
  'lanthanide': 'bg-pink-400',
  'actinide': 'bg-rose-400',
};

export function PeriodicTable() {
  const [hoveredElement, setHoveredElement] = useState<number | null>(null);

  return (
    <div className="py-20 px-4 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <div className="max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Interactive Periodic Table
          </h2>
          <p className="text-lg text-gray-300">
            Explore all 118 elements - hover for details
          </p>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap gap-3 justify-center mb-8"
        >
          {Object.entries(categoryColors).map(([category, color]) => (
            <div key={category} className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
              <div className={`w-4 h-4 ${color} rounded`}></div>
              <span className="text-white capitalize text-xs">
                {category.replace('-', ' ')}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Periodic Table Grid - Responsive sizing */}
        <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6">
          <div
            className="grid gap-0.5 md:gap-1"
            style={{
              gridTemplateColumns: 'repeat(18, 1fr)',
              gridTemplateRows: 'repeat(10, minmax(40px, 1fr))',
            }}
          >
            {elements.map((element, index) => (
              <motion.div
                key={`${element.number}-${element.x}-${element.y}`}
                className={`${
                  categoryColors[element.category]
                } rounded p-1 md:p-2 cursor-pointer relative overflow-hidden group hover:z-10`}
                style={{
                  gridColumn: element.x + 1,
                  gridRow: element.y + 1,
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.003,
                  type: 'spring',
                  stiffness: 300,
                }}
                whileHover={{ scale: 1.15, zIndex: 50 }}
                onHoverStart={() => setHoveredElement(element.number)}
                onHoverEnd={() => setHoveredElement(null)}
              >
                <div className="text-[8px] md:text-xs font-semibold text-gray-900">
                  {element.number}
                </div>
                <div className="text-sm md:text-xl font-bold text-gray-900 text-center leading-tight">
                  {element.symbol}
                </div>
                <div className="text-[6px] md:text-[10px] text-gray-800 text-center truncate leading-tight">
                  {element.name}
                </div>

                {/* Hover tooltip */}
                {hoveredElement === element.number && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-2xl whitespace-nowrap z-50 pointer-events-none"
                  >
                    <div className="font-bold">{element.name}</div>
                    <div className="text-sm">Atomic #: {element.number}</div>
                    <div className="text-sm capitalize">{element.category.replace('-', ' ')}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Legend markers for Lanthanides and Actinides */}
          <div className="mt-4 text-white text-xs flex gap-4 justify-center">
            <div>* Lanthanides (57-71)</div>
            <div>** Actinides (89-103)</div>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-gray-400 text-sm"
        >
          118 Elements | 7 Periods | 18 Groups | Interactive & Educational
        </motion.div>
      </div>
    </div>
  );
}
