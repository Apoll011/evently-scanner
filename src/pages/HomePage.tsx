import { useState } from 'react';
import { useScanner } from '../contexts/ScannerContext';
import { useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Trash2, Power } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function HomePage() {
  const { logout, forgetServer, isAuthenticated, event } = useScanner();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Toolbar */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-card h-14">
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
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {!isAuthenticated ? (
          <>
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
          </>
        ) : (
          <div className="w-full max-w-md space-y-6">
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Scanner Ready</h2>
              <div className="space-y-2 text-left">
                 <p className="text-sm text-muted-foreground">Active Event</p>
                 <p className="font-semibold">{event?.name || 'Loading...'}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/scanner')}
              className="w-full py-6 bg-primary text-primary-foreground rounded-xl text-2xl font-black shadow-xl hover:opacity-90 transition-opacity uppercase tracking-wider"
            >
              Go to Scanner
            </button>
          </div>
        )}
      </main>

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
