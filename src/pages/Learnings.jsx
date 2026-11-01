import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Download,
  Search,
  Edit2,
  Trash2,
  Clock,
  BookOpen,
  LayoutGrid,
  List,
  Award,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { SearchInput } from '../components/common/SearchInput';
import { ExportModal } from '../components/export/ExportModal';

const LEARNING_CATEGORIES = [
  'All',
  'Technology & Coding',
  'Business & Finance',
  'Languages',
  'Design & Creative',
  'Personal Growth',
  'Other',
];

const STATUSES = ['All', 'Not Started', 'In Progress', 'Completed'];

export function Learnings() {
  const { learnings, addLearning, editLearning, removeLearning, logLearningHours } = useData();
  const { can } = useAuth();

  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [logHoursItem, setLogHoursItem] = useState(null);
  const [additionalHours, setAdditionalHours] = useState(1);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State
  const initialForm = {
    title: '',
    category: 'Technology & Coding',
    targetHours: 20,
    completedHours: 0,
    status: 'In Progress',
    notes: '',
  };
  const [formData, setFormData] = useState(initialForm);

  // Filtered list
  const filteredLearnings = useMemo(() => {
    return learnings.filter((item) => {
      const matchesSearch =
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === 'All' || item.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [learnings, searchTerm, categoryFilter, statusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalHours = learnings.reduce((s, l) => s + Number(l.completedHours || 0), 0);
    const completed = learnings.filter((l) => l.status === 'Completed').length;
    const inProgress = learnings.filter((l) => l.status === 'In Progress').length;
    return { totalHours, completed, inProgress, count: learnings.length };
  }, [learnings]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(initialForm);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      targetHours: item.targetHours,
      completedHours: item.completedHours,
      status: item.status,
      notes: item.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      setFormSubmitting(true);
      if (editingItem) {
        await editLearning(editingItem.id, formData);
      } else {
        await addLearning(formData);
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleLogHoursSubmit = async (e) => {
    e.preventDefault();
    if (!logHoursItem) return;
    try {
      setFormSubmitting(true);
      await logLearningHours(logHoursItem.id, Number(additionalHours));
      setLogHoursItem(null);
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
      await removeLearning(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Learning Progress
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Set study goals and track your completed hours and progress.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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

          {can('learnings:create') && (
            <Button
              variant="primary"
              icon={Plus}
              size="sm"
              onClick={handleOpenCreate}
            >
              Add Topic
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Hours Studied"
          value={`${metrics.totalHours} hrs`}
          subtitle="Hours logged"
          trend="Total"
          trendPositive={true}
          icon={Clock}
          iconBg="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          title="Completed Topics"
          value={`${metrics.completed} topics`}
          subtitle="100% finished"
          trend="Done"
          trendPositive={true}
          icon={Award}
          iconBg="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Active Topics"
          value={`${metrics.inProgress} topics`}
          subtitle="Currently studying"
          trend="Active"
          icon={BookOpen}
          iconBg="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors">
        <div className="w-full sm:w-72">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search learning topics..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-medium px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {LEARNING_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-medium px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        filteredLearnings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
            <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No learning topics yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Click "+ Add Topic" above to begin tracking what you are studying.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLearnings.map((item) => {
              const isCompleted = item.status === 'Completed';
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="primary">{item.category}</Badge>
                      <Badge variant={isCompleted ? 'success' : 'sky'}>
                        {item.status}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {item.title}
                    </h3>

                    {item.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60 line-clamp-2">
                        {item.notes}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-400">Progress</span>
                        <span
                          className={
                            isCompleted
                              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }
                        >
                          {item.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <div className="text-2xs text-slate-400 dark:text-slate-500">
                        {item.completedHours} / {item.targetHours} hours completed
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    {can('learnings:edit') && (
                      <button
                        onClick={() => {
                          setLogHoursItem(item);
                          setAdditionalHours(1);
                        }}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-md transition cursor-pointer"
                      >
                        + Log Hours
                      </button>
                    )}

                    <div className="flex items-center gap-1">
                      {can('learnings:edit') && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {can('learnings:delete') && (
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Hours</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {filteredLearnings.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="primary">{item.category}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {item.completedHours} / {item.targetHours}h
                    </td>
                    <td className="py-3.5 px-4 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-2xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                          {item.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={item.status === 'Completed' ? 'success' : 'sky'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {can('learnings:edit') && (
                          <button
                            onClick={() => {
                              setLogHoursItem(item);
                              setAdditionalHours(1);
                            }}
                            className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 font-semibold text-xs transition cursor-pointer"
                          >
                            +Log
                          </button>
                        )}
                        {can('learnings:edit') && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {can('learnings:delete') && (
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Topic Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Edit Learning Topic' : 'Add New Learning Topic'}
        subtitle="Set learning topic and study target in hours"
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
              {editingItem ? 'Save Changes' : 'Save Topic'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Topic / Course Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. React & TypeScript, Data Analysis, Accounting"
              className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {LEARNING_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Target Hours *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.targetHours}
                onChange={(e) => setFormData({ ...formData, targetHours: e.target.value })}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Completed Hours
              </label>
              <input
                type="number"
                min="0"
                value={formData.completedHours}
                onChange={(e) => setFormData({ ...formData, completedHours: e.target.value })}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes or key concepts..."
              className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </form>
      </Modal>

      {/* Quick Log Hours Modal */}
      <Modal
        isOpen={!!logHoursItem}
        onClose={() => setLogHoursItem(null)}
        title={`Log Study Hours: ${logHoursItem?.title || ''}`}
        subtitle="Quickly add study time"
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setLogHoursItem(null)}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleLogHoursSubmit}
              loading={formSubmitting}
            >
              Save Hours
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Currently logged:{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {logHoursItem?.completedHours} of {logHoursItem?.targetHours} hours
            </span>{' '}
            ({logHoursItem?.progress}%).
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Hours Studied
            </label>
            <div className="flex items-center gap-2 mb-3">
              {[1, 2, 3, 5].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setAdditionalHours(h)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    additionalHours === h
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  +{h}h
                </button>
              ))}
            </div>

            <input
              type="number"
              min="0.5"
              step="0.5"
              value={additionalHours}
              onChange={(e) => setAdditionalHours(e.target.value)}
              className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Topic?"
        message="Are you sure you want to remove this learning topic?"
        loading={formSubmitting}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        moduleName="Learnings"
        allData={learnings}
        filteredData={filteredLearnings}
      />
    </div>
  );
}
