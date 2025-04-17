import { motion } from 'framer-motion';

export const Greeting = () => {
  return (
    <div
      id="greeting"
      key="overview"
      className="max-w-3xl mx-auto md:mt-5 px-8 w-full flex flex-col justify-center h-[100px]"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold text-center"
      >
        What would you like to verify?
      </motion.div>
    </div>
  );
};
