'use client';
import React, { useMemo, useState } from "react";
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// =============================
// 学生向け 財務三表ミニ・シミュレータ（整形UI・フルコード）
// - ラベル列と数値列を綺麗に整列（グリッド）
// - テンプレートを拡充
// - P/Lはウォーターフォール、B/Sは 縦: 左=資産 / 右=負債(上)+純資産(下)
// - 配当はCFFに反映し、B/Sが必ず合うように調整
// =============================

// 追加テンプレート
const caseTemplates = [
  { name: "カフェチェーン（原価率高め）", sales: 1200000, cogsRate: 0.55, sga: 300000, dep: 30000, interest: 15000, taxRate: 0.30,
    begCash: 150000, ppeNet: 400000, otherAssets: 120000, debt: 220000, otherLiab: 180000, shareCapital: 240000, retainedBeg: 140000,
    cfi: -80000, cff: 30000, dividend: 10000 },
  { name: "ITスタートアップ（販管費高め）", sales: 800000, cogsRate: 0.20, sga: 500000, dep: 10000, interest: 5000, taxRate: 0.25,
    begCash: 300000, ppeNet: 150000, otherAssets: 100000, debt: 100000, otherLiab: 120000, shareCapital: 350000, retainedBeg: 80000,
    cfi: -40000, cff: 50000, dividend: 0 },
  { name: "製造業（設備投資大）", sales: 2000000, cogsRate: 0.60, sga: 400000, dep: 80000, interest: 20000, taxRate: 0.30,
    begCash: 250000, ppeNet: 800000, otherAssets: 200000, debt: 400000, otherLiab: 300000, shareCapital: 300000, retainedBeg: 200000,
    cfi: -200000, cff: 100000, dividend: 20000 },
  { name: "コンビニ（在庫厚め・薄利多売）", sales: 1500000, cogsRate: 0.70, sga: 250000, dep: 20000, interest: 8000, taxRate: 0.30,
    begCash: 180000, ppeNet: 300000, otherAssets: 250000, debt: 200000, otherLiab: 260000, shareCapital: 220000, retainedBeg: 160000,
    cfi: -50000, cff: 20000, dividend: 10000 },
  { name: "SaaS（サブスク・高粗利）", sales: 900000, cogsRate: 0.15, sga: 550000, dep: 15000, interest: 3000, taxRate: 0.25,
    begCash: 400000, ppeNet: 120000, otherAssets: 180000, debt: 80000, otherLiab: 90000, shareCapital: 380000, retainedBeg: 90000,
    cfi: -30000, cff: 0, dividend: 0 },
  { name: "EC（広告費高め）", sales: 1300000, cogsRate: 0.55, sga: 420000, dep: 20000, interest: 6000, taxRate: 0.27,
    begCash: 220000, ppeNet: 200000, otherAssets: 160000, debt: 150000, otherLiab: 170000, shareCapital: 260000, retainedBeg: 130000,
    cfi: -60000, cff: 10000, dividend: 5000 },
  { name: "ゲーム（ヒット依存・波大）", sales: 1100000, cogsRate: 0.35, sga: 450000, dep: 25000, interest: 4000, taxRate: 0.30,
    begCash: 350000, ppeNet: 180000, otherAssets: 140000, debt: 100000, otherLiab: 120000, shareCapital: 300000, retainedBeg: 160000,
    cfi: -90000, cff: -20000, dividend: 0 },
];

export default function FinanceMiniLab() {
  // ---- 入力（損益関連） ----
  const [sales, setSales] = useState(1000000);
  const [cogsRate, setCogsRate] = useState(0.45);
  const [sga, setSga] = useState(300000);
  const [dep, setDep] = useState(50000);
  const [interest, setInterest] = useState(10000);
  const [taxRate, setTaxRate] = useState(0.30);

  // ---- 入力（期首・B/Sの素） ----
  const [begCash, setBegCash] = useState(200000);
  const [ppeNet, setPpeNet] = useState(500000);
  const [otherAssets, setOtherAssets] = useState(150000);
  const [debt, setDebt] = useState(250000);
  const [otherLiab, setOtherLiab] = useState(200000);
  const [shareCapital, setShareCapital] = useState(250000);
  const [retainedEarningsBeg, setRetainedEarningsBeg] = useState(150000);

  // ---- 入力（CF仮定）----
  const [cfi, setCfi] = useState(-60000);
  const [cff, setCff] = useState(20000);
  const [dividend, setDividend] = useState(0);

  // ---- テンプレート適用 ----
  const applyTemplate = (t) => {
    setSales(t.sales); setCogsRate(t.cogsRate); setSga(t.sga); setDep(t.dep); setInterest(t.interest); setTaxRate(t.taxRate);
    setBegCash(t.begCash); setPpeNet(t.ppeNet); setOtherAssets(t.otherAssets);
    setDebt(t.debt); setOtherLiab(t.otherLiab); setShareCapital(t.shareCapital); setRetainedEarningsBeg(t.retainedBeg);
    setCfi(t.cfi); setCff(t.cff); setDividend(t.dividend);
  };

  // ---- 計算 ----
  const calc = useMemo(() => {
    const cogs = Math.round(sales * cogsRate);
    const gross = sales - cogs;
    const ebitda = gross - sga;
    const ebit = ebitda - dep;
    const ebt = ebit - interest;
    const tax = Math.max(0, Math.round(ebt * taxRate));
    const netIncome = ebt - tax;

    // CF（簡略・間接法）
    const cfo = netIncome + dep;             // 運転資本の変動は0仮定
    const cffNet = cff - dividend;           // 配当は資金流出としてCFFに含める
    const netChangeCash = cfo + cfi + cffNet;
    const endCash = begCash + netChangeCash;

    // B/S（期末）
    const assets = endCash + ppeNet + otherAssets;
    const retainedEarningsEnd = retainedEarningsBeg + netIncome - dividend;
    const equity = shareCapital + retainedEarningsEnd;
    const liabEquity = debt + otherLiab + equity;
    const imbalance = assets - liabEquity;   // 0が正しい

    // 指標
    const opMargin = sales ? ebit / sales : 0;
    const netMargin = sales ? netIncome / sales : 0;
    const interestCoverage = interest > 0 ? ebit / interest : Infinity;
    const roa = assets ? netIncome / assets : 0;
    const leverage = equity > 0 ? (debt + otherLiab) / equity : Infinity;

    return { cogs, gross, ebitda, ebit, ebt, tax, netIncome, cfo, cfi, cff: cffNet, netChangeCash, endCash,
             assets, retainedEarningsEnd, equity, liabEquity, imbalance, opMargin, netMargin, interestCoverage, roa, leverage };
  }, [sales, cogsRate, sga, dep, interest, taxRate, begCash, ppeNet, otherAssets, debt, otherLiab, shareCapital, retainedEarningsBeg, cfi, cff, dividend]);

  // ---- 表示ユーティリティ ----
  const fmt = (n) => (Number.isFinite(n) ? n.toLocaleString("ja-JP") : "―");
  const yen = (n) => (n >= 0 ? `￥${fmt(n)}` : `▲￥${fmt(Math.abs(n))}`);
  const pct = (x) => (isFinite(x) ? (x * 100).toFixed(1) + "%" : "―");

  // ---- P/L ウォーターフォール用データ ----
  const plWaterfall = useMemo(() => {
    const steps = [
      { name: "売上高", amount: sales },
      { name: "売上原価", amount: -calc.cogs },
      { name: "販管費", amount: -sga },
      { name: "減価償却", amount: -dep },
      { name: "支払利息", amount: -interest },
      { name: "税金", amount: -calc.tax },
    ];
    let prev = 0;
    const rows = steps.map((s) => {
      const r = s.amount >= 0
        ? { name: s.name, base: prev, inc: s.amount, dec: 0 }
        : { name: s.name, base: prev + s.amount, inc: 0, dec: -s.amount };
      prev += s.amount;
      return r;
    });
    rows.push({ name: "当期純利益", base: 0, inc: Math.max(prev, 0), dec: Math.max(-prev, 0), total: true });
    return rows;
  }, [sales, sga, dep, interest, calc.cogs, calc.tax]);

  // ---- B/S 可視化データ（左:資産 / 右:負債+純資産） ----
  const bsData = [
    { name: "資産", 資産: calc.assets },
    { name: "負債・純資産", 負債: debt + otherLiab, 純資産: calc.equity },
  ];

  // ---- フォーム用の行コンポーネント（ラベル/入力を整列） ----
  const Row = ({ label, children }) => (
    <div className="grid grid-cols-12 items-center gap-2 py-1">
      <div className="col-span-6 md:col-span-7 text-sm text-slate-600 text-right pr-2">{label}</div>
      <div className="col-span-6 md:col-span-5">{children}</div>
    </div>
  );

  const Num = (props) => (
    <input type="number" className="w-full rounded-md border px-3 py-2 bg-white text-right tabular-nums" {...props} />
  );
  const Range = ({ value, onChange, min=0, max=1, step=0.01 }) => (
    <input type="range" className="w-full" value={value} min={min} max={max} step={step} onChange={(e)=>onChange(Number(e.target.value))} />
  );

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* 上段：テンプレ選択 */}
        <div className="rounded-2xl shadow-sm border p-4 bg-white">
          <div className="grid grid-cols-12 items-center gap-3">
            <div className="col-span-12 md:col-span-3 text-sm font-medium">テンプレート</div>
            <div className="col-span-12 md:col-span-9">
              <select className="w-full rounded-md border px-3 py-2 bg-slate-50"
                onChange={(e)=>{ const idx = Number(e.target.value); if (!Number.isNaN(idx)) applyTemplate(caseTemplates[idx]); }}>
                <option value="">選択してください</option>
                {caseTemplates.map((t, i)=> <option key={i} value={i}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 中段：入力フォーム（左右2列） */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* P/L 入力 */}
          <div className="rounded-2xl shadow-sm border p-4 bg-white">
            <h2 className="text-lg font-semibold mb-2">前提・入力（P/L）</h2>
            <Row label="売上高（円）"><Num value={sales} onChange={(e)=>setSales(Number(e.target.value))} step={10000} min={0} /></Row>
            <Row label={`売上原価率（COGS/Sales） ${pct(cogsRate)}`}><Range value={cogsRate} onChange={setCogsRate} min={0} max={0.95} step={0.01} /></Row>
            <Row label="販管費（円）"><Num value={sga} onChange={(e)=>setSga(Number(e.target.value))} step={10000} min={0} /></Row>
            <Row label="減価償却費（円）"><Num value={dep} onChange={(e)=>setDep(Number(e.target.value))} step={5000} min={0} /></Row>
            <Row label="支払利息（円）"><Num value={interest} onChange={(e)=>setInterest(Number(e.target.value))} step={1000} min={0} /></Row>
            <Row label={`実効税率 ${pct(taxRate)}`}><Range value={taxRate} onChange={setTaxRate} min={0} max={0.5} step={0.01} /></Row>
          </div>

          {/* B/S・CF 入力 */}
          <div className="rounded-2xl shadow-sm border p-4 bg-white">
            <h2 className="text-lg font-semibold mb-2">前提・入力（B/S・CF）</h2>
            <Row label="期首現金"><Num value={begCash} onChange={(e)=>setBegCash(Number(e.target.value))} step={10000} min={0} /></Row>
            <Row label="有形固定資産（純額）"><Num value={ppeNet} onChange={(e)=>setPpeNet(Number(e.target.value))} step={10000} min={0} /></Row>
            <Row label="その他資産"><Num value={otherAssets} onChange={(e)=>setOtherAssets(Number(e.target.value))} step={10000} min={0} /></Row>
            <Row label="有利子負債"><Num value={debt} onChange={(e)=>setDebt(Number(e.target.value))} step={10000} min={0} /></Row>
            <Row label="その他負債"><Num value={otherLiab} onChange={(e)=>setOtherLiab(Number(e.target.value))} step={10000} min={0} /></Row>
            <Row label="資本金等"><Num value={shareCapital} onChange={(e)=>setShareCapital(Number(e.target.value))} step={10000} min={0} /></Row>
            <Row label="期首利益剰余金"><Num value={retainedEarningsBeg} onChange={(e)=>setRetainedEarningsBeg(Number(e.target.value))} step={10000} min={0} /></Row>
            <Row label="投資CF（マイナス=投資）"><Num value={cfi} onChange={(e)=>setCfi(Number(e.target.value))} step={10000} min={-1000000} /></Row>
            <Row label="財務CF（正=調達/負=返済）"><Num value={cff} onChange={(e)=>setCff(Number(e.target.value))} step={10000} min={-1000000} /></Row>
            <Row label="配当（現金流出/CFFに含む）"><Num value={dividend} onChange={(e)=>setDividend(Number(e.target.value))} step={10000} min={0} /></Row>
          </div>
        </div>

        {/* 下段：可視化＆指標 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* P/L ウォーターフォール */}
          <div className="rounded-2xl shadow-sm border p-4 bg-white">
            <h2 className="text-lg font-semibold mb-3">損益計算書（ウォーターフォール）</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={plWaterfall}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v)=>`￥${fmt(Number(v))}`} />
                <Tooltip formatter={(v)=>`￥${fmt(Number(v))}`} />
                <Legend />
                <Bar dataKey="base" stackId="a" fill="rgba(0,0,0,0)" isAnimationActive={false} />
                <Bar dataKey="inc"  stackId="a" name="増加" fill="#22c55e" />
                <Bar dataKey="dec"  stackId="a" name="減少" fill="#ef4444" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* B/S 可視化（縦：左=資産 / 右=負債+純資産） */}
          <div className="rounded-2xl shadow-sm border p-4 bg-white">
            <h2 className="text-lg font-semibold mb-1">貸借対照表（構造・縦型）</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={bsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v)=>`￥${fmt(Number(v))}`} />
                <YAxis type="category" dataKey="name" />
                <Tooltip formatter={(v)=>`￥${fmt(Number(v))}`} />
                <Legend />
                {/* 左：資産（単独色：青） */}
                <Bar dataKey="資産" name="資産" fill="#3b82f6" />
                {/* 右：負債（上・オレンジ）＋ 純資産（下・紫） */}
                <Bar dataKey="負債"   name="負債"   stackId="b" fill="#f59e0b" />
                <Bar dataKey="純資産" name="純資産" stackId="b" fill="#8b5cf6" />
              </ComposedChart>
            </ResponsiveContainer>
            <div className={`mt-2 text-sm ${Math.abs(calc.imbalance) < 1 ? "text-green-600" : "text-red-600"}`}>
              バランス確認：資産 −（負債＋純資産）= {fmt(Math.round(calc.imbalance))} 円
            </div>
          </div>

          {/* 主要指標 */}
          <div className="rounded-2xl shadow-sm border p-4 bg-white lg:col-span-2">
            <h2 className="text-lg font-semibold mb-3">主要指標</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="rounded-xl border p-3 bg-slate-50"><div className="text-slate-600">営業利益率</div><div className="text-lg font-semibold tabular-nums">{pct(calc.opMargin)}</div></div>
              <div className="rounded-xl border p-3 bg-slate-50"><div className="text-slate-600">純利益率</div><div className="text-lg font-semibold tabular-nums">{pct(calc.netMargin)}</div></div>
              <div className="rounded-xl border p-3 bg-slate-50"><div className="text-slate-600">インタレストカバレッジ</div><div className="text-lg font-semibold tabular-nums">{isFinite(calc.interestCoverage) ? calc.interestCoverage.toFixed(1) + "x" : "―"}</div></div>
              <div className="rounded-xl border p-3 bg-slate-50"><div className="text-slate-600">ROA</div><div className="text-lg font-semibold tabular-nums">{pct(calc.roa)}</div></div>
              <div className="rounded-xl border p-3 bg-slate-50"><div className="text-slate-600">負債/純資産</div><div className="text-lg font-semibold tabular-nums">{isFinite(calc.leverage) ? calc.leverage.toFixed(2) + "x" : "―"}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
