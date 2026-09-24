import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, Loader2, Save } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, getEmployeesForHead } from '../api/departments.js';
import { formatCurrency } from '../lib/format.js';

export default function Departments() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    headId: '',
    budget: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Load employees for head selection
  useEffect(() => {
    async function loadEmployees() {
      try {
        const emps = await getEmployeesForHead();
        setEmployees(emps);
      } catch (e) {
        console.error('Failed to load employees for head:', e);
      }
    }
    loadEmployees();
  }, []);

  // Load departments
  useEffect(() => {
    loadDepartments();
  }, [pagination.page]);

  async function loadDepartments() {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search.trim()) params.search = search.trim();

      const res = await getDepartments(params);
      setDepartments(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      console.error('Failed to load departments:', e);
      toast('Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd() {
    setEditing(null);
    setFormData({
      code: '',
      name: '',
      headId: '',
      budget: '',
      description: '',
    });
    setFormErrors({});
    setShowModal(true);
  }

  function handleEdit(dept) {
    setEditing(dept);
    setFormData({
      code: dept.code,
      name: dept.name,
      headId: dept.headId || '',
      budget: dept.budget ? String(dept.budget) : '',
      description: dept.description || '',
    });
    setFormErrors({});
    setShowModal(true);
  }

  function validateForm() {
    const errors = {};
    if (!formData.code.trim()) errors.code = 'Code is required';
    else if (!/^[A-Z0-9]+$/.test(formData.code)) errors.code = 'Code must be uppercase alphanumeric';
    else if (formData.code.length > 10) errors.code = 'Code must be 10 characters or less';
    if (!formData.name.trim()) errors.name = 'Name is required';
    else if (formData.name.length > 100) errors.name = 'Name must be 100 characters or less';
    if (formData.budget && !/^\d+(\.\d{1,2})?$/.test(formData.budget)) errors.budget = 'Budget must be a valid number';
    if (formData.description && formData.description.length > 500) errors.description = 'Description must be 500 characters or less';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setSaveLoading(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        headId: formData.headId || null,
        budget: formData.budget || null,
        description: formData.description.trim() || null,
      };

      if (editing) {
        await updateDepartment(editing.id, payload);
        toast('Department updated', 'success');
      } else {
        await createDepartment(payload);
        toast('Department created', 'success');
      }
      setShowModal(false);
      loadDepartments();
    } catch (e) {
      const msg = e?.response?.data?.error?.message || (editing ? 'Failed to update department' : 'Failed to create department');
      toast(msg, 'error');
      if (e?.response?.data?.error?.code === 'DUPLICATE') {
        setFormErrors({ code: 'A department with this code already exists' });
      }
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleDelete(dept) {
    setDeleteLoading(dept.id);
    try {
      await deleteDepartment(dept.id);
      toast('Department deleted', 'success');
      loadDepartments();
    } catch (e) {
      const msg = e?.response?.data?.error?.message || 'Failed to delete department';
      toast(msg, 'error');
    } finally {
      setDeleteLoading(null);
      setConfirmDelete(null);
    }
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
          <h1 className="font-display font-bold text-ink text-2xl">Departments</h1>
          <p className="text-sm text-muted mt-0.5">Manage organizational structure</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleAdd}>
          <Plus size={16} aria-hidden="true" /> Add Department
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-line flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search departments..."
              className="input pl-9 pr-4"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            />
          </div>
        </div>

        <table className="data-table min-w-[800px]">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Head</th>
                <th>Employees</th>
                <th>Budget</th>
                <th>Description</th>
                <th className="w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-muted">
                      <Loader2 size={20} className="animate-spin" />
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDepts.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState title="No departments found" />
                  </td>
                </tr>
              ) : (
                filteredDepts.map((d) => {
                  const head = d.head;
                  const headName = head ? `${head.firstName} ${head.lastName}` : '—';
                  const empCount = d._count?.employees ?? 0;
                  return (
                    <tr key={d.id} data-selectable="true">
                      <td className="font-mono text-sm font-semibold">{d.code}</td>
                      <td className="font-medium text-ink">{d.name}</td>
                      <td>{headName}</td>
                      <td className="flex items-center gap-1">
                        <Users size={14} aria-hidden="true" className="text-muted" />
                        <span>{empCount}</span>
                      </td>
                      <td className="font-mono">{formatCurrency(d.budget)}</td>
                      <td className="text-sm text-muted max-w-xs truncate">{d.description || '—'}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="btn btn-ghost p-1.5"
                            onClick={() => handleEdit(d)}
                            title="Edit"
                            disabled={deleteLoading === d.id}
                          >
                            <Edit size={14} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost p-1.5 text-error"
                            onClick={() => setConfirmDelete(d)}
                            title="Delete"
                            disabled={deleteLoading === d.id}
                          >
                            {deleteLoading === d.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} aria-hidden="true" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* Add/Edit Department Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Department' : 'Add Department'}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mono-label">Code <span className="text-error">*</span></label>
              <input
                type="text"
                className={`input mt-1.5 ${formErrors.code ? 'input-error' : ''}`}
                placeholder="e.g., ADM"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                required
                maxLength={10}
                pattern="[A-Z0-9]+"
                disabled={editing}
              />
              {formErrors.code && <p className="text-xs text-error mt-1">{formErrors.code}</p>}
              <p className="text-xs text-muted mt-1">Uppercase alphanumeric, max 10 chars</p>
            </div>
            <div>
              <label className="mono-label">Name <span className="text-error">*</span></label>
              <input
                type="text"
                className={`input mt-1.5 ${formErrors.name ? 'input-error' : ''}`}
                placeholder="e.g., Administration"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                maxLength={100}
              />
              {formErrors.name && <p className="text-xs text-error mt-1">{formErrors.name}</p>}
            </div>
          </div>
          <div>
            <label className="mono-label">Department Head</label>
            <select
              className="select mt-1.5"
              value={formData.headId}
              onChange={(e) => handleInputChange('headId', e.target.value)}
            >
              <option value="">Select department head</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeNumber}) - {e.position}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mono-label">Budget</label>
            <input
              type="text"
              className={`input mt-1.5 ${formErrors.budget ? 'input-error' : ''}`}
              placeholder="e.g., 2500000"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
            />
            {formErrors.budget && <p className="text-xs text-error mt-1">{formErrors.budget}</p>}
            <p className="text-xs text-muted mt-1">Amount in pesos (e.g., 2500000 for ₱2,500,000)</p>
          </div>
          <div>
            <label className="mono-label">Description</label>
            <textarea
              className="input mt-1.5 min-h-[80px]"
              placeholder="Optional description..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              maxLength={500}
            />
            {formErrors.description && <p className="text-xs text-error mt-1">{formErrors.description}</p>}
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Delete department"
        message={confirmDelete ? `Delete "${confirmDelete.name}" department? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}