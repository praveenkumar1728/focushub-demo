import React from 'react';

export function CategoryBreakdown({ title, items = [], isExpense = false }) {
  const categoryTotals = {};
  let totalAmount = 0;

  items.forEach((item) => {
    const cat = item.category || 'Other';
    const amt = Number(item.amount || 0);
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    totalAmount += amt;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const colors = isExpense
    ? ['bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 'bg-sky-500', 'bg-emerald-500']
    : ['bg-emerald-500', 'bg-indigo-500', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        <span>{title}</span>
        <span>Total: ₹{totalAmount.toLocaleString('en-IN')}</span>
      </div>

      {sortedCategories.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">
          No expenses recorded yet
        </p>
      ) : (
        <div className="space-y-2.5">
          {sortedCategories.map(([category, amount], idx) => {
            const percentage = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0;
            return (
              <div key={category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      ₹{amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-2xs">
                      ({percentage}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      colors[idx % colors.length]
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
