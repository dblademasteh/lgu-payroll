import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';

export default function Departments() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const departments = [
    { id: '1', name: 'Admin', code: 'ADM', head: 'Juan Dela Cruz', employeeCount: 12, budget: '₱2,500,000', description: 'Administrative and support services' },
    { id: '2', name: 'HR', code: 'HR', head: 'Maria Santos', employeeCount: 8, budget: '₱1,800,000', description: 'Human resource management' },
    { id: '3', name: 'Engineering', code: 'ENG', head: 'Pedro Garcia', employeeCount: 25, budget: '₱5,000,000', description: 'Software development and IT infrastructure' },
    { id: '4', name: 'Finance', code: 'FIN', head: 'Ana Reyes', employeeCount: 15, budget: '₱3,200,000', description: 'Financial management and accounting' },
    { id: '5', name: 'Operations', code: 'OPS', head: 'Jose Mendoza', employeeCount: 18, budget: '₱2,800,000', description: 'Field operations and service delivery' },
    { id: '6', name: 'Legal', code: 'LEG', head: 'Luisa Fernandez', employeeCount: 5, budget: '₱1,200,000', description: 'Legal counsel and compliance' },
  ];

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setEditing(null);
    setShowModal(true);
  };

  const handleEdit = (dept) => {
    setEditing(dept);
    setShowModal(true);
  };

  const handleDelete = (dept) => {
    toast(`Delete ${dept.name} department - to be implemented`, 'info');
  };

  const handleSave = () => {
    toast(editing ? 'Update department - to be implemented' : 'Create department - to be implemented', 'info');
    setShowModal(false);
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
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
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
              {filteredDepts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted">No departments found</td>
                </tr>
              ) : (
                filteredDepts.map((d) => (
                  <tr key={d.id} data-selectable="true">
                    <td className="font-mono text-sm font-semibold">{d.code}</td>
                    <td className="font-medium text-ink">{d.name}</td>
                    <td>{d.head}</td>
                    <td className="flex items-center gap-1">
                      <Users size={14} aria-hidden="true" className="text-muted" />
                      <span>{d.employeeCount}</span>
                    </td>
                    <td className="font-mono">{d.budget}</td>
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
              <h3>{editing ? 'Edit Department' : 'Add Department'}</h3>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">✕</button>
            </div>
            <div className="modal-body">
              <form className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mono-label">Code</label>
                    <input type="text" className="input mt-1.5" defaultValue={editing?.code ?? ''} maxLength={10} required />
                  </div>
                  <div>
                    <label className="mono-label">Name</label>
                    <input type="text" className="input mt-1.5" defaultValue={editing?.name ?? ''} required />
                  </div>
                </div>
                <div>
                  <label className="mono-label">Department Head</label>
                  <input type="text" className="input mt-1.5" defaultValue={editing?.head ?? ''} placeholder="Employee name" />
                </div>
                <div>
                  <label className="mono-label">Budget</label>
                  <input type="text" className="input mt-1.5" defaultValue={editing?.budget ?? ''} placeholder="e.g. ₱2,500,000" />
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