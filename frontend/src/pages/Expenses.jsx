import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Info, Wallet } from 'lucide-react';
import { format } from 'date-fns';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Chara',
    amount: '',
    type: 'Debit',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const categories = ['Chara', 'Medicine', 'Labor', 'Bills', 'Other'];

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get('/expenses');
      setExpenses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', formData);
      setShowModal(false);
      setFormData({ category: 'Chara', amount: '', type: 'Debit', description: '', date: format(new Date(), 'yyyy-MM-dd') });
      fetchExpenses();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await api.delete(`/expenses/${id}`);
        fetchExpenses();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const totalDebits = expenses.filter(e => e.type === 'Debit').reduce((sum, e) => sum + e.amount, 0);
  const totalCredits = expenses.filter(e => e.type === 'Credit').reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalCredits - totalDebits;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses & Records</h1>
          <p className="text-sm text-gray-500">Track your daily costs and extra income.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-1" /> Add Record
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-red-500 p-6 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-400 uppercase">Total Debits</span>
            <ArrowDownCircle className="w-5 h-5 text-red-500 opacity-50" />
          </div>
          <span className="text-3xl font-bold text-gray-800">
            Rs {totalDebits.toLocaleString()}
          </span>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-green-500 p-6 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-400 uppercase">Total Credits</span>
            <ArrowUpCircle className="w-5 h-5 text-green-500 opacity-50" />
          </div>
          <span className="text-3xl font-bold text-gray-800">
            Rs {totalCredits.toLocaleString()}
          </span>
        </div>

        <div className={`bg-white rounded-xl shadow-sm border-l-4 ${netBalance >= 0 ? 'border-primary-500' : 'border-orange-500'} p-6 flex flex-col justify-center`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-400 uppercase">Net Balance</span>
            <Wallet className={`w-5 h-5 ${netBalance >= 0 ? 'text-primary-500' : 'text-orange-500'} opacity-50`} />
          </div>
          <span className={`text-3xl font-bold ${netBalance >= 0 ? 'text-gray-800' : 'text-orange-600'}`}>
            Rs {netBalance.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-gray-600">Date & Desc</th>
              <th className="p-4 font-semibold text-gray-600">Category</th>
              <th className="p-4 font-semibold text-gray-600">Amount</th>
              <th className="p-4 font-semibold text-gray-600 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="4" className="text-center p-6">Loading...</td></tr> : expenses.map(e => (
              <tr key={e._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-gray-900">{format(new Date(e.date), 'dd MMM, yyyy')}</div>
                  <div className="text-sm text-gray-500">{e.description || 'N/A'}</div>
                </td>
                <td className="p-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                    {e.category}
                  </span>
                </td>
                <td className="p-4">
                  <div className={`flex items-center font-bold ${e.type === 'Credit' ? 'text-green-600' : 'text-red-500'}`}>
                    {e.type === 'Credit' ? <ArrowUpCircle className="w-4 h-4 mr-1"/> : <ArrowDownCircle className="w-4 h-4 mr-1"/>}
                    Rs {e.amount.toLocaleString()}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => handleDelete(e._id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5 mx-auto" />
                  </button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && !loading && (
              <tr>
                <td colSpan="4" className="p-10 text-center text-gray-500">
                  <Info className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  No expense records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Add Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="Debit">Debit (Expense)</option>
                  <option value="Credit">Credit (Income/Injection)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs)</label>
                <input type="number" required className="input-field" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" required className="input-field" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input type="text" className="input-field" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="btn-primary">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
