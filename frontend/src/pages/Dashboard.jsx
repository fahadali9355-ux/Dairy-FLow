import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { BarChart3, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    monthlyExpense: 0,
    estimatedDailyRevenue: 0,
    revenueLoaded: false
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [customersRes, expensesRes, logsRes] = await Promise.all([
          api.get('/customers'),
          api.get('/expenses'),
          api.get('/logs')
        ]);

        const customers = customersRes.data;
        const expenses = expensesRes.data;
        const logs = logsRes.data;

        // Current Month Expenses
        const start = startOfMonth(new Date());
        const end = endOfMonth(new Date());
        
        const monthlyExpense = expenses
          .filter(e => e.type === 'Debit' && new Date(e.date) >= start && new Date(e.date) <= end)
          .reduce((sum, e) => sum + e.amount, 0);

        // Revenue Calculation: Use most recent log date to calculate "Actual" revenue
        let latestDate = null;
        if (logs.length > 0) {
          latestDate = logs.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date;
        }

        let calculatedRevenue = 0;
        customers.forEach(customer => {
          const baseMilk = customer.defaultMilkPerDay || customer.defaultMilkQuantity || 0;
          const rate = customer.ratePerKg || 0;
          
          let dayMilk = baseMilk;
          if (latestDate) {
            // Check if there is an exception for this specific customer on the latest log date
            const exception = logs.find(l => {
              const logCustId = l.customerId?._id || l.customerId;
              return logCustId === customer._id && 
                     new Date(l.date).toDateString() === new Date(latestDate).toDateString();
            });

            if (exception) {
              if (exception.type === 'ABSENT') {
                dayMilk = 0;
              } else if (exception.type === 'EXTRA') {
                dayMilk += (exception.quantity || 0);
              }
            }
          }
          calculatedRevenue += (dayMilk * rate);
        });

        setStats({
          totalCustomers: customers.length,
          monthlyExpense,
          estimatedDailyRevenue: calculatedRevenue,
          revenueLoaded: true
        });

      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-primary-600 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name.split(' ')[0]}!</h1>
          <p className="text-primary-100">Here's what's happening with your dairy farm today.</p>
        </div>
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/3 -translate-y-1/4">
          <BarChart3 className="w-64 h-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Total Customers</h3>
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Latest Day Revenue</h3>
            <div className="bg-green-50 p-3 rounded-xl text-green-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
             {stats.revenueLoaded ? `Rs ${stats.estimatedDailyRevenue.toLocaleString()}` : 'Loading...'}
          </p>
          <p className="text-sm text-gray-400 mt-2">Based on latest log entries.</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Monthly Expenses</h3>
            <div className="bg-red-50 p-3 rounded-xl text-red-500">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
             Rs {stats.monthlyExpense.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-2">Total spent this month.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
