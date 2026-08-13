"use client";
// src/components/property/EMICalculator.tsx
import { useState, useCallback } from "react";

interface EMICalculatorProps {
  price: number;
}

const fmtINR = (v: number) => {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(2)} Cr`;
  if (v >= 100_000) return `₹${Math.round(v / 100_000)} L`;
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
};

export function EMICalculator({ price }: EMICalculatorProps) {
  const [loanPct, setLoanPct] = useState(80);      // % of price as loan
  const [rateX10, setRateX10] = useState(85);       // rate * 10 to avoid float slider
  const [tenureYrs, setTenureYrs] = useState(20);

  const calcEMI = useCallback(() => {
    const principal = (price * loanPct) / 100;
    const monthlyRate = rateX10 / 10 / 100 / 12;
    const n = tenureYrs * 12;
    if (monthlyRate === 0) return { emi: principal / n, principal, interest: 0, total: principal };
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    const total = emi * n;
    return { emi, principal, interest: total - principal, total };
  }, [price, loanPct, rateX10, tenureYrs]);

  const { emi, principal, interest, total } = calcEMI();
  const interestPct = Math.round((interest / total) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
      <h2 className="text-lg font-semibold mb-5">EMI calculator</h2>

      <div className="grid sm:grid-cols-2 gap-8">
        {/* Sliders */}
        <div className="space-y-5">
          {/* Loan % */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500 dark:text-slate-400">Loan amount</span>
              <span className="font-medium">{loanPct}% — {fmtINR((price * loanPct) / 100)}</span>
            </div>
            <input type="range" min={50} max={90} step={5} value={loanPct}
              onChange={(e) => setLoanPct(Number(e.target.value))}
              className="w-full accent-brand-600" />
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
              <span>50%</span><span>90%</span>
            </div>
          </div>

          {/* Rate */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500 dark:text-slate-400">Interest rate</span>
              <span className="font-medium">{(rateX10 / 10).toFixed(1)}% p.a.</span>
            </div>
            <input type="range" min={60} max={120} step={5} value={rateX10}
              onChange={(e) => setRateX10(Number(e.target.value))}
              className="w-full accent-brand-600" />
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
              <span>6%</span><span>12%</span>
            </div>
          </div>

          {/* Tenure */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500 dark:text-slate-400">Tenure</span>
              <span className="font-medium">{tenureYrs} years</span>
            </div>
            <div className="flex gap-2">
              {[10, 15, 20, 25, 30].map((y) => (
                <button key={y} onClick={() => setTenureYrs(y)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    tenureYrs === y
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-slate-500 border-slate-200 hover:border-brand-300"
                  }`}>
                  {y}y
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="bg-brand-50 dark:bg-brand-950 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Monthly EMI</p>
            <p className="text-3xl font-bold text-brand-700">{fmtINR(emi)}</p>
          </div>

          <div className="space-y-2 my-4">
            {[
              { label: "Loan amount", value: fmtINR(principal) },
              { label: "Total interest", value: fmtINR(interest), highlight: true },
              { label: "Total payable", value: fmtINR(total) },
              { label: "Down payment", value: fmtINR(price - principal) },
            ].map((r) => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{r.label}</span>
                <span className={`font-medium ${r.highlight ? "text-amber-600" : "text-slate-800"}`}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Interest/principal bar */}
          <div>
            <div className="h-2 rounded-full overflow-hidden flex mb-1">
              <div style={{ width: `${100 - interestPct}%` }} className="bg-brand-600 transition-all" />
              <div style={{ width: `${interestPct}%` }} className="bg-brand-200 transition-all" />
            </div>
            <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-brand-600 inline-block" />Principal</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-brand-200 inline-block" />Interest</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
