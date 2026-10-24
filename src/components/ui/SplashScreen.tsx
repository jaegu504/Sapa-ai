import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import sapaLogo from '../../assets/logo.png';

/** Short opening animation: the logo springs in, then the app fades up from behind it. */
export const SplashScreen: React.FC = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 950);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden="true"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F2F2F7] dark:bg-[#090A0F] pointer-events-none"
          exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
        >
          <motion.img
            src={sapaLogo}
            alt=""
            className="w-24 h-24 rounded-[28px] shadow-[0_20px_45px_-15px_rgba(47,84,235,0.6)]"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.15, opacity: 0, transition: { duration: 0.35 } }}
            transition={{ type: 'spring', damping: 14, stiffness: 180 }}
          />
          <motion.span
            className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
          >
            Sapa
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
