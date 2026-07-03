import type { Ticket } from '../types';
import { User, Ticket as TicketIcon, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DigitalTicketProps {
  ticket: Ticket;
}

export function DigitalTicket({ ticket }: DigitalTicketProps) {
  const getStatusConfig = () => {
    switch (ticket.status) {
      case 'ISSUED':
        return {
          icon: <CheckCircle size={24} />,
          bg: "bg-green-500",
          text: "text-white",
          label: "Valid"
        };
      case 'USED':
        return {
          icon: <Clock size={24} />,
          bg: "bg-blue-500",
          text: "text-white",
          label: "Used"
        };
      case 'CANCELLED':
        return {
          icon: <AlertCircle size={24} />,
          bg: "bg-red-500",
          text: "text-white",
          label: "Cancelled"
        };
      case 'REFUNDED':
        return {
          icon: <AlertCircle size={24} />,
          bg: "bg-gray-500",
          text: "text-white",
          label: "Refunded"
        };
      default:
        return {
          icon: <AlertCircle size={24} />,
          bg: "bg-gray-200",
          text: "text-gray-600",
          label: ticket.status
        };
    }
  };

  const status = getStatusConfig();

  return (
    <div className="w-full max-w-sm mx-auto bg-card rounded-[2rem] overflow-hidden shadow-2xl border border-border flex flex-col transition-all duration-300 hover:shadow-cyan-500/10">
      {/* Header/Status */}
      <div className={cn(
        "p-6 flex items-center justify-between",
        status.bg,
        status.text
      )}>
        <div className="flex items-center gap-3">
          {status.icon}
          <span className="font-black uppercase tracking-widest text-lg">
            {status.label}
          </span>
        </div>
        <TicketIcon size={24} className="opacity-40" />
      </div>

      {/* Content */}
      <div className="p-8 space-y-8 relative">
        {/* Punch holes effect */}
        <div className="absolute -left-3 top-0 bottom-0 flex flex-col justify-center gap-2 py-4">
           {[...Array(6)].map((_, i) => (
             <div key={i} className="w-6 h-6 rounded-full bg-background border-r border-border -ml-3" />
           ))}
        </div>
        <div className="absolute -right-3 top-0 bottom-0 flex flex-col justify-center gap-2 py-4">
           {[...Array(6)].map((_, i) => (
             <div key={i} className="w-6 h-6 rounded-full bg-background border-l border-border -mr-3" />
           ))}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Event Name</p>
          <p className="text-2xl font-black leading-tight text-foreground">{ticket.event.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Holder</p>
            <div className="flex items-center gap-2">
              <User size={16} className="text-primary" />
              <p className="font-bold text-foreground">{ticket.holderName}</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Ticket Type</p>
            <div className="flex items-center gap-2">
              <TicketIcon size={16} className="text-primary" />
              <p className="font-bold text-foreground">{ticket.ticketType.name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-dashed border-border">
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Ticket ID</p>
            <p className="font-mono font-bold text-sm text-foreground">#{ticket.id.slice(0, 8)}</p>
          </div>
          {ticket.usedAt && (
             <div className="space-y-2">
               <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Used On</p>
               <p className="font-bold text-sm text-foreground">{new Date(ticket.usedAt).toLocaleDateString()}</p>
             </div>
          )}
        </div>

        {ticket.customFields && Object.entries(ticket.customFields).length > 0 && (
           <div className="pt-6 border-t border-dashed border-border space-y-3">
              {Object.entries(ticket.customFields).map(([label, value]) => (
                <div key={label} className="flex justify-between items-center bg-muted/30 p-2 rounded-lg">
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">{label}</span>
                  <span className="font-bold text-sm text-foreground">{value}</span>
                </div>
              ))}
           </div>
        )}
      </div>
      
      {/* Footer decoration */}
      <div className="mt-auto h-3 bg-muted/50 w-full" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 95% 70%, 90% 100%, 85% 70%, 80% 100%, 75% 70%, 70% 100%, 65% 70%, 60% 100%, 55% 70%, 50% 100%, 45% 70%, 40% 100%, 35% 70%, 30% 100%, 25% 70%, 20% 100%, 15% 70%, 10% 100%, 5% 70%, 0 100%)' }} />
    </div>
  );
}
