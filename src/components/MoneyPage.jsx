import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { PieChart as PieChartIcon, BarChart3, TrendingUp, TrendingDown, IndianRupee, Search, Filter, Plus, PlusCircle, CheckCircle2, Edit2, Trash2, X, ShoppingCart, Check, ImageIcon } from "lucide-react";
import Navbar from "./NavBar";
import Chart from "react-apexcharts";
import { motion, AnimatePresence } from "framer-motion";

const supabaseUrl = "https://quufeiwzsgiuwkeyjjns.supabase.co";
const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWZlaXd6c2dpdXdrZXlqam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ5OTYsImV4cCI6MjA4MzQ2MDk5Nn0.KL0XNEg4o4RVMJOfAQdWQekug_sw2I0KNTLkj_73_sg";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function MoneyPage() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [activeTab, setActiveTab] = useState("transactions");
    const [shoppingPlans, setShoppingPlans] = useState([]);
    const [completedPlans, setCompletedPlans] = useState([]);
    const [shopForm, setShopForm] = useState({ name: "", amount: "", image_url: "" });
    const [shopLoading, setShopLoading] = useState(false);
    const [editingShopId, setEditingShopId] = useState(null);
    const [editShopForm, setEditShopForm] = useState({ name: "", amount: "", image_url: "" });
    const [showCompleted, setShowCompleted] = useState(false);
    const [categories, setCategories] = useState([]);
    const [newCategoryInput, setNewCategoryInput] = useState("");
    const [showNewCategory, setShowNewCategory] = useState(false);

    const [balanceDetails, setBalanceDetails] = useState({
        totalBalance: 0,
        totalIncome: 0,
        totalExpense: 0
    });

    const NEON_COLORS = [
        '#00e5ff', // cyan
        '#7c4dff', // purple
        '#ff3366', // rose
        '#00e676', // emerald
        '#ffea00', // yellow
        '#ff9100', // orange
        '#00b0ff'  // light blue
    ];

    const [expenseData, setExpenseData] = useState({ series: [], options: {} });
    const [incomeData, setIncomeData] = useState({ series: [], options: {} });

    const [form, setForm] = useState({
        title: "",
        amount: "",
        type: "expense",
        category: "",
        date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchTransactions();
        fetchShoppingPlans();
        fetchCategories();
    }, []);

    async function fetchCategories() {
        const { data } = await supabase.from("categories").select("name").order("name");
        setCategories((data || []).map(c => c.name));
    }

    async function addCategory(name) {
        const trimmed = name.trim();
        if (!trimmed) return;
        await supabase.from("categories").upsert({ name: trimmed }, { onConflict: "name" });
        await fetchCategories();
        setForm(f => ({ ...f, category: trimmed }));
        setNewCategoryInput("");
        setShowNewCategory(false);
    }

    async function fetchShoppingPlans() {
        const [{ data: active }, { data: done }] = await Promise.all([
            supabase.from("shopping_plans").select("*").eq("completed", false).order("created_at", { ascending: false }),
            supabase.from("shopping_plans").select("*").eq("completed", true).order("created_at", { ascending: false }).limit(50),
        ]);
        setShoppingPlans(active || []);
        setCompletedPlans(done || []);
    }

    async function addShoppingItem(e) {
        e.preventDefault();
        if (!shopForm.name.trim() || !shopForm.amount) return;
        setShopLoading(true);
        await supabase.from("shopping_plans").insert({
            name: shopForm.name.trim(),
            amount: Number(shopForm.amount),
            image_url: shopForm.image_url.trim() || null,
        });
        setShopForm({ name: "", amount: "", image_url: "" });
        await fetchShoppingPlans();
        setShopLoading(false);
    }

    async function saveEditShopItem(e) {
        e.preventDefault();
        if (!editShopForm.name.trim() || !editShopForm.amount) return;
        setShopLoading(true);
        await supabase.from("shopping_plans").update({
            name: editShopForm.name.trim(),
            amount: Number(editShopForm.amount),
            image_url: editShopForm.image_url.trim() || null,
        }).eq("id", editingShopId);
        setEditingShopId(null);
        await fetchShoppingPlans();
        setShopLoading(false);
    }

    async function completeShoppingItem(item) {
        setShopLoading(true);
        await supabase.from("shopping_plans").update({ completed: true }).eq("id", item.id);
        await supabase.from("money_transactions").insert({
            title: item.name,
            amount: item.amount,
            type: "expense",
            category: "Shopping",
            date: new Date().toISOString().split('T')[0],
        });
        await fetchShoppingPlans();
        await fetchTransactions();
        setShopLoading(false);
    }

    async function deleteShoppingItem(id) {
        setShopLoading(true);
        await supabase.from("shopping_plans").delete().eq("id", id);
        await fetchShoppingPlans();
        setShopLoading(false);
    }

    async function fetchTransactions() {
        setLoading(true);
        const { data, error } = await supabase
            .from("money_transactions")
            .select("*")
            .order("date", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error);
            setLoading(false);
            return;
        }

        setTransactions(data || []);

        // Calculate balances
        let income = 0;
        let expense = 0;
        const expMap = {};
        const incMap = {};

        (data || []).forEach(t => {
            const cat = t.category || 'General';
            if (t.type === 'income') {
                income += Number(t.amount);
                incMap[cat] = (incMap[cat] || 0) + Number(t.amount);
            } else if (t.type === 'expense') {
                expense += Number(t.amount);
                expMap[cat] = (expMap[cat] || 0) + Number(t.amount);
            }
        });

        setBalanceDetails({
            totalBalance: income - expense,
            totalIncome: income,
            totalExpense: expense
        });

        const sortedExp = Object.keys(expMap).map(k => ({ name: k, value: expMap[k] })).sort((a, b) => b.value - a.value);
        const sortedInc = Object.keys(incMap).map(k => ({ name: k, value: incMap[k] })).sort((a, b) => b.value - a.value);

        setExpenseData({
            series: sortedExp.map(d => d.value),
            options: {
                chart: { type: 'donut', background: 'transparent', foreColor: '#94a3b8' },
                labels: sortedExp.map(d => d.name),
                colors: NEON_COLORS,
                stroke: { show: false },
                dataLabels: { enabled: false },
                legend: {
                    position: 'bottom',
                    fontFamily: 'monospace',
                    labels: { colors: '#94a3b8' }
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '75%',
                            background: 'transparent',
                            labels: {
                                show: true,
                                name: { show: true, fontSize: '12px', fontFamily: 'monospace', color: '#64748b' },
                                value: {
                                    show: true,
                                    fontSize: '20px',
                                    fontFamily: 'monospace',
                                    fontWeight: 'bold',
                                    color: '#f1f5f9',
                                    formatter: (val) => `₹${Number(val).toLocaleString()}`
                                },
                                total: {
                                    show: true,
                                    label: 'EXPENSES',
                                    fontFamily: 'monospace',
                                    color: '#64748b',
                                    formatter: () => `₹${expense.toLocaleString()}`
                                }
                            }
                        }
                    }
                },
                tooltip: {
                    theme: 'dark',
                    y: { formatter: (val) => `₹${val.toLocaleString()}` }
                }
            }
        });

        setIncomeData({
            series: [{
                name: 'Volume',
                data: sortedInc.map(d => d.value)
            }],
            options: {
                chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
                plotOptions: {
                    bar: {
                        borderRadius: 6,
                        horizontal: true,
                        barHeight: '60%',
                        distributed: true
                    }
                },
                colors: NEON_COLORS.slice().reverse(),
                dataLabels: { enabled: false },
                xaxis: {
                    categories: sortedInc.map(d => d.name),
                    labels: {
                        style: { colors: '#94a3b8', fontFamily: 'monospace' },
                        formatter: (val) => `₹${val}`
                    },
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: {
                    labels: { style: { colors: '#f1f5f9', fontFamily: 'monospace' } }
                },
                grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
                tooltip: {
                    theme: 'dark',
                    y: { formatter: (val) => `₹${val.toLocaleString()}` }
                }
            }
        });

        setLoading(false);
    }

    async function createTransaction(e) {
        e.preventDefault();
        if (!form.title.trim() || !form.amount) return;

        setLoading(true);

        if (editingId) {
            const { error } = await supabase
                .from("money_transactions")
                .update({
                    title: form.title.trim(),
                    amount: Number(form.amount),
                    type: form.type,
                    category: form.category.trim() || null,
                    date: form.date || new Date().toISOString().split('T')[0],
                })
                .eq("id", editingId);

            if (error) {
                console.error(error);
                setLoading(false);
                return;
            }
        } else {
            const { error } = await supabase
                .from("money_transactions")
                .insert({
                    title: form.title.trim(),
                    amount: Number(form.amount),
                    type: form.type,
                    category: form.category.trim() || null,
                    date: form.date || new Date().toISOString().split('T')[0],
                });

            if (error) {
                console.error(error);
                setLoading(false);
                return;
            }
        }

        setForm({
            title: "",
            amount: "",
            type: "expense",
            category: "",
            date: new Date().toISOString().split('T')[0],
        });

        setFormOpen(false);
        setEditingId(null);
        await fetchTransactions();
    }

    async function deleteTransaction(id) {
        if (!window.confirm("Are you sure you want to scrub this record?")) return;

        setLoading(true);
        const { error } = await supabase
            .from("money_transactions")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(error);
        }
        await fetchTransactions();
    }

    function startEdit(t) {
        setForm({
            title: t.title,
            amount: t.amount,
            type: t.type,
            category: t.category || "",
            date: t.date,
        });
        setEditingId(t.id);
        setFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const getTypeStyle = (type) => {
        if (type === 'income') return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
        if (type === 'expense') return "bg-rose-500/10 text-rose-400 border-rose-500/30";
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    };

    const getTypeIcon = (type) => {
        if (type === 'income') return <TrendingUp size={20} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />;
        if (type === 'expense') return <TrendingDown size={20} className="text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]" />;
        return <IndianRupee size={20} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />;
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#020617] text-slate-200">
            <Navbar />
            <style>{`
        .dash-glass { background: rgba(15,23,42,0.6); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .dash-input { background: rgba(30,41,59,0.5); border: 1px solid rgba(255,255,255,0.1); color: #e2e8f0; transition: all 0.3s ease; }
        .dash-input:focus { border-color: rgba(34,211,238,0.5); box-shadow: 0 0 10px rgba(34,211,238,0.2); outline: none; }
        .dash-btn { background: linear-gradient(to right, rgba(14,165,233,0.8), rgba(59,130,246,0.8)); color: white; border: 1px solid rgba(14,165,233,0.5); transition: all 0.3s ease; }
        .dash-btn:hover { background: linear-gradient(to right, rgba(14,165,233,1), rgba(59,130,246,1)); box-shadow: 0 0 15px rgba(14,165,233,0.4); }
      `}</style>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Tab Switcher */}
                <div className="flex gap-2 mb-8 dash-glass p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab("transactions")}
                        className={`px-5 py-2 rounded-lg text-xs font-mono tracking-widest uppercase transition-all ${
                            activeTab === "transactions"
                                ? "bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-500/30"
                                : "text-gray-500 hover:text-gray-300"
                        }`}
                    >
                        <span className="flex items-center gap-2"><IndianRupee size={13} /> Finance Vault</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("shopping")}
                        className={`px-5 py-2 rounded-lg text-xs font-mono tracking-widest uppercase transition-all ${
                            activeTab === "shopping"
                                ? "bg-gradient-to-r from-violet-500/30 to-purple-500/30 text-violet-300 border border-violet-500/30"
                                : "text-gray-500 hover:text-gray-300"
                        }`}
                    >
                        <span className="flex items-center gap-2"><ShoppingCart size={13} /> Shopping Plan</span>
                    </button>
                </div>

                {activeTab === "transactions" && <>
                {/* Header + Overview */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-10 relative"
                >
                    <div className="absolute right-0 top-0 hidden md:block group">
                        <button
                            onClick={() => setFormOpen(!formOpen)}
                            className="dash-btn px-6 py-3 rounded-xl font-semibold flex items-center gap-2 text-xs tracking-widest uppercase transition-all hover:scale-105"
                        >
                            <Plus size={16} />
                            New Transaction
                        </button>
                    </div>

                    <div className="inline-flex items-center justify-center p-4 dash-glass rounded-2xl mb-4 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                        <IndianRupee size={42} strokeWidth={2} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 mb-2 tracking-wide">
                        Finance Vault
                    </h1>
                    <p className="text-cyan-400/60 font-mono text-sm tracking-widest uppercase mb-6 md:mb-0">
                        Asset Tracking & Capital Flow
                    </p>

                    <div className="md:hidden mt-6">
                        <button
                            onClick={() => setFormOpen(!formOpen)}
                            className="w-full dash-btn px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-xs tracking-widest uppercase"
                        >
                            <Plus size={16} />
                            New Transaction
                        </button>
                    </div>
                </motion.div>

                {/* Balance Overview Cards */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
                >
                    <div className="dash-glass p-6 rounded-2xl border-l-[4px] border-l-cyan-500 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute right-[-20%] top-[-20%] opacity-10">
                            <IndianRupee size={150} />
                        </div>
                        <p className="text-xs font-mono tracking-widest text-gray-400 uppercase mb-2">Net Balance</p>
                        <h2 className={`text-4xl font-bold ${balanceDetails.totalBalance >= 0 ? "text-cyan-400" : "text-rose-400"}`}>
                            ₹{balanceDetails.totalBalance.toLocaleString()}
                        </h2>
                    </div>
                    <div className="dash-glass p-6 rounded-2xl border-l-[4px] border-l-emerald-500 flex flex-col items-center justify-center relative overflow-hidden">
                        <p className="text-xs font-mono tracking-widest text-emerald-400/70 uppercase mb-2">Total Income</p>
                        <h2 className="text-3xl font-bold text-emerald-400">
                            ₹{balanceDetails.totalIncome.toLocaleString()}
                        </h2>
                        <TrendingUp className="absolute bottom-4 right-4 text-emerald-500/20" size={40} />
                    </div>
                    <div className="dash-glass p-6 rounded-2xl border-l-[4px] border-l-rose-500 flex flex-col items-center justify-center relative overflow-hidden">
                        <p className="text-xs font-mono tracking-widest text-rose-400/70 uppercase mb-2">Total Expenses</p>
                        <h2 className="text-3xl font-bold text-rose-400">
                            ₹{balanceDetails.totalExpense.toLocaleString()}
                        </h2>
                        <TrendingDown className="absolute bottom-4 right-4 text-rose-500/20" size={40} />
                    </div>
                </motion.div>

                {/* Create Transaction Form */}
                {formOpen && (
                    <div className="mb-12 dash-glass rounded-3xl p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 opacity-50"></div>

                        <h2 className="text-xl font-bold text-gray-200 mb-8 flex items-center gap-3 pb-4 border-b border-white/5">
                            {editingId ? <Edit2 className="text-emerald-400" size={24} /> : <PlusCircle className="text-emerald-400" size={24} />}
                            {editingId ? "Update Capital Transfer" : "Register Capital Transfer"}
                        </h2>

                        <form onSubmit={createTransaction} className="grid gap-6 md:grid-cols-2">
                            {/* Title */}
                            <div className="relative">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Transaction Origin/Target *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Salary, Groceries, Rent"
                                    className="dash-input w-full px-4 py-3 rounded-xl placeholder-gray-600 focus:ring-1 focus:ring-emerald-500/50"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Amount */}
                            <div className="relative">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Value (₹) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="dash-input w-full px-4 py-3 rounded-xl placeholder-gray-600 focus:ring-1 focus:ring-emerald-500/50"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Type */}
                            <div className="relative">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Flow Vector</label>
                                <select
                                    className="dash-input w-full px-4 py-3 rounded-xl appearance-none focus:ring-1 focus:ring-emerald-500/50"
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                                >
                                    <option value="expense" className="bg-gray-900">Outbound (Expense)</option>
                                    <option value="income" className="bg-gray-900">Inbound (Income)</option>
                                </select>
                            </div>

                            {/* Category */}
                            <div className="relative">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Class Index</label>
                                {!showNewCategory ? (
                                    <div className="flex gap-2">
                                        <select
                                            className="dash-input flex-1 px-4 py-3 rounded-xl appearance-none focus:ring-1 focus:ring-emerald-500/50"
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                                        >
                                            <option value="" className="bg-gray-900">-- Select Class Index --</option>
                                            {categories.map(c => (
                                                <option key={c} value={c} className="bg-gray-900">{c}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setShowNewCategory(true)}
                                            className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                            title="Create new category"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="New class name..."
                                            className="dash-input flex-1 px-4 py-3 rounded-xl placeholder-gray-600 focus:ring-1 focus:ring-emerald-500/50"
                                            value={newCategoryInput}
                                            onChange={(e) => setNewCategoryInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory(newCategoryInput))}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => addCategory(newCategoryInput)}
                                            className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 transition-all"
                                        >
                                            <CheckCircle2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowNewCategory(false); setNewCategoryInput(""); }}
                                            className="px-3 py-2 rounded-xl bg-gray-700/50 border border-white/10 text-gray-400 hover:bg-gray-700 transition-all"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Date */}
                            <div className="relative md:col-span-2">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Timestamp</label>
                                <input
                                    type="date"
                                    className="dash-input w-full px-4 py-3 rounded-xl focus:ring-1 focus:ring-emerald-500/50"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 mt-6 md:col-span-2 pt-6 border-t border-white/5">
                                <button
                                    type="submit"
                                    disabled={loading || !form.title.trim() || !form.amount}
                                    className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-semibold tracking-widest uppercase shadow-[0_0_15px_rgba(52,211,153,0.2)] disabled:opacity-50 transition-all border border-emerald-500/50"
                                >
                                    {loading ? "Processing..." : editingId ? "Save Changes" : "Commit Transaction"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormOpen(false);
                                        setEditingId(null);
                                        setShowNewCategory(false);
                                        setNewCategoryInput("");
                                        setForm({ title: "", amount: "", type: "expense", category: "", date: new Date().toISOString().split('T')[0] });
                                    }}
                                    className="flex-1 px-8 py-3.5 bg-gray-900/50 hover:bg-gray-800 text-gray-400 border border-white/10 rounded-xl text-xs font-semibold tracking-widest uppercase transition-all"
                                >
                                    Abort
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Charts Overview */}

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10"
                >
                    {/* Expenses Doughnut Chart */}
                    <div className="dash-glass p-6 rounded-2xl relative overflow-hidden">
                        <h3 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2">
                            <PieChartIcon size={20} className="text-rose-400" />
                            Ledger: Outbound Flow
                        </h3>
                        {expenseData.series?.length > 0 ? (
                            <div className="h-[300px] w-full">
                                <Chart
                                    options={expenseData.options}
                                    series={expenseData.series}
                                    type="donut"
                                    height="100%"
                                />
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-500 font-mono text-xs uppercase tracking-widest">
                                No outbound flow detected
                            </div>
                        )}
                    </div>

                    {/* Income Bar Chart */}
                    <div className="dash-glass p-6 rounded-2xl relative overflow-hidden">
                        <h3 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2">
                            <BarChart3 size={20} className="text-emerald-400" />
                            Ledger: Inbound Channels
                        </h3>
                        {incomeData.series?.[0]?.data?.length > 0 ? (
                            <div className="h-[300px] w-full">
                                <Chart
                                    options={incomeData.options}
                                    series={incomeData.series}
                                    type="bar"
                                    height="100%"
                                />
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-500 font-mono text-xs uppercase tracking-widest">
                                No inbound signal detected
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Transactions List */}
                <h3 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2">
                    <Filter size={20} className="text-cyan-400" />
                    Ledger History
                </h3>
                {
                    loading ? (
                        <div className="flex justify-center py-20">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
                                <div className="text-emerald-400 font-mono text-sm tracking-widest uppercase animate-pulse">Syncing Ledger...</div>
                            </div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-20 dash-glass rounded-3xl mt-8">
                            <div className="inline-flex items-center justify-center p-6 bg-gray-900/50 border border-white/5 rounded-3xl mb-6">
                                <Search className="text-gray-600" size={56} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-300 mb-2">No Transactions Detected</h3>
                            <p className="text-gray-500 font-mono text-[10px] tracking-widest uppercase mb-8">Initiate capital flow to view records</p>
                            <button
                                onClick={() => setFormOpen(true)}
                                className="px-8 py-4 dash-btn bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 rounded-xl font-semibold text-xs tracking-widest uppercase border-emerald-500/50"
                            >
                                Execute First Transfer
                            </button>
                        </div>
                    ) : (
                        <div className="dash-glass rounded-2xl overflow-hidden">
                            <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-gray-900/50 text-xs font-mono tracking-widest uppercase text-gray-400">
                                <div className="col-span-1 text-center">Dir</div>
                                <div className="col-span-4">Entity/Details</div>
                                <div className="col-span-2">Class</div>
                                <div className="col-span-2 text-right">Date</div>
                                <div className="col-span-2 text-right">Volume</div>
                                <div className="col-span-1 text-center">Actions</div>
                            </div>

                            <div className="divide-y divide-white/5">
                                {transactions.map((t) => (
                                    <div key={t.id} className="p-4 md:grid md:grid-cols-12 md:gap-4 md:items-center hover:bg-white/[0.02] transition-colors group">
                                        <div className="hidden md:flex col-span-1 justify-center">
                                            {getTypeIcon(t.type)}
                                        </div>

                                        <div className="col-span-4 mb-2 md:mb-0 flex items-center gap-3">
                                            <div className="md:hidden">
                                                {getTypeIcon(t.type)}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium group-hover:text-cyan-400 transition-colors">{t.title}</p>
                                                <p className="text-xs text-gray-500 md:hidden mt-0.5">{new Date(t.date).toLocaleDateString()} &bull; {t.category || 'Uncategorized'}</p>
                                            </div>
                                        </div>

                                        <div className="hidden md:block col-span-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border border-white/10 bg-white/5 text-gray-300`}>
                                                {t.category || "General"}
                                            </span>
                                        </div>

                                        <div className="hidden md:block col-span-2 text-right text-sm text-gray-400 font-mono">
                                            {new Date(t.date).toLocaleDateString()}
                                        </div>

                                        <div className="col-span-2 text-right">
                                            <span className={`text-lg md:text-xl font-bold font-mono tracking-wide ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>

                                        <div className="hidden md:flex col-span-1 justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(t)} className="text-cyan-400 hover:text-cyan-300">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => deleteTransaction(t.id)} className="text-rose-500 hover:text-rose-400">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Mobile Actions */}
                                        <div className="md:hidden mt-4 pt-4 border-t border-white/5 flex gap-4 w-full">
                                            <button onClick={() => startEdit(t)} className="flex-1 py-2 rounded bg-cyan-500/10 text-cyan-400 text-xs font-mono tracking-widest uppercase border border-cyan-500/20 flex items-center justify-center gap-2">
                                                <Edit2 size={12} /> Edit
                                            </button>
                                            <button onClick={() => deleteTransaction(t.id)} className="flex-1 py-2 rounded bg-rose-500/10 text-rose-500 text-xs font-mono tracking-widest uppercase border border-rose-500/20 flex items-center justify-center gap-2">
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }
                </>
                }

                {activeTab === "shopping" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                        {/* Header */}
                        <div className="text-center mb-10 relative">
                            <div className="inline-flex items-center justify-center p-4 dash-glass rounded-2xl mb-4 text-violet-400 border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                                <ShoppingCart size={42} strokeWidth={2} />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 mb-2 tracking-wide">Shopping Plan</h1>
                            <p className="text-violet-400/60 font-mono text-sm tracking-widest uppercase">Plan Before You Spend</p>
                        </div>

                        {/* Add Form */}
                        <div className="dash-glass rounded-3xl p-6 md:p-8 mb-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-500/0 via-violet-500 to-violet-500/0 opacity-50"></div>
                            <h2 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-3 pb-4 border-b border-white/5">
                                <ShoppingCart className="text-violet-400" size={22} />
                                Add Shopping Item
                            </h2>
                            <form onSubmit={addShoppingItem} className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Item Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Groceries, Shoes"
                                        className="dash-input w-full px-4 py-3 rounded-xl placeholder-gray-600"
                                        value={shopForm.name}
                                        onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Est. Amount (₹) *</label>
                                    <input
                                        type="number" min="0" step="0.01" placeholder="0.00"
                                        className="dash-input w-full px-4 py-3 rounded-xl placeholder-gray-600"
                                        value={shopForm.amount}
                                        onChange={(e) => setShopForm({ ...shopForm, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 flex items-center gap-1"><ImageIcon size={10} /> Image URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        className="dash-input w-full px-4 py-3 rounded-xl placeholder-gray-600"
                                        value={shopForm.image_url}
                                        onChange={(e) => setShopForm({ ...shopForm, image_url: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-end md:col-start-3">
                                    <button type="submit" disabled={shopLoading}
                                        className="w-full py-3 bg-gradient-to-r from-violet-500/80 to-purple-600/80 hover:from-violet-500 hover:to-purple-600 text-white rounded-xl text-xs font-semibold tracking-widest uppercase border border-violet-500/50 transition-all disabled:opacity-50"
                                    >
                                        <span className="flex items-center justify-center gap-2"><Plus size={14} /> Add to Plan</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Total bar */}
                        {shoppingPlans.length > 0 && (
                            <div className="dash-glass rounded-2xl px-6 py-4 mb-4 flex items-center justify-between">
                                <span className="text-xs font-mono tracking-widest uppercase text-gray-400">{shoppingPlans.length} item{shoppingPlans.length !== 1 ? 's' : ''} planned</span>
                                <span className="font-mono font-bold text-violet-300 text-lg">
                                    Total ₹{shoppingPlans.reduce((s, i) => s + Number(i.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}

                        {shoppingPlans.length === 0 ? (
                            <div className="text-center py-16 dash-glass rounded-3xl">
                                <ShoppingCart className="mx-auto text-gray-600 mb-4" size={48} strokeWidth={1.5} />
                                <p className="text-gray-500 font-mono text-xs tracking-widest uppercase">No items in shopping plan</p>
                            </div>
                        ) : (
                            <div className="dash-glass rounded-2xl overflow-hidden">
                                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-gray-900/50 text-xs font-mono tracking-widest uppercase text-gray-400">
                                    <div className="col-span-5">Item</div>
                                    <div className="col-span-3 text-right">Est. Amount</div>
                                    <div className="col-span-4 text-center">Actions</div>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {shoppingPlans.map((item) => (
                                        <div key={item.id}>
                                            {editingShopId === item.id ? (
                                                <form onSubmit={saveEditShopItem} className="p-4 grid md:grid-cols-12 md:gap-4 md:items-center bg-violet-500/5">
                                                    <div className="col-span-4 mb-2 md:mb-0">
                                                        <input
                                                            type="text"
                                                            className="dash-input w-full px-3 py-2 rounded-lg text-sm"
                                                            value={editShopForm.name}
                                                            onChange={(e) => setEditShopForm({ ...editShopForm, name: e.target.value })}
                                                            required autoFocus
                                                        />
                                                    </div>
                                                    <div className="col-span-2 mb-2 md:mb-0">
                                                        <input
                                                            type="number" min="0" step="0.01"
                                                            className="dash-input w-full px-3 py-2 rounded-lg text-sm text-right"
                                                            value={editShopForm.amount}
                                                            onChange={(e) => setEditShopForm({ ...editShopForm, amount: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-span-2 mb-2 md:mb-0">
                                                        <input
                                                            type="url"
                                                            placeholder="Image URL"
                                                            className="dash-input w-full px-3 py-2 rounded-lg text-sm"
                                                            value={editShopForm.image_url}
                                                            onChange={(e) => setEditShopForm({ ...editShopForm, image_url: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-span-4 flex gap-2 justify-center">
                                                        <button type="submit" disabled={shopLoading}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/40 text-xs font-mono tracking-widest uppercase hover:bg-violet-500/30 transition-all disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 size={12} /> Save
                                                        </button>
                                                        <button type="button" onClick={() => setEditingShopId(null)}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-700/50 text-gray-400 border border-white/10 text-xs font-mono tracking-widest uppercase hover:bg-gray-700 transition-all"
                                                        >
                                                            <X size={12} /> Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="p-4 md:grid md:grid-cols-12 md:gap-4 md:items-center hover:bg-white/[0.02] transition-colors group">
                                                    <div className="col-span-5 flex items-center gap-3 mb-2 md:mb-0">
                                                        {item.image_url ? (
                                                            <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-violet-500/30" onError={(e) => { e.target.style.display='none'; }} />
                                                        ) : (
                                                            <ShoppingCart size={16} className="text-violet-400 shrink-0" />
                                                        )}
                                                        <span className="text-white font-medium">{item.name}</span>
                                                    </div>
                                                    <div className="col-span-3 text-right font-mono font-bold text-violet-300 mb-2 md:mb-0">
                                                        ₹{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="col-span-4 flex gap-2 justify-center mt-3 md:mt-0">
                                                        <button
                                                            onClick={() => { setEditingShopId(item.id); setEditShopForm({ name: item.name, amount: item.amount, image_url: item.image_url || "" }); }}
                                                            disabled={shopLoading}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono tracking-widest uppercase hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                                                        >
                                                            <Edit2 size={12} /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => completeShoppingItem(item)}
                                                            disabled={shopLoading}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono tracking-widest uppercase hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                                                        >
                                                            <Check size={12} /> Done
                                                        </button>
                                                        <button
                                                            onClick={() => deleteShoppingItem(item.id)}
                                                            disabled={shopLoading}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-mono tracking-widest uppercase hover:bg-rose-500/20 transition-all disabled:opacity-50"
                                                        >
                                                            <Trash2 size={12} /> Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Completed Items */}
                        {completedPlans.length > 0 && (
                            <div className="mt-6">
                                <button
                                    onClick={() => setShowCompleted(v => !v)}
                                    className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-gray-400 hover:text-gray-200 transition-colors mb-3"
                                >
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                    {showCompleted ? 'Hide' : 'Show'} Completed ({completedPlans.length})
                                </button>
                                {showCompleted && (
                                    <div className="dash-glass rounded-2xl overflow-hidden opacity-70">
                                        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-gray-900/50 text-xs font-mono tracking-widest uppercase text-gray-500">
                                            <div className="col-span-7">Item</div>
                                            <div className="col-span-5 text-right">Amount</div>
                                        </div>
                                        <div className="divide-y divide-white/5">
                                            {completedPlans.map((item) => (
                                                <div key={item.id} className="p-4 md:grid md:grid-cols-12 md:gap-4 md:items-center">
                                                    <div className="col-span-7 flex items-center gap-3">
                                                        <CheckCircle2 size={15} className="text-emerald-500/60 shrink-0" />
                                                        <span className="text-gray-400 line-through">{item.name}</span>
                                                    </div>
                                                    <div className="col-span-5 text-right font-mono text-gray-500 line-through">
                                                        ₹{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
