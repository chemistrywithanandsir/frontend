import { motion } from "motion/react";
import { Menu, X, User } from "lucide-react";
import Logo from "../../assests/Logo.png";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "NEET", to: "/neet" },
    { label: "JEE (Mains)", to: "/jee-main" },
    { label: "JEE (Advanced)", to: "/jee-advanced" },
    { label: "CBSE", to: "/cbse" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <img
                src={Logo}
                alt="Chemistry platform logo"
                className="h-12 sm:h-14 md:h-16 w-auto object-contain"
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <motion.div key={link.label} whileHover={{ y: -2 }}>
                <Link
                  to={link.to}
                  className="text-slate-200 hover:text-cyan-300 font-medium transition-colors"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Desktop Auth Button */}
          <div className="hidden md:flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 text-cyan-300 font-medium hover:bg-slate-900 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
              onClick={user ? () => { void signOut(); navigate("/"); } : () => signInWithGoogle()}
            >
              <User size={18} />
              {loading ? "Loading..." : user ? "Sign Out" : "Sign In with Google"}
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-100"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pb-4 border-t border-slate-800 pt-4"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-slate-200 hover:text-cyan-300 font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-700">
                <button
                  className="w-full px-4 py-2 text-cyan-300 font-medium border border-cyan-400 rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={loading}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (user) {
                      void signOut();
                      navigate("/");
                    } else {
                      void signInWithGoogle();
                    }
                  }}
                >
                  {loading ? "Loading..." : user ? "Sign Out" : "Sign In"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}