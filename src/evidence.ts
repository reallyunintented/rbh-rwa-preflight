import { hashValue } from './hash.js';
import { redactText } from './redact.js';

export type EvidenceClass = 'onchain-reverifiable' | 'offchain-captured';
export type EvidenceSourceKind = 'rpc' | 'http';

export interface EvidenceItem {
  id: string;
  source: EvidenceSourceKind;
  class: EvidenceClass;
  atBlock?: string;
  request: unknown;
  response?: unknown;
  error?: { code?: number; message: string };
  capture?: { fetchedAtUnix: number; headers?: Record<string, string> };
}

export interface EvidenceSource {
  rpc(method: string, params: unknown[]): Promise<EvidenceItem>;
  http(url: string, init?: { method?: string; headers?: Record<string, string> }): Promise<EvidenceItem>;
  items(): EvidenceItem[];
}

export class LiveSource implements EvidenceSource {
  private collected: EvidenceItem[] = [];
  private rpcUrl: string;
  constructor(rpcUrl: string) { this.rpcUrl = rpcUrl; }
  async rpc(method: string, params: unknown[]): Promise<EvidenceItem> {
    const req = { method, params };
    const item: EvidenceItem = { id: '', source: 'rpc', class: 'onchain-reverifiable', request: req };
    item.id = hashValue({ source: 'rpc', method, params });
    try {
      const res = await fetch(this.rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
      const json = await res.json();
      item.response = json.result ?? null;
      if (json.error) item.error = { code: json.error.code, message: redactText(String(json.error.message ?? '')) };
    } catch (e: any) {
      item.error = { message: redactText(String(e?.message ?? e)) };
    }
    this.collected.push(item);
    return item;
  }
  async http(url: string, init?: { method?: string; headers?: Record<string, string> }): Promise<EvidenceItem> {
    const host = new URL(url).host;
    const method = init?.method ?? 'GET';
    const item: EvidenceItem = { id: '', source: 'http', class: 'offchain-captured', request: { host, method } };
    item.id = hashValue({ source: 'http', url, method });
    const fetchedAtUnix = Math.floor(Date.now() / 1000);
    try {
      const res = await fetch(url, init as any);
      const json = await res.json().catch(() => null);
      item.response = json;
      item.capture = { fetchedAtUnix, headers: { 'content-type': res.headers.get('content-type') ?? '', 'cache-control': res.headers.get('cache-control') ?? '', 'age': res.headers.get('age') ?? '', 'date': res.headers.get('date') ?? '' } };
    } catch (e: any) {
      item.error = { message: redactText(String(e?.message ?? e)) };
      item.capture = { fetchedAtUnix };
    }
    this.collected.push(item);
    return item;
  }
  items(): EvidenceItem[] {
    return [...this.collected].sort((a, b) => a.id.localeCompare(b.id));
  }
}

export class ReplaySource implements EvidenceSource {
  private map: Map<string, EvidenceItem>;
  constructor(items: EvidenceItem[]) {
    this.map = new Map(items.map((i) => [i.id, i]));
  }
  async rpc(method: string, params: unknown[]): Promise<EvidenceItem> {
    const id = hashValue({ source: 'rpc', method, params });
    const item = this.map.get(id);
    if (!item) throw new Error('EVIDENCE_INCOMPLETE');
    return item;
  }
  async http(url: string, init?: { method?: string; headers?: Record<string, string> }): Promise<EvidenceItem> {
    const method = init?.method ?? 'GET';
    const id = hashValue({ source: 'http', url, method });
    const item = this.map.get(id);
    if (!item) throw new Error('EVIDENCE_INCOMPLETE');
    return item;
  }
  items(): EvidenceItem[] { return [...this.map.values()].sort((a, b) => a.id.localeCompare(b.id)); }
}
