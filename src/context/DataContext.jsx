import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { storageService } from '../services/storageService';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const toast = useToast();
  const { refreshRoles, currentUser, switchUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [learnings, setLearnings] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  // Load all initial state
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [inc, exp, expCats, lrn, usr, rls] = await Promise.all([
        api.getIncome(),
        api.getExpenses(),
        api.getExpenseCategories(),
        api.getLearnings(),
        api.getUsers(),
        api.getRoles(),
      ]);
      setIncome(inc);
      setExpenses(exp);
      setExpenseCategories(expCats);
      setLearnings(lrn);
      setUsers(usr);
      setRoles(rls);
    } catch (err) {
      console.error('Failed to load FocusHub records:', err);
      toast.error('Failed to load records from storage.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // -------------------------------------------------------------
  // INCOME OPERATIONS
  // -------------------------------------------------------------
  const addIncome = async (data) => {
    try {
      const created = await api.createIncome(data);
      setIncome((prev) => [created, ...prev]);
      toast.success('Income recorded successfully.');
      return created;
    } catch (e) {
      toast.error('Failed to create income record.');
      throw e;
    }
  };

  const editIncome = async (id, data) => {
    try {
      const updated = await api.updateIncome(id, data);
      setIncome((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success('Income record updated.');
      return updated;
    } catch (e) {
      toast.error('Failed to update income record.');
      throw e;
    }
  };

  const removeIncome = async (id) => {
    try {
      await api.deleteIncome(id);
      setIncome((prev) => prev.filter((item) => item.id !== id));
      toast.success('Income record deleted.');
    } catch (e) {
      toast.error('Failed to delete income record.');
      throw e;
    }
  };

  // -------------------------------------------------------------
  // EXPENSE OPERATIONS
  // -------------------------------------------------------------
  const addExpense = async (data) => {
    try {
      const created = await api.createExpense(data);
      setExpenses((prev) => [created, ...prev]);
      toast.success('Expense recorded successfully.');
      return created;
    } catch (e) {
      toast.error('Failed to record expense.');
      throw e;
    }
  };

  const editExpense = async (id, data) => {
    try {
      const updated = await api.updateExpense(id, data);
      setExpenses((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success('Expense record updated.');
      return updated;
    } catch (e) {
      toast.error('Failed to update expense.');
      throw e;
    }
  };

  const removeExpense = async (id) => {
    try {
      await api.deleteExpense(id);
      setExpenses((prev) => prev.filter((item) => item.id !== id));
      toast.success('Expense record deleted.');
    } catch (e) {
      toast.error('Failed to delete expense.');
      throw e;
    }
  };

  // -------------------------------------------------------------
  // EXPENSE CATEGORY OPERATIONS
  // -------------------------------------------------------------
  const addExpenseCategory = async (name) => {
    try {
      const updatedList = await api.createExpenseCategory(name);
      setExpenseCategories([...updatedList]);
      toast.success(`Category "${name}" added.`);
      return updatedList;
    } catch (e) {
      toast.error(e.message || 'Failed to add category.');
      throw e;
    }
  };

  const editExpenseCategory = async (oldName, newName) => {
    try {
      const updatedList = await api.updateExpenseCategory(oldName, newName);
      setExpenseCategories([...updatedList]);
      // Also update expenses in local state if category name changed
      const updatedExpenses = await api.getExpenses();
      setExpenses(updatedExpenses);
      toast.success(`Renamed category to "${newName}".`);
      return updatedList;
    } catch (e) {
      toast.error(e.message || 'Failed to update category.');
      throw e;
    }
  };

  const deleteExpenseCategory = async (name) => {
    try {
      const updatedList = await api.deleteExpenseCategory(name);
      setExpenseCategories([...updatedList]);
      const updatedExpenses = await api.getExpenses();
      setExpenses(updatedExpenses);
      toast.success(`Category "${name}" removed.`);
      return updatedList;
    } catch (e) {
      toast.error(e.message || 'Failed to delete category.');
      throw e;
    }
  };

  // -------------------------------------------------------------
  // LEARNING OPERATIONS
  // -------------------------------------------------------------
  const addLearning = async (data) => {
    try {
      const created = await api.createLearning(data);
      setLearnings((prev) => [created, ...prev]);
      toast.success('Learning topic added.');
      return created;
    } catch (e) {
      toast.error('Failed to add learning topic.');
      throw e;
    }
  };

  const editLearning = async (id, data) => {
    try {
      const updated = await api.updateLearning(id, data);
      setLearnings((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success('Learning progress updated.');
      return updated;
    } catch (e) {
      toast.error('Failed to update learning.');
      throw e;
    }
  };

  const logLearningHours = async (id, hours) => {
    try {
      const updated = await api.logLearningHours(id, hours);
      setLearnings((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success(`Logged ${hours} study hours successfully.`);
      return updated;
    } catch (e) {
      toast.error('Failed to log learning hours.');
      throw e;
    }
  };

  const removeLearning = async (id) => {
    try {
      await api.deleteLearning(id);
      setLearnings((prev) => prev.filter((item) => item.id !== id));
      toast.success('Learning topic removed.');
    } catch (e) {
      toast.error('Failed to delete learning topic.');
      throw e;
    }
  };

  // -------------------------------------------------------------
  // USER OPERATIONS
  // -------------------------------------------------------------
  const addUser = async (data) => {
    try {
      const created = await api.createUser(data);
      setUsers((prev) => [created, ...prev]);
      toast.success('User account created.');
      return created;
    } catch (e) {
      toast.error('Failed to create user.');
      throw e;
    }
  };

  const editUser = async (id, data) => {
    try {
      const updated = await api.updateUser(id, data);
      setUsers((prev) => prev.map((item) => (item.id === id ? updated : item)));
      if (currentUser?.id === id) {
        switchUser(updated);
      }
      toast.success('User profile updated.');
      return updated;
    } catch (e) {
      toast.error('Failed to update user.');
      throw e;
    }
  };

  const removeUser = async (id) => {
    try {
      if (currentUser?.id === id) {
        toast.error('You cannot delete your own active account.');
        return;
      }
      await api.deleteUser(id);
      setUsers((prev) => prev.filter((item) => item.id !== id));
      toast.success('User removed from system.');
    } catch (e) {
      toast.error('Failed to delete user.');
      throw e;
    }
  };

  // -------------------------------------------------------------
  // ROLE OPERATIONS
  // -------------------------------------------------------------
  const addRole = async (data) => {
    try {
      const created = await api.createRole(data);
      setRoles((prev) => [...prev, created]);
      refreshRoles();
      toast.success(`Role '${data.name}' created.`);
      return created;
    } catch (e) {
      toast.error('Failed to create role.');
      throw e;
    }
  };

  const editRole = async (id, data) => {
    try {
      const updated = await api.updateRole(id, data);
      setRoles((prev) => prev.map((item) => (item.id === id ? updated : item)));
      refreshRoles();
      toast.success('Role permissions updated.');
      return updated;
    } catch (e) {
      toast.error('Failed to update role.');
      throw e;
    }
  };

  const removeRole = async (id) => {
    try {
      await api.deleteRole(id);
      setRoles((prev) => prev.filter((item) => item.id !== id));
      refreshRoles();
      toast.success('Custom role removed.');
    } catch (e) {
      toast.error(e.message || 'Failed to remove role.');
      throw e;
    }
  };

  // Reset entire application data
  const resetAllData = async () => {
    try {
      await api.resetAllData();
      await loadAllData();
      const defaultUser = storageService.getActiveUser();
      switchUser(defaultUser);
      toast.success('FocusHub reset to clean state.');
    } catch (e) {
      toast.error('Failed to reset data.');
    }
  };

  const value = {
    loading,
    income,
    expenses,
    expenseCategories,
    learnings,
    users,
    roles,
    addIncome,
    editIncome,
    removeIncome,
    addExpense,
    editExpense,
    removeExpense,
    addExpenseCategory,
    editExpenseCategory,
    deleteExpenseCategory,
    addLearning,
    editLearning,
    logLearningHours,
    removeLearning,
    addUser,
    editUser,
    removeUser,
    addRole,
    editRole,
    removeRole,
    resetAllData,
    reload: loadAllData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
