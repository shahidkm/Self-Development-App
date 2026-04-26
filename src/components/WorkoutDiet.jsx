import React, { useState, useEffect } from 'react';
import { Dumbbell, Sun, Coffee, Utensils, Apple, Moon, Droplets, BedDouble,
  TrendingUp, ChevronDown, ChevronUp, Check, LayoutList, Clock, Scale, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from './NavBar';
import { supabase } from '../supabase';

const GLASS = {
  background: 'rgba(15,23,42,0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.06)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

const TODAY = new Date().toISOString().split('T')[0];

// hour range when each meal is "current"
const MEAL_HOURS = {
  'Pre-Workout':           [5, 8],
  'Post-Workout Breakfast':[8, 11],
  'Mid-Morning':           [10, 12],
  'Lunch':                 [12, 15],
  'Evening Snack':         [16, 18],
  'Dinner':                [19, 21],
  'Before Bed':            [21, 24],
};

const MEALS_ALL = [
  {
    time: 'Pre-Workout',
    subtitle: '20–30 mins before',
    icon: Sun,
    color: '#facc15',
    items: ['1 banana', 'Black coffee (optional)'],
    tip: 'Quick energy without heaviness',
    workoutOnly: true,
  },
  {
    time: 'Post-Workout Breakfast',
    subtitle: 'Most important meal',
    icon: Dumbbell,
    color: '#4ade80',
    items: ['4 whole eggs (or 3 whole + 2 whites)', '2–3 chapati  OR  3 idli / 1 dosa', '1 fruit (banana or apple)'],
    tip: 'This meal drives muscle growth',
    workoutOnly: true,
  },
  {
    time: 'Mid-Morning',
    subtitle: '~10–11 AM',
    icon: Coffee,
    color: '#fb923c',
    items: ['Handful of peanuts / almonds', 'Buttermilk or coconut water'],
    tip: 'Light fuel to stay sharp',
    workoutOnly: false,
  },
  {
    time: 'Lunch',
    subtitle: 'Big balanced meal',
    icon: Utensils,
    color: '#22d3ee',
    items: ['Rice (normal portion)', 'Chicken / fish (150–200g)  OR  paneer / dal', 'Vegetables', 'Curd'],
    tip: 'Biggest meal of the day',
    workoutOnly: false,
  },
  {
    time: 'Evening Snack',
    subtitle: '~4–5 PM',
    icon: Apple,
    color: '#e879f9',
    items: ['2 boiled eggs', 'OR  Peanut butter sandwich', 'OR  Boiled chana'],
    tip: 'Pick one — keep it protein-rich',
    workoutOnly: false,
  },
  {
    time: 'Dinner',
    subtitle: 'Clean + protein-focused',
    icon: Moon,
    color: '#818cf8',
    items: ['2 chapati', 'Chicken / fish / paneer / dal', 'Vegetables'],
    tip: 'Keep lighter than lunch',
    workoutOnly: false,
  },
  {
    time: 'Before Bed',
    subtitle: 'Recovery fuel',
    icon: BedDouble,
    color: '#f472b6',
    items: ['1 glass of milk'],
    tip: 'Slow protein for overnight recovery',
    workoutOnly: false,
  },
];

const RULES = [
  { icon: TrendingUp, color: '#4ade80', label: 'Protein Target', value: '1.6–2g per kg body weight' },
  { icon: Droplets,   color: '#22d3ee', label: 'Water Daily',    value: '3 litres minimum' },
  { icon: BedDouble,  color: '#818cf8', label: 'Sleep',          value: '7–8 hours every night' },
  { icon: TrendingUp, color: '#facc15', label: 'Weight Gain',    value: '0.25–0.5 kg per week' },
];

const TIMELINE_TIMES = [
  { time: 'Pre-Workout',           label: '6:00 AM' },
  { time: 'Post-Workout Breakfast',label: '8:00 AM' },
  { time: 'Mid-Morning',           label: '10:30 AM' },
  { time: 'Lunch',                 label: '1:00 PM' },
  { time: 'Evening Snack',         label: '4:30 PM' },
  { time: 'Dinner',                label: '8:00 PM' },
  { time: 'Before Bed',            label: '10:00 PM' },
];

function getCurrentMeal() {
  const h = new Date().getHours();
  for (const [name, [start, end]] of Object.entries(MEAL_HOURS)) {
    if (h >= start && h < end) return name;
  }
  return null;
}

// ── Meal Card ──────────────────────────────────────────────────────────────
function MealCard({ meal, checked, onCheck, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const { icon: Icon, color, time, subtitle, items, tip } = meal;

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ ...GLASS, borderColor: checked ? color + '50' : color + '20',
        boxShadow: checked ? `0 0 18px ${color}18` : GLASS.boxShadow }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left"
        style={{ background: 'transparent' }}>
        {/* check circle */}
        <button onClick={e => { e.stopPropagation(); onCheck(time); }}
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
          style={{ background: checked ? color + '25' : 'rgba(255,255,255,0.04)',
            border: `2px solid ${checked ? color : 'rgba(255,255,255,0.1)'}`,
            boxShadow: checked ? `0 0 10px ${color}40` : 'none' }}>
          {checked && <Check size={13} style={{ color }} />}
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: color + '18', border: `1px solid ${color}35` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm leading-tight ${checked ? 'line-through opacity-50' : 'text-slate-200'}`}>{time}</p>
          <p className="text-[11px] font-mono text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        {open ? <ChevronUp size={15} className="text-slate-600 flex-shrink-0" />
               : <ChevronDown size={15} className="text-slate-600 flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="h-px mb-3" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
          <ul className="space-y-2 mb-3">
            {items.map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-[11px] font-mono px-3 py-2 rounded-lg"
            style={{ background: color + '10', color, border: `1px solid ${color}25` }}>
            👉 {tip}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Timeline View ──────────────────────────────────────────────────────────
function TimelineView({ meals, checked, onCheck }) {
  const currentMeal = getCurrentMeal();
  return (
    <div className="relative pl-8">
      {/* vertical line */}
      <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
      <div className="space-y-4">
        {meals.map((meal) => {
          const tl = TIMELINE_TIMES.find(t => t.time === meal.time);
          const isCurrent = meal.time === currentMeal;
          const isChecked = checked[meal.time];
          return (
            <div key={meal.time} className="relative flex items-start gap-4">
              {/* dot */}
              <div className="absolute -left-5 mt-1 w-3 h-3 rounded-full flex-shrink-0 transition-all"
                style={{ background: isChecked ? meal.color : isCurrent ? meal.color : '#1e293b',
                  border: `2px solid ${isCurrent || isChecked ? meal.color : '#334155'}`,
                  boxShadow: isCurrent ? `0 0 10px ${meal.color}` : 'none' }} />
              <div className="flex-1 rounded-2xl p-4 transition-all"
                style={{ ...GLASS, borderColor: isCurrent ? meal.color + '40' : meal.color + '15',
                  background: isCurrent ? meal.color + '08' : GLASS.background }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500">{tl?.label}</span>
                    {isCurrent && <span className="ml-2 text-[9px] font-mono px-2 py-0.5 rounded-full"
                      style={{ background: meal.color + '20', color: meal.color }}>NOW</span>}
                    <p className={`font-bold text-sm mt-0.5 ${isChecked ? 'line-through opacity-40' : 'text-slate-200'}`}>{meal.time}</p>
                  </div>
                  <button onClick={() => onCheck(meal.time)}
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: isChecked ? meal.color + '25' : 'rgba(255,255,255,0.04)',
                      border: `2px solid ${isChecked ? meal.color : 'rgba(255,255,255,0.1)'}` }}>
                    {isChecked && <Check size={13} style={{ color: meal.color }} />}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {meal.items.map(item => (
                    <span key={item} className="text-[11px] px-2 py-0.5 rounded-lg text-slate-400"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Weight Tracker ─────────────────────────────────────────────────────────
function WeightTracker({ bodyWeight }) {
  const [logs, setLogs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .order('date', { ascending: true })
      .limit(30);
    setLogs(data || []);
  };

  const logWeight = async () => {
    const val = parseFloat(input);
    if (!val || val < 20 || val > 300) return;
    setLoading(true);
    const existing = logs.find(l => l.date === TODAY);
    if (existing) {
      await supabase.from('weight_logs').update({ weight: val }).eq('id', existing.id);
    } else {
      await supabase.from('weight_logs').insert({ date: TODAY, weight: val });
    }
    setInput('');
    await loadLogs();
    setLoading(false);
  };

  const latest = logs[logs.length - 1]?.weight;
  const first  = logs[0]?.weight;
  const gained = latest && first ? (latest - first).toFixed(1) : null;
  const chartData = logs.map(l => ({ date: l.date.slice(5), kg: l.weight }));

  return (
    <div className="rounded-2xl p-5" style={GLASS}>
      <div className="flex items-center gap-2 mb-4">
        <Scale size={16} className="text-cyan-400" />
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-slate-400">Body Weight Tracker</p>
      </div>

      {/* stats row */}
      {latest && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Current', value: `${latest} kg`, color: '#22d3ee' },
            { label: 'Total Gained', value: gained !== null ? `${gained > 0 ? '+' : ''}${gained} kg` : '—', color: gained > 0 ? '#4ade80' : '#f87171' },
            { label: 'Goal/week', value: '+0.25–0.5 kg', color: '#facc15' },
          ].map(s => (
            <div key={s.label} className="text-center p-2 rounded-xl"
              style={{ background: s.color + '08', border: `1px solid ${s.color}20` }}>
              <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] font-mono text-slate-600 uppercase mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* chart */}
      {chartData.length > 1 && (
        <div className="mb-4 h-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#22d3ee' }} />
              <Line type="monotone" dataKey="kg" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* input */}
      <div className="flex gap-2">
        <input
          type="number" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && logWeight()}
          placeholder={`Today's weight (kg)`}
          className="flex-1 px-3 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
          style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <button onClick={logWeight} disabled={loading}
          className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all"
          style={{ background: '#22d3ee18', border: '1px solid #22d3ee40', color: '#22d3ee' }}>
          <Plus size={14} /> Log
        </button>
      </div>

      {/* protein target based on body weight */}
      {bodyWeight > 0 && (
        <p className="text-[11px] font-mono mt-3 text-center"
          style={{ color: '#4ade80' }}>
          💪 Your protein target: {Math.round(bodyWeight * 1.6)}–{Math.round(bodyWeight * 2)}g / day
        </p>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function WorkoutDiet() {
  const [isWorkoutDay, setIsWorkoutDay] = useState(true);
  const [view, setView] = useState('cards'); // 'cards' | 'timeline'
  const [bodyWeight, setBodyWeight] = useState(() => parseFloat(localStorage.getItem('wd_bodyweight') || '0'));
  const [checked, setChecked] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('wd_checked') || '{}');
      return saved.date === TODAY ? saved.meals : {};
    } catch { return {}; }
  });

  const currentMeal = getCurrentMeal();

  const meals = isWorkoutDay ? MEALS_ALL : MEALS_ALL.filter(m => !m.workoutOnly);

  const completedCount = Object.values(checked).filter(Boolean).length;
  const totalCount = meals.length;

  const handleCheck = (mealTime) => {
    const next = { ...checked, [mealTime]: !checked[mealTime] };
    setChecked(next);
    localStorage.setItem('wd_checked', JSON.stringify({ date: TODAY, meals: next }));
  };

  const handleBodyWeight = (val) => {
    setBodyWeight(val);
    localStorage.setItem('wd_bodyweight', val);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-green-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-cyan-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-3 sm:px-4 py-8">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4"
            style={{ ...GLASS, boxShadow: '0 0 24px rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.3)' }}>
            <Dumbbell size={32} className="text-green-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-green-200 to-cyan-400 mb-2">
            WORKOUT DIET PLAN
          </h1>
          <p className="text-green-400/50 font-mono text-xs tracking-[0.3em] uppercase">Lean Bulk · Clean Fuel · Real Gains</p>
        </div>

        {/* Protein Calculator */}
        <div className="rounded-2xl p-4 mb-4" style={GLASS}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} className="text-green-400" />
            <p className="font-mono text-xs tracking-[0.2em] uppercase text-slate-400">Protein Calculator</p>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="number" value={bodyWeight || ''} onChange={e => handleBodyWeight(parseFloat(e.target.value) || 0)}
              placeholder="Your body weight (kg)"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            {bodyWeight > 0 && (
              <div className="px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap"
                style={{ background: '#4ade8018', border: '1px solid #4ade8040', color: '#4ade80' }}>
                {Math.round(bodyWeight * 1.6)}–{Math.round(bodyWeight * 2)}g protein
              </div>
            )}
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {/* Workout / Rest toggle */}
          <div className="flex rounded-xl overflow-hidden flex-1" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {[{ label: '💪 Workout Day', val: true }, { label: '😴 Rest Day', val: false }].map(opt => (
              <button key={String(opt.val)} onClick={() => setIsWorkoutDay(opt.val)}
                className="flex-1 py-2 text-xs font-bold font-mono tracking-wider transition-all"
                style={{
                  background: isWorkoutDay === opt.val ? (opt.val ? '#4ade8020' : '#818cf820') : 'transparent',
                  color: isWorkoutDay === opt.val ? (opt.val ? '#4ade80' : '#818cf8') : '#475569',
                  borderRight: opt.val ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {[{ icon: LayoutList, val: 'cards' }, { icon: Clock, val: 'timeline' }].map(opt => (
              <button key={opt.val} onClick={() => setView(opt.val)}
                className="p-2.5 transition-all"
                style={{
                  background: view === opt.val ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: view === opt.val ? '#e2e8f0' : '#475569',
                  borderRight: opt.val === 'cards' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                <opt.icon size={15} />
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="rounded-2xl p-4 mb-5" style={GLASS}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Today's Meals</p>
            <p className="text-xs font-bold" style={{ color: completedCount === totalCount ? '#4ade80' : '#22d3ee' }}>
              {completedCount} / {totalCount} done
            </p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%`,
                background: completedCount === totalCount
                  ? 'linear-gradient(90deg,#4ade80,#22d3ee)'
                  : 'linear-gradient(90deg,#22d3ee,#818cf8)' }} />
          </div>
          {completedCount === totalCount && totalCount > 0 && (
            <p className="text-[11px] font-mono text-green-400 text-center mt-2">🎉 All meals done! Great discipline.</p>
          )}
        </div>

        {/* Meal list */}
        {view === 'cards' ? (
          <div className="space-y-3 mb-6">
            {meals.map(meal => (
              <MealCard key={meal.time} meal={meal} checked={!!checked[meal.time]}
                onCheck={handleCheck}
                defaultOpen={meal.time === currentMeal} />
            ))}
          </div>
        ) : (
          <div className="mb-6">
            <TimelineView meals={meals} checked={checked} onCheck={handleCheck} />
          </div>
        )}

        {/* Weight Tracker */}
        <div className="mb-6">
          <WeightTracker bodyWeight={bodyWeight} />
        </div>

        {/* Key Rules */}
        <div className="rounded-2xl p-5" style={GLASS}>
          <p className="font-mono text-xs tracking-[0.25em] uppercase text-slate-500 mb-4">💡 Key Rules for Lean Bulk</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RULES.map(({ icon: Icon, color, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: color + '08', border: `1px solid ${color}20` }}>
                <Icon size={16} style={{ color, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="text-xs font-bold" style={{ color }}>{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-600 font-mono mt-4 text-center">
            ❌ No junk · No fried foods · No excess sugar
          </p>
        </div>

      </div>
    </div>
  );
}
