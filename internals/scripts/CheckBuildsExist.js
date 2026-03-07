// Check if the renderer bundle is built
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';

const rendererPath = path.join(
  __dirname,
  '..',
  '..',
  'app',
  'dist',
  'renderer.js'
);

if (!fs.existsSync(rendererPath)) {
  throw new Error(
    chalk.whiteBright.bgRed.bold(
      'The renderer is not built yet. Build it by running "yarn build-renderer"'
    )
  );
}
