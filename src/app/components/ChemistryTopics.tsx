import { motion } from 'motion/react';
import { Beaker, FlaskConical, TestTube, Flame, Droplet, Sparkles } from 'lucide-react';

const topics = [
  {
    icon: Beaker,
    title: 'Organic Chemistry',
    description: 'Study of carbon-based compounds and their reactions',
    color: 'from-green-400 to-emerald-600',
    lessons: 45,
    image: 'https://images.unsplash.com/photo-1616046560582-41ac3c954715?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVtaXN0cnklMjBsYWIlMjBiZWFrZXJzJTIwY29sb3JmdWx8ZW58MXx8fHwxNzcyNDM5NTg2fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    icon: FlaskConical,
    title: 'Inorganic Chemistry',
    description: 'Explore metals, minerals, and non-carbon compounds',
    color: 'from-blue-400 to-indigo-600',
    lessons: 38,
    image: 'https://images.unsplash.com/photo-1740666387475-548de5c37691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2xlY3VsYXIlMjBzdHJ1Y3R1cmUlMjBzY2llbmNlfGVufDF8fHx8MTc3MjQzOTU4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    icon: TestTube,
    title: 'Analytical Chemistry',
    description: 'Master techniques for analyzing chemical compositions',
    color: 'from-purple-400 to-pink-600',
    lessons: 32,
    image: 'https://images.unsplash.com/photo-1770320742537-e2710eeb04d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVtaWNhbCUyMHJlYWN0aW9uJTIwZXhwZXJpbWVudHxlbnwxfHx8fDE3NzI0Mzk1ODd8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    icon: Flame,
    title: 'Physical Chemistry',
    description: 'Understand the physical properties of molecules',
    color: 'from-orange-400 to-red-600',
    lessons: 41,
    image: 'https://images.unsplash.com/photo-1711185898441-f493426390cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJpb2RpYyUyMHRhYmxlJTIwZWxlbWVudHN8ZW58MXx8fHwxNzcyNDM5NTg2fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    icon: Droplet,
    title: 'Biochemistry',
    description: 'Chemical processes within living organisms',
    color: 'from-cyan-400 to-teal-600',
    lessons: 36,
    image: 'https://images.unsplash.com/photo-1676313414325-2a877a95dd10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVtaXN0cnklMjBzdHVkZW50JTIwbWljcm9zY29wZXxlbnwxfHx8fDE3NzI0Mzk1ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    icon: Sparkles,
    title: 'Quantum Chemistry',
    description: 'Application of quantum mechanics to chemistry',
    color: 'from-violet-400 to-purple-600',
    lessons: 28,
    image: 'https://images.unsplash.com/photo-1758685734030-a31d96462eec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2llbmNlJTIwZWR1Y2F0aW9uJTIwbGVhcm5pbmd8ZW58MXx8fHwxNzcyNDM5NTg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

export function ChemistryTopics() {
  return (
    <div className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-4">Explore Chemistry Topics</h2>
          <p className="text-xl text-gray-600">
            Comprehensive courses covering all major branches of chemistry
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topics.map((topic, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group relative overflow-hidden rounded-3xl shadow-xl"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={topic.image}
                  alt={topic.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${topic.color} opacity-90 mix-blend-multiply`} />
              </div>

              {/* Content */}
              <div className="relative p-8 min-h-[320px] flex flex-col">
                <motion.div
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <topic.icon className="w-16 h-16 text-white mb-4" />
                </motion.div>

                <h3 className="text-2xl font-bold text-white mb-3">
                  {topic.title}
                </h3>

                <p className="text-white/90 mb-4 flex-grow">
                  {topic.description}
                </p>

                <div className="flex items-center justify-between text-white">
                  <span className="text-sm font-semibold">
                    {topic.lessons} Lessons
                  </span>
                  <motion.button
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Learning
                  </motion.button>
                </div>

                {/* Floating particles effect */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white rounded-full"
                      initial={{
                        x: Math.random() * 100,
                        y: Math.random() * 100,
                        opacity: 0,
                      }}
                      animate={{
                        y: [null, -100],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
