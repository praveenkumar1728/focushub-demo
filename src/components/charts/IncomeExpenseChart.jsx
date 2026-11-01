import React from 'react';

/**
 * Clean responsive SVG Bar Chart comparing Income vs Expenses in Indian Rupees (₹)
 * with Dark and Light theme styling.
 */
export function IncomeExpenseChart({ income = [], expenses = [] }) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthlyData = {};

  income.forEach((item) => {
    if (!item.date) return;
    const key = item.date.substring(0, 7);
    if (!monthlyData[key]) {
      monthlyData[key] = { monthKey: key, income: 0, expense: 0 };
    }
    monthlyData[key].income += Number(item.amount || 0);
  });

  expenses.forEach((item) => {
    if (!item.date) return;
    const key = item.date.substring(0, 7);
    if (!monthlyData[key]) {
      monthlyData[key] = { monthKey: key, income: 0, expense: 0 };
    }
    monthlyData[key].expense += Number(item.amount || 0);
  });

  let chartEntries = Object.values(monthlyData).sort((a, b) =>
    a.monthKey.localeCompare(b.monthKey)
  );

  if (chartEntries.length === 0) {
    const currentKey = new Date().toISOString().substring(0, 7);
    chartEntries = [{ monthKey: currentKey, income: 0, expense: 0 }];
  }

  const maxVal = Math.max(
    ...chartEntries.map((d) => Math.max(d.income, d.expense)),
    1000
  );

  const chartHeight = 150;

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center justify-end gap-5 text-xs text-slate-500 dark:text-slate-400 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block"></span>
          <span className="font-medium text-slate-700 dark:text-slate-300">Income (₹)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-indigo-500 inline-block"></span>
          <span className="font-medium text-slate-700 dark:text-slate-300">Expenses (₹)</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative pt-2 pb-6 flex items-end justify-between gap-3 sm:gap-6 border-b border-slate-200 dark:border-slate-800 h-48">
        {chartEntries.map((entry) => {
          const [, m] = entry.monthKey.split('-');
          const label = monthNames[parseInt(m, 10) - 1] || entry.monthKey;
          const incomeHeight =
            entry.income > 0 ? Math.max(8, Math.round((entry.income / maxVal) * chartHeight)) : 0;
          const expenseHeight =
            entry.expense > 0 ? Math.max(8, Math.round((entry.expense / maxVal) * chartHeight)) : 0;

          return (
            <div key={entry.monthKey} className="flex-1 flex flex-col items-center group relative">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none bg-slate-900 dark:bg-slate-800 text-white text-2xs rounded-lg py-1 px-2.5 shadow-md whitespace-nowrap flex flex-col gap-0.5 border border-slate-700">
                <span className="text-emerald-300 font-semibold">
                  +₹{entry.income.toLocaleString('en-IN')}
                </span>
                <span className="text-indigo-300 font-semibold">
                  -₹{entry.expense.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Bars container */}
              <div className="flex items-end gap-1.5 sm:gap-2.5 w-full justify-center h-36">
                <div
                  style={{ height: `${incomeHeight}px` }}
                  className="w-4 sm:w-8 rounded-t-md bg-emerald-500 hover:bg-emerald-600 transition-all duration-300 shadow-2xs"
                  title={`Income: ₹${entry.income.toLocaleString('en-IN')}`}
                />
                <div
                  style={{ height: `${expenseHeight}px` }}
                  className="w-4 sm:w-8 rounded-t-md bg-indigo-500 hover:bg-indigo-600 transition-all duration-300 shadow-2xs"
                  title={`Expense: ₹${entry.expense.toLocaleString('en-IN')}`}
                />
              </div>

              {/* Month label */}
              <span className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
