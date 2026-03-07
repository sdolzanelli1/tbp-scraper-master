export const logger = (message) => {
  const timestamp = new Date().toTimeString().slice(0, 8);
  console.log(`[${timestamp}] ${message}`);
};

export default logger;

