import { motion } from "motion/react";
import { GraduationCap, Building2, Award, Users, Quote } from "lucide-react";
import SirImage from "../../assests/Sir.png";

export function MentorSection() {
  const credentials = [
    {
      icon: GraduationCap,
      title: "10+ years teaching experience",
      description: "",
    },
    {
      icon: Building2,
      title: "M.Sc. Chemistry, DU",
      description: "",
    },
    {
      icon: Users,
      title: "10K+ students impacted",
      description: "",
    },
    {
      icon: Award,
      title: "Recognized by MHRD",
      description: "",
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-wider mb-2">
            YOUR MENTOR
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Main Heading */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Taught by Anand Pandey
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
              As a Lecturer, my role goes beyond imparting knowledge I focus on assessing and monitoring student progress while providing tailored guidance that empowers them to achieve their academic goals. With a deep passion for Chemistry and a commitment to academic excellence, I strive to create an environment where learning truly thrives.
              </p>
            </div>

            {/* Credentials Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {credentials.map((cred, index) => (
                <motion.div
                  key={cred.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <cred.icon className="text-orange-400" size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm leading-snug">{cred.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quote */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative pl-6 border-l-4 border-orange-500"
            >
              <Quote className="absolute -top-2 -left-4 text-orange-500/20" size={40} />
              <p className="text-gray-300 italic text-lg mb-2">
                "Teaching is an art. I chose teaching over core engineering because I found my calling in interacting with the beautiful minds of our country."
              </p>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="space-y-4"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="text-orange-400" size={20} />
                  Teaching Journey
                </h4>
                <div className="space-y-2">
                  {['ALLEN Kota - Senior Faculty', 'Narayana Academy - HOD Chemistry', 'Aakash Institute - Regional Head'].map((institute, index) => (
                    <motion.div
                      key={institute}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      <span className="text-gray-400 text-sm">{institute}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Image Placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Decorative glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/25 to-amber-500/10 rounded-3xl blur-3xl" />

            {/* Image container using most of the section */}
            <div className="relative bg-gradient-to-br from-gray-900 to-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              {/* Full-height mentor image */}
              <div className="relative aspect-[3/4]">
                <img
                  src={SirImage}
                  alt="Anand Pandey"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Dark gradient overlay to blend with theme */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/40 to-transparent" />

                {/* Name + role card pinned near the bottom */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-6 w-[80%] max-w-sm">
                  <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30 shadow-xl text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Anand Pandey
                    </h3>
                    <p className="text-orange-400 font-semibold mb-1">
                      M.Sc. Chemistry, DU
                    </p>
                    <p className="text-gray-300 text-sm">
                      Founder & Lead Chemistry Educator
                    </p>
                  </div>
                </div>
              </div>

              {/* Accent corner */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500 to-transparent opacity-20" />
            </div>
          </motion.div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { value: '10+', label: 'Years Experience' },
            { value: '10,000+', label: 'Students Taught' },
            { value: '3', label: 'Top Institutes' },
            { value: '98%', label: 'Success Rate' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
              className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="text-3xl md:text-4xl font-bold text-orange-400 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
