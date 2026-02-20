import React, { useState, useEffect, useMemo } from 'react';
import { 
  Inbox, 
  Send, 
  File, 
  Trash2, 
  Star, 
  Search, 
  Plus, 
  Menu, 
  X, 
  MoreVertical, 
  Archive, 
  Clock, 
  AlertCircle,
  ChevronLeft,
  User,
  LogOut,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Email {
  id: number;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  folder: 'inbox' | 'sent' | 'drafts' | 'bin';
  is_important: number;
  is_read: number;
}

interface User {
  email: string;
}

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick, 
  count 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void,
  count?: number 
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-r-full transition-all duration-200 group ${
      active 
        ? 'bg-indigo-50 text-indigo-700 font-semibold' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon size={20} className={active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
      <span className="text-sm">{label}</span>
    </div>
    {count !== undefined && count > 0 && (
      <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-indigo-100' : 'bg-slate-100'}`}>
        {count}
      </span>
    )}
  </button>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState('user@example.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [emails, setEmails] = useState<Email[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- API Calls ---

  const fetchEmails = async () => {
    try {
      const res = await fetch(`/api/emails?folder=${currentFolder}&search=${searchQuery}`);
      const data = await res.json();
      setEmails(data);
    } catch (err) {
      console.error("Failed to fetch emails", err);
    }
  };

  useEffect(() => {
    if (user) fetchEmails();
  }, [user, currentFolder, searchQuery]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: composeTo, subject: composeSubject, body: composeBody })
      });
      setIsComposeOpen(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      fetchEmails();
    } catch (err) {
      alert("Failed to send email");
    }
  };

  const toggleImportant = async (email: Email) => {
    try {
      await fetch(`/api/emails/${email.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_important: !email.is_important })
      });
      fetchEmails();
    } catch (err) {
      console.error(err);
    }
  };

  const moveToBin = async (email: Email) => {
    try {
      await fetch(`/api/emails/${email.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'bin' })
      });
      setSelectedEmail(null);
      fetchEmails();
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (email: Email) => {
    if (email.is_read) return;
    try {
      await fetch(`/api/emails/${email.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: 1 })
      });
      fetchEmails();
    } catch (err) {
      console.error(err);
    }
  };

  // --- Render Helpers ---

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-200">
              <Inbox size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Personal Mail</h1>
            <p className="text-slate-500 text-sm">Sign in to your private inbox</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Password</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">Demo credentials: user@example.com / password123</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="border-r border-slate-100 flex flex-col bg-white z-20"
      >
        <div className="p-4 flex items-center gap-3 mb-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
          >
            <Menu size={20} />
          </button>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight text-indigo-600">Mail</span>}
        </div>

        <div className="px-3 mb-6">
          <button 
            onClick={() => setIsComposeOpen(true)}
            className={`flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3 shadow-lg shadow-indigo-100 transition-all ${isSidebarOpen ? 'w-full px-6' : 'w-12 h-12'}`}
          >
            <Plus size={20} />
            {isSidebarOpen && <span className="font-semibold">Compose</span>}
          </button>
        </div>

        <nav className="flex-1 space-y-1 pr-3">
          <SidebarItem 
            icon={Inbox} 
            label={isSidebarOpen ? "Inbox" : ""} 
            active={currentFolder === 'inbox'} 
            onClick={() => { setCurrentFolder('inbox'); setSelectedEmail(null); }}
            count={emails.filter(e => !e.is_read && e.folder === 'inbox').length}
          />
          <SidebarItem 
            icon={Star} 
            label={isSidebarOpen ? "Important" : ""} 
            active={currentFolder === 'important'} 
            onClick={() => { setCurrentFolder('important'); setSelectedEmail(null); }} 
          />
          <SidebarItem 
            icon={Send} 
            label={isSidebarOpen ? "Sent" : ""} 
            active={currentFolder === 'sent'} 
            onClick={() => { setCurrentFolder('sent'); setSelectedEmail(null); }} 
          />
          <SidebarItem 
            icon={File} 
            label={isSidebarOpen ? "Drafts" : ""} 
            active={currentFolder === 'drafts'} 
            onClick={() => { setCurrentFolder('drafts'); setSelectedEmail(null); }} 
          />
          <SidebarItem 
            icon={Trash2} 
            label={isSidebarOpen ? "Bin" : ""} 
            active={currentFolder === 'bin'} 
            onClick={() => { setCurrentFolder('bin'); setSelectedEmail(null); }} 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
              <User size={16} />
            </div>
            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <button 
                  onClick={() => setUser(null)}
                  className="text-[10px] text-slate-400 uppercase font-bold tracking-widest hover:text-red-500 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header / Search */}
        <header className="h-16 border-b border-slate-100 flex items-center px-6 gap-4">
          <div className="flex-1 max-w-2xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-transparent border focus:border-indigo-100 focus:bg-white focus:ring-4 focus:ring-indigo-50/50 rounded-xl py-2.5 pl-12 pr-4 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <Filter size={18} />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <AlertCircle size={18} />
            </button>
          </div>
        </header>

        {/* List and Detail Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email List */}
          <div className={`flex-1 flex flex-col min-w-0 border-r border-slate-100 ${selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
            <div className="flex-1 overflow-y-auto">
              {emails.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Inbox size={32} />
                  </div>
                  <p className="font-medium">No emails found</p>
                  <p className="text-sm">Try a different folder or search query</p>
                </div>
              ) : (
                emails.map((email) => (
                  <div 
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email);
                      markAsRead(email);
                    }}
                    className={`group flex items-start gap-4 px-6 py-4 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 hover:shadow-sm relative ${
                      !email.is_read ? 'bg-white' : 'bg-slate-50/30'
                    } ${selectedEmail?.id === email.id ? 'bg-indigo-50/50 border-l-4 border-l-indigo-500' : ''}`}
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleImportant(email);
                      }}
                      className={`mt-1 transition-colors ${email.is_important ? 'text-amber-400' : 'text-slate-300 hover:text-slate-400'}`}
                    >
                      <Star size={18} fill={email.is_important ? 'currentColor' : 'none'} />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm truncate ${!email.is_read ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                          {email.sender === user.email ? `To: ${email.recipient}` : email.sender}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                          {new Date(email.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h3 className={`text-sm truncate mb-1 ${!email.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                        {email.subject}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {email.body}
                      </p>
                    </div>

                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-slate-100">
                      <button 
                        onClick={(e) => { e.stopPropagation(); moveToBin(email); }}
                        className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-slate-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400 transition-colors">
                        <Archive size={14} />
                      </button>
                      <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400 transition-colors">
                        <Clock size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Email Detail */}
          <AnimatePresence mode="wait">
            {selectedEmail ? (
              <motion.div 
                key={selectedEmail.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col bg-white overflow-hidden"
              >
                <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedEmail(null)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 lg:hidden"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={() => moveToBin(selectedEmail)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                      <Archive size={18} />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                      <AlertCircle size={18} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                  <div className="max-w-3xl mx-auto">
                    <h1 className="text-2xl font-bold text-slate-900 mb-8 leading-tight">
                      {selectedEmail.subject}
                    </h1>

                    <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                          {selectedEmail.sender[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{selectedEmail.sender}</span>
                            <span className="text-xs text-slate-400 font-medium">
                              &lt;{selectedEmail.sender}&gt;
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            to {selectedEmail.recipient === user.email ? 'me' : selectedEmail.recipient}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                          {new Date(selectedEmail.timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(selectedEmail.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-[15px]">
                      {selectedEmail.body}
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-50 flex gap-4">
                      <button className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                        Reply
                      </button>
                      <button className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                        Forward
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-slate-300 p-8 text-center bg-slate-50/30">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 border border-slate-100">
                  <Inbox size={48} className="text-slate-200" />
                </div>
                <h2 className="text-xl font-bold text-slate-400 mb-2">Select an email to read</h2>
                <p className="text-sm max-w-xs">Choose a conversation from the list on the left to view its full content here.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Compose Modal */}
      <AnimatePresence>
        {isComposeOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 right-8 w-full max-w-lg bg-white rounded-t-2xl shadow-2xl z-50 border border-slate-200 overflow-hidden"
          >
            <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
              <span className="text-sm font-bold">New Message</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsComposeOpen(false)} className="p-1 hover:bg-white/10 rounded transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
            <form onSubmit={handleSend} className="p-6 space-y-4">
              <div className="relative border-b border-slate-100 pb-2">
                <input 
                  type="email" 
                  placeholder="Recipients"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full text-sm outline-none py-1"
                  required
                />
              </div>
              <div className="relative border-b border-slate-100 pb-2">
                <input 
                  type="text" 
                  placeholder="Subject"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full text-sm outline-none py-1 font-semibold"
                  required
                />
              </div>
              <textarea 
                placeholder="Write your message..."
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                className="w-full h-64 text-sm outline-none resize-none py-2"
                required
              />
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-100">
                    Send
                  </button>
                  <button type="button" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <MoreVertical size={18} />
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
