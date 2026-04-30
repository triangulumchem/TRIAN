import React, { useEffect, useState } from 'react';
import { getInquiries, getFilterOptions, deleteInquiry, exportInquiries } from '../services/api';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Trash2,
  Edit2,
  X,
  Calendar,
  MapPin,
  Package,
  Building2,
  Phone,
  Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({
    search: '',
    product: '',
    city: '',
    state: '',
    dateFrom: '',
    dateTo: ''
  });
  const [filterOptions, setFilterOptions] = useState({ products: [], cities: [], states: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchInquiries();
    fetchFilterOptions();
  }, [pagination.page, filters]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await getInquiries(params);
      setInquiries(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await getFilterOptions();
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Failed to load filter options');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      product: '',
      city: '',
      state: '',
      dateFrom: '',
      dateTo: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      await deleteInquiry(id);
      toast.success('Inquiry deleted');
      fetchInquiries();
    } catch (error) {
      toast.error('Failed to delete inquiry');
    }
  };

  const handleExport = async () => {
    try {
      const response = await exportInquiries(filters);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inquiries_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (error) {
      toast.error('Failed to export');
    }
  };

  const startEdit = (inquiry) => {
    setEditingId(inquiry.id);
    setEditForm({
      company_name: inquiry.company_name || '',
      person_name: inquiry.person_name || '',
      product_name: inquiry.product_name || '',
      city: inquiry.city || '',
      state: inquiry.state || '',
      contact_number: inquiry.contact_number || '',
      email: inquiry.email || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id) => {
    try {
      await updateInquiry(id, editForm);
      toast.success('Inquiry updated');
      setEditingId(null);
      fetchInquiries();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inquiries</h2>
          <p className="text-slate-500 mt-1">{pagination.total} total inquiries found</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-blue-100 text-blue-700' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by company name, person, or requirement..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="input-field pl-12 py-3"
        />
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card bg-slate-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Filter Options</h3>
            <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700">
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Product</label>
              <select
                value={filters.product}
                onChange={(e) => handleFilterChange('product', e.target.value)}
                className="input-field"
              >
                <option value="">All Products</option>
                {filterOptions.products.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">City</label>
              <select
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="input-field"
              >
                <option value="">All Cities</option>
                {filterOptions.cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">State</label>
              <select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="input-field"
              >
                <option value="">All States</option>
                {filterOptions.states.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-header">Date</th>
                <th className="table-header">Company</th>
                <th className="table-header">Person</th>
                <th className="table-header">Product</th>
                <th className="table-header">Location</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No inquiries found
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-slate-50 transition-colors">
                    {editingId === inquiry.id ? (
                      <>
                        <td className="table-cell">
                          <span className="text-slate-500">{inquiry.date}</span>
                        </td>
                        <td className="table-cell">
                          <input
                            value={editForm.company_name || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, company_name: e.target.value }))}
                            className="input-field text-sm py-1"
                          />
                        </td>
                        <td className="table-cell">
                          <input
                            value={editForm.person_name || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, person_name: e.target.value }))}
                            className="input-field text-sm py-1"
                          />
                        </td>
                        <td className="table-cell">
                          <input
                            value={editForm.product_name || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, product_name: e.target.value }))}
                            className="input-field text-sm py-1"
                          />
                        </td>
                        <td className="table-cell">
                          <div className="flex gap-1">
                            <input
                              value={editForm.city || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                              className="input-field text-sm py-1 w-24"
                              placeholder="City"
                            />
                            <input
                              value={editForm.state || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                              className="input-field text-sm py-1 w-24"
                              placeholder="State"
                            />
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex gap-1">
                            <input
                              value={editForm.contact_number || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, contact_number: e.target.value }))}
                              className="input-field text-sm py-1 w-28"
                            />
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            <button onClick={() => saveEdit(inquiry.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="table-cell">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{inquiry.date}</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium">{inquiry.company_name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="table-cell">{inquiry.person_name || 'N/A'}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-xs">
                              {inquiry.product_name || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{inquiry.city || 'N/A'}{inquiry.state ? `, ${inquiry.state}` : ''}</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="space-y-0.5">
                            {inquiry.contact_number && (
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{inquiry.contact_number}</span>
                              </div>
                            )}
                            {inquiry.email && (
                              <div className="flex items-center gap-1 text-xs">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[120px]">{inquiry.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => startEdit(inquiry)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(inquiry.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inquiries;
