import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../services/api';
import { 
  TrendingUp, 
  Users, 
  Package, 
  MapPin,
  Calendar,
  Repeat
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange.from) params.dateFrom = dateRange.from;
      if (dateRange.to) params.dateTo = dateRange.to;

      const response = await getDashboardStats(params);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const monthlyData = stats?.monthlyStats?.map(item => ({
    month: item.month,
    count: item.count
  })) || [];

  const productData = stats?.topProducts?.map(item => ({
    name: item.product_name,
    value: item.count
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500 mt-1">Overview of your TradeIndia inquiries</p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="input-field text-sm py-1.5 w-36"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="input-field text-sm py-1.5 w-36"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Inquiries" 
          value={stats?.totalInquiries || 0} 
          icon={TrendingUp}
          color="bg-blue-600"
        />
        <StatCard 
          title="Top Product" 
          value={stats?.topProducts?.[0]?.product_name || 'N/A'} 
          icon={Package}
          color="bg-emerald-600"
        />
        <StatCard 
          title="Top City" 
          value={stats?.topCities?.[0]?.city || 'N/A'} 
          icon={MapPin}
          color="bg-amber-600"
        />
        <StatCard 
          title="Repeat Customers" 
          value={stats?.repeatCustomers?.length || 0} 
          icon={Repeat}
          color="bg-violet-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Inquiry Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {productData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {productData.slice(0, 5).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-slate-700 truncate max-w-[200px]">{item.name}</span>
                </div>
                <span className="font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Top Cities</h3>
          </div>
          <div className="space-y-3">
            {stats?.topCities?.map((city, index) => (
              <div key={city.city} className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500 w-6">#{index + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{city.city}</span>
                    <span className="font-medium text-slate-900">{city.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(city.count / (stats.topCities[0]?.count || 1)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            )) || <p className="text-slate-400 text-sm">No data available</p>}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">Repeat Customers</h3>
          </div>
          <div className="space-y-3">
            {stats?.repeatCustomers?.map((customer, index) => (
              <div key={customer.company_name} className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500 w-6">#{index + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 truncate max-w-[200px]">{customer.company_name}</span>
                    <span className="font-medium text-emerald-600">{customer.inquiry_count} inquiries</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(customer.inquiry_count / (stats.repeatCustomers[0]?.inquiry_count || 1)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            )) || <p className="text-slate-400 text-sm">No repeat customers yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
