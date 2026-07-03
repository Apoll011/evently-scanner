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

export interface Ticket {
  holderName: string;
  ticketType: string;
  status: 'valid' | 'used' | 'invalid';
  event: string;
  ticketIndex: string;
  usedDate?: string;
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
  session: ScannerSession | null;
  event: Event | null;
  gate: string | null;
}
