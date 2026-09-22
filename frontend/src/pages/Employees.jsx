import { useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';

export default function Employees() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const departments = ['Admin', 'HR', 'Engineering', 'Finance', 'Operations', 'Legal'];
  const positions = ['Administrative Aide', 'HR Specialist', 'Software Engineer', 'Accountant', 'Operations Officer', 'Attorney'];

  const employees = [
    { id: '1', employeeNo: 'EMP-001', firstName: 'Juan', lastName: 'Dela Cruz', middleName: 'Santos', email: 'juan.delacruz@lgu.gov.ph', department: 'Admin', position: 'Administrative Officer', hiredDate: '2020-01-15', monthlySalary: '25000', status: 'ACTIVE' },
    { id: '2', employeeNo: 'EMP-002', firstName: 'Maria', lastName: 'Santos', middleName: 'Reyes', email: 'maria.santos@lgu.gov.ph', department: 'HR', position: 'HR Specialist', hiredDate: '2021-03-22', monthlySalary: '30000', status: 'ACTIVE' },
    { id: '3', employeeNo: 'EMP-003', firstName: 'Pedro', lastName: 'Garcia', middleName: 'Lopez', email: 'pedro.garcia@lgu.gov.ph', department: 'Engineering', position: 'Software Engineer', hiredDate: '2022-06-10', monthlySalary: '35000', status: 'ACTIVE' },
    { id: '4', employeeNo: 'EMP-004', firstName: 'Ana', lastName: 'Reyes', middleName: 'Cruz', email: 'ana.reyes@lgu.gov.ph', department: 'Finance', position: 'Accountant', hiredDate: '2019-11-05', monthlySalary: '28000', status: 'ACTIVE' },
    { id: '5', employeeNo: 'EMP-005', firstName: 'Jose', lastName: 'Mendoza', middleName: 'Torres', email: 'jose.mendoza@lgu.gov.ph', department: 'Operations', position: 'Operations Officer', hiredDate: '2023-02-14', monthlySalary: '22000', status: 'ACTIVE' },
    { id: '6', employeeNo: 'EMP-006', firstName: 'Luisa', lastName: 'Fernandez', middleName: 'Garcia', email: 'luisa.fernandez@lgu.gov.ph', department: 'Legal', position: 'Attorney', hiredDate: '2018-08-20', monthlySalary: '40000', status: 'INACTIVE' },
  ];

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch = `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeNo.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'all' || e.department === deptFilter;
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleAdd = () => {
    setEditing(null);
    setShowModal(true);
  };

  const handleEdit = (emp) => {
    setEditing(emp);
    setShowModal(true);
  };

  const handleDelete = (emp) => {
    toast(`Delete ${emp.firstName} ${emp.lastName} - to be implemented`, 'info');
  };

  const handleSave = () => {
    toast(editing ? 'Update employee - to be implemented' : 'Create employee - to be implemented', 'info');
    setShowModal(false);
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
            <select className="select pr-8" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="all">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="select pr-8" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
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
                <th className="w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted">No employees found</td>
                </tr>
              ) : (
                filteredEmployees.map((e) => (
                  <tr key={e.id} data-selectable="true">
                    <td className="font-mono text-sm">{e.employeeNo}</td>
                    <td className="font-medium text-ink">{e.firstName} {e.middleName ? e.middleName[0] + '. ' : ''}{e.lastName}</td>
                    <td className="text-sm">{e.email}</td>
                    <td>{e.department}</td>
                    <td className="text-sm">{e.position}</td>
                    <td className="font-mono text-sm">{e.hiredDate}</td>
                    <td className="font-mono">₱{Number(e.monthlySalary).toLocaleString()}</td>
                    <td><span className={`badge ${e.status === 'ACTIVE' ? 'badge-success' : 'badge-muted'}`}>{e.status}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button type="button" className="btn btn-ghost p-1.5" onClick={() => handleEdit(e)} title="Edit"><Edit size={14} aria-hidden="true" /></button>
                        <button type="button" className="btn btn-ghost p-1.5 text-error" onClick={() => handleDelete(e)} title="Delete"><Trash2 size={14} aria-hidden="true" /></button>
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
          <div className="modal-box modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editing ? 'Edit Employee' : 'Add Employee'}</h3>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">✕</button>
            </div>
            <div className="modal-body">
              <form className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mono-label">Employee No.</label>
                    <input type="text" className="input mt-1.5" defaultValue={editing?.employeeNo ?? ''} required />
                  </div>
                  <div>
                    <label className="mono-label">First Name</label>
                    <input type="text" className="input mt-1.5" defaultValue={editing?.firstName ?? ''} required />
                  </div>
                  <div>
                    <label className="mono-label">Last Name</label>
                    <input type="text" className="input mt-1.5" defaultValue={editing?.lastName ?? ''} required />
                  </div>
                  <div>
                    <label className="mono-label">Middle Name</label>
                    <input type="text" className="input mt-1.5" defaultValue={editing?.middleName ?? ''} />
                  </div>
                  <div>
                    <label className="mono-label">Email</label>
                    <input type="email" className="input mt-1.5" defaultValue={editing?.email ?? ''} required />
                  </div>
                  <div>
                    <label className="mono-label">Department</label>
                    <select className="select mt-1.5" defaultValue={editing?.department ?? ''}>
                      <option value="">Select department</option>
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mono-label">Position</label>
                    <select className="select mt-1.5" defaultValue={editing?.position ?? ''}>
                      <option value="">Select position</option>
                      {positions.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mono-label">Hired Date</label>
                    <input type="date" className="input mt-1.5" defaultValue={editing?.hiredDate ?? ''} required />
                  </div>
                  <div>
                    <label className="mono-label">Monthly Salary</label>
                    <input type="number" className="input mt-1.5" defaultValue={editing?.monthlySalary ?? ''} step="0.01" min="0" required />
                  </div>
                  <div>
                    <label className="mono-label">Status</label>
                    <select className="select mt-1.5" defaultValue={editing?.status ?? 'ACTIVE'}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
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