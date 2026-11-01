import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  CreditCard,
  Wallet,
  GraduationCap,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  IndianRupee,
  BookOpen,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart';
import { CategoryBreakdown } from '../components/charts/CategoryBreakdown';
import { ExportModal } from '../components/export/ExportModal';

export function Dashboard() {
  const { income, expenses, learnings } = useData();
  const { currentUser, can } = useAuth();
  const navigate = useNavigate();

  const [exportOpen, setExportOpen] = useState(false);

  // Computations in Rupees
  const stats = useMemo(() => {
    const totalIncome = income.reduce((s, i) => s + Number(i.amount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate =
      totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    const totalLearningHours = learnings.reduce(
      (s, l) => s + Number(l.completedHours || 0),
      0
    );
    const completedLearnings = learnings.filter((l) => l.status === 'Completed').length;

    // Combined recent transactions
    const recentTx = [
      ...income.map((i) => ({ ...i, txType: 'income' })),
      ...expenses.map((e) => ({ ...e, txType: 'expense' })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      totalLearningHours,
      completedLearnings,
      recentTx,
    };
  }, [income, expenses, learnings]);

  const formatRupees = (amt) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);

  const hasFinancialData = income.length > 0 || expenses.length > 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              <IndianRupee className="w-3 h-3" />
              FocusHub Personal Dashboard
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Welcome, {currentUser?.name || 'User'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              Overview of your personal income, expenses, balance (in ₹), and learning progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {can('income:create') && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => navigate('/income')}
                className="bg-emerald-600 hover:bg-emerald-700 border-none shadow-sm"
              >
                Add Income
              </Button>
            )}
            {can('expenses:create') && (
              <Button
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={() => navigate('/expenses')}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                Add Expense
              </Button>
            )}
            {can('learnings:create') && (
              <Button
                variant="secondary"
                size="sm"
                icon={BookOpen}
                onClick={() => navigate('/learnings')}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                Add Topic
              </Button>
            )}
            {can('export:data') && hasFinancialData && (
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={() => setExportOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                Export
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Row in Rupees */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={formatRupees(stats.totalIncome)}
          subtitle={`${income.length} income recorded`}
          trend="Inflow"
          trendPositive={true}
          icon={TrendingUp}
          iconBg="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
        />

        <StatCard
          title="Total Expenses"
          value={formatRupees(stats.totalExpenses)}
          subtitle={`${expenses.length} expenses recorded`}
          trend="Outflow"
          trendPositive={false}
          icon={CreditCard}
          iconBg="bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
        />

        <StatCard
          title="Net Balance"
          value={formatRupees(stats.netSavings)}
          subtitle={
            stats.totalIncome > 0
              ? `${stats.savingsRate}% savings rate`
              : 'Current balance'
          }
          trend={stats.netSavings >= 0 ? 'Surplus' : 'Deficit'}
          trendPositive={stats.netSavings >= 0}
          icon={Wallet}
          iconBg={
            stats.netSavings >= 0
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
          }
        />

        <StatCard
          title="Learning Progress"
          value={`${stats.totalLearningHours} hrs`}
          subtitle={`${stats.completedLearnings} of ${learnings.length} completed`}
          trend={`${learnings.length} topics`}
          trendPositive={true}
          icon={GraduationCap}
          iconBg="bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Cash Flow Comparison */}
        <div className="lg:col-span-2">
          <Card
            header="Income vs Expense Breakdown"
            action={
              <button
                onClick={() => navigate('/income')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 transition cursor-pointer"
              >
                <span>Manage</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            {hasFinancialData ? (
              <IncomeExpenseChart income={income} expenses={expenses} />
            ) : (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                <IndianRupee className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  No transactions recorded yet
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Add income or expenses to see your monthly financial charts.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Top Expense Categories */}
        <div className="lg:col-span-1">
          <Card
            header="Expense by Category"
            action={
              <button
                onClick={() => navigate('/expenses')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 transition cursor-pointer"
              >
                <span>View</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            <CategoryBreakdown
              title="Categories"
              items={expenses}
              isExpense={true}
            />
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List (2 Cols) */}
        <div className="lg:col-span-2">
          <Card header="Recent Transactions">
            {stats.recentTx.length === 0 ? (
              <div className="py-10 text-center text-slate-400 dark:text-slate-500">
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  No recent transactions
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Transactions will appear here once you record income or expenses.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.recentTx.map((tx) => {
                  const isIncome = tx.txType === 'income';
                  return (
                    <div
                      key={`${tx.txType}_${tx.id}`}
                      className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isIncome
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownRight className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {tx.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-2xs text-slate-400 dark:text-slate-500">
                            <span>{tx.date}</span>
                            <span>•</span>
                            <span>{tx.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-xs sm:text-sm font-bold ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatRupees(tx.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Learning Summary (1 Col) */}
        <div className="lg:col-span-1">
          <Card
            header="Learning Topics"
            action={
              <button
                onClick={() => navigate('/learnings')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition cursor-pointer"
              >
                View All
              </button>
            }
          >
            {learnings.length === 0 ? (
              <div className="py-10 text-center text-slate-400 dark:text-slate-500">
                <GraduationCap className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  No learning topics yet
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Add topics to track your progress and hours.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {learnings.slice(0, 4).map((topic) => (
                  <div
                    key={topic.id}
                    className="space-y-1.5 pb-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {topic.title}
                      </span>
                      <Badge
                        variant={
                          topic.status === 'Completed'
                            ? 'success'
                            : topic.status === 'In Progress'
                            ? 'primary'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {topic.status}
                      </Badge>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          topic.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${topic.progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-2xs text-slate-400 dark:text-slate-500">
                      <span>
                        {topic.completedHours} / {topic.targetHours} hrs
                      </span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {topic.progress}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        moduleName="Income"
        allData={income}
        filteredData={income}
      />
    </div>
  );
}
