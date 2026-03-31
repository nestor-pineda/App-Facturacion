const { join } = require('path');

/**
 * Keep browser binaries inside project dependencies so cloud builds
 * and runtime environments can resolve Chrome consistently.
 */
module.exports = {
  cacheDirectory: join(__dirname, 'node_modules', '.puppeteer_cache'),
};
