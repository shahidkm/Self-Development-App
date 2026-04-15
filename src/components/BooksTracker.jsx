import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, X, Check, Star, TrendingUp, Pencil, StickyNote } from 'lucide-react';
import Navbar from './NavBar';

const supabase = createClient(
  'https://quufeiwzsgiuwkeyjjns.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWZlaXd6c2dpdXdrZXlqam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ5OTYsImV4cCI6MjA4MzQ2MDk5Nn0.KL0XNEg4o4RVMJOfAQdWQekug_sw2I0KNTLkj_73_sg'
);

const GLASS = { background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };
const STATUS = [
  { key: 'reading',   label: 'Reading',   color: '#22d3ee' },
    { key: 'learning',   label: 'Learning',   color: '#22d3ee' },
  { key: 'completed', label: 'Completed', color: '#4ade80' },
  { key: 'paused',    label: 'Paused',    color: '#fb923c' },
  { key: 'wishlist',  label: 'Wishlist',  color: '#818cf8' },
];

export default function BooksTracker() {
  const [books, setBooks]   = useState([]);
  const [form, setForm]     = useState({ title: '', author: '', total_pages: '', status: 'reading', rating: 0, notes: '' });
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('books_tracker').select('*').order('created_at', { ascending: false });
    setBooks(data || []);
  };

  const saveNote = async (id) => {
    await supabase.from('books_tracker').update({ notes: noteText[id] ?? '' }).eq('id', id);
    await load();
  };

  const save = async () => {
    if (!form.title.trim()) return;
    const payload = { ...form, total_pages: parseInt(form.total_pages) || null, current_page: form.current_page ? parseInt(form.current_page) : 0 };
    if (editing) {
      await supabase.from('books_tracker').update(payload).eq('id', editing);
      setEditing(null);
    } else {
      await supabase.from('books_tracker').insert({ ...payload, current_page: 0 });
    }
    setForm({ title: '', author: '', total_pages: '', status: 'reading', rating: 0, notes: '' });
    setAdding(false);
    await load();
  };

  const startEdit = (book) => {
    setForm({ title: book.title, author: book.author || '', total_pages: book.total_pages || '', status: book.status, rating: book.rating || 0, notes: book.notes || '' });
    setEditing(book.id);
    setAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateProgress = async (id, current_page, total_pages) => {
    const status = current_page >= total_pages ? 'completed' : 'reading';
    await supabase.from('books_tracker').update({ current_page, status }).eq('id', id);
    await load();
  };

  const deleteBook = async (id) => {
    await supabase.from('books_tracker').delete().eq('id', id);
    await load();
  };

  const filtered = filter === 'all' ? books : books.filter(b => b.status === filter);
  const stats = { total: books.length, completed: books.filter(b => b.status === 'completed').length, reading: books.filter(b => b.status === 'reading').length };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-emerald-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-teal-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 border border-emerald-500/30" style={{ ...GLASS, boxShadow: '0 0 24px rgba(74,222,128,0.2)' }}>
            <BookOpen size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-200 to-emerald-500 mb-2">BOOKS & COURSES</h1>
          <p className="text-emerald-400/50 font-mono text-xs tracking-[0.3em] uppercase">Read · Learn · Grow</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, color: '#22d3ee' },
            { label: 'Completed', value: stats.completed, color: '#4ade80' },
            { label: 'Reading', value: stats.reading, color: '#818cf8' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 text-center" style={GLASS}>
              <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter + Add */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[{ key: 'all', label: 'All' }, ...STATUS].map(s => (
            <button key={s.key} onClick={() => setFilter(s.key)}
              className="px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all"
              style={filter === s.key
                ? { background: (s.color || '#22d3ee') + '20', border: `1px solid ${s.color || '#22d3ee'}50`, color: s.color || '#22d3ee' }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#475569' }}>
              {s.label}
            </button>
          ))}
          <button onClick={() => setAdding(true)} className="ml-auto px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5"
            style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
            <Plus size={14} /> Add
          </button>
        </div>

        {/* Add Form */}
        <AnimatePresence>
          {adding && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="rounded-3xl p-6 mb-6 overflow-hidden" style={GLASS}>
              <h3 className="text-xs font-bold font-mono uppercase tracking-widest mb-4" style={{ color: '#4ade80' }}>
                {editing ? 'Edit Book / Course' : 'Add New Book / Course'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title *"
                  className="px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Author / Creator"
                  className="px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <input value={form.total_pages} onChange={e => setForm(f => ({ ...f, total_pages: e.target.value }))} placeholder="Total pages / lessons"
                  type="number" className="px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="px-4 py-3 rounded-xl text-sm text-slate-200 focus:outline-none"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {STATUS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)"
                rows={3} className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none mb-3"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <div className="flex gap-2">
                <button onClick={save} className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80' }}>
                  {editing ? 'Update' : 'Save'}
                </button>
                <button onClick={() => { setAdding(false); setEditing(null); setForm({ title: '', author: '', total_pages: '', status: 'reading', rating: 0, notes: '' }); }} className="px-5 py-3 rounded-xl text-slate-500"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}><X size={16} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Books Grid */}
        <div className="space-y-3">
          {filtered.map((book, i) => {
            const st = STATUS.find(s => s.key === book.status);
            const pct = book.total_pages ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100)) : 0;
            return (
              <motion.div key={book.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl p-5" style={{ ...GLASS, borderColor: st?.color + '20' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider"
                        style={{ background: st?.color + '15', border: `1px solid ${st?.color}30`, color: st?.color }}>{st?.label}</span>
                    </div>
                    <h3 className="font-bold text-slate-200">{book.title}</h3>
                    {book.author && <p className="text-xs text-slate-500 mt-0.5">{book.author}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {book.rating > 0 && (
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(v => <Star key={v} size={12} fill={v <= book.rating ? '#f59e0b' : 'transparent'} className={v <= book.rating ? 'text-amber-400' : 'text-slate-700'} />)}
                      </div>
                    )}
                    <button onClick={() => { setNoteModal(book); setNoteText(n => ({ ...n, [book.id]: book.notes || '' })); }}
                      className="text-slate-600 hover:text-yellow-400 transition-all"><StickyNote size={14} /></button>
                    <button onClick={() => startEdit(book)} className="text-slate-600 hover:text-cyan-400 transition-all"><Pencil size={14} /></button>
                    <button onClick={() => deleteBook(book.id)} className="text-slate-600 hover:text-rose-400 transition-all"><X size={14} /></button>
                  </div>
                </div>

                {book.total_pages > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Progress</span>
                      <span style={{ color: st?.color }}>{book.current_page} / {book.total_pages} · {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: st?.color, boxShadow: `0 0 6px ${st?.color}60` }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} max={book.total_pages} defaultValue={book.current_page}
                        onBlur={e => updateProgress(book.id, parseInt(e.target.value) || 0, book.total_pages)}
                        className="w-20 px-2 py-1 rounded-lg text-xs text-slate-300 focus:outline-none"
                        style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      <span className="text-[10px] text-slate-600 font-mono">current page</span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 rounded-3xl" style={GLASS}>
              <BookOpen className="text-slate-700 mx-auto mb-3" size={36} />
              <p className="text-slate-500 font-mono text-sm">No books here yet</p>
            </div>
          )}
        </div>
      </div>
      {/* Notes Modal */}
      <AnimatePresence>
        {noteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={() => setNoteModal(null)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md rounded-3xl p-6" style={GLASS}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-yellow-400 mb-0.5">Notes</p>
                  <h3 className="font-bold text-slate-200">{noteModal.title}</h3>
                </div>
                <button onClick={() => setNoteModal(null)} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
              </div>
              <textarea rows={6} value={noteText[noteModal.id] ?? ''}
                onChange={e => setNoteText(n => ({ ...n, [noteModal.id]: e.target.value }))}
                placeholder="Write your notes here..."
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none mb-4"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <button onClick={async () => { await saveNote(noteModal.id); setNoteModal(null); }}
                className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider"
                style={{ background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80' }}>
                Save Note
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
