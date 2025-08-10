import React, { useMemo, useState } from "react";

// ケーステンプレート
const caseTemplates = [
  {
    name: "カフェチェーン（原価率高め）",
    sales: 1200000,
    cogsRate: 0.55,
    sga: 300000,
    dep: 30000,
    interest: 15000,
    taxRate: 0.3
  },
  {
    name: "ITスタートアップ（販管費高め）",
    sales: 800000,
    cogsRate: 0.2,
    sga: 500000,
    dep: 10000,
    interest: 5000,
    taxRate: 0.25
  },
  {
    name: "製造業（設備投資大）",
    sales: 2000000,
    cogsRate: 0.6,
    sga: 400000,
    dep: 80000,
    interest: 20000,
    taxRate: 0.3
  }
];

export default function FinanceMiniLab() {
  const [sales, setSales] = useState(1000_000);
  const [cogsRate, setCogsRate] = useState(0.45);
  const [sga, setSga] = useState(300_000);
  const [dep, setDep] = useState(50_000);
  const [interest, setInterest] = useState(10_000);
  const [taxRate, setTaxRate] = useState(0.30);
  const [begCash, setBegCash] = useState(200_000);
  const [ppeNet, setPpeNet] = useState(500_000);
  const [otherAssets, setOtherAssets] = useState(150_000);
  const [debt, setDebt] = useState(250_000);
  const [otherLiab, setOtherLiab] = useState(200_000);
  const [shareCapital, setShareCapital] = useState(250_000);
  const [retainedEarningsBeg, setRetainedEarningsBeg] = useState(150_000);
  const [cfi, setCfi] = useState(-60_000);
  const [cff, setCff] = useState(20_000);
  const [dividend, setDividend] = useState(0);

  const applyTemplate = (template) => {
    setSales(template.sales);
    setCogsRate(template.cogsRate);
    setSga(template.sga);
    setDep(template.dep);
    setInterest(template.interest);
    setTaxRate(template.taxRate);
  };

  const calc = useMemo(() => {
    const cogs = Math.round(sales * cogsRate);
    const gross = sales - cogs;
    const ebitda = gross - sga;
    const ebit = ebitda - dep;
    const ebt = ebit - interest;
    const tax = Math.max(0, Math.round(ebt * taxRate));
    const netIncome = ebt - tax;
    const cfo = netIncome + dep;
    const netChangeCash = cfo + cfi + cff;
    const endCash = begCash + netChangeCash;
    const assets = endCash + ppeNet + otherAssets;
    const retainedEarningsEnd = retainedEarningsBeg + netIncome - dividend;
    const equity = shareCapital + retainedEarningsEnd;
    const liabEquity = debt + otherLiab + equity;
    const imbalance = assets - liabEquity;
    const opMargin = sales ? ebit / sales : 0;
    const netMargin = sales ? netIncome / sales : 0;
    const interestCoverage = interest > 0 ? ebit / interest : Infinity;
    const roa = assets ? netIncome / assets : 0;
    const leverage = equity > 0 ? (debt + otherLiab) / equity : Infinity;
    return { cogs, gross, ebitda, ebit, ebt, tax, netIncome, cfo, cfi, cff, netChangeCash, endCash, assets, retainedEarningsEnd, equity, liabEquity, imbalance, opMargin, netMargin, interestCoverage, roa, leverage };
  }, [sales, cogsRate, sga, dep, interest, taxRate, begCash, ppeNet, otherAssets, debt, otherLiab, shareCapital, retainedEarningsBeg, cfi, cff, dividend]);

  const fmt = (n) => n.toLocaleString("ja-JP");
  const pct = (x) => (isFinite(x) ? (x * 100).toFixed(1) + "%" : "―");
  const L = ({ label, children }) => (<div className="flex items-center justify-between py-1 text-sm"><span className="text-slate-600">{label}</span><span className="font-medium tabular-nums">{children}</span></div>);
  const Section = ({ title, children }) => (<div className="rounded-2xl shadow-sm border p-4 bg-white"><h2 className="text-lg font-semibold mb-3">{title}</h2>{children}</div>);
  const Num = ({ value, onChange, step = 1000, min = -1_000_000, max = 5_000_000 }) => (<input type="number" className="w-full rounded-lg border px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} />);
  const Slider = ({ value, onChange, min, max, step = 0.01 }) => (<input type="range" className="w-full" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} />);

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">テンプレートを選択</label>
        <select className="w-full rounded-lg border px-3 py-2 bg-slate-50" onChange={(e) => { if (e.target.value !== "") applyTemplate(caseTemplates[e.target.value]); }}>
          <option value="">選択してください</option>
          {caseTemplates.map((t, idx) => (<option key={idx} value={idx}>{t.name}</option>))}
        </select>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-4">
          <Section title="前提・入力（P/L）">
            <div className="space-y-2">
              <label className="block text-sm">売上高（円）</label>
              <Num value={sales} onChange={setSales} step={10_000} min={0} />
              <label className="block text-sm">売上原価率（COGS/Sales） {pct(cogsRate)}</label>
              <Slider value={cogsRate} onChange={setCogsRate} min={0} max={0.95} step={0.01} />
              <label className="block text-sm">販管費（円）</label>
              <Num value={sga} onChange={setSga} step={10_000} min={0} />
              <label className="block text-sm">減価償却費（円）</label>
              <Num value={dep} onChange={setDep} step={5_000} min={0} />
              <label className="block text-sm">支払利息（円）</label>
              <Num value={interest} onChange={setInterest} step={1_000} min={0} />
              <label className="block text-sm">実効税率 {pct(taxRate)}</label>
              <Slider value={taxRate} onChange={setTaxRate} min={0} max={0.5} step={0.01} />
            </div>
          </Section>
          <Section title="前提・入力（B/S期首・その他）">
            <div className="space-y-2">
              <label className="block text-sm">期首現金</label>
              <Num value={begCash} onChange={setBegCash} step={10_000} min={0} />
              <label className="block text-sm">有形固定資産（純額）</label>
              <Num value={ppeNet} onChange={setPpeNet} step={10_000} min={0} />
              <label className="block text-sm">その他資産</label>
              <Num value={otherAssets} onChange={setOtherAssets} step={10_000} min={0} />
              <label className="block text-sm">有利子負債</label>
              <Num value={debt} onChange={setDebt} step={10_000} min={0} />
              <label className="block text-sm">その他負債</label>
              <Num value={otherLiab} onChange={setOtherLiab} step={10_000} min={0} />
              <label className="block text-sm">資本金等</label>
              <Num value={shareCapital} onChange={setShareCapital} step={10_000} min={0} />
              <label className="block text-sm">期首利益剰余金</label>
              <Num value={retainedEarningsBeg} onChange={setRetainedEarningsBeg} step={10_000} min={0} />
            </div>
          </Section>
          <Section title="キャッシュフロー仮定">
            <div className="space-y-2">
              <label className="block textsm">投資CF（マイナス=投資）</label>
              <Num value={cfi} onChange={setCfi} step={10_000} min={-1_000_000} max={1_000_000} />
              <label className="block text-sm">財務CF（正=資金調達）</label>
              <Num value={cff} onChange={setCff} step={10_000} min={-1_000_000} max={1_000_000} />
              <label className="block text-sm">配当（利益剰余金から控除）</label>
              <Num value={dividend} onChange={setDividend} step={10_000} min={0} />
            </div>
          </Section>
        </div>
        <div className="md:col-span-2 space-y-4">
          <Section title="損益計算書（P/L）">
            <L label="売上高">￥{fmt(sales)}</L>
            <L label={`売上原価（${pct(cogsRate)}）`}>▲￥{fmt(calc.cogs)}</L>
            <div className="border-t my-2"></div>
            <L label="売上総利益（粗利）">￥{fmt(calc.gross)}</L>
            <L label="販管費">▲￥{fmt(sga)}</L>
            <L label="EBITDA">￥{fmt(calc.ebitda)}</L>
            <L label="減価償却">▲￥{fmt(dep)}</L>
            <L label="営業利益（EBIT）">￥{fmt(calc.ebit)}</L>
            <L label="支払利息">▲￥{fmt(interest)}</L>
            <L label="税金">▲￥{fmt(calc.tax)}</L>
            <div className="border-t my-2"></div>
            <L label="当期純利益">￥{fmt(calc.netIncome)}</L>
          </Section>
          <Section title="キャッシュフロー計算書（簡略・間接法）">
            <L label="営業CF（CFO）">￥{fmt(calc.cfo)}</L>
            <L label="投資CF（CFI）">￥{fmt(calc.cfi)}</L>
            <L label="財務CF（CFF）">￥{fmt(calc.cff)}</L>
            <div className="border-t my-2"></div>
            <L label="現金増減額">￥{fmt(calc.netChangeCash)}</L>
            <L label="期首現金">￥{fmt(begCash)}</L>
            <div className="border-t my-2"></div>
            <L label="期末現金">￥{fmt(calc.endCash)}</L>
          </Section>
          <Section title="貸借対照表（B/S・期末）">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">資産の部</h3>
                <L label="現金・預金">￥{fmt(calc.endCash)}</L>
                <L label="有形固定資産（純額）">￥{fmt(ppeNet)}</L>
                <L label="その他資産">￥{fmt(otherAssets)}</L>
                <div className="border-t my-2"></div>
                <L label="資産合計">￥{fmt(calc.assets)}</L>
              </div>
              <div>
                <h3 className="font-medium mb-2">負債純資産の部</h3>
                <L label="有利子負債">￥{fmt(debt)}</L>
                <L label="その他負債">￥{fmt(otherLiab)}</L>
                <L label="資本金等">￥{fmt(shareCapital)}</L>
                <L label="利益剰余金（期末）">￥{fmt(calc.retainedEarningsEnd)}</L>
                <div className="border-t my-2"></div>
                <L label="負債・純資産合計">￥{fmt(calc.liabEquity)}</L>
              </div>
            </div>
            <div className={`mt-2 text-sm ${Math.abs(calc.imbalance) < 1 ? "text-green-600" : "text-red-600"}`}>
              バランス確認：資産−（負債＋純資産）＝ {fmt(Math.round(calc.imbalance))} 円
            </div>
          </Section>
          <Section title="主要指標">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="rounded-xl border p-3 bg-slate-50"><div className="text-slate-600">営業利益率</div><div className="text-lg font-semibold">{pct(calc.opMargin)}</div></div>
              <div className="rounded-xl border p-3 bg-slate-50"><div className="text-slate-600">純利益率</div><div className="text-lg font-semibold">{pct(calc.netMargin)}</div></div>
              <div className="rounded-xl border p-3 bg-slate-50"><div className="text-slate-600">インタレストカバレッジ</div><div className="text-lg font-semibold">{isFinite(calc.interestCoverage) ? calc.interestCoverage.toFixed(1) + "x" : "―"}</div></div>
              <div className="rounded-xl border p-3 bg-slate-50"><div className="text-slate-600">ROA</div><div className="text-lg font-semibold">{pct(calc.roa)}</div></div>
              <div className="rounded-xl border p-3 bg-slate-50"><div className="text-slate-600">負債/純資産</div><div className="text-lg font-semibold">{isFinite(calc.leverage) ? calc.leverage.toFixed(2) + "x" : "―"}</div></div>
            </div>
          </Section>
          <Section title="使い方のヒント">
            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
              <li>COGS率や販管費、減価償却を変えて、粗利率・EBIT・純利益率がどう動くか見てみましょう。</li>
              <li>投資CF（設備投資）をマイナスにすると期末現金が減り、B/Sのバランスにも影響します。</li>
              <li>配当を入れると利益剰余金が減少します（現金はCFFに含めず簡略化）。</li>
              <li>この試作は学習用の単純化モデルです。厳密な会計処理や複雑な科目は別途拡張可能です。</li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
