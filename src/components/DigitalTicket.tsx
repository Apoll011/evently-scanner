import type { Ticket } from '../types';
import { Plane, User, Ticket as TicketIcon, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DigitalTicketProps {
  ticket: Ticket;
}

export function DigitalTicket({ ticket }: DigitalTicketProps) {
  const isValid = ticket.status === 'valid';
  const isUsed = ticket.status === 'used';
  const isInvalid = ticket.status === 'invalid';

  return (
    <div className="w-full max-w-sm mx-auto bg-card rounded-3xl overflow-hidden shadow-2xl border flex flex-col">
      {/* Header/Status */}
      <div className={cn(
        "p-6 flex items-center justify-between",
        isValid && "bg-green-500 text-white",
        isUsed && "bg-yellow-500 text-black",
        isInvalid && "bg-red-500 text-white"
      )}>
        <div className="flex items-center gap-2">
          {isValid && <CheckCircle size={24} />}
          {isUsed && <Clock size={24} />}
          {isInvalid && <AlertCircle size={24} />}
          <span className="font-bold uppercase tracking-widest">
            {ticket.status}
          </span>
        </div>
        <Plane size={24} className="opacity-50 rotate-90" />
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Event</p>
          <p className="text-xl font-black leading-tight">{ticket.event}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Passenger / Holder</p>
            <div className="flex items-center gap-2">
              <User size={16} className="text-muted-foreground" />
              <p className="font-bold">{ticket.holderName}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Ticket Type</p>
            <div className="flex items-center gap-2">
              <TicketIcon size={16} className="text-muted-foreground" />
              <p className="font-bold">{ticket.ticketType}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Index</p>
            <p className="font-mono font-bold text-sm">#{ticket.ticketIndex}</p>
          </div>
          {ticket.usedDate && (
             <div className="space-y-1">
               <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Used On</p>
               <p className="font-bold text-sm">{ticket.usedDate}</p>
             </div>
          )}
        </div>

        {ticket.customFields && Object.entries(ticket.customFields).length > 0 && (
           <div className="pt-4 border-t border-dashed space-y-2">
              {Object.entries(ticket.customFields).map(([label, value]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-bold uppercase">{label}</span>
                  <span className="font-bold">{value}</span>
                </div>
              ))}
           </div>
        )}
      </div>

      {/* Footer "Barcode" area */}
      <div className="p-6 bg-muted/50 border-t border-dashed mt-auto flex flex-col items-center">
         <div className="w-full h-12 bg-foreground/10 rounded flex items-center justify-around px-4 opacity-30 overflow-hidden">
            {Array.from({length: 40}).map((_, i) => (
              <div key={i} className="h-full bg-foreground" style={{ width: `${Math.random() * 4 + 1}px` }} />
            ))}
         </div>
         <p className="mt-2 font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            {ticket.ticketIndex}-{ticket.holderName.replace(/\s+/g, '')}
         </p>
      </div>
    </div>
  );
}
