import type { TicketPayload } from '../types';

export function parseServerQr(text: string): string | null {
  // https://api.example.com or ticket-server://https://api.example.com
  const match = text.match(/^(?:ticket-server:\/\/)?(https?:\/\/[^\s]+)$/);
  return match ? match[1] : null;
}

export function parsePairingQr(text: string): string | null {
  // ticket-scanner://{pairingToken}
  const match = text.match(/^ticket-scanner:\/\/([^\s]+)$/);
  return match ? match[1] : null;
}

export function parseTicketQr(text: string): TicketPayload | null {
  // ticket://v{version}/{compressed_payload}@{signature}
  const match = text.match(/^ticket:\/\/v([^/]+)\/([^@]+)@([^\s]+)$/);
  if (!match) return null;

  return {
    version: match[1],
    payload: match[2],
    signature: match[3],
  };
}
