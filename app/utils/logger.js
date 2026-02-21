import { getMainWindow } from 'electron-main-window';

const dateFormat = require('dateformat');

export const logger = (message) => {
  const now = new Date();
  const timestamp = dateFormat(now, 'HH:MM:ss');
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  const mainWindow = getMainWindow();
  mainWindow.webContents.send('logger', { message: logMessage });
};

export default logger;
