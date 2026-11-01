import React, { useState, useMemo } from 'react';
import {
  Users as UsersIcon,
  Plus,
  Download,
  Search,
  Edit2,
  Trash2,
  Shield,
  Building,
  Mail,
  UserCheck,
  XCircle,
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

export function Users() {
  const { users, roles, addUser, editUser, removeUser } = useData();
  const { currentUser, can } = useAuth();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State
  const initialForm = {
    name: '',
    email: '',
    role: 'member',
    status: 'Active',
    department: 'Operations',
    avatar: '',
  };
  const [formData, setFormData] = useState(initialForm);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Metrics
  const metrics = useMemo(() => {
    const active = users.filter((u) => u.status === 'Active').length;
    const inactive = users.filter((u) => u.status === 'Inactive').length;
    return { total: users.length, active, inactive, rolesCount: roles.length };
  }, [users, roles]);

  const getRoleName = (roleId) => {
    const r = roles.find((role) => role.id === roleId);
    return r ? r.name : roleId;
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(initialForm);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingItem(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'Active',
      department: user.department || '',
      avatar: user.avatar || '',
    });
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (user) => {
    if (!can('users:edit')) return;
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    await editUser(user.id, { status: nextStatus });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    try {
      setFormSubmitting(true);
      if (editingItem) {
        await editUser(editingItem.id, formData);
      } else {
        await addUser(formData);
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
      await removeUser(deleteConfirmId);
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
            User Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage system operators, assign RBAC access roles, and control account statuses.
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

          {can('users:create') && (
            <Button
              variant="primary"
              icon={Plus}
              size="sm"
              onClick={handleOpenCreate}
            >
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={`${metrics.total} accounts`}
          subtitle="Registered operators"
          trend="Registered"
          trendPositive={true}
          icon={UsersIcon}
          iconBg="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          title="Active Accounts"
          value={`${metrics.active} active`}
          subtitle="Operational status"
          trend="Healthy"
          trendPositive={true}
          icon={UserCheck}
          iconBg="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Inactive Accounts"
          value={`${metrics.inactive} inactive`}
          subtitle="Suspended or archived"
          trend="Inactive"
          trendPositive={false}
          icon={XCircle}
          iconBg="bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
        />
        <StatCard
          title="Configured Roles"
          value={`${metrics.rolesCount} roles`}
          subtitle="RBAC security levels"
          trend="Governed"
          icon={Shield}
          iconBg="bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="w-full md:w-72">
            <SearchInput
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, department..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-medium px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-medium px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No users found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Try adjusting filters or add a user account.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isCurrent = currentUser?.id === user.id;
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              user.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                            }
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {user.name}
                              </span>
                              {isCurrent && (
                                <span className="text-2xs font-bold px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-2xs text-slate-400 dark:text-slate-500 font-normal flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                              <span>{user.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            user.role === 'admin'
                              ? 'purple'
                              : 'neutral'
                          }
                        >
                          {getRoleName(user.role)}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{user.department || 'General'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={!can('users:edit') || isCurrent}
                          className="cursor-pointer group inline-flex items-center"
                          title="Click to toggle status"
                        >
                          <Badge
                            variant={user.status === 'Active' ? 'success' : 'danger'}
                            className="group-hover:opacity-80 transition"
                          >
                            {user.status || 'Active'}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs font-mono">
                        {user.createdAt ? user.createdAt.split('T')[0] : '2026-01-01'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {can('users:edit') && (
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition cursor-pointer"
                              title="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {can('users:delete') && !isCurrent && (
                            <button
                              onClick={() => setDeleteConfirmId(user.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredUsers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Edit User Profile' : 'Add New User'}
        subtitle="Configure user credentials and security role"
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
              {editingItem ? 'Save Changes' : 'Create Account'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Maya Lin"
              className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@focushub.io"
              className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Assigned Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Account Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Department / Team
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g. Operations, Finance"
              className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete User Account?"
        message="Are you sure you want to permanently remove this user account?"
        loading={formSubmitting}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        moduleName="Users"
        allData={users}
        filteredData={filteredUsers}
      />
    </div>
  );
}
