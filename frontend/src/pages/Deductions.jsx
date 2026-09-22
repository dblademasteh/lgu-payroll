import { useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';

export default function Deductions() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const deductionTypes = [
    { id: '1', name: 'SSS Contribution', type: 'GOVERNMENT', amountType: 'PERCENTAGE', value: '4.5%', basis: 'GROSS', isMandatory: true, description: 'Social Security System employee share' },
    { id: '2', name: 'PhilHealth Contribution', type: 'GOVERNMENT', amountType: 'PERCENTAGE', value: '2.0%', basis: 'GROSS', isMandatory: true, description: 'PhilHealth employee share (split 50/50)' },
    { id: '3', name: 'Pag-IBIG Contribution', type: 'GOVERNMENT', amountType: 'FIXED', value: '₱100', basis: 'GROSS', isMandatory: true, description: 'Pag-IBIG Fund employee share' },
    { id: '4', name: 'Withholding Tax', type: 'TAX', amountType: 'TABLE', value: 'BIR Table', basis: 'TAXABLE', isMandatory: true, description: 'BIR Withholding Tax per TRAIN Law' },
    { id: '5', name: 'SSS Loan', type: 'LOAN', amountType: 'FIXED', value: '₱500', basis: 'NET', isMandatory: false, description: 'Salary loan amortization' },
    { id: '6', name: 'Pag-IBIG Loan', type: 'LOAN', amountType: 'FIXED', value: '₱800', basis: 'NET', isMandatory: false, description: 'Multi-purpose loan amortization' },
    { id: '7', name: 'Union Dues', type: 'OTHER', amountType: 'FIXED', value: '₱50', basis: 'NET', isMandatory: false, description: 'Monthly union membership fee' },
    { id: '8', name: 'Cooperative Dues', type: 'OTHER', amountType: 'PERCENTAGE', value: '1.0%', basis: 'GROSS', isMandatory: false, description: 'Employee cooperative contribution' },
  ];

  const filteredDeductions = deductionTypes.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const typeBadges = {
    GOVERNMENT: 'badge-accent',
    TAX: 'badge-error',
    LOAN: 'badge-warning',
    OTHER: 'badge-muted',
  };

  const handleAdd = () => {
    setEditing(null);
    setShowModal(true);
  };

  const handleEdit = (deduction) => {
    setEditing(deduction);
    setShowModal(true);
  };

  const handleDelete = (deduction) => {
    toast(`Delete ${deduction.name} - to be implemented`, 'info');
  };

  const handleSave = () => {
    toast(editing ? 'Update deduction - to be implemented' : 'Create deduction - to be implemented', 'info');
    setShowModal(false);
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
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="GOVERNMENT">Government</option>
              <option value="TAX">Tax</option>
              <option value="LOAN">Loan</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Amount Type</th>
                <th>Value</th>
                <th>Basis</th>
                <th>Mandatory</th>
                <th>Description</th>
                <th className="w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeductions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted">No deductions found</td>
                </tr>
              ) : (
                filteredDeductions.map((d) => (
                  <tr key={d.id} data-selectable="true">
                    <td className="font-medium text-ink">{d.name}</td>
                    <td><span className={`badge ${typeBadges[d.type]}`}>{d.type}</span></td>
                    <td className="font-mono text-xs">{d.amountType}</td>
                    <td className="font-mono">{d.value}</td>
                    <td><span className="badge badge-muted">{d.basis}</span></td>
                    <td>{d.isMandatory ? 'Yes' : 'No'}</td>
                    <td className="text-sm text-muted max-w-xs truncate">{d.description}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button type="button" className="btn btn-ghost p-1.5" onClick={() => handleEdit(d)} title="Edit"><Edit size={14} aria-hidden="true" /></button>
                        <button type="button" className="btn btn-ghost p-1.5 text-error" onClick={() => handleDelete(d)} title="Delete"><Trash2 size={14} aria-hidden="true" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editing ? 'Edit Deduction' : 'Add Deduction'}</h3>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">✕</button>
            </div>
            <div className="modal-body">
              <form className="space-y-4">
                <div>
                  <label className="mono-label">Name</label>
                  <input type="text" className="input mt-1.5" defaultValue={editing?.name ?? ''} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mono-label">Type</label>
                    <select className="select mt-1.5" defaultValue={editing?.type ?? 'GOVERNMENT'}>
                      <option value="GOVERNMENT">Government</option>
                      <option value="TAX">Tax</option>
                      <option value="LOAN">Loan</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mono-label">Amount Type</label>
                    <select className="select mt-1.5" defaultValue={editing?.amountType ?? 'FIXED'}>
                      <option value="FIXED">Fixed Amount</option>
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="TABLE">Tax Table</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mono-label">Value</label>
                    <input type="text" className="input mt-1.5" defaultValue={editing?.value ?? ''} placeholder="e.g. ₱100 or 4.5%" required />
                  </div>
                  <div>
                    <label className="mono-label">Basis</label>
                    <select className="select mt-1.5" defaultValue={editing?.basis ?? 'GROSS'}>
                      <option value="GROSS">Gross Pay</option>
                      <option value="TAXABLE">Taxable Income</option>
                      <option value="NET">Net Pay</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="mandatory" className="w-4 h-4 accent-accent" defaultChecked={editing?.isMandatory ?? false} />
                  <label htmlFor="mandatory" className="text-sm text-ink">Mandatory for all employees</label>
                </div>
                <div>
                  <label className="mono-label">Description</label>
                  <textarea className="input mt-1.5 min-h-[80px]" defaultValue={editing?.description ?? ''} />
                </div>
              </form>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}