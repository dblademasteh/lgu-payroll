import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Loader2, Save, CalendarClock, CalendarCheck, CalendarX, CalendarDays } from 'lucide-react';
import { useAuth } from '../stores/auth.js';
import { useToast } from '../hooks/useToast.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import { getLeaveRequests, createLeaveRequest, updateLeaveRequest, deleteLeaveRequest, getHolidays, createHoliday, deleteHoliday } from '../api/leave.js';
import { getEmployees } from '../api/employees.js';
import { getStatusTone } from '../lib/tones.js';

function getStatusIcon(status) {
  switch (status) {
    case 'APPROVED': return CalendarCheck;
    case 'PENDING': return CalendarClock;
    case 'REJECTED': return CalendarX;
    default: return CalendarDays;
  }
}

const LEAVE_TYPES = [
  { value: 'VACATION', label: 'Vacation Leave' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'EMERGENCY', label: 'Emergency Leave' },
  { value: 'MATERNITY', label: 'Maternity Leave' },
  { value: 'PATERNITY', label: 'Paternity Leave' },
  { value: 'SOLO_PARENT', label: 'Solo Parent Leave' },
  { value: 'OTHER', label: 'Other' },
];

export default function Leave() {
  const toast = useToast();
  const user = useAuth(s => s.user);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState('requests');
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'VACATION',
    startDate: '',
    endDate: '',
    days: 0,
    status: 'PENDING',
    reason: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [holidayForm, setHolidayForm] = useState({ date: '', name: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Load data
  useEffect(() => {
    loadLeaves();
  }, [pagination.page, statusFilter, activeTab]);

  useEffect(() => {
    loadHolidays();
  }, []);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadLeaves() {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const res = await getLeaveRequests(params);
      setLeaves(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      console.error('Failed to load leave requests:', e);
      toast('Failed to load leave requests', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadHolidays() {
    try {
      const res = await getHolidays();
      setHolidays(res.data || []);
    } catch (e) {
      console.error('Failed to load holidays:', e);
    }
  }

  async function loadEmployees() {
    try {
      const res = await getEmployees({ limit: 100 });
      setEmployees(res.data || []);
    } catch (e) {
      console.error('Failed to load employees:', e);
    }
  }

  const filteredLeaves = leaves.filter((l) => {
    const empName = `${l.employee?.firstName} ${l.employee?.lastName}`;
    return empName.toLowerCase().includes(search.toLowerCase()) ||
      l.employee?.employeeNumber?.toLowerCase().includes(search.toLowerCase());
  });

  function handleAdd() {
    setEditing(null);
    setFormData({
      employeeId: '',
      type: 'VACATION',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      days: 1,
      status: 'PENDING',
      reason: '',
    });
    setFormErrors({});
    setShowModal(true);
  }

  function handleEdit(leave) {
    setEditing(leave);
    setFormData({
      employeeId: leave.employeeId,
      type: leave.type,
      startDate: leave.startDate ? new Date(leave.startDate).toISOString().slice(0, 10) : '',
      endDate: leave.endDate ? new Date(leave.endDate).toISOString().slice(0, 10) : '',
      days: leave.days,
      status: leave.status,
      reason: leave.reason || '',
    });
    setFormErrors({});
    setShowModal(true);
  }

  function calcDays(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }

  function validateForm() {
    const errors = {};
    if (!formData.type) errors.type = 'Leave type is required';
    if (!formData.startDate) errors.startDate = 'Start date is required';
    if (!formData.endDate) errors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      errors.endDate = 'End date must be after start date';
    }
    if (!formData.reason.trim()) errors.reason = 'Reason is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setSaveLoading(true);
    try {
      let employeeId = formData.employeeId;

      // For VIEWER creating their own request, resolve their UUID from the employees list.
      if (user?.role === 'VIEWER' && !editing && !employeeId) {
        const me = employees.find((e) => e.employeeNumber === user.externalId);
        if (!me) throw new Error('Could not resolve your employee record');
        employeeId = me.id;
      }

      const payload = {
        employeeId,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days: formData.days,
        reason: formData.reason.trim(),
      };
      if (editing) payload.status = formData.status;

      if (editing) {
        await updateLeaveRequest(editing.id, payload);
        toast('Leave request updated', 'success');
      } else {
        await createLeaveRequest(payload);
        toast('Leave request created', 'success');
      }
      setShowModal(false);
      loadLeaves();
    } catch (e) {
      const msg = e?.response?.data?.error?.message || (editing ? 'Failed to update leave request' : 'Failed to create leave request');
      toast(msg, 'error');
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleDelete(leave) {
    setDeleteLoading(leave.id);
    try {
      await deleteLeaveRequest(leave.id);
      toast('Leave request deleted', 'success');
      loadLeaves();
    } catch (e) {
      const msg = e?.response?.data?.error?.message || 'Failed to delete leave request';
      toast(msg, 'error');
    } finally {
      setDeleteLoading(null);
      setConfirmDelete(null);
    }
  }

  async function handleHolidaySave(e) {
    e.preventDefault();
    if (!holidayForm.date || !holidayForm.name.trim()) {
      toast('Date and name are required', 'error');
      return;
    }
    try {
      await createHoliday({ date: holidayForm.date, name: holidayForm.name.trim() });
      toast('Holiday added', 'success');
      setHolidayForm({ date: '', name: '' });
      loadHolidays();
    } catch (e) {
      toast('Failed to add holiday', 'error');
    }
  }

  async function handleHolidayDelete(holiday) {
    try {
      await deleteHoliday(holiday.id);
      toast('Holiday deleted', 'success');
      loadHolidays();
    } catch (e) {
      toast('Failed to delete holiday', 'error');
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'startDate' || field === 'endDate') {
        next.days = calcDays(field === 'startDate' ? value : prev.startDate, field === 'endDate' ? value : prev.endDate);
      }
      return next;
    });
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const canApprove = ['ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD'].includes(user?.role);

  async function handleApprove(leave) {
    try {
      await updateLeaveRequest(leave.id, { status: 'APPROVED' });
      toast('Leave request approved', 'success');
      loadLeaves();
    } catch (e) {
      toast('Failed to approve', 'error');
    }
  }

  async function handleReject(leave) {
    try {
      await updateLeaveRequest(leave.id, { status: 'REJECTED' });
      toast('Leave request rejected', 'success');
      loadLeaves();
    } catch (e) {
      toast('Failed to reject', 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-ink text-2xl">Leave Management</h1>
          <p className="text-sm text-muted mt-0.5">Manage leave requests and holidays</p>
        </div>
        {activeTab === 'requests' && (
          <button type="button" className="btn btn-primary" onClick={handleAdd}>
            <Plus size={16} aria-hidden="true" /> New Leave Request
          </button>
        )}
        {activeTab === 'holidays' && (
          <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} aria-hidden="true" /> Add Holiday
          </button>
        )}
      </div>

      <div className="tabbar" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'requests'}
          className={`tab ${activeTab === 'requests' ? 'tab-active' : ''}`}
          onClick={() => { setActiveTab('requests'); setShowModal(false); }}
        >
          <CalendarDays size={16} aria-hidden="true" className="mr-1" />
          Leave Requests
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'holidays'}
          className={`tab ${activeTab === 'holidays' ? 'tab-active' : ''}`}
          onClick={() => { setActiveTab('holidays'); setShowModal(false); }}
        >
          <CalendarDays size={16} aria-hidden="true" className="mr-1" />
          Holidays
        </button>
      </div>

      {activeTab === 'requests' && (
        <div className="card">
          <div className="p-4 border-b border-line flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search leave requests..."
                className="input pl-9 pr-4"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="text-muted" size={16} aria-hidden="true" />
              <select
                className="select pr-8"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <table className="data-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th className="w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <div className="flex items-center justify-center gap-2 text-muted">
                        <Loader2 size={20} className="animate-spin" />
                        <span>Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState title="No leave requests found" />
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((l) => {
                    const Icon = getStatusIcon(l.status);
                    return (
                      <tr key={l.id} data-selectable="true">
                        <td className="font-medium text-ink">{l.employee?.firstName} {l.employee?.lastName}</td>
                        <td><Badge tone="accent">{l.type}</Badge></td>
                        <td className="font-mono text-sm">{l.startDate ? new Date(l.startDate).toLocaleDateString() : '—'}</td>
                        <td className="font-mono text-sm">{l.endDate ? new Date(l.endDate).toLocaleDateString() : '—'}</td>
                        <td>{l.days}</td>
                        <td>
                          <Badge tone={getStatusTone(l.status, 'leave')} className="flex items-center gap-1">
                            <Icon size={10} aria-hidden="true" />
                            {l.status}
                          </Badge>
                        </td>
                        <td className="text-sm text-muted max-w-xs truncate">{l.reason}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            {canApprove && l.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm px-2 py-1.5 text-xs"
                                  onClick={() => handleApprove(l)}
                                  disabled={saveLoading === l.id}
                                >
                                  <CalendarCheck size={12} aria-hidden="true" /> Approve
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-error btn-sm px-2 py-1.5 text-xs"
                                  onClick={() => handleReject(l)}
                                  disabled={saveLoading === l.id}
                                >
                                  <CalendarX size={12} aria-hidden="true" /> Reject
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              className="btn btn-ghost p-1.5"
                              onClick={() => handleEdit(l)}
                              title="Edit"
                              disabled={deleteLoading === l.id}
                            >
                              <Edit size={14} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost p-1.5 text-error"
                              onClick={() => setConfirmDelete(l)}
                              title="Delete"
                              disabled={deleteLoading === l.id}
                            >
                              {deleteLoading === l.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} aria-hidden="true" />}
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
      )}

      {activeTab === 'holidays' && (
        <div className="card">
          <div className="p-4 border-b border-line flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search holidays..."
                className="input pl-9 pr-4"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th className="w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {holidays.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <EmptyState title="No holidays found" />
                    </td>
                  </tr>
                ) : (
                  holidays.map((h) => (
                    <tr key={h.id} data-selectable="true">
                      <td className="font-mono text-sm">{new Date(h.date).toLocaleDateString()}</td>
                      <td className="font-medium text-ink">{h.name}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost p-1.5 text-error"
                          onClick={() => setConfirmDelete({ kind: 'holiday', item: h })}
                          title="Delete"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>
      )}

      {/* Leave Request Modal */}
      <Modal
        open={showModal && activeTab === 'requests'}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Leave Request' : 'New Leave Request'}
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
          {user?.role !== 'VIEWER' && (
            <div>
              <label className="mono-label">Employee</label>
              <select
                className="select mt-1.5"
                value={formData.employeeId}
                onChange={(e) => handleInputChange('employeeId', e.target.value)}
                required
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeNumber} — {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mono-label">Leave Type <span className="text-error">*</span></label>
            <select
              className={`select mt-1.5 ${formErrors.type ? 'input-error' : ''}`}
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              required
            >
              {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {formErrors.type && <p className="text-xs text-error mt-1">{formErrors.type}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mono-label">Start Date <span className="text-error">*</span></label>
              <input
                type="date"
                className={`input mt-1.5 ${formErrors.startDate ? 'input-error' : ''}`}
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
                min={new Date().toISOString().slice(0, 10)}
              />
              {formErrors.startDate && <p className="text-xs text-error mt-1">{formErrors.startDate}</p>}
            </div>
            <div>
              <label className="mono-label">End Date <span className="text-error">*</span></label>
              <input
                type="date"
                className={`input mt-1.5 ${formErrors.endDate ? 'input-error' : ''}`}
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                required
                min={formData.startDate}
              />
              {formErrors.endDate && <p className="text-xs text-error mt-1">{formErrors.endDate}</p>}
            </div>
          </div>
          <div>
            <label className="mono-label">Days</label>
            <input
              type="number"
              className="input mt-1.5 bg-bg/60"
              value={formData.days}
              readOnly
            />
            <p className="text-xs text-muted mt-1">Automatically calculated from dates</p>
          </div>
          {editing && canApprove && (
            <div>
              <label className="mono-label">Status</label>
              <select
                className="select mt-1.5"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}
          <div>
            <label className="mono-label">Reason <span className="text-error">*</span></label>
            <textarea
              className={`input mt-1.5 min-h-[80px] ${formErrors.reason ? 'input-error' : ''}`}
              placeholder="Reason for leave..."
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              required
              maxLength={500}
            />
            {formErrors.reason && <p className="text-xs text-error mt-1">{formErrors.reason}</p>}
          </div>
        </form>
      </Modal>

      {/* Holiday Modal */}
      <Modal
        open={showModal && activeTab === 'holidays'}
        onClose={() => setShowModal(false)}
        title="Add Holiday"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleHolidaySave}>
              <Save size={14} aria-hidden="true" className="mr-2" /> Add
            </button>
          </>
        }
      >
        <form onSubmit={handleHolidaySave} className="space-y-4">
          <div>
            <label className="mono-label">Date <span className="text-error">*</span></label>
            <input
              type="date"
              className="input mt-1.5"
              value={holidayForm.date}
              onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mono-label">Name <span className="text-error">*</span></label>
            <input
              type="text"
              className="input mt-1.5"
              placeholder="e.g., New Year's Day"
              value={holidayForm.name}
              onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
              required
              maxLength={100}
            />
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          const target = confirmDelete;
          if (target?.kind === 'holiday') {
            handleHolidayDelete(target.item);
          } else if (target) {
            handleDelete(target);
          }
        }}
        title={confirmDelete?.kind === 'holiday' ? 'Delete holiday' : 'Delete leave request'}
        message={
          confirmDelete?.kind === 'holiday'
            ? `Delete holiday "${confirmDelete.item.name}"?`
            : `Delete leave request for ${confirmDelete?.employee?.firstName} ${confirmDelete?.employee?.lastName}?`
        }
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}