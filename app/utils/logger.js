import { getMainWindow } from 'electron-main-window';
import log from 'electron-log';

const dateFormat = require('dateformat');

export const logger = (message) => {
  const now = new Date();
  const timestamp = dateFormat(now, 'HH:MM:ss');
  const logMessage = `[${timestamp}] ${message}`;
  
  // Always log to console and file
  console.log(logMessage);
  log.info(logMessage);
  
  // Try to send to renderer, but don't fail if window isn't ready
  try {
    const mainWindow = getMainWindow();
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('logger', { message: logMessage });
    }
  } catch (err) {
    // Silently ignore if window isn't available yet
    // Logs are already going to console and electron-log
  }
};

export default logger;
