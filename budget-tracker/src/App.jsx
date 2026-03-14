import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ── Supabase ─────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── constants ─────────────────────────────────────────────────
const CATS = [
  { value: "salary",        label: "Salary",        type: "income",  color: "#1D9E75", icon: "💼" },
  { value: "business",      label: "Business",       type: "income",  color: "#378ADD", icon: "🏢" },
  { value: "deposits",      label: "Deposits",       type: "income",  color: "#7F77DD", icon: "🏦" },
  { value: "savings",       label: "Savings",        type: "income",  color: "#639922", icon: "🐖" },
  { value: "freelance",     label: "Freelance",      type: "income",  color: "#0F6E56", icon: "💻" },
  { value: "bills",         label: "Bills",          type: "expense", color: "#D85A30", icon: "🧾" },
  { value: "home_rent",     label: "Home Rent",      type: "expense", color: "#E24B4A", icon: "🏠" },
  { value: "shopping",      label: "Shopping",       type: "expense", color: "#D4537E", icon: "🛍"  },
  { value: "food",          label: "Food",           type: "expense", color: "#BA7517", icon: "🍔" },
  { value: "transport",     label: "Transport",      type: "expense", color: "#885A30", icon: "🚗" },
  { value: "health",        label: "Health",         type: "expense", color: "#A32D2D", icon: "💊" },
  { value: "entertainment", label: "Entertainment",  type: "expense", color: "#993556", icon: "🎬" },
  { value: "other",         label: "Other",          type: "expense", color: "#5F5E5A", icon: "📦" },
];

const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const today   = () => new Date().toISOString().split("T")[0];
const hashPass = (p) => { let h = 0; for (let i = 0; i < p.length; i++) h = (Math.imul(31, h) + p.charCodeAt(i)) | 0; return h.toString(36); };
const SESSION_KEY = "vbt_session_v2";

// ── shared styles ─────────────────────────────────────────────
const aInp = { padding: "10px 13px", borderRadius: 8, border: "1.5px solid #dde3ed", fontSize: 14, width: "100%", boxSizing: "border-box", background: "#fff", color: "#1D3557", outline: "none" };
const aLbl = { fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5, display: "block", letterSpacing: "0.04em", textTransform: "uppercase" };
const aBtn = (bg = "#1D3557", extra = {}) => ({ padding: "11px 0", width: "100%", borderRadius: 9, border: "none", background: bg, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", ...extra });
const ErrBox = ({ msg }) => msg ? <div style={{ background: "#FCEBEB", border: "1px solid #E24B4A", borderRadius: 8, padding: "9px 13px", fontSize: 13, color: "#A32D2D", marginBottom: 14 }}>{msg}</div> : null;

// ── auth shell ────────────────────────────────────────────────
function AuthShell({ children, title, sub }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1D3557 0%,#274472 60%,#1b6ca8 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>💰</div>
          <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Budget Tracker</h1>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Voice-powered personal finance</p>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: "28px 28px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
          <h2 style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 700, color: "#1D3557" }}>{title}</h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#94a3b8" }}>{sub}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── sign in ───────────────────────────────────────────────────
function SignIn({ onLogin, switchTo }) {
  const [f, setF]       = useState({ email: "", pass: "" });
  const [err, setErr]   = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.email || !f.pass) return setErr("Please fill in all fields.");
    setBusy(true); setErr("");
    try {
      const { data, error } = await supabase
        .from("users").select("*")
        .eq("email", f.email.toLowerCase().trim()).single();
      if (error || !data)                      { setErr("No account found with this email."); return; }
      if (data.pass_hash !== hashPass(f.pass)) { setErr("Incorrect password."); return; }
      localStorage.setItem(SESSION_KEY, JSON.stringify(data));
      onLogin(data);
    } catch { setErr("Connection error. Check your internet."); }
    finally { setBusy(false); }
  };

  return (
    <AuthShell title="Welcome back" sub="Sign in to your account">
      <ErrBox msg={err} />
      <div style={{ marginBottom: 12 }}>
        <label style={aLbl}>Email</label>
        <input style={aInp} type="email" placeholder="you@example.com" value={f.email}
          onChange={e => { set("email", e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && submit()} />
      </div>
      <div style={{ marginBottom: 22 }}>
        <label style={aLbl}>Password</label>
        <input style={aInp} type="password" placeholder="Your password" value={f.pass}
          onChange={e => set("pass", e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()} />
      </div>
      <button style={aBtn()} onClick={submit} disabled={busy}>{busy ? "Signing in…" : "Sign In"}</button>
      <p style={{ textAlign: "center", fontSize: 13, color: "#94a3b8", marginTop: 16 }}>
        No account?{" "}
        <span onClick={() => switchTo("signup")} style={{ color: "#1D3557", fontWeight: 700, cursor: "pointer" }}>Sign Up</span>
      </p>
    </AuthShell>
  );
}

// ── sign up ───────────────────────────────────────────────────
function SignUp({ onLogin, switchTo }) {
  const [f, setF]       = useState({ name: "", email: "", pass: "", confirm: "" });
  const [err, setErr]   = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.name.trim())         return setErr("Name is required.");
    if (!f.email.includes("@")) return setErr("Enter a valid email.");
    if (f.pass.length < 6)      return setErr("Password must be at least 6 characters.");
    if (f.pass !== f.confirm)   return setErr("Passwords do not match.");
    setBusy(true); setErr("");
    try {
      // check duplicate
      const { data: existing } = await supabase
        .from("users").select("email")
        .eq("email", f.email.toLowerCase().trim()).single();
      if (existing) { setErr("An account already exists with this email."); return; }

      const { data, error } = await supabase
        .from("users")
        .insert([{ name: f.name.trim(), email: f.email.toLowerCase().trim(), pass_hash: hashPass(f.pass) }])
        .select().single();
      if (error) { setErr("Could not create account. Try again."); return; }
      localStorage.setItem(SESSION_KEY, JSON.stringify(data));
      onLogin(data);
    } catch { setErr("Connection error. Check your internet."); }
    finally { setBusy(false); }
  };

  return (
    <AuthShell title="Create account" sub="Sign up once — access anywhere">
      <ErrBox msg={err} />
      <div style={{ marginBottom: 12 }}>
        <label style={aLbl}>Full Name</label>
        <input style={aInp} placeholder="John Doe" value={f.name} onChange={e => { set("name", e.target.value); setErr(""); }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={aLbl}>Email</label>
        <input style={aInp} type="email" placeholder="you@example.com" value={f.email} onChange={e => { set("email", e.target.value); setErr(""); }} />
      </div>
      <div style={{ marginBottom: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={aLbl}>Password</label>
          <input style={aInp} type="password" placeholder="Min 6 chars" value={f.pass} onChange={e => set("pass", e.target.value)} />
        </div>
        <div>
          <label style={aLbl}>Confirm</label>
          <input style={aInp} type="password" placeholder="Repeat" value={f.confirm} onChange={e => set("confirm", e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
      </div>
      <button style={aBtn()} onClick={submit} disabled={busy}>{busy ? "Creating…" : "Create Account"}</button>
      <p style={{ textAlign: "center", fontSize: 13, color: "#94a3b8", marginTop: 16 }}>
        Already have an account?{" "}
        <span onClick={() => switchTo("signin")} style={{ color: "#1D3557", fontWeight: 700, cursor: "pointer" }}>Sign In</span>
      </p>
    </AuthShell>
  );
}

// ── navbar ────────────────────────────────────────────────────
function Navbar({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#1D3557", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, position: "sticky", top: 0, zIndex: 100 }}>
      <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>💰 Budget Tracker</span>
      <div style={{ position: "relative" }}>
        <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 600 }}>
          👤 {user.name.split(" ")[0]} <span style={{ fontSize: 9, opacity: 0.7 }}>▼</span>
        </button>
        {open && (
          <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", minWidth: 190, overflow: "hidden", zIndex: 200 }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#1D3557" }}>{user.name}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{user.email}</p>
              <p style={{ margin: "4px 0 0", fontSize: 10, color: "#b0c4d8" }}>Data synced across all devices ✓</p>
            </div>
            <button onClick={() => { setOpen(false); onLogout(); }} style={{ display: "block", width: "100%", padding: "11px 16px", border: "none", background: "none", textAlign: "left", fontSize: 13, color: "#E24B4A", cursor: "pointer", fontWeight: 600 }}>
              🚪 Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── voice parser ──────────────────────────────────────────────
function parseVoice(text) {
  const s = text.toLowerCase().trim();
  const out = {};
  if (/\b(expense|spent|paid|bought|cost|bill|rent|shopping|food)\b/.test(s)) out.type = "expense";
  else if (/\b(income|earned|received|salary|got paid|deposit|saving|freelance|business)\b/.test(s)) out.type = "income";
  const kMatch = s.match(/\$?(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) { out.amount = parseFloat(kMatch[1]) * 1000; }
  else {
    const digMatch = s.match(/\$?(\d[\d,]*(?:\.\d+)?)/);
    if (digMatch) out.amount = parseFloat(digMatch[1].replace(/,/g, ""));
  }
  for (const c of CATS) { if (s.includes(c.value.replace("_", " ")) || s.includes(c.label.toLowerCase())) { out.category = c.value; break; } }
  if (!out.category) {
    if (/\b(rent|house|apartment)\b/.test(s))                                   out.category = "home_rent";
    else if (/\b(grocery|groceries|restaurant|cafe|coffee|lunch|dinner)\b/.test(s)) out.category = "food";
    else if (/\b(uber|taxi|bus|metro|gas|petrol|fuel)\b/.test(s))               out.category = "transport";
    else if (/\b(doctor|hospital|medicine|pharmacy)\b/.test(s))                 out.category = "health";
    else if (/\b(movie|netflix|spotify|game|cinema)\b/.test(s))                 out.category = "entertainment";
    else if (/\b(electricity|water|internet|phone|utility)\b/.test(s))          out.category = "bills";
    else if (/\b(salary|wage|paycheck|pay)\b/.test(s))                          out.category = "salary";
  }
  const now = new Date();
  if (/\byesterday\b/.test(s))  { const d = new Date(now); d.setDate(d.getDate() - 1); out.date = d.toISOString().split("T")[0]; }
  if (/\blast week\b/.test(s))  { const d = new Date(now); d.setDate(d.getDate() - 7); out.date = d.toISOString().split("T")[0]; }
  return out;
}

// ── inner styles ──────────────────────────────────────────────
const inp = { padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, width: "100%", boxSizing: "border-box", background: "#fff", color: "#1D3557", outline: "none" };
const lbl = { fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" };

// ── voice panel ───────────────────────────────────────────────
function VoicePanel({ onParsed }) {
  const [text, setText]         = useState("");
  const [listening, setListening] = useState(false);
  const [msg, setMsg]           = useState(null);
  const recogRef = useRef(null);
  const SpeechRec = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const processText = (t) => {
    if (!t.trim()) return;
    const parsed = parseVoice(t);
    if (!Object.keys(parsed).length) { setMsg({ t: "warn", s: `Couldn't parse. Try: "expense 150 food"` }); return; }
    onParsed(parsed);
    setMsg({ t: "ok", s: `✓ ${parsed.type || "?"} · ${parsed.category || "?"} · ${parsed.amount ? fmt(parsed.amount) : "?"}` });
    setText("");
  };

  const startMic = () => {
    if (!SpeechRec) { setMsg({ t: "error", s: "Mic not available — type instead." }); return; }
    const r = new SpeechRec(); r.lang = "en-US"; r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onresult = (e) => { const t = e.results[0][0].transcript; setText(t); processText(t); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recogRef.current = r;
    try { r.start(); } catch { setMsg({ t: "error", s: "Could not start mic." }); }
  };

  const examples = ["expense 50 food", "paid 1200 home rent", "salary income 3000", "spent 80 shopping", "electricity bill 200", "freelance income 500"];

  return (
    <div style={{ background: "#F0FDF4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>🎙</span>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#166534" }}>Voice Input</span>
        {SpeechRec && (
          <button onClick={startMic} disabled={listening} style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 20, border: "none", background: listening ? "#dc2626" : "#16a34a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: listening ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", opacity: listening ? 1 : 0.5, display: "inline-block", animation: listening ? "pulse 1s infinite" : "none" }} />
            {listening ? "Listening…" : "Start Mic"}
          </button>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && processText(text)}
          placeholder='e.g. "expense 150 food" then press Enter'
          style={{ ...inp, flex: 1, background: "#fff", borderColor: "#86efac" }} />
        <button onClick={() => processText(text)} style={{ padding: "9px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Parse →</button>
      </div>
      {msg && <div style={{ marginTop: 8, padding: "7px 12px", borderRadius: 8, fontSize: 13, background: msg.t === "ok" ? "#dcfce7" : msg.t === "warn" ? "#fef9c3" : "#fee2e2", color: msg.t === "ok" ? "#166534" : msg.t === "warn" ? "#854d0e" : "#991b1b", border: `1px solid ${msg.t === "ok" ? "#86efac" : msg.t === "warn" ? "#fde047" : "#fca5a5"}` }}>{msg.s}</div>}
      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {examples.map(ex => <button key={ex} onClick={() => { setText(ex); processText(ex); }} style={{ padding: "4px 10px", borderRadius: 20, border: "1px solid #86efac", background: "#fff", color: "#166534", fontSize: 12, cursor: "pointer" }}>{ex}</button>)}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
    </div>
  );
}

// ── entry form ────────────────────────────────────────────────
function EntryForm({ onAdd }) {
  const blank = { type: "expense", category: "food", amount: "", date: today(), description: "" };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleParsed = (p) => setForm(f => ({ ...f, ...(p.type && { type: p.type }), ...(p.category && { category: p.category }), ...(p.amount && { amount: String(p.amount) }), ...(p.date && { date: p.date }) }));

  const submit = async () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return;
    setBusy(true);
    await onAdd({ ...form, amount: amt });
    setForm(blank); setBusy(false);
  };

  return (
    <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "#1D3557" }}>Add Transaction</h3>
      <VoicePanel onParsed={handleParsed} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lbl}>Type</label>
          <select value={form.type} onChange={e => { set("type", e.target.value); set("category", e.target.value === "income" ? "salary" : "food"); }} style={inp}>
            <option value="income">💰 Income</option><option value="expense">💸 Expense</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Category</label>
          <select value={form.category} onChange={e => set("category", e.target.value)} style={inp}>
            {CATS.filter(c => c.type === form.type).map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Amount ($)</label>
          <input type="number" placeholder="0.00" value={form.amount} onChange={e => set("amount", e.target.value)} style={inp} min="0" step="0.01" />
        </div>
        <div>
          <label style={lbl}>Date</label>
          <input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inp} />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={lbl}>Description</label>
          <input type="text" placeholder="Optional note…" value={form.description} onChange={e => set("description", e.target.value)} style={inp} />
        </div>
      </div>
      <button onClick={submit} disabled={busy} style={{ marginTop: 14, width: "100%", padding: 11, background: "#1D3557", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
        {busy ? "Saving…" : "+ Add Transaction"}
      </button>
    </div>
  );
}

// ── balance card ──────────────────────────────────────────────
function BalanceCard({ txns }) {
  const inc = txns.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const exp = txns.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const pct = inc > 0 ? Math.round((exp / inc) * 100) : 0;
  return (
    <div style={{ background: "linear-gradient(135deg,#1D3557 0%,#2d5986 100%)", borderRadius: 16, padding: "22px 24px", color: "#fff", marginBottom: 16 }}>
      <p style={{ margin: "0 0 2px", fontSize: 12, opacity: .7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Net Balance</p>
      <h2 style={{ margin: "0 0 4px", fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em" }}>{fmt(inc - exp)}</h2>
      <p style={{ margin: "0 0 18px", fontSize: 12, opacity: .6 }}>{pct}% of income spent</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[{ label: "Income", val: inc, bg: "rgba(29,158,117,.3)", arrow: "↑" }, { label: "Expenses", val: exp, bg: "rgba(226,75,74,.3)", arrow: "↓" }].map(({ label, val, bg, arrow }) => (
          <div key={label} style={{ background: bg, borderRadius: 10, padding: "10px 14px" }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, opacity: .8 }}>{arrow} {label}</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{fmt(val)}</p>
          </div>
        ))}
      </div>
      {inc > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ height: 6, background: "rgba(255,255,255,.2)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: pct > 80 ? "#f87171" : pct > 60 ? "#fbbf24" : "#4ade80", borderRadius: 3, transition: "width .4s" }} />
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 11, opacity: .6 }}>Spending rate</p>
        </div>
      )}
    </div>
  );
}

// ── charts ────────────────────────────────────────────────────
function Charts({ txns }) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1); return { label: d.toLocaleString("default", { month: "short" }), y: d.getFullYear(), m: d.getMonth() }; });
  const barData = months.map(({ label, y, m }) => {
    const inc = txns.filter(t => { const d = new Date(t.date); return d.getFullYear() === y && d.getMonth() === m && t.type === "income"; }).reduce((s, t) => s + Number(t.amount), 0);
    const exp = txns.filter(t => { const d = new Date(t.date); return d.getFullYear() === y && d.getMonth() === m && t.type === "expense"; }).reduce((s, t) => s + Number(t.amount), 0);
    return { name: label, Income: Math.round(inc), Expenses: Math.round(exp) };
  });
  const catTotals = {};
  txns.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount); });
  const expPie = CATS.filter(c => c.type === "expense" && catTotals[c.value] > 0).map(c => ({ name: c.label, value: Math.round(catTotals[c.value]), color: c.color }));
  const incPie = CATS.filter(c => c.type === "income"  && catTotals[c.value] > 0).map(c => ({ name: c.label, value: Math.round(catTotals[c.value]), color: c.color }));
  const card = { background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 18, marginBottom: 14 };
  const TT = ({ active, payload }) => !active || !payload?.length ? null : <div style={{ background: "#1D3557", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 13 }}>{payload.map(p => <div key={p.name}>{p.name}: {fmt(p.value)}</div>)}</div>;
  return (
    <>
      <div style={card}>
        <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#1D3557" }}>Monthly Overview — Last 6 Months</h3>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={barData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#888" }} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} axisLine={false} tickLine={false} />
            <Tooltip content={<TT />} /><Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="Income" fill="#1D9E75" radius={[4,4,0,0]} maxBarSize={36} />
            <Bar dataKey="Expenses" fill="#E24B4A" radius={[4,4,0,0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[{ label: "Expenses by Category", data: expPie }, { label: "Income by Category", data: incPie }].map(({ label, data }) => (
          <div key={label} style={card}>
            <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#1D3557" }}>{label}</h3>
            {data.length === 0 ? <p style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "28px 0", margin: 0 }}>No data</p> :
              <><ResponsiveContainer width="100%" height={160}>
                <PieChart><Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={65} dataKey="value" paddingAngle={2}>
                  {data.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie><Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} /></PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 8px", marginTop: 8 }}>
                {data.map(d => <span key={d.name} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}><span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />{d.name}</span>)}
              </div></>
            }
          </div>
        ))}
      </div>
    </>
  );
}

// ── transaction list ──────────────────────────────────────────
function TxnList({ txns, onDelete }) {
  if (!txns.length) return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: "#bbb" }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
      <p style={{ margin: 0, fontSize: 15 }}>No transactions yet</p>
      <p style={{ margin: "4px 0 0", fontSize: 13 }}>Add one using the form or voice input</p>
    </div>
  );
  return (
    <div style={{ maxHeight: 480, overflowY: "auto" }}>
      {txns.map(t => {
        const cat = CATS.find(c => c.value === t.category) || CATS[CATS.length - 1];
        return (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: "1px solid #f5f5f5" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: cat.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{cat.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1D3557", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description || cat.label}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>{cat.label} · {new Date(t.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: t.type === "income" ? "#1D9E75" : "#E24B4A", flexShrink: 0, marginRight: 6 }}>{t.type === "income" ? "+" : "−"}{fmt(Number(t.amount))}</span>
            <button onClick={() => onDelete(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", fontSize: 18, lineHeight: 1, padding: "2px 4px", borderRadius: 4, flexShrink: 0 }}>×</button>
          </div>
        );
      })}
    </div>
  );
}

// ── budget app ────────────────────────────────────────────────
function BudgetApp({ user, onLogout }) {
  const [txns, setTxns]     = useState([]);
  const [tab, setTab]       = useState("all");
  const [loading, setLoading] = useState(true);

  // fetch all transactions for this user from Supabase
  useEffect(() => {
    const fetchTxns = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_email", user.email)
        .order("created_at", { ascending: false });
      if (!error && data) setTxns(data);
      setLoading(false);
    };
    fetchTxns();
  }, [user.email]);

  const handleAdd = async (payload) => {
    const { data, error } = await supabase
      .from("transactions")
      .insert([{ ...payload, user_email: user.email }])
      .select().single();
    if (!error && data) setTxns(prev => [data, ...prev]);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) setTxns(prev => prev.filter(t => t.id !== id));
  };

  const income   = txns.filter(t => t.type === "income");
  const expenses = txns.filter(t => t.type === "expense");
  const filtered = tab === "all" ? txns : tab === "income" ? income : tab === "expense" ? expenses : txns;

  const tabs = [
    { id: "all",     label: "All",       count: txns.length },
    { id: "income",  label: "Income",    count: income.length },
    { id: "expense", label: "Expenses",  count: expenses.length },
    { id: "charts",  label: "Analytics", count: null },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <Navbar user={user} onLogout={onLogout} />
      <div style={{ padding: "20px 16px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <div style={{ marginBottom: 22 }}>
            <h1 style={{ margin: "0 0 2px", fontFamily: "'Georgia', serif", fontSize: 26, fontWeight: 800, color: "#1D3557", letterSpacing: "-0.02em" }}>
              Hey {user.name.split(" ")[0]}! 👋
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
              {loading ? "Loading your data…" : `${txns.length} transactions · synced across all devices`}
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "#94a3b8" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
              <p style={{ margin: 0, fontSize: 15 }}>Fetching your transactions…</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "start" }}>
              <div>
                <BalanceCard txns={txns} />
                <EntryForm onAdd={handleAdd} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Income entries",  n: income.length,   total: income.reduce((s,t)=>s+Number(t.amount),0),   color: "#1D9E75" },
                    { label: "Expense entries", n: expenses.length, total: expenses.reduce((s,t)=>s+Number(t.amount),0), color: "#E24B4A" },
                  ].map(({ label, n, total, color }) => (
                    <div key={label} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "14px 16px" }}>
                      <p style={{ margin: "0 0 2px", fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                      <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color }}>{n}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#666" }}>{fmt(total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#f1f5f9", borderRadius: 10, padding: 4 }}>
                  {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "8px 4px", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 600, background: tab === t.id ? "#fff" : "transparent", color: tab === t.id ? "#1D3557" : "#94a3b8", boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,.1)" : "none", transition: "all .2s" }}>
                      {t.label}{t.count !== null ? ` (${t.count})` : ""}
                    </button>
                  ))}
                </div>
                {tab === "charts" ? <Charts txns={txns} /> : (
                  <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1D3557" }}>{tab === "all" ? "All Transactions" : tab === "income" ? "Income" : "Expenses"}</span>
                      <span style={{ fontSize: 13, color: "#94a3b8" }}>{filtered.length} entries</span>
                    </div>
                    <TxnList txns={filtered} onDelete={handleDelete} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── root app ──────────────────────────────────────────────────
export default function App() {
  const [user,     setUser]     = useState(() => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } });
  const [authView, setAuthView] = useState("signin");

  const handleLogin  = (u) => { localStorage.setItem(SESSION_KEY, JSON.stringify(u)); setUser(u); };
  const handleLogout = () => { localStorage.removeItem(SESSION_KEY); setUser(null); };

  if (!user) return authView === "signin"
    ? <SignIn  onLogin={handleLogin} switchTo={setAuthView} />
    : <SignUp  onLogin={handleLogin} switchTo={setAuthView} />;

  return <BudgetApp user={user} onLogout={handleLogout} />;
}

