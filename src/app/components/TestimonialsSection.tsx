import { motion } from 'motion/react';
import { Star, Quote, Trophy } from 'lucide-react';

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'NEET 2024 - AIR 247',
    image: '👩‍🎓',
    rating: 5,
    text: 'Anand Sir\'s chapter-wise PYQ approach helped me score 180/180 in Chemistry! The notes are so well-organized that revision became super easy. Highly recommend for NEET aspirants.',
    color: 'from-blue-400 to-cyan-400',
    exam: 'NEET',
  },
  {
    name: 'Arjun Patel',
    role: 'JEE Advanced 2024 - AIR 512',
    image: '👨‍🎓',
    rating: 5,
    text: 'The reaction mechanism notes and smart tests were game-changers for JEE Advanced. Sir explains complex organic reactions in such a simple way. Got full marks in Chemistry!',
    color: 'from-purple-400 to-pink-400',
    exam: 'JEE',
  },
  {
    name: 'Sneha Reddy',
    role: 'Class 12 - 98% in Chemistry',
    image: '👩‍🔬',
    rating: 5,
    text: 'I was afraid of Physical Chemistry, but Anand Sir\'s teaching made it my strongest subject. The NCERT solutions and additional practice questions helped me ace my boards!',
    color: 'from-green-400 to-teal-400',
    exam: 'Boards',
  },
  {
    name: 'Rohit Verma',
    role: 'JEE Main 2024 - 99.8 %ile',
    image: '👨‍🎓',
    rating: 5,
    text: 'Best decision I made during my JEE prep! The chapter-wise structure and performance tracking helped me identify my weak areas quickly. Chemistry became my scoring subject.',
    color: 'from-orange-400 to-red-400',
    exam: 'JEE',
  },
];

export function TestimonialsSection() {
  return (
    <div className="py-20 px-4 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full mb-4 shadow-md">
            <Trophy className="text-purple-600" size={20} />
            <span className="text-sm font-medium text-purple-700">Student Success Stories</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
              Our Students Are Winning
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real results from real students who trusted Chemistry By Anand for their exam preparation
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative"
            >
              {/* Glow effect */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${testimonial.color} rounded-3xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity`} />

              {/* Card */}
              <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all">
                {/* Quote icon */}
                <div className="absolute top-6 right-6 opacity-10">
                  <Quote size={60} className="text-gray-400" />
                </div>

                {/* Header */}
                <div className="flex items-start gap-4 mb-6 relative z-10">
                  <div className={`text-5xl bg-gradient-to-br ${testimonial.color} rounded-2xl w-16 h-16 flex items-center justify-center shadow-md`}>
                    {testimonial.image}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-800">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{testimonial.role}</p>
                    <div className={`inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r ${testimonial.color} rounded-full`}>
                      <Trophy size={12} className="text-white" />
                      <span className="text-xs font-semibold text-white">{testimonial.exam}</span>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + i * 0.05 }}
                    >
                      <Star className={`w-5 h-5 fill-yellow-400 text-yellow-400`} />
                    </motion.div>
                  ))}
                </div>

                {/* Testimonial text */}
                <p className="text-gray-700 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="inline-block bg-white rounded-2xl p-8 shadow-xl">
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">500+</div>
                <div className="text-sm text-gray-600">Top 1000 Rankers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
                <div className="text-sm text-gray-600">Selection Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-pink-600 mb-2">4.9/5</div>
                <div className="text-sm text-gray-600">Student Rating</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}