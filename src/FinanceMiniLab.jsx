'use client';
import React, { useMemo, useState } from "react";
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ==========================================================
// Next.js（Vercel）対応版：すべて Client Component で完結
// - Recharts を使うので 'use client' を明示
// - 1ファイル内にチャート用の小コンポーネントを内包
// - 配当はCFFに含め、資産=負債+純資産 が一致
// - B/Sは縦向き：左=資産、右=負債(上)+純資産(下)
// - P/Lはウォーターフォール（増減を積み上げ）
// ==========================================================

// ----- チャート小コンポーネント：P/L ウォーターフォール -----
function PLWaterfall({ data, formatY }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={(v) => (formatY ? formatY(Number(v)) : v)} />
        <Tooltip formatter={(v) => (formatY ? formatY(Number(v)) : v)} />
        <Legend />
        <Bar dataKey="past" stackId="wf" fill="rgba(0,0,0,0)" isAnimationActive={false} />
        <Bar dataKey="inc"  stackId="wf" name="増加" fill="#22c55e" />
        <Bar dataKey="dec"  stackId="wf" name="減少" fill="#ef4444" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ----- チャート小コンポーネント：B/S 縦積み -----
function BSStacked({ data, formatX }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tickFormatter={(v) => (formatX ? formatX(Number(v)) : v)} />
        <YAxis type="category" dataKey="name" />
        <Tooltip formatter={(v) => (formatX ? formatX(Number(v)) : v)} />
        <Legend />
        {/* 左列：資産（単独色：青） */}
        <Bar dataKey="資産" name="資産" fill="#3b82f6" />
        {/* 右列：負債(上) + 純資産(下)（別色） */}
        <Bar dataKey="負債"   name="負債"   stackId="bs" fill="#f59e0b" />
        <Bar dataKey="純資産" name="純資産" stackId="bs" fill="#8b5cf6" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default function FinanceMiniLab() {
  // ---- 入力（損益関連） ----
  const [sales, setSales] = useState(1_000_000);
  const [cogsRate, setCogsRate] = useState(0.45);
  const [sga, setSga] = useState(300_000);
  const [dep, setDep] = useState(50_000);
  const [interest, setInterest] = useState(10_000);
  const [taxRate, setTaxRate] = useState(0.30);

  // ---- 入力（期首・B/Sの素） ----
  const [begCash, setBegCash] = useState(200_000);
  const [ppeNet, setPpeNet] = useState(500_000);
  const [otherAssets, setOtherAssets] = useState(150_000);
  const [debt, setDebt] = useState(250_000);
  const [otherLiab, setOtherLiab] = useState(200_000);
  const [shareCapital, setShareCapital] = useState(250_000);
  const [retainedEarningsBeg, setRetainedEarningsBeg] = useState(150_000);

  // ---- 入力（CF仮定）----
  const [cfi, setCfi] = useState(-60_000); // 投資CF（マイナス=投資）
  const [cff, setCff] = useState(20_000);  // 財務CF（正=調達/負=返済）
  const [dividend, setDividend] = useState(0); // 配当

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
    const cfo = netIncome + dep;       // 運転資本変動は0仮定
    const cffNet = cff - dividend;     // ★配当はCFFに含めて現金を減らす
    const netChangeCash = cfo + cfi + cffNet;
    const endCash = begCash + netChangeCash;

    // B/S（期末）
    const assets = endCash + ppeNet + otherAssets;
    const retainedEarningsEnd = retainedEarningsBeg + netIncome - dividend; // 剰余金から配当控除
    const equity = shareCapital + retainedEarningsEnd;
    const liabEquity = debt + otherLiab + equity;
    const imbalance = assets - liabEquity; // 0 が理論値

    // 指標
    const opMargin = sales ? ebit / sales : 0;
    const netMargin = sales ? netIncome / sales : 0;
    const interestCoverage = interest > 0 ? ebit / interest : Infinity;
    const roa = assets ? netIncome / assets : 0;
    const leverage = equity > 0 ? (debt + otherLiab) / equity : Infinity;

    return {
      cogs, gross, ebitda, ebit, ebt, tax, netIncome,
      cfo, cfi, cff: cffNet, netChangeCash, endCash,
      assets, retainedEarningsEnd, equity, liabEquity, imbalance,
      opMargin, netMargin, interestCoverage, roa, leverage,
    };
  }, [sales, cogsRate, sga, dep, interest, taxRate, begCash, ppeNet, otherAssets, debt, otherLiab, shareCapital, retainedEarningsBeg, cfi, cff, dividend]);

  const fmt = (n) => n.toLocaleString("ja-JP");
  const yen = (n) => `￥${Number(n).toLocaleString('ja-JP')}`;
  const pct = (x) => (isFinite(x) ? (x * 100).toFixed(1) + "%" : "―");

  // ----- P/L ウォーターフォール用データ -----
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

  // ----- B/S 可視化データ（左=資産、右=負債+純資産） -----
  const bsData = [
    { name: "資産", 資産: calc.assets },
    { name: "負債・純資産", 負債: debt + otherLiab, 純資産: calc.equity },
  ];

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 入力フォーム */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-2xl shadow-sm border p-4 bg-white space-y-2">
            <h3 className="font-semibold">P/L 入力</h3>
            <label>売上高</label><input type="number" value={sales} onChange={(e) => setSales(Number(e.target.value))} />
            <label>売上原価率 {pct(cogsRate)}</label><input type="range" value={cogsRate} min={0} max={1} step={0.01} onChange={(e) => setCogsRate(Number(e.target.value))} />
            <label>販管費</label><input type="number" value={sga} onChange={(e) => setSga(Number(e.target.value))} />
            <label>減価償却費</label><input type="number" value={dep} onChange={(e) => setDep(Number(e.target.value))} />
            <label>支払利息</label><input type="number" value={interest} onChange={(e) => setInterest(Number(e.target.value))} />
            <label>実効税率 {pct(taxRate)}</label><input type="range" value={taxRate} min={0} max={0.6} step={0.01} onChange={(e) => setTaxRate(Number(e.target.value))} />
          </div>

          <div className="rounded-2xl shadow-sm border p-4 bg-white space-y-2">
            <h3 className="font-semibold">B/S 期首ほか</h3>
            <label>期首現金</label><input type="number" value={begCash} onChange={(e) => setBegCash(Number(e.target.value))} />
            <label>有形固定資産</label><input type="number" value={ppeNet} onChange={(e) => setPpeNet(Number(e.target.value))} />
            <label>その他資産</label><input type="number" value={otherAssets} onChange={(e) => setOtherAssets(Number(e.target.value))} />
            <label>有利子負債</label><input type="number" value={debt} onChange={(e) => setDebt(Number(e.target.value))} />
            <label>その他負債</label><input type="number" value={otherLiab} onChange={(e) => setOtherLiab(Number(e.target.value))} />
            <label>資本金等</label><input type="number" value={shareCapital} onChange={(e) => setShareCapital(Number(e.target.value))} />
            <label>期首利益剰余金</label><input type="number" value={retainedEarningsBeg} onChange={(e) => setRetainedEarningsBeg(Number(e.target.value))} />
          </div>

          <div className="rounded-2xl shadow-sm border p-4 bg-white space-y-2">
            <h3 className="font-semibold">キャッシュフロー仮定</h3>
            <label>投資CF（マイナス=投資）</label><input type="number" value={cfi} onChange={(e) => setCfi(Number(e.target.value))} />
            <label>財務CF（正=調達・負=返済）</label><input type="number" value={cff} onChange={(e) => setCff(Number(e.target.value))} />
            <label>配当</label><input type="number" value={dividend} onChange={(e) => setDividend(Number(e.target.value))} />
          </div>
        </div>

        {/* 可視化＆指標 */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-2xl shadow-sm border p-4 bg-white">
            <h2 className="text-lg font-semibold mb-3">損益計算書（ウォーターフォール）</h2>
            <PLWaterfall data={plWaterfall} formatY={yen} />
          </div>

          <div className="rounded-2xl shadow-sm border p-4 bg-white">
            <h2 className="text-lg font-semibold mb-3">貸借対照表（縦：左=資産 / 右=負債+純資産）</h2>
            <BSStacked data={bsData} formatX={yen} />
            <div className={`mt-2 text-sm ${Math.abs(calc.imbalance) < 1 ? "text-green-600" : "text-red-600"}`}>
              バランス確認：資産 −（負債＋純資産）= {fmt(Math.round(calc.imbalance))} 円
            </div>
          </div>

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
