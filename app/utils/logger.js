const dateFormat = require('dateformat');

export const logger = (message) => {
  const now = new Date();
  const timestamp = dateFormat(now, 'HH:MM:ss');
  const logMessage = `[${timestamp}] ${message}`;

  console.log(logMessage);
};

export default logger;
