const debug = require('debug')('processor:m3u8');
const axios = require('axios');

async function processM3U8(requestSpec, response, context, ee) {
  debug('Processing M3U8 response');
  try {
    if (!response || !response.body) {
      debug('Empty response or body');
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

    for (const url of tsUrls) {
      try {
        const fullUrl = `http://localhost:3000${url}`;
        console.log(`Requesting: ${fullUrl}`);
        const response = await axios.get(fullUrl);
        console.log(
          `Successfully downloaded: ${url}, status: ${response.status}`,
        );
      } catch (error) {
        console.error(`Failed to download ${url}:`, error.message);
      }
    }
    return context;
  } catch (error) {
    debug(`Error processing M3U8: ${error.message}`);
    console.error(error);
    return context;
  }
}

module.exports = {
  processM3U8,
};
