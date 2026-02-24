import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const words = ["invertís", "comprás", "alquilás", "te mudás", "buscás"];

const RotatingWord = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block relative align-baseline">
      {/* Invisible longest word to reserve space */}
      <span className="invisible">te mudás</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          className="landing-gradient-text absolute left-0 top-0"
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
            scale: {
              type: "spring",
              stiffness: 400,
              damping: 15,
              mass: 0.5,
            },
          }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export default RotatingWord;
