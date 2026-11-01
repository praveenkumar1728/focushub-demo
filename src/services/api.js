import { storageService } from './storageService';

/**
 * FocusHub API Client.
 *
 * Asynchronous Promise interface mirroring future NestJS REST endpoints
 * (e.g. GET /api/v1/income, POST /api/v1/expenses, etc.).
 * Currently powered by storageService (LocalStorage persistence), ready for instant drop-in
 * replacement with fetch/axios once NestJS & MySQL are connected.
 */

export const api = {
  // -------------------------------------------------------------
  // DASHBOARD
  // -------------------------------------------------------------
  async getDashboardSummary() {
    const income = storageService.getIncome();
    const expenses = storageService.getExpenses();
    const learnings = storageService.getLearnings();
    const users = storageService.getUsers();

    const totalIncome = income.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    const totalLearningHours = learnings.reduce(
      (sum, l) => sum + Number(l.completedHours || 0),
      0
    );
    const completedTopics = learnings.filter((l) => l.status === 'Completed').length;
    const inProgressTopics = learnings.filter((l) => l.status === 'In Progress').length;

    // Recent activities (sorted by date desc)
    const recentIncome = income.map((i) => ({ ...i, type: 'income' }));
    const recentExpenses = expenses.map((e) => ({ ...e, type: 'expense' }));
    const recentActivity = [...recentIncome, ...recentExpenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);

    return {
      financials: {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
      },
      learnings: {
        totalTopics: learnings.length,
        completedTopics,
        inProgressTopics,
        totalLearningHours,
      },
      usersCount: users.length,
      recentActivity,
    };
  },

  // -------------------------------------------------------------
  // INCOME CRUD
  // -------------------------------------------------------------
  async getIncome() {
    return storageService.getIncome();
  },

  async createIncome(data) {
    const items = storageService.getIncome();
    const newItem = {
      ...data,
      id: `inc_${Date.now()}`,
      amount: Number(data.amount) || 0,
      createdAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    storageService.saveIncome(items);
    return newItem;
  },

  async updateIncome(id, data) {
    const items = storageService.getIncome();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Income record not found');
    const updated = {
      ...items[index],
      ...data,
      amount: Number(data.amount) || 0,
      updatedAt: new Date().toISOString(),
    };
    items[index] = updated;
    storageService.saveIncome(items);
    return updated;
  },

  async deleteIncome(id) {
    const items = storageService.getIncome();
    const filtered = items.filter((i) => i.id !== id);
    storageService.saveIncome(filtered);
    return { success: true, id };
  },

  // -------------------------------------------------------------
  // EXPENSES CRUD
  // -------------------------------------------------------------
  async getExpenses() {
    return storageService.getExpenses();
  },

  async createExpense(data) {
    const items = storageService.getExpenses();
    const newItem = {
      ...data,
      id: `exp_${Date.now()}`,
      amount: Number(data.amount) || 0,
      createdAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    storageService.saveExpenses(items);
    return newItem;
  },

  async updateExpense(id, data) {
    const items = storageService.getExpenses();
    const index = items.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Expense record not found');
    const updated = {
      ...items[index],
      ...data,
      amount: Number(data.amount) || 0,
      updatedAt: new Date().toISOString(),
    };
    items[index] = updated;
    storageService.saveExpenses(items);
    return updated;
  },

  async deleteExpense(id) {
    const items = storageService.getExpenses();
    const filtered = items.filter((e) => e.id !== id);
    storageService.saveExpenses(filtered);
    return { success: true, id };
  },

  // -------------------------------------------------------------
  // EXPENSE CATEGORIES
  // -------------------------------------------------------------
  async getExpenseCategories() {
    return storageService.getExpenseCategories();
  },

  async createExpenseCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Category name cannot be empty');
    const categories = storageService.getExpenseCategories();
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('Category already exists');
    }
    categories.push(trimmed);
    storageService.saveExpenseCategories(categories);
    return categories;
  },

  async updateExpenseCategory(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed) throw new Error('Category name cannot be empty');
    const categories = storageService.getExpenseCategories();
    const index = categories.findIndex((c) => c.toLowerCase() === oldName.toLowerCase());
    if (index === -1) throw new Error('Category not found');
    categories[index] = trimmed;
    storageService.saveExpenseCategories(categories);

    // Also update existing expenses with this category
    const expenses = storageService.getExpenses();
    let changed = false;
    expenses.forEach((e) => {
      if (e.category === oldName) {
        e.category = trimmed;
        changed = true;
      }
    });
    if (changed) storageService.saveExpenses(expenses);

    return categories;
  },

  async deleteExpenseCategory(name) {
    const categories = storageService.getExpenseCategories();
    if (categories.length <= 1) {
      throw new Error('You must keep at least one category');
    }
    const filtered = categories.filter((c) => c !== name);
    storageService.saveExpenseCategories(filtered);

    // Reassign any expenses in this deleted category
    const fallbackCategory = filtered.includes('Other') ? 'Other' : filtered[0];
    const expenses = storageService.getExpenses();
    let changed = false;
    expenses.forEach((e) => {
      if (e.category === name) {
        e.category = fallbackCategory;
        changed = true;
      }
    });
    if (changed) storageService.saveExpenses(expenses);

    return filtered;
  },

  // -------------------------------------------------------------
  // LEARNINGS CRUD
  // -------------------------------------------------------------
  async getLearnings() {
    return storageService.getLearnings();
  },

  async createLearning(data) {
    const items = storageService.getLearnings();
    const targetHours = Number(data.targetHours) || 1;
    const completedHours = Number(data.completedHours) || 0;
    const progress = Math.min(100, Math.round((completedHours / targetHours) * 100));

    const newItem = {
      ...data,
      id: `lrn_${Date.now()}`,
      targetHours,
      completedHours,
      progress,
      status: data.status || (progress >= 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'),
      createdAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    storageService.saveLearnings(items);
    return newItem;
  },

  async updateLearning(id, data) {
    const items = storageService.getLearnings();
    const index = items.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Learning record not found');

    const targetHours = Number(data.targetHours) || items[index].targetHours || 1;
    const completedHours = Number(data.completedHours) || items[index].completedHours || 0;
    const progress = Math.min(100, Math.round((completedHours / targetHours) * 100));

    let status = data.status || items[index].status;
    if (progress >= 100 && status !== 'Completed') {
      status = 'Completed';
    }

    const updated = {
      ...items[index],
      ...data,
      targetHours,
      completedHours,
      progress,
      status,
      updatedAt: new Date().toISOString(),
    };
    items[index] = updated;
    storageService.saveLearnings(items);
    return updated;
  },

  async deleteLearning(id) {
    const items = storageService.getLearnings();
    const filtered = items.filter((l) => l.id !== id);
    storageService.saveLearnings(filtered);
    return { success: true, id };
  },

  async logLearningHours(id, additionalHours) {
    const items = storageService.getLearnings();
    const item = items.find((l) => l.id === id);
    if (!item) throw new Error('Learning record not found');

    const completedHours = Math.max(0, Number(item.completedHours || 0) + Number(additionalHours));
    const targetHours = Number(item.targetHours) || 1;
    const progress = Math.min(100, Math.round((completedHours / targetHours) * 100));
    const status = progress >= 100 ? 'Completed' : 'In Progress';

    return this.updateLearning(id, {
      completedHours,
      progress,
      status,
    });
  },

  // -------------------------------------------------------------
  // USERS CRUD
  // -------------------------------------------------------------
  async getUsers() {
    return storageService.getUsers();
  },

  async createUser(data) {
    const items = storageService.getUsers();
    const newItem = {
      ...data,
      id: `usr_${Date.now()}`,
      status: data.status || 'Active',
      createdAt: new Date().toISOString(),
      avatar:
        data.avatar ||
        `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 100000)}?w=150&auto=format&fit=crop&q=80`,
    };
    items.unshift(newItem);
    storageService.saveUsers(items);
    return newItem;
  },

  async updateUser(id, data) {
    const items = storageService.getUsers();
    const index = items.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('User not found');
    const updated = {
      ...items[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    items[index] = updated;
    storageService.saveUsers(items);

    const activeUser = storageService.getActiveUser();
    if (activeUser && activeUser.id === id) {
      storageService.setActiveUser(updated);
    }

    return updated;
  },

  async deleteUser(id) {
    const items = storageService.getUsers();
    const filtered = items.filter((u) => u.id !== id);
    storageService.saveUsers(filtered);
    return { success: true, id };
  },

  // -------------------------------------------------------------
  // ROLES & PERMISSIONS
  // -------------------------------------------------------------
  async getRoles() {
    return storageService.getRoles();
  },

  async createRole(data) {
    const items = storageService.getRoles();
    const newRole = {
      ...data,
      id: data.id || `role_${Date.now()}`,
      isSystem: false,
      permissions: data.permissions || [],
    };
    items.push(newRole);
    storageService.saveRoles(items);
    return newRole;
  },

  async updateRole(id, data) {
    const items = storageService.getRoles();
    const index = items.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Role not found');
    const updated = {
      ...items[index],
      ...data,
    };
    items[index] = updated;
    storageService.saveRoles(items);
    return updated;
  },

  async deleteRole(id) {
    const items = storageService.getRoles();
    const target = items.find((r) => r.id === id);
    if (target?.isSystem) {
      throw new Error('System roles cannot be deleted');
    }
    const filtered = items.filter((r) => r.id !== id);
    storageService.saveRoles(filtered);
    return { success: true, id };
  },

  async resetAllData() {
    storageService.resetToDefaults();
    return true;
  },
};
