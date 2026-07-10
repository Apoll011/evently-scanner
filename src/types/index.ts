export interface ScannerSession {
  accessToken: string;
  scannerId: string;
  eventId: string;
  organizerId: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  capacity: number;
  status: string;
  organizerId: string;
  bannerUrl?: string;
}

export interface TicketPayload {
  version: string;
  payload: string;
  signature: string;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold: number;
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  holderName: string;
  ticketType: TicketType;
  status: 'ISSUED' | 'USED' | 'CANCELLED' | 'REFUNDED';
  event: Event;
  ticketIndex: string;
  usedAt?: string;
  customFields?: Record<string, string>;
}

export interface CheckInResponse {
  valid: boolean;
  ticketType: string;
  holderName: string;
  event: string;
  checkedInAt: string;
}

export interface ScannerState {
  serverUrl: string | null;
  publicKey: {
    algorithm: string;
    keyId: string;
    public_key: string;
  } | null;
  session: ScannerSession | null;
  event: Event | null;
  gate: string | null;
  offlineMode: boolean;
}
