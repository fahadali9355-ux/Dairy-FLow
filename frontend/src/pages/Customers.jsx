import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit2, Trash2, Phone, Droplets } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', defaultMilkPerDay: '', ratePerKg: 250 });
  const [editingId, setEditingId] = useState(null);

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      setShowModal(false);
      setFormData({ name: '', phone: '', defaultMilkPerDay: '', ratePerKg: 250 });
      setEditingId(null);
      fetchCustomers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.delete(`/customers/${id}`);
        fetchCustomers();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openEdit = (customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone,
      defaultMilkPerDay: customer.defaultMilkPerDay || customer.defaultMilkQuantity || 0,
      ratePerKg: customer.ratePerKg || 250
    });
    setEditingId(customer._id);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', phone: '', defaultMilkPerDay: '', ratePerKg: 250 });
            setShowModal(true);
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-1" /> Add Customer
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((c) => (
            <div key={c._id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-800">{c.name}</h3>
                <div className="flex space-x-2 text-gray-400">
                  <button onClick={() => openEdit(c)} className="hover:text-blue-500 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(c._id)} className="hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  {c.phone || 'N/A'}
                </div>
                <div className="flex items-center">
                  <Droplets className="w-4 h-4 mr-2 pl-0.5 text-primary-500" />
                  Default: <span className="font-semibold text-gray-900 ml-1">
                    {c.defaultMilkPerDay || c.defaultMilkQuantity || c.defaultQuantity || 0} Kg
                  </span>
                  <span className="text-gray-400 mx-2 text-xs">|</span>
                  Rate: <span className="font-semibold text-gray-900 ml-1">Rs {c.ratePerKg || 250}</span>
                </div>
              </div>
            </div>
          ))}
          {customers.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              No customers found. Add your first customer!
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Customer' : 'Add Customer'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  type="text" required className="input-field"
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="text" className="input-field"
                  value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Daily Milk (Kg)</label>
                <input 
                  type="number" step="0.5" required className="input-field"
                  value={formData.defaultMilkPerDay} onChange={(e) => setFormData({...formData, defaultMilkPerDay: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate Per Kg (Rs)</label>
                <input 
                  type="number" required className="input-field"
                  value={formData.ratePerKg} onChange={(e) => setFormData({...formData, ratePerKg: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Save Changes' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
