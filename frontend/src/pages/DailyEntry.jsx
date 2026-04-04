import { useState, useEffect } from 'react';
import api from '../api/axios';
import { format } from 'date-fns';
import { Check, X, AlertCircle } from 'lucide-react';

const DailyEntry = () => {
  const [customers, setCustomers] = useState([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [custRes, logsRes] = await Promise.all([
          api.get('/customers'),
          api.get('/logs')
        ]);
        setCustomers(custRes.data);
        setLogs(logsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter logs for selected date
  const todaysLogs = logs.filter(log => log.date.startsWith(date));
  const loggedCustomerIds = todaysLogs.map(log => log.customerId?._id);

  const handleMarkEntry = async (customerId, type, quantity = 0) => {
    setSaving(customerId);
    try {
      const { data } = await api.post('/logs', {
        customerId,
        date,
        type,
        quantity
      });
      // Add new log to state
      setLogs([...logs, { ...data, customerId: customers.find(c => c._id === customerId) }]);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving entry');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="w-full md:w-auto">
          <label className="block text-sm text-gray-500 mb-1">Select Date</label>
          <input 
            type="date"
            className="input-field max-w-[200px]"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="hidden md:block text-right text-sm text-gray-400">
          <p>Exceptions only: Only log if customer is <span className="text-red-400 font-medium">Absent</span> or needs <span className="text-blue-400 font-medium">Extra</span>.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? <div className="text-center py-4">Loading...</div> : 
          customers.map(customer => {
            const isMarked = loggedCustomerIds.includes(customer._id);
            const logEntry = todaysLogs.find(l => l.customerId?._id === customer._id);

            return (
              <div key={customer._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:border-primary-100 hover:shadow-md">
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{customer.name}</h3>
                  <p className="text-sm text-gray-500 italic">Default: {customer.defaultMilkPerDay || customer.defaultMilkQuantity} Kg</p>
                </div>
                
                {isMarked ? (
                  <div className="flex items-center px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    {logEntry.type === 'ABSENT' ? (
                      <span className="text-red-500 font-medium flex items-center"><X className="w-4 h-4 mr-1"/> Absent (Chuti)</span>
                    ) : (
                      <span className="text-blue-600 font-medium flex items-center">
                        <Check className="w-4 h-4 mr-1"/> 
                        +{logEntry.quantity} Kg Extra
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="hidden sm:flex items-center text-xs text-green-500 font-medium px-3 mr-2 bg-green-50 rounded-full border border-green-100">
                      Auto: {customer.defaultMilkPerDay || customer.defaultMilkQuantity} Kg
                    </div>

                    <button 
                      disabled={saving === customer._id}
                      onClick={() => {
                        const extra = prompt("Enter extra milk quantity (Kg):", "1");
                        if (extra !== null && extra !== "") {
                          handleMarkEntry(customer._id, 'EXTRA', Number(extra));
                        }
                      }}
                      className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium transition-colors border border-blue-100"
                    >
                      {saving === customer._id ? '...' : '+ Extra'}
                    </button>
 
                    <button 
                      disabled={saving === customer._id}
                      onClick={() => {
                        if(window.confirm(`Mark ${customer.name} as Absent (Chuti) for today?`)) {
                          handleMarkEntry(customer._id, 'ABSENT');
                        }
                      }}
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors border border-red-100"
                    >
                      {saving === customer._id ? '...' : 'Absent'}
                    </button>
                  </div>
                )}
              </div>
            )
          })
        }
        {customers.length === 0 && !loading && (
          <div className="text-center py-10 text-gray-500 bg-white rounded-xl">No customers added yet.</div>
        )}
      </div>
    </div>
  );
};

export default DailyEntry;
