import { useState, useEffect } from 'react';
import { useScanner } from '../contexts/ScannerContext';
import { useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Trash2, Power, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function HomePage() {
  const { logout, forgetServer, isAuthenticated, event, gate, setGate } = useScanner();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [gateInput, setGateInput] = useState(gate || '');

  useEffect(() => {
    setGateInput(gate || '');
  }, [gate]);

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      {/* Toolbar */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-card h-14 z-10">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-accent rounded-full transition-colors"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="font-semibold text-lg">Ticket Scanner</span>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto pb-24">
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-muted p-6 rounded-full mb-6">
              <Power size={48} className="text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No active scanner session</h2>
            <p className="text-muted-foreground mb-8">
              Start a new session to begin scanning tickets.
            </p>
            <button
              onClick={() => navigate('/pair')}
              className="w-full max-w-xs py-4 bg-primary text-primary-foreground rounded-xl text-lg font-bold shadow-lg hover:opacity-90 transition-opacity"
            >
              Start Session
            </button>
          </div>
        ) : (
          <div className="flex flex-col pb-12">
            {event?.bannerUrl && (
              <div className="w-full h-48 bg-muted overflow-hidden">
                <img 
                  src={event.bannerUrl} 
                  alt={event.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-6 space-y-8">
              <section>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-primary/10 rounded">Active Event</span>
                  {event?.status && (
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-green-500/10 text-green-600 rounded">
                      {event.status}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-black leading-tight">{event?.name || 'Loading...'}</h1>
                {event?.description && (
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    {event.description}
                  </p>
                )}
              </section>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-4 p-4 bg-card border rounded-2xl">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Date</p>
                    <p className="font-bold">{event?.date || '---'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-card border rounded-2xl">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Time</p>
                    <p className="font-bold">{event?.time || '---'}</p>
                  </div>
                </div>

                {gate && (
                  <div className="flex items-center gap-4 p-4 bg-card border rounded-2xl">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Assigned Gate</p>
                      <p className="font-bold">{gate}</p>
                    </div>
                  </div>
                )}

                {event?.capacity && (
                  <div className="flex items-center gap-4 p-4 bg-card border rounded-2xl">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                      <Users size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Capacity</p>
                      <p className="font-bold">{event.capacity.toLocaleString()} tickets</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Action Bar */}
      {isAuthenticated && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-10 space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <MapPin size={20} />
            </div>
            <input
              type="text"
              placeholder="Enter gate name (optional)"
              value={gateInput}
              onChange={(e) => setGateInput(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-card border-2 rounded-2xl focus:border-primary outline-none transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => {
              if (gateInput !== gate) {
                setGate(gateInput);
              }
              navigate('/scanner');
            }}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl text-xl font-black shadow-2xl shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98] uppercase tracking-widest"
          >
            Open Scanner
          </button>
        </div>
      )}

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-card border-r z-50 transform transition-transform duration-200 ease-in-out",
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b h-14 flex items-center">
           <h2 className="font-bold text-lg">Settings</h2>
        </div>
        <div className="p-2 flex flex-col gap-1">
          <button
            onClick={() => {
              logout();
              setIsMenuOpen(false);
            }}
            className="flex items-center gap-3 px-3 py-3 text-destructive hover:bg-destructive/10 rounded-lg transition-colors w-full text-left"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout Scanner</span>
          </button>
          <button
            onClick={() => {
              forgetServer();
              setIsMenuOpen(false);
              navigate('/setup');
            }}
            className="flex items-center gap-3 px-3 py-3 text-destructive hover:bg-destructive/10 rounded-lg transition-colors w-full text-left"
          >
            <Trash2 size={20} />
            <span className="font-medium">Forget Server</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
