import http from 'node:http';
import { buildMeterSnapshot } from './meter';

const server = http.createServer((req, res) => {
  if (req.url?.startsWith('/api/v0/token/')) {
    const snapshot = buildMeterSnapshot({
      request: { asset: 'AAPL', side: 'buy', sizeQuote: '100' },
      chain: { chainId: 4663, blockNumber: '1', blockHash: '0x0', blockTimestamp: 1 },
      feedPriceWad: 100n * 10n ** 18n,
      uiMultiplier: 10n ** 18n,
      midPriceWad: 101n * 10n ** 18n,
      effectivePriceWad: 102n * 10n ** 18n,
    });
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(snapshot));
    return;
  }
  res.statusCode = 404;
  res.end('not found');
});

server.listen(8787, () => console.log('meter api on 8787'));
