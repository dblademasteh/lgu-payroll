import { useState, useEffect } from 'react';
import { Search, Filter, Edit, Trash2, UserPlus, Loader2, Save, RotateCcw } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import { getEmployees, getEmployeeDepartments, createEmployee, updateEmployee, deleteEmployee } from '../api/employees.js';
import { formatCurrency } from '../lib/format.js';
import { getStatusTone } from '../lib/tones.js';

export default function Employees() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    employeeNumber: '',
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    department: '',
    position: '',
    hiredDate: '',
    monthlySalary: '',
    status: 'ACTIVE',
  });
  const [formErrors, setFormErrors] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Load departments for filter and form
  useEffect(() => {
    async function loadDepartments() {
      try {
        const res = await getEmployeeDepartments();
        setDepartments(res.data || []);
      } catch (e) {
        console.error('Failed to load departments:', e);
      }
    }
    loadDepartments();
  }, []);

  // Load employees
  useEffect(() => {
    loadEmployees();
  }, [pagination.page, deptFilter, statusFilter]);

  async function loadEmployees() {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (deptFilter && deptFilter !== 'all') params.department = deptFilter;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const res = await getEmployees(params);
      setEmployees(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      console.error('Failed to load employees:', e);
      toast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch = `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeNumber.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  function handleAdd() {
    setEditing(null);
    setFormData({
      employeeNumber: '',
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      department: '',
      position: '',
      hiredDate: new Date().toISOString().slice(0, 10),
      monthlySalary: '',
      status: 'ACTIVE',
    });
    setFormErrors({});
    setShowModal(true);
  }

  function handleEdit(emp) {
    setEditing(emp);
    setFormData({
      employeeNumber: emp.employeeNumber,
      firstName: emp.firstName,
      lastName: emp.lastName,
      middleName: emp.middleName || '',
      email: emp.email || '',
      department: emp.department || '',
      position: emp.position || '',
      hiredDate: emp.hiredDate ? new Date(emp.hiredDate).toISOString().slice(0, 10) : '',
      monthlySalary: String(emp.monthlySalary),
      status: emp.status,
    });
    setFormErrors({});
    setShowModal(true);
  }

  function validateForm() {
    const errors = {};
    if (!formData.employeeNumber.trim()) errors.employeeNumber = 'Employee number is required';
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    if (!formData.hiredDate) errors.hiredDate = 'Hired date is required';
    if (!formData.monthlySalary || Number(formData.monthlySalary) < 0) errors.monthlySalary = 'Valid salary is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setSaveLoading(true);
    try {
      const payload = {
        employeeNumber: formData.employeeNumber.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.middleName.trim() || null,
        email: formData.email.trim() || null,
        department: formData.department || null,
        position: formData.position || null,
        hiredDate: formData.hiredDate,
        monthlySalary: Number(formData.monthlySalary),
        status: formData.status,
      };

      if (editing) {
        await updateEmployee(editing.id, payload);
        toast('Employee updated', 'success');
      } else {
        await createEmployee(payload);
        toast('Employee created', 'success');
      }
      setShowModal(false);
      loadEmployees();
    } catch (e) {
      const msg = e?.response?.data?.error?.message || (editing ? 'Failed to update employee' : 'Failed to create employee');
      toast(msg, 'error');
      if (e?.response?.data?.error?.code === 'DUPLICATE') {
        setFormErrors({ employeeNumber: 'An employee with this number already exists' });
      }
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleDelete(emp) {
    setDeleteLoading(emp.id);
    try {
      await deleteEmployee(emp.id);
      toast('Employee deleted (soft delete)', 'success');
      loadEmployees();
    } catch (e) {
      const msg = e?.response?.data?.error?.message || 'Failed to delete employee';
      toast(msg, 'error');
    } finally {
      setDeleteLoading(null);
      setConfirmDelete(null);
    }
  }

  async function handleRehire(emp) {
    // Rehire is done by updating status to ACTIVE and clearing deletedAt
    // For now, we'll just show info - the backend handles revival on re-creation with same employeeNumber
    toast('Rehire: Create a new employee with the same employee number to revive', 'info');
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-ink text-2xl">Employees</h1>
          <p className="text-sm text-muted mt-0.5">Manage employee records and compensation</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleAdd}>
          <UserPlus size={16} aria-hidden="true" /> Add Employee
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-line flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search employees..."
              className="input pl-9 pr-4"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="text-muted" size={16} aria-hidden="true" />
            <select
              className="select pr-8"
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="all">All Departments</option>
              {departments.map((d) => <option key={d.name} value={d.name}>{d.name} ({d.count})</option>)}
            </select>
            <select
              className="select pr-8"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        <table className="data-table min-w-[800px]">
            <thead>
              <tr>
                <th>Employee No.</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Position</th>
                <th>Hired</th>
                <th>Monthly Salary</th>
                <th>Status</th>
                <th className="w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-muted">
                      <Loader2 size={20} className="animate-spin" />
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState title="No employees found" />
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((e) => (
                  <tr key={e.id} data-selectable="true">
                    <td className="font-mono text-sm">{e.employeeNumber}</td>
                    <td className="font-medium text-ink">
                      {e.firstName} {e.middleName ? e.middleName[0] + '. ' : ''}{e.lastName}
                    </td>
                    <td className="text-sm">{e.email || '—'}</td>
                    <td>{e.department || '—'}</td>
                    <td className="text-sm">{e.position || '—'}</td>
                    <td className="font-mono text-sm">{e.hiredDate ? new Date(e.hiredDate).toLocaleDateString() : '—'}</td>
                    <td className="font-mono">{formatCurrency(e.monthlySalary)}</td>
                    <td><Badge tone={getStatusTone(e.status, 'employee')}>{e.status}</Badge></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost p-1.5"
                          onClick={() => handleEdit(e)}
                          title="Edit"
                          disabled={deleteLoading === e.id}
                        >
                          <Edit size={14} aria-hidden="true" />
                        </button>
                        {e.status === 'INACTIVE' && !e.deletedAt ? (
                          <button
                            type="button"
                            className="btn btn-accent btn-sm px-2 py-1.5 text-xs"
                            onClick={() => handleRehire(e)}
                            title="Rehire/Revive"
                          >
                            <RotateCcw size={12} aria-hidden="true" /> Revive
                          </button>
                        ) : e.deletedAt ? (
                          <button
                            type="button"
                            className="btn btn-accent btn-sm px-2 py-1.5 text-xs"
                            onClick={() => handleRehire(e)}
                            title="Revive deleted employee"
                          >
                            <RotateCcw size={12} aria-hidden="true" /> Revive
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-ghost p-1.5 text-error"
                            onClick={() => setConfirmDelete(e)}
                            title="Delete (Soft)"
                            disabled={deleteLoading === e.id}
                          >
                            {deleteLoading === e.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} aria-hidden="true" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          loading={loading}
          onPageChange={(page) => setPagination(p => ({ ...p, page }))}
        />
      </div>

      {/* Add/Edit Employee Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Employee' : 'Add Employee'}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={saveLoading}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saveLoading}>
              {saveLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} aria-hidden="true" />}
              {editing ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mono-label">Employee No. <span className="text-error">*</span></label>
              <input
                type="text"
                className={`input mt-1.5 ${formErrors.employeeNumber ? 'input-error' : ''}`}
                placeholder="e.g., EMP-007"
                value={formData.employeeNumber}
                onChange={(e) => handleInputChange('employeeNumber', e.target.value)}
                required
                maxLength={50}
                disabled={editing}
              />
              {formErrors.employeeNumber && <p className="text-xs text-error mt-1">{formErrors.employeeNumber}</p>}
            </div>
            <div>
              <label className="mono-label">First Name <span className="text-error">*</span></label>
              <input
                type="text"
                className={`input mt-1.5 ${formErrors.firstName ? 'input-error' : ''}`}
                placeholder="Juan"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
                maxLength={100}
              />
              {formErrors.firstName && <p className="text-xs text-error mt-1">{formErrors.firstName}</p>}
            </div>
            <div>
              <label className="mono-label">Last Name <span className="text-error">*</span></label>
              <input
                type="text"
                className={`input mt-1.5 ${formErrors.lastName ? 'input-error' : ''}`}
                placeholder="Dela Cruz"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
                maxLength={100}
              />
              {formErrors.lastName && <p className="text-xs text-error mt-1">{formErrors.lastName}</p>}
            </div>
            <div>
              <label className="mono-label">Middle Name</label>
              <input
                type="text"
                className="input mt-1.5"
                placeholder="Santos"
                value={formData.middleName}
                onChange={(e) => handleInputChange('middleName', e.target.value)}
                maxLength={100}
              />
            </div>
            <div>
              <label className="mono-label">Email <span className="text-error">*</span></label>
              <input
                type="email"
                className={`input mt-1.5 ${formErrors.email ? 'input-error' : ''}`}
                placeholder="juan.delacruz@lgu.gov.ph"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                maxLength={255}
              />
              {formErrors.email && <p className="text-xs text-error mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <label className="mono-label">Department</label>
              <select
                className="select mt-1.5"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
              >
                <option value="">Select department</option>
                {departments.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mono-label">Position</label>
              <input
                type="text"
                className="input mt-1.5"
                placeholder="Administrative Officer"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                maxLength={100}
              />
            </div>
            <div>
              <label className="mono-label">Hired Date <span className="text-error">*</span></label>
              <input
                type="date"
                className={`input mt-1.5 ${formErrors.hiredDate ? 'input-error' : ''}`}
                value={formData.hiredDate}
                onChange={(e) => handleInputChange('hiredDate', e.target.value)}
                required
                max={new Date().toISOString().slice(0, 10)}
              />
              {formErrors.hiredDate && <p className="text-xs text-error mt-1">{formErrors.hiredDate}</p>}
            </div>
            <div>
              <label className="mono-label">Monthly Salary <span className="text-error">*</span></label>
              <input
                type="number"
                className={`input mt-1.5 ${formErrors.monthlySalary ? 'input-error' : ''}`}
                placeholder="25000"
                value={formData.monthlySalary}
                onChange={(e) => handleInputChange('monthlySalary', e.target.value)}
                step="0.01"
                min="0"
                required
              />
              {formErrors.monthlySalary && <p className="text-xs text-error mt-1">{formErrors.monthlySalary}</p>}
            </div>
            <div>
              <label className="mono-label">Status</label>
              <select
                className="select mt-1.5"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Delete employee"
        message={confirmDelete ? `Delete "${confirmDelete.firstName} ${confirmDelete.lastName}"? This will soft-delete the record (can be revived later).` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}