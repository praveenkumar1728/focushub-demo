import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Download,
  Search,
  Edit2,
  Trash2,
  Calendar,
  IndianRupee,
  Tag,
  Check,
  X,
  Settings2,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { SearchInput } from '../components/common/SearchInput';
import { Pagination } from '../components/common/Pagination';
import { ExportModal } from '../components/export/ExportModal';

export function Expenses() {
  const {
    expenses,
    expenseCategories,
    addExpense,
    editExpense,
    removeExpense,
    addExpenseCategory,
    editExpenseCategory,
    deleteExpenseCategory,
  } = useData();
  const { can } = useAuth();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Category Management Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCatName, setEditingCatName] = useState(null);
  const [editingCatValue, setEditingCatValue] = useState('');
  const [deleteCatConfirm, setDeleteCatConfirm] = useState(null);

  // Inline add category state inside Add Expense modal
  const [showInlineAddCat, setShowInlineAddCat] = useState(false);
  const [inlineCatName, setInlineCatName] = useState('');

  // Expense Form State
  const initialForm = {
    title: '',
    category: expenseCategories[0] || 'Food',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  };
  const [formData, setFormData] = useState(initialForm);

  // Filtered Expense List
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((item) => {
        const matchesSearch =
          item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.notes?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
          categoryFilter === 'All' || item.category === categoryFilter;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, searchTerm, categoryFilter]);

  // Paginated records
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  // Metrics in Rupees
  const metrics = useMemo(() => {
    const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const highest = expenses.reduce((max, e) => Math.max(max, Number(e.amount || 0)), 0);
    return { total, highest, count: expenses.length };
  }, [expenses]);

  const formatRupees = (amt) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      ...initialForm,
      category: expenseCategories[0] || 'Food',
    });
    setShowInlineAddCat(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      amount: item.amount,
      date: item.date,
      notes: item.notes || '',
    });
    setShowInlineAddCat(false);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount) return;

    try {
      setFormSubmitting(true);
      const payload = {
        ...formData,
        status: 'Paid',
      };
      if (editingItem) {
        await editExpense(editingItem.id, payload);
      } else {
        await addExpense(payload);
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      setFormSubmitting(true);
      await removeExpense(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Category Handlers
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await addExpenseCategory(newCategoryName.trim());
      setNewCategoryName('');
    } catch (err) {
      // toast shown in context
    }
  };

  const handleInlineAddCategory = async (e) => {
    e.preventDefault();
    if (!inlineCatName.trim()) return;
    try {
      await addExpenseCategory(inlineCatName.trim());
      setFormData((prev) => ({ ...prev, category: inlineCatName.trim() }));
      setInlineCatName('');
      setShowInlineAddCat(false);
    } catch (err) {
      // toast handled in context
    }
  };

  const handleSaveEditCategory = async (oldName) => {
    if (!editingCatValue.trim()) return;
    try {
      await editExpenseCategory(oldName, editingCatValue.trim());
      setEditingCatName(null);
      setEditingCatValue('');
    } catch (err) {
      // toast handled
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCatConfirm) return;
    try {
      await deleteExpenseCategory(deleteCatConfirm);
      setDeleteCatConfirm(null);
    } catch (err) {
      // toast handled
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Expense Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Log your daily spending in Indian Rupees (₹) and customize expense categories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            icon={Tag}
            size="sm"
            onClick={() => setIsCategoryModalOpen(true)}
            title="Manage categories"
          >
            Categories
          </Button>

          {can('export:data') && (
            <Button
              variant="secondary"
              icon={Download}
              size="sm"
              onClick={() => setIsExportOpen(true)}
            >
              Export
            </Button>
          )}

          {can('expenses:create') && (
            <Button
              variant="primary"
              icon={Plus}
              size="sm"
              onClick={handleOpenCreate}
            >
              Add Expense
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Expenses"
          value={formatRupees(metrics.total)}
          subtitle="Total money spent"
          trend="Outflow"
          trendPositive={false}
          icon={CreditCard}
          iconBg="bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
        />
        <StatCard
          title="Highest Expense"
          value={formatRupees(metrics.highest)}
          subtitle="Peak single expense"
          trend="Peak"
          icon={IndianRupee}
          iconBg="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          title="Active Categories"
          value={`${expenseCategories.length} categories`}
          subtitle="Configured spending tags"
          trend="Managed"
          icon={Tag}
          iconBg="bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors">
        <div className="w-full sm:w-72">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder="Search expense title or notes..."
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-medium px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            {expenseCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition cursor-pointer"
            title="Edit Categories"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clean Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Title / Purpose</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount (₹)</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      No expense records yet
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Click "+ Add Expense" above to record your first expense in Rupees.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="purple">{item.category}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 font-mono">
                      -{formatRupees(item.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">
                      {item.date}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {item.notes || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {can('expenses:edit') && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {can('expenses:delete') && (
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredExpenses.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Edit Expense' : 'Add New Expense'}
        subtitle="Record money spent in Rupees (₹)"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsFormOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleFormSubmit}
              loading={formSubmitting}
            >
              {editingItem ? 'Save Changes' : 'Save Expense'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Title / Expense Description *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Groceries, Electricity Bill, Fuel"
              className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowInlineAddCat(!showInlineAddCat)}
                  className="text-2xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition cursor-pointer"
                >
                  {showInlineAddCat ? 'Cancel' : '+ New Category'}
                </button>
              </div>

              {showInlineAddCat ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={inlineCatName}
                    onChange={(e) => setInlineCatName(e.target.value)}
                    placeholder="Category name..."
                    className="w-full text-xs px-2.5 py-2 border border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={handleInlineAddCategory}
                  >
                    Add
                  </Button>
                </div>
              ) : (
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="₹ e.g. 1500"
                className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes or details..."
              className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </form>
      </Modal>

      {/* Manage Categories Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCatName(null);
        }}
        title="Manage Expense Categories"
        subtitle="Add, rename, or remove categories for organizing your expenses"
        maxWidth="max-w-md"
        footer={
          <Button
            variant="secondary"
            onClick={() => {
              setIsCategoryModalOpen(false);
              setEditingCatName(null);
            }}
          >
            Done
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="flex items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name (e.g. Fuel, EMI)..."
              className="flex-1 text-sm px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Plus}
              disabled={!newCategoryName.trim()}
            >
              Add
            </Button>
          </form>

          {/* Categories List */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
            {expenseCategories.map((category) => {
              const count = expenses.filter((e) => e.category === category).length;
              const isEditing = editingCatName === category;

              return (
                <div
                  key={category}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        autoFocus
                        value={editingCatValue}
                        onChange={(e) => setEditingCatValue(e.target.value)}
                        className="flex-1 text-xs px-2.5 py-1 border border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEditCategory(category);
                          if (e.key === 'Escape') setEditingCatName(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditCategory(category)}
                        className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition cursor-pointer"
                        title="Save name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCatName(null)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        <Tag className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {category}
                        </span>
                        <span className="text-2xs text-slate-400 dark:text-slate-500">
                          ({count} {count === 1 ? 'expense' : 'expenses'})
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatName(category);
                            setEditingCatValue(category);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition cursor-pointer"
                          title="Rename Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={expenseCategories.length <= 1}
                          onClick={() => setDeleteCatConfirm(category)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Delete Category Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteCatConfirm}
        onClose={() => setDeleteCatConfirm(null)}
        onConfirm={handleDeleteCategory}
        title={`Delete "${deleteCatConfirm}" Category?`}
        message={`Are you sure you want to delete this category? Any expenses currently categorized under "${deleteCatConfirm}" will be automatically moved to "Other".`}
        confirmText="Delete Category"
      />

      {/* Delete Expense Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense Record?"
        message="Are you sure you want to delete this expense record?"
        loading={formSubmitting}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        moduleName="Expenses"
        allData={expenses}
        filteredData={filteredExpenses}
      />
    </div>
  );
}
