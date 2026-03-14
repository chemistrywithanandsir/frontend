import { motion } from 'motion/react';
import { BookOpen, Award, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Comprehensive Curriculum',
    description: 'From basic concepts to advanced topics, covering all aspects of chemistry',
    stat: '500+',
    statLabel: 'Lessons',
  },
  {
    icon: Award,
    title: 'Earn Certificates',
    description: 'Get recognized for your achievements with official course certificates',
    stat: '50+',
    statLabel: 'Certificates',
  },
  {
    icon: Users,
    title: 'Expert Instructors',
    description: 'Learn from PhDs and industry professionals with years of experience',
    stat: '100+',
    statLabel: 'Instructors',
  },
  {
    icon: TrendingUp,
    title: 'Track Progress',
    description: 'Monitor your learning journey with detailed analytics and insights',
    stat: '24/7',
    statLabel: 'Tracking',
  },
  {
    icon: Clock,
    title: 'Learn at Your Pace',
    description: 'Flexible schedule with lifetime access to all course materials',
    stat: '∞',
    statLabel: 'Access',
  },
  {
    icon: CheckCircle,
    title: 'Interactive Quizzes',
    description: 'Test your knowledge with thousands of practice questions',
    stat: '5000+',
    statLabel: 'Questions',
  },
];

export function FeaturesSection() {
  return (
    <div className="py-20 px-4 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-white mb-4">
            Why Choose ChemLearn Academy?
          </h2>
          <p className="text-xl text-gray-300">
            Everything you need to master chemistry in one place
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <motion.div
                whileHover={{ y: -10 }}
                className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-lg border border-white/20 p-8 h-full"
              >
                {/* Animated gradient background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <motion.div
                    className="mb-6"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-300 mb-6">
                    {feature.description}
                  </p>

                  {/* Stat */}
                  <div className="flex items-end gap-2">
                    <motion.span
                      className="text-4xl font-bold text-white"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
                    >
                      {feature.stat}
                    </motion.span>
                    <span className="text-gray-400 mb-1">{feature.statLabel}</span>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl" />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-block">
            <motion.button
              className="px-12 py-5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold rounded-full shadow-2xl"
              whileHover={{
                scale: 1.05,
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
              }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Free
            </motion.button>
            <motion.p
              className="mt-4 text-gray-300"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              No credit card required • 14-day free trial
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
