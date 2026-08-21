import { useState } from 'react';
import { useBranchesQuery } from '@/hooks/useAdminQueries';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import {
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  toggleBranchStatus,
} from '../redux/slices/branchSlice';
import { Branch, BranchFormData } from '../services/branch.service';
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Phone,
  Mail,
  Clock,
  X,
  Search,
  Home,
  Microscope,
  CheckCircle
} from 'lucide-react';
import { useToast } from '../components/Toast';

const DEFAULT_SLOTS = [
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM',
  '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM',
  '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM',
  '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM',
];

const emptyForm: BranchFormData = {
  name: '', code: '', line1: '', city: '', state: 'Maharashtra',
  pincode: '', contactNumber: '', email: '', workingHours: '',
  availableSlots: [], homeCollection: true, labVisit: true, isActive: true,
  latitude: undefined, longitude: undefined,
};

export default function Branches() {
  const dispatch = useDispatch<AppDispatch>();
  const { branches, loading } = useSelector((s: RootState) => (s as any).branches);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchFormData>(emptyForm);
const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

useBranchesQuery();

  const filtered = (branches || []).filter((b: Branch) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.city.toLowerCase().includes(search.toLowerCase()) ||
    b.pincode.includes(search) ||
    b.code.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (b: Branch) => {
    setEditing(b);
    setForm({
      name: b.name, code: b.code, line1: b.line1, city: b.city,
      state: b.state, pincode: b.pincode, latitude: b.latitude,
      longitude: b.longitude, contactNumber: b.contactNumber || '',
      email: b.email || '', workingHours: b.workingHours || '',
      availableSlots: b.availableSlots || [], homeCollection: b.homeCollection,
      labVisit: b.labVisit, isActive: b.isActive,
    });
    setModalOpen(true);
  };

  const handleSlotToggle = (slot: string) => {
    setForm(f => ({
      ...f,
      availableSlots: f.availableSlots?.includes(slot)
        ? f.availableSlots.filter(s => s !== slot)
        : [...(f.availableSlots || []), slot],
    }));
  };

  const handleSubmit = async () => {
if (!form.name || !form.code || !form.line1 || !form.city || !form.pincode) {
      error('Missing Fields', 'Please fill all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await dispatch(updateBranch({ id: editing.id, data: form })).unwrap();
      } else {
        await dispatch(createBranch(form)).unwrap();
      }
      setModalOpen(false);
   } catch (e: any) {
      error('Failed', e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await dispatch(deleteBranch(id));
    setDeleteConfirm(null);
  };

  const handleToggle = (b: Branch) => {
    dispatch(toggleBranchStatus({ id: b.id, isActive: !b.isActive }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all MedSeva collection branches</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={16} /> Add Branch
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by name, city, pincode..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Stats */}
<div className="grid grid-cols-3 gap-4">
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border p-4 animate-pulse space-y-2">
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-7 bg-gray-200 rounded w-12" />
              </div>
            ))}
          </>
        ) : [
          { label: 'Total Branches', value: branches?.length || 0, color: 'blue' },
          { label: 'Active', value: branches?.filter((b: Branch) => b.isActive).length || 0, color: 'green' },
          { label: 'Inactive', value: branches?.filter((b: Branch) => !b.isActive).length || 0, color: 'red' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
          </div>
        ))}
      </div>
      {/* Table */}
    {loading ? (
        <div className="bg-white rounded-xl border overflow-hidden animate-pulse">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Branch', 'Location', 'Contact', 'Services', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">
                    <div className="h-3 bg-gray-200 rounded w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <div className="h-3.5 bg-gray-200 rounded w-32 mb-1.5" />
                    <div className="h-2.5 bg-gray-200 rounded w-20" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-3 bg-gray-200 rounded w-40 mb-1.5" />
                    <div className="h-2.5 bg-gray-200 rounded w-24" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-3 bg-gray-200 rounded w-28 mb-1.5" />
                    <div className="h-2.5 bg-gray-200 rounded w-32" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 bg-gray-200 rounded-full w-28 mb-1.5" />
                    <div className="h-5 bg-gray-200 rounded-full w-20" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 bg-gray-200 rounded-full w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 bg-gray-200 rounded" />
                      <div className="h-5 w-5 bg-gray-200 rounded" />
                      <div className="h-5 w-5 bg-gray-200 rounded" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No branches found.</div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Branch', 'Location', 'Contact', 'Services', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((b: Branch) => (
                <tr key={b.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{b.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{b.code}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-1 text-gray-600">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      <span className="text-xs">{b.line1}, {b.city} - {b.pincode}</span>
                    </div>
                    {b.workingHours && (
                      <div className="flex items-center gap-1 text-gray-400 mt-1">
                        <Clock size={11} />
                        <span className="text-xs">{b.workingHours}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {b.contactNumber && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Phone size={11} /> {b.contactNumber}
                      </div>
                    )}
                    {b.email && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <Mail size={11} /> {b.email}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                   <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit ${b.homeCollection ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'}`}>
  <Home size={12} />
  Home Collection
</span>
                     <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit ${b.labVisit ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
  <Microscope size={12} />
  Lab Visit
</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggle(b)} title="Toggle status">
                        {b.isActive
                          ? <ToggleRight size={20} className="text-green-500 hover:text-green-700" />
                          : <ToggleLeft size={20} className="text-gray-400 hover:text-gray-600" />}
                      </button>
                      <button onClick={() => openEdit(b)} className="text-blue-500 hover:text-blue-700">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteConfirm(b.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-80 space-y-4">
            <h3 className="font-semibold text-gray-900">Delete Branch?</h3>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Branch' : 'Add New Branch'}</h2>
              <button onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Branch Name *</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Branch Code *</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. MSV-AND-W" value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-medium text-gray-600">Address *</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.line1} onChange={e => setForm(f => ({ ...f, line1: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">City *</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">State</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Pincode *</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Latitude</label>
                  <input type="number" step="any" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.latitude || ''} onChange={e => setForm(f => ({ ...f, latitude: parseFloat(e.target.value) || undefined }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Longitude</label>
                  <input type="number" step="any" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.longitude || ''} onChange={e => setForm(f => ({ ...f, longitude: parseFloat(e.target.value) || undefined }))} />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Contact Number</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.contactNumber} onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Email</label>
                  <input type="email" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <label className="text-xs font-medium text-gray-600">Working Hours</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Mon–Sat: 7:00 AM – 8:00 PM"
                  value={form.workingHours} onChange={e => setForm(f => ({ ...f, workingHours: e.target.value }))} />
              </div>

              {/* Available Slots */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">Available Time Slots</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_SLOTS.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleSlotToggle(slot)}
                      className={`text-xs px-2 py-1 rounded-full border transition ${
                        form.availableSlots?.includes(slot)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                {[
                 {
  key: 'homeCollection',
  label: (
    <span className="inline-flex items-center gap-1">
      <Home size={14} />
      Home Collection
    </span>
  ),
},
{
  key: 'labVisit',
  label: (
    <span className="inline-flex items-center gap-1">
      <Microscope size={14} />
      Lab Visit
    </span>
  ),
},
{
  key: 'isActive',
  label: (
    <span className="inline-flex items-center gap-1">
      <CheckCircle size={14} />
      Active
    </span>
  ),
},
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                      className="w-4 h-4 accent-blue-600"
                    />
                 <span className="text-sm text-gray-700 flex items-center">
  {label}
</span>
                  </label>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalOpen(false)} className="flex-1 border rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                  {submitting ? 'Saving...' : editing ? 'Update Branch' : 'Create Branch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}