const debug = require('debug')('processor:m3u8');
const axios = require('axios');

async function processM3U8(requestSpec, response, context, ee) {
  debug('Starting M3U8 processing');
  try {
    if (!response || !response.body) {
      debug('Response or body is empty');
      return;
    }

    const m3u8Content = response.body;
    const lines = m3u8Content.split('\n');
    const tsUrls = [];

    lines.forEach((line) => {
      if (
        line.includes('/api/music/') &&
        line.includes('/playlist') &&
        line.endsWith('.ts')
      ) {
        tsUrls.push(line.trim());
      }
    });

    debug(`Found ${tsUrls.length} ts URLs`);
    if (tsUrls.length === 0) {
      debug('No .ts files found');
      return;
    }

    for (const url of tsUrls) {
      try {
        const fullUrl = `http://localhost:3000${url}`;
        debug(`Requesting TS file: ${fullUrl}`);
        const response = await axios.get(fullUrl);
        debug(`TS file downloaded: ${url}, status: ${response.status}`);
      } catch (error) {
        debug(`Failed to download ${url}: ${error.message}`);
      }
    }

    debug('M3U8 processing completed');
  } catch (error) {
    debug(`Error in M3U8 processing: ${error.message}`);
  }
}

module.exports = {
  processM3U8,
};
