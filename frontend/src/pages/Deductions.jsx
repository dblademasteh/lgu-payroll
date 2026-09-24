import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Loader2, Save } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import { getDeductions, createDeduction, updateDeduction, deleteDeduction } from '../api/deductions.js';
import { formatCurrency } from '../lib/format.js';
import { getDeductionTone } from '../lib/tones.js';

export default function Deductions() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [deductions, setDeductions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'GOVERNMENT',
    amountType: 'FIXED',
    basis: 'GROSS',
    rateOrAmount: '',
    isMandatory: false,
    isActive: true,
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    loadDeductions();
  }, [pagination.page, typeFilter]);

  async function loadDeductions() {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;

      const res = await getDeductions(params);
      setDeductions(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      console.error('Failed to load deductions:', e);
      toast('Failed to load deductions', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filteredDeductions = deductions.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  function handleAdd() {
    setEditing(null);
    setFormData({
      name: '',
      code: '',
      type: 'GOVERNMENT',
      amountType: 'FIXED',
      basis: 'GROSS',
      rateOrAmount: '',
      isMandatory: false,
      isActive: true,
      description: '',
    });
    setFormErrors({});
    setShowModal(true);
  }

  function handleEdit(deduction) {
    setEditing(deduction);
    setFormData({
      name: deduction.name,
      code: deduction.code,
      type: deduction.type,
      amountType: deduction.amountType,
      basis: deduction.basis,
      rateOrAmount: String(deduction.rateOrAmount),
      isMandatory: deduction.isMandatory,
      isActive: deduction.isActive,
      description: deduction.description || '',
    });
    setFormErrors({});
    setShowModal(true);
  }

  function validateForm() {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.code.trim()) errors.code = 'Code is required';
    else if (!/^[A-Z0-9_]+$/.test(formData.code)) errors.code = 'Code must be uppercase alphanumeric with underscores';
    if (!formData.rateOrAmount.trim()) errors.rateOrAmount = 'Rate/Amount is required';
    else if (!/^\d+(\.\d{1,4})?$/.test(formData.rateOrAmount)) errors.rateOrAmount = 'Invalid rate/amount format';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setSaveLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        amountType: formData.amountType,
        basis: formData.basis,
        rateOrAmount: formData.rateOrAmount,
        isMandatory: formData.isMandatory,
        isActive: formData.isActive,
        description: formData.description.trim() || null,
      };

      if (editing) {
        await updateDeduction(editing.id, payload);
        toast('Deduction updated', 'success');
      } else {
        await createDeduction(payload);
        toast('Deduction created', 'success');
      }
      setShowModal(false);
      loadDeductions();
    } catch (e) {
      const msg = e?.response?.data?.error?.message || (editing ? 'Failed to update deduction' : 'Failed to create deduction');
      toast(msg, 'error');
      if (e?.response?.data?.error?.code === 'DUPLICATE') {
        setFormErrors({ code: 'A deduction with this code already exists' });
      }
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleDelete(deduction) {
    setDeleteLoading(deduction.id);
    try {
      await deleteDeduction(deduction.id);
      toast('Deduction deleted', 'success');
      loadDeductions();
    } catch (e) {
      const msg = e?.response?.data?.error?.message || 'Failed to delete deduction';
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
          <h1 className="font-display font-bold text-ink text-2xl">Deductions</h1>
          <p className="text-sm text-muted mt-0.5">Manage deduction types and rates</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleAdd}>
          <Plus size={16} aria-hidden="true" /> Add Deduction
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-line flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search deductions..."
              className="input pl-9 pr-4"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-muted" size={16} aria-hidden="true" />
            <select
              className="select pr-8"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="all">All Types</option>
              <option value="GOVERNMENT">Government</option>
              <option value="TAX">Tax</option>
              <option value="LOAN">Loan</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <table className="data-table min-w-[1000px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Type</th>
                <th>Amount Type</th>
                <th>Rate/Amount</th>
                <th>Basis</th>
                <th>Mandatory</th>
                <th>Active</th>
                <th>Description</th>
                <th className="w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-muted">
                      <Loader2 size={20} className="animate-spin" />
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDeductions.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState title="No deductions found" />
                  </td>
                </tr>
              ) : (
                filteredDeductions.map((d) => (
                  <tr key={d.id} data-selectable="true">
                    <td className="font-medium text-ink">{d.name}</td>
                    <td className="font-mono text-xs">{d.code}</td>
                    <td><Badge tone={getDeductionTone(d.type)}>{d.type}</Badge></td>
                    <td className="font-mono text-xs">{d.amountType}</td>
                    <td className="font-mono">{d.amountType === 'PERCENTAGE' ? `${d.rateOrAmount}%` : d.amountType === 'FIXED' ? formatCurrency(Number(d.rateOrAmount)) : 'Table'}</td>
                    <td><Badge tone="muted">{d.basis}</Badge></td>
                    <td>{d.isMandatory ? 'Yes' : 'No'}</td>
                    <td>{d.isActive ? 'Yes' : 'No'}</td>
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

      {/* Add/Edit Deduction Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Deduction' : 'Add Deduction'}
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
              <div>
                <label className="mono-label">Name <span className="text-error">*</span></label>
                <input
                  type="text"
                  className={`input mt-1.5 ${formErrors.name ? 'input-error' : ''}`}
                  placeholder="e.g., SSS Contribution"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  maxLength={100}
                />
                {formErrors.name && <p className="text-xs text-error mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="mono-label">Code <span className="text-error">*</span></label>
                <input
                  type="text"
                  className={`input mt-1.5 ${formErrors.code ? 'input-error' : ''}`}
                  placeholder="e.g., SSS_EE"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  required
                  maxLength={50}
                  pattern="[A-Z0-9_]+"
                />
                {formErrors.code && <p className="text-xs text-error mt-1">{formErrors.code}</p>}
                <p className="text-xs text-muted mt-1">Uppercase alphanumeric with underscores only</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mono-label">Type</label>
                  <select
                    className="select mt-1.5"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  >
                    <option value="GOVERNMENT">Government</option>
                    <option value="TAX">Tax</option>
                    <option value="LOAN">Loan</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mono-label">Amount Type</label>
                  <select
                    className="select mt-1.5"
                    value={formData.amountType}
                    onChange={(e) => handleInputChange('amountType', e.target.value)}
                  >
                    <option value="FIXED">Fixed Amount</option>
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="TABLE">Tax Table</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mono-label">Rate/Amount <span className="text-error">*</span></label>
                  <input
                    type="text"
                    className={`input mt-1.5 ${formErrors.rateOrAmount ? 'input-error' : ''}`}
                    placeholder={formData.amountType === 'PERCENTAGE' ? 'e.g., 4.5' : formData.amountType === 'FIXED' ? 'e.g., 100' : '0 (not used)'}
                    value={formData.rateOrAmount}
                    onChange={(e) => handleInputChange('rateOrAmount', e.target.value)}
                    required
                  />
                  {formErrors.rateOrAmount && <p className="text-xs text-error mt-1">{formErrors.rateOrAmount}</p>}
                  <p className="text-xs text-muted mt-1">
                    {formData.amountType === 'PERCENTAGE' ? 'Percentage (e.g., 4.5 for 4.5%)' :
                      formData.amountType === 'FIXED' ? 'Fixed amount in pesos (e.g., 100 for ₱100)' :
                        'Not used for tax table (BIR table applied automatically)'}
                  </p>
                </div>
                <div>
                  <label className="mono-label">Basis</label>
                  <select
                    className="select mt-1.5"
                    value={formData.basis}
                    onChange={(e) => handleInputChange('basis', e.target.value)}
                  >
                    <option value="GROSS">Gross Pay</option>
                    <option value="TAXABLE">Taxable Income</option>
                    <option value="NET">Net Pay</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mandatory"
                  className="w-4 h-4 accent-accent"
                  checked={formData.isMandatory}
                  onChange={(e) => handleInputChange('isMandatory', e.target.checked)}
                />
                <label htmlFor="mandatory" className="text-sm text-ink">Mandatory for all employees</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  className="w-4 h-4 accent-accent"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                />
                <label htmlFor="active" className="text-sm text-ink">Active</label>
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
              </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Delete deduction"
        message={confirmDelete ? `Delete "${confirmDelete.name}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}