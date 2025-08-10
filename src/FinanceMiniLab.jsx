import React, { useMemo, useState } from "react";
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// =============================
// 学生向け 財務三表ミニ・シミュレータ（フル機能版）
// - テンプレート選択
// - 入力フォーム（省略なし）
// - P/L ウォーターフォール（売上原価は売上高の上端を基準に下向き、以降も直前の小計基準）
// - B/S 可視化：左「資産」単独バー、右「負債(上)・純資産(下)」の積み上げ縦棒
// - 主要指標一覧
// =============================

// ケーステンプレート
const caseTemplates = [
  { name: "カフェチェーン（原価率高め）", sales: 1200000, cogsRate: 0.55, sga: 300000, dep: 30000, interest: 15000, taxRate: 0.3 },
  { name: "ITスタートアップ（販管費高め）", sales: 800000,  cogsRate: 0.20, sga: 500000, dep: 10000, interest:  5000, taxRate: 0.25 },
  { name: "製造業（設備投資大）",   sales: 2000000, cogsRate: 0.60, sga: 400000, dep: 80000, interest: 20000, taxRate: 0.30 }
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
  const applyTemplate = (template) => {
    setSales(template.sales);
    setCogsRate(template.cogsRate);
    setSga(template.sga);
    setDep(template.dep);
    setInterest(template.interest);
    setTaxRate(template.taxRate);
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
    const cfo = netIncome + dep;              // 運転資本の変動は0仮定
    const cffNet = cff - dividend;            // ★配当を資金流出としてCFFに含める
    const netChangeCash = cfo + cfi + cffNet;
    const endCash = begCash + netChangeCash;

  // B/S（期末）— ppeNet/otherAssets は期末残高入力想定
    const assets = endCash + ppeNet + otherAssets;
    const retainedEarningsEnd = retainedEarningsBeg + netIncome - dividend; // 剰余金から配当控除
    const equity = shareCapital + retainedEarningsEnd;
    const liabEquity = debt + otherLiab + equity;
    const imbalance = assets - liabEquity;    // 0が正しい

  // 指標
    const opMargin = sales ? ebit / sales : 0;
    const netMargin = sales ? netIncome / sales : 0;
    const interestCoverage = interest > 0 ? ebit / interest : Infinity;
    const roa = assets ? netIncome / assets : 0;
    const leverage = equity > 0 ? (debt + otherLiab) / equity : Infinity;

    return {
      cogs, gross, ebitda, ebit, ebt, tax, netIncome,
      cfo, cfi, cff: cffNet, netChangeCash, endCash,  // ← cff は cffNet を返す
      assets, retainedEarningsEnd, equity, liabEquity, imbalance,
      opMargin, netMargin, interestCoverage, roa, leverage,
    };
  }, [sales, cogsRate, sga, dep, interest, taxRate,
      begCash, ppeNet, otherAssets, debt, otherLiab, shareCapital,
      retainedEarningsBeg, cfi, cff, dividend]);


  const fmt = (n) => n.toLocaleString("ja-JP");
  const pct = (x) => (isFinite(x) ? (x * 100).toFixed(1) + "%" : "―");

  // ===== P/L ウォーターフォール（増減を積み上げて表示） =====
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
        ? { name: s.name, past: prev, inc: s.amount, dec: 0 }
        : { name: s.name, past: prev + s.amount, inc: 0, dec: -s.amount };
      prev += s.amount;
      return r;
    });
    rows.push({ name: "当期純利益", past: 0, inc: Math.max(prev, 0), dec: Math.max(-prev, 0), total: true });
    return rows;
  }, [sales, sga, dep, interest, calc.cogs, calc.tax]);

  // ===== B/S データ（左：資産、右：負債(上)+純資産(下)） =====
  const bsData = [
    { name: "資産", 資産: calc.assets },
    { name: "負債・純資産", 負債: debt + otherLiab, 純資産: calc.equity }
  ];

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      {/* テンプレート選択 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">テンプレートを選択</label>
        <select
          className="w-full rounded-lg border px-3 py-2 bg-slate-50"
          onChange={(e) => { if (e.target.value !== "") applyTemplate(caseTemplates[e.target.value]); }}
        >
          <option value="">選択してください</option>
          {caseTemplates.map((t, idx) => (
            <option key={idx} value={idx}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 入力フォーム（省略なし） */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-2xl shadow-sm border p-4 bg-white space-y-2">
            <h3 className="font-semibold">P/L 入力</h3>
            <label>売上高</label>
            <input type="number" value={sales} onChange={(e) => setSales(Number(e.target.value))} />
            <label>売上原価率 {pct(cogsRate)}</label>
            <input type="range" value={cogsRate} min={0} max={1} step={0.01} onChange={(e) => setCogsRate(Number(e.target.value))} />
            <label>販管費</label>
            <input type="number" value={sga} onChange={(e) => setSga(Number(e.target.value))} />
            <label>減価償却費</label>
            <input type="number" value={dep} onChange={(e) => setDep(Number(e.target.value))} />
            <label>支払利息</label>
            <input type="number" value={interest} onChange={(e) => setInterest(Number(e.target.value))} />
            <label>実効税率 {pct(taxRate)}</label>
            <input type="range" value={taxRate} min={0} max={1} step={0.01} onChange={(e) => setTaxRate(Number(e.target.value))} />
          </div>

          <div className="rounded-2xl shadow-sm border p-4 bg-white space-y-2">
            <h3 className="font-semibold">B/S 期首ほか</h3>
            <label>期首現金</label>
            <input type="number" value={begCash} onChange={(e) => setBegCash(Number(e.target.value))} />
            <label>有形固定資産</label>
            <input type="number" value={ppeNet} onChange={(e) => setPpeNet(Number(e.target.value))} />
            <label>その他資産</label>
            <input type="number" value={otherAssets} onChange={(e) => setOtherAssets(Number(e.target.value))} />
            <label>有利子負債</label>
            <input type="number" value={debt} onChange={(e) => setDebt(Number(e.target.value))} />
            <label>その他負債</label>
            <input type="number" value={otherLiab} onChange={(e) => setOtherLiab(Number(e.target.value))} />
            <label>資本金等</label>
            <input type="number" value={shareCapital} onChange={(e) => setShareCapital(Number(e.target.value))} />
            <label>期首利益剰余金</label>
            <input type="number" value={retainedEarningsBeg} onChange={(e) => setRetainedEarningsBeg(Number(e.target.value))} />
          </div>

          <div className="rounded-2xl shadow-sm border p-4 bg-white space-y-2">
            <h3 className="font-semibold">キャッシュフロー仮定</h3>
            <label>投資CF（マイナス=投資）</label>
            <input type="number" value={cfi} onChange={(e) => setCfi(Number(e.target.value))} />
            <label>財務CF（正=調達・負=返済）</label>
            <input type="number" value={cff} onChange={(e) => setCff(Number(e.target.value))} />
            <label>配当（利益剰余金から控除）</label>
            <input type="number" value={dividend} onChange={(e) => setDividend(Number(e.target.value))} />
          </div>
        </div>

        {/* 可視化＆指標 */}
        <div className="md:col-span-2 space-y-4">
          {/* P/L ウォーターフォール */}
          <div className="rounded-2xl shadow-sm border p-4 bg-white">
            <h2 className="text-lg font-semibold mb-3">損益計算書（ウォーターフォール）</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={plWaterfall}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => `￥${fmt(Number(v))}`} />
                <Legend />
                {/* ベース（開始位置） */}
                <Bar dataKey="past" stackId="a" fill="rgba(0,0,0,0)" isAnimationActive={false} />
                {/* 増加（上向き）= 緑、減少（下向き）= 赤 */}
                <Bar dataKey="inc" stackId="a" name="増加" fill="#22c55e" />
                <Bar dataKey="dec" stackId="a" name="減少" fill="#ef4444" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* B/S：左=資産、右=負債+純資産（負債を上、純資産を下で積み上げ） */}
          <div className="rounded-2xl shadow-sm border p-4 bg-white">
            <h2 className="text-lg font-semibold mb-3">貸借対照表（構造・縦型）</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={bsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(v) => `￥${fmt(Number(v))}`} />
                <Legend />
                {/* 資産（単独色：青） */}
                <Bar dataKey="資産" name="資産" fill="#3b82f6" />
                {/* 右側カテゴリで負債＆純資産を積み上げ（オレンジ・紫） */}
                <Bar dataKey="負債"   stackId="b" name="負債"   fill="#f59e0b" />
                <Bar dataKey="純資産" stackId="b" name="純資産" fill="#8b5cf6" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* 指標欄 */}
          <div className="rounded-2xl shadow-sm border p-4 bg-white">
            <h2 className="text-lg font-semibold mb-3">主要指標</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="rounded-xl border p-3 bg-slate-50"><div className="text-slate-600">営業利益率</div><div className="text-lg font-semibold">{pct(calc.opMargin)}</div></div>
              <div className="rounded-xl border p-3 bg-slate-50"><div className="text-slate-600">純利益率</div><div className="text-lg font-semibold">{pct(calc.netMargin)}</div></div>
              <div className="rounded-xl border p-3 bg-slate-50"><div className="text-slate-600">インタレストカバレッジ</div><div className="text-lg font-semibold">{isFinite(calc.interestCoverage) ? calc.interestCoverage.toFixed(1) + "x" : "―"}</div></div>
              <div className="rounded-xl border p-3 bg-slate-50"><div className="text-slate-600">ROA</div><div className="text-lg font-semibold">{pct(calc.roa)}</div></div>
              <div className="rounded-xl border p-3 bg-slate-50"><div className="text-slate-600">負債/純資産</div><div className="text-lg font-semibold">{isFinite(calc.leverage) ? calc.leverage.toFixed(2) + "x" : "―"}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
