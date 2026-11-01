import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  Users,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Card } from '../components/common/Card';
import initialData from '../data/initialData.json';

export function Permissions() {
  const { roles, addRole, editRole, removeRole, users } = useData();
  const { can } = useAuth();

  const permissionsList = initialData.permissionDefinitions;

  // Group permissions by module
  const groupedPermissions = permissionsList.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  // Modals state
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteConfirmRoleId, setDeleteConfirmRoleId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [],
  });

  const handleOpenAddRole = () => {
    setRoleForm({
      name: '',
      description: '',
      permissions: ['income:view', 'expenses:view', 'learnings:view'],
    });
    setIsAddRoleOpen(true);
  };

  const handleOpenEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
    });
  };

  const handleTogglePermission = async (role, permissionId) => {
    if (role.id === 'admin') return; // Admin has permanent full access
    if (!can('permissions:manage')) return;

    const hasPerm = role.permissions.includes(permissionId);
    const updatedPermissions = hasPerm
      ? role.permissions.filter((p) => p !== permissionId)
      : [...role.permissions, permissionId];

    await editRole(role.id, { permissions: updatedPermissions });
  };

  const handleCreateRoleSubmit = async (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) return;

    try {
      setSubmitting(true);
      const roleId = roleForm.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await addRole({
        id: `custom_${roleId}_${Date.now()}`,
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions,
      });
      setIsAddRoleOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRoleSubmit = async (e) => {
    e.preventDefault();
    if (!editingRole || !roleForm.name.trim()) return;

    try {
      setSubmitting(true);
      await editRole(editingRole.id, {
        name: roleForm.name,
        description: roleForm.description,
      });
      setEditingRole(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoleConfirm = async () => {
    if (!deleteConfirmRoleId) return;
    try {
      setSubmitting(true);
      await removeRole(deleteConfirmRoleId);
      setDeleteConfirmRoleId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Roles & Permissions Matrix
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure access control policies, module boundaries, and custom permission profiles.
          </p>
        </div>

        {can('permissions:manage') && (
          <Button
            variant="primary"
            icon={Plus}
            size="sm"
            onClick={handleOpenAddRole}
          >
            Create Custom Role
          </Button>
        )}
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const userCount = users.filter((u) => u.role === role.id).length;
          const isSystem = role.isSystem;
          return (
            <div
              key={role.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {role.name}
                    </h3>
                    {isSystem && (
                      <span className="text-2xs font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                        System
                      </span>
                    )}
                  </div>
                  <Badge variant="primary" size="sm">
                    {role.permissions.length} perms
                  </Badge>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {role.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>
                    {userCount} assigned {userCount === 1 ? 'user' : 'users'}
                  </span>
                </span>

                <div className="flex items-center gap-1">
                  {!isSystem && can('permissions:manage') && (
                    <>
                      <button
                        onClick={() => handleOpenEditRole(role)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                        title="Edit Role Name & Description"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmRoleId(role.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                        title="Delete Custom Role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions Matrix Table */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100">Access Matrix</span>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                Click any checkbox to grant or revoke privileges for that role.
              </p>
            </div>
            {can('permissions:manage') && (
              <Badge variant="success" size="sm">
                Live Editing Enabled
              </Badge>
            )}
          </div>
        }
      >
        <div className="overflow-x-auto -mx-5 -my-5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-2xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3 px-5 w-72">Permission Privilege</th>
                {roles.map((role) => (
                  <th key={role.id} className="py-3 px-4 text-center font-semibold">
                    <span className="whitespace-nowrap">{role.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                <React.Fragment key={moduleName}>
                  {/* Module Group Header */}
                  <tr className="bg-slate-50/80 dark:bg-slate-950/60">
                    <td
                      colSpan={roles.length + 1}
                      className="py-2 px-5 font-bold text-2xs uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/40"
                    >
                      {moduleName} Module
                    </td>
                  </tr>

                  {/* Permission Rows */}
                  {perms.map((perm) => (
                    <tr
                      key={perm.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-5">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {perm.label}
                        </p>
                        <p className="text-2xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {perm.description}
                        </p>
                      </td>

                      {roles.map((role) => {
                        const isGranted =
                          role.id === 'admin' || role.permissions.includes(perm.id);
                        const isLocked = role.id === 'admin' || !can('permissions:manage');

                        return (
                          <td key={role.id} className="py-3 px-4 text-center">
                            {isLocked ? (
                              <div
                                className="inline-flex items-center justify-center cursor-not-allowed"
                                title={
                                  role.id === 'admin'
                                    ? 'Administrator has full privileges'
                                    : 'Manage permissions privilege required'
                                }
                              >
                                {isGranted ? (
                                  <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 flex items-center justify-center mx-auto">
                                    <span className="text-2xs font-bold">-</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTogglePermission(role, perm.id)}
                                className={`w-5 h-5 rounded-md flex items-center justify-center mx-auto transition cursor-pointer ${
                                  isGranted
                                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-2xs hover:bg-indigo-700'
                                    : 'border border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-800'
                                }`}
                                aria-label={`Toggle ${perm.label} for ${role.name}`}
                              >
                                {isGranted && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Custom Role Modal */}
      <Modal
        isOpen={isAddRoleOpen}
        onClose={() => setIsAddRoleOpen(false)}
        title="Create New Custom Role"
        subtitle="Define a specialized permission policy for team members"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsAddRoleOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateRoleSubmit}
              loading={submitting}
            >
              Save Custom Role
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRoleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Role Name *
            </label>
            <input
              type="text"
              required
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              placeholder="e.g. Project Lead, Accountant"
              className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows="2"
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              placeholder="Describe role responsibilities..."
              className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Initial Permissions
            </label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2 bg-slate-50/50 dark:bg-slate-950/40">
              {permissionsList.map((perm) => {
                const checked = roleForm.permissions.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const newPerms = e.target.checked
                          ? [...roleForm.permissions, perm.id]
                          : roleForm.permissions.filter((p) => p !== perm.id);
                        setRoleForm({ ...roleForm, permissions: newPerms });
                      }}
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium">{perm.label}</span>
                    <span className="text-2xs text-slate-400 dark:text-slate-500">
                      ({perm.module})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        title={`Edit Role: ${editingRole?.name}`}
        subtitle="Modify role metadata"
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditingRole(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditRoleSubmit}
              loading={submitting}
            >
              Update Role
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditRoleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Role Name *
            </label>
            <input
              type="text"
              required
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows="3"
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              className="w-full text-sm px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmRoleId}
        onClose={() => setDeleteConfirmRoleId(null)}
        onConfirm={handleDeleteRoleConfirm}
        title="Delete Custom Role?"
        message="Are you sure you want to delete this custom role?"
        loading={submitting}
      />
    </div>
  );
}
