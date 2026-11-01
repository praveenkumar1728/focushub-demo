import initialData from '../data/initialData.json';

const DEFAULT_EXPENSE_CATEGORIES = [
  'Food',
  'Rent',
  'Bills & Utilities',
  'Shopping',
  'Travel',
  'Health',
  'Education',
  'Other',
];

const STORAGE_KEYS = {
  INCOME: 'focushub_v1_income',
  EXPENSES: 'focushub_v1_expenses',
  EXPENSE_CATEGORIES: 'focushub_v1_expense_categories',
  LEARNINGS: 'focushub_v1_learnings',
  USERS: 'focushub_v1_users',
  ROLES: 'focushub_v1_roles',
  ACTIVE_USER: 'focushub_v1_active_user',
  VERSION: 'focushub_v1_schema_v2',
};

/**
 * Storage service providing robust LocalStorage persistence.
 * Starts with clean empty data in Indian Rupees (₹).
 */
export const storageService = {
  init() {
    try {
      const currentVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
      if (!currentVersion) {
        this.resetToDefaults();
      }
      // Ensure categories exist
      if (!localStorage.getItem(STORAGE_KEYS.EXPENSE_CATEGORIES)) {
        localStorage.setItem(
          STORAGE_KEYS.EXPENSE_CATEGORIES,
          JSON.stringify(DEFAULT_EXPENSE_CATEGORIES)
        );
      }
    } catch (e) {
      console.warn('LocalStorage not accessible', e);
    }
  },

  resetToDefaults() {
    try {
      localStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
      localStorage.setItem(
        STORAGE_KEYS.EXPENSE_CATEGORIES,
        JSON.stringify(DEFAULT_EXPENSE_CATEGORIES)
      );
      localStorage.setItem(STORAGE_KEYS.LEARNINGS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialData.users));
      localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(initialData.roles));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(initialData.users[0]));
      localStorage.setItem(STORAGE_KEYS.VERSION, 'v2_rupees_clean');
    } catch (e) {
      console.error('Error resetting storage', e);
    }
  },

  getItem(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error(`Error reading key ${key} from storage:`, e);
      return fallback;
    }
  },

  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing key ${key} to storage:`, e);
    }
  },

  // Income
  getIncome() {
    return this.getItem(STORAGE_KEYS.INCOME, []);
  },
  saveIncome(data) {
    this.setItem(STORAGE_KEYS.INCOME, data);
  },

  // Expenses
  getExpenses() {
    return this.getItem(STORAGE_KEYS.EXPENSES, []);
  },
  saveExpenses(data) {
    this.setItem(STORAGE_KEYS.EXPENSES, data);
  },

  // Expense Categories
  getExpenseCategories() {
    return this.getItem(STORAGE_KEYS.EXPENSE_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES);
  },
  saveExpenseCategories(data) {
    this.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, data);
  },

  // Learnings
  getLearnings() {
    return this.getItem(STORAGE_KEYS.LEARNINGS, []);
  },
  saveLearnings(data) {
    this.setItem(STORAGE_KEYS.LEARNINGS, data);
  },

  // Users
  getUsers() {
    return this.getItem(STORAGE_KEYS.USERS, initialData.users);
  },
  saveUsers(data) {
    this.setItem(STORAGE_KEYS.USERS, data);
  },

  // Roles
  getRoles() {
    return this.getItem(STORAGE_KEYS.ROLES, initialData.roles);
  },
  saveRoles(data) {
    this.setItem(STORAGE_KEYS.ROLES, data);
  },

  // Active User / Session
  getActiveUser() {
    return this.getItem(STORAGE_KEYS.ACTIVE_USER, initialData.users[0]);
  },
  setActiveUser(user) {
    this.setItem(STORAGE_KEYS.ACTIVE_USER, user);
  },
  clearActiveUser() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    } catch (e) {
      console.error('Error clearing active user:', e);
    }
  },
};

// Initialize
storageService.init();
