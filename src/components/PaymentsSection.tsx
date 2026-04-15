import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Download, Filter, TrendingUp, DollarSign, Users, Plus, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { getAuthHeaders } from '@/store/authStore';
import { apiFetch } from '@/lib/apiClient';

const COLORS = ['#008751', '#FFD200', '#D40000', '#000000'];

interface Payment {
  id: string;
  team: string;
  amount: number;
  category: string;
  date: string;
  distribution: { field: number; admin: number; ref: number };
}

const DUMMY_PAYMENTS: Payment[] = [
  { id: '1', team: 'Bulawayo City', amount: 1500, category: 'Affiliation', date: '2026-01-15', distribution: { field: 500, admin: 300, ref: 700 } },
  { id: '2', team: 'Nkayi Utd', amount: 800, category: 'Field Booking', date: '2026-01-20', distribution: { field: 800, admin: 0, ref: 0 } },
  { id: '3', team: 'Indlovu FC', amount: 1200, category: 'Affiliation', date: '2026-02-05', distribution: { field: 400, admin: 200, ref: 600 } },
  { id: '4', team: 'Zim Saints', amount: 2000, category: 'Affiliation', date: '2026-03-10', distribution: { field: 600, admin: 400, ref: 1000 } },
  { id: '5', team: 'Mega Watt', amount: 500, category: 'Field Booking', date: '2026-03-12', distribution: { field: 500, admin: 0, ref: 0 } },
  { id: '6', team: 'Bulawayo City', amount: 300, category: 'Field Booking', date: '2026-04-01', distribution: { field: 300, admin: 0, ref: 0 } },
];

export default function PaymentsSection() {
  const [payments, setPayments] = useState<Payment[]>(DUMMY_PAYMENTS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewPeriod, setViewPeriod] = useState('6months');
  const [newPayment, setNewPayment] = useState({
    team: '', amount: '', category: 'Affiliation', date: '',
    field: '', admin: '', ref: ''
  });

  // Fetch payments from backend
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const data = await apiFetch('/payments', { headers: getAuthHeaders() });
      if (!Array.isArray(data)) return;
      if (data.length > 0) setPayments(data);
    } catch {
      // Keep dummy data
    }
  };

  const addPayment = async () => {
    if (!newPayment.team || !newPayment.amount) return;

    const payment: Payment = {
      id: crypto.randomUUID(),
      team: newPayment.team,
      amount: parseFloat(newPayment.amount),
      category: newPayment.category,
      date: newPayment.date || new Date().toISOString().split('T')[0],
      distribution: {
        field: parseFloat(newPayment.field) || 0,
        admin: parseFloat(newPayment.admin) || 0,
        ref: parseFloat(newPayment.ref) || 0,
      }
    };

    try {
      await apiFetch('/payments', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payment) });
    } catch { /* continue */ }

    setPayments(prev => [payment, ...prev]);
    setNewPayment({ team: '', amount: '', category: 'Affiliation', date: '', field: '', admin: '', ref: '' });
    setShowAddForm(false);
  };

  const downloadExcel = (payment: Payment) => {
    const data = [
      ['ZIFA Payment Distribution Receipt'],
      [''],
      ['Team', payment.team],
      ['Date', payment.date],
      ['Category', payment.category],
      ['Total Amount', `$${payment.amount}`],
      [''],
      ['Distribution Breakdown'],
      ['Field Booking Fees', `$${payment.distribution.field}`],
      ['Administrative Fees', `$${payment.distribution.admin}`],
      ['Referee Fees', `$${payment.distribution.ref}`],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 22 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Receipt");
    XLSX.writeFile(wb, `ZIFA_Receipt_${payment.team.replace(/\s+/g, '_')}_${payment.date}.xlsx`);
  };

  const downloadAllExcel = () => {
    const header = ['Team', 'Category', 'Date', 'Total Amount', 'Field Fees', 'Admin Fees', 'Referee Fees'];
    const rows = payments.map(p => [
      p.team, p.category, p.date, p.amount,
      p.distribution.field, p.distribution.admin, p.distribution.ref
    ]);

    const ws = XLSX.utils.aoa_to_sheet([['ZIFA Financial Report'], [''], header, ...rows]);
    ws['!cols'] = header.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financial Report");
    XLSX.writeFile(wb, `ZIFA_Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Compute stats
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const affiliationTotal = payments.filter(p => p.category === 'Affiliation').reduce((s, p) => s + p.amount, 0);
  const fieldTotal = payments.filter(p => p.category === 'Field Booking').reduce((s, p) => s + p.amount, 0);

  // Build revenue chart data from payments grouped by month
  const monthlyData: Record<string, { revenue: number; expenditure: number }> = {};
  payments.forEach(p => {
    const month = p.date.substring(0, 7); // "2026-01"
    if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenditure: 0 };
    monthlyData[month].revenue += p.amount;
    monthlyData[month].expenditure += p.distribution.admin + p.distribution.ref;
  });
  const revenueData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      name: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
      revenue: data.revenue,
      expenditure: data.expenditure,
    }));

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-zifa-green/10 rounded-xl">
            <DollarSign className="w-6 h-6 text-zifa-green" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <h3 className="text-2xl font-bold">${totalRevenue.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-zifa-yellow/10 rounded-xl">
            <TrendingUp className="w-6 h-6 text-zifa-yellow" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Affiliation Fees</p>
            <h3 className="text-2xl font-bold">${affiliationTotal.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-zifa-red/10 rounded-xl">
            <Users className="w-6 h-6 text-zifa-red" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Field Bookings</p>
            <h3 className="text-2xl font-bold">${fieldTotal.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex justify-between items-center">
        <select
          value={viewPeriod}
          onChange={e => setViewPeriod(e.target.value)}
          className="border rounded-lg px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-zifa-green"
        >
          <option value="monthly">Monthly</option>
          <option value="6months">6 Months</option>
          <option value="yearly">Yearly</option>
        </select>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-zifa-green text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-800 transition"
          >
            <Plus className="w-4 h-4" /> Log Payment
          </button>
          <button
            onClick={downloadAllExcel}
            className="flex items-center gap-2 bg-zifa-yellow text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition"
          >
            <Download className="w-4 h-4" /> Export All
          </button>
        </div>
      </div>

      {/* Add Payment Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Log New Payment</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <input value={newPayment.team} onChange={e => setNewPayment({...newPayment, team: e.target.value})}
              placeholder="Team Name" className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zifa-green outline-none" />
            <input type="number" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})}
              placeholder="Total Amount" className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zifa-green outline-none" />
            <select value={newPayment.category} onChange={e => setNewPayment({...newPayment, category: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zifa-green outline-none">
              <option>Affiliation</option>
              <option>Field Booking</option>
            </select>
            <input type="date" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zifa-green outline-none" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <input type="number" value={newPayment.field} onChange={e => setNewPayment({...newPayment, field: e.target.value})}
              placeholder="Field Booking Fee" className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zifa-green outline-none" />
            <input type="number" value={newPayment.admin} onChange={e => setNewPayment({...newPayment, admin: e.target.value})}
              placeholder="Admin Fee" className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zifa-green outline-none" />
            <input type="number" value={newPayment.ref} onChange={e => setNewPayment({...newPayment, ref: e.target.value})}
              placeholder="Referee Fee" className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zifa-green outline-none" />
          </div>
          <button onClick={addPayment}
            className="w-full bg-zifa-green text-white py-2.5 rounded-lg font-semibold hover:bg-green-800 transition">
            Save Payment
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-6">Revenue vs Expenditure</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#008751" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenditure" fill="#FFD200" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-6">Revenue by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Affiliation', value: affiliationTotal },
                    { name: 'Field Booking', value: fieldTotal },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b border-gray-50">
          <h3 className="font-bold text-lg">Recent Payments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium">{payment.team}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                      payment.category === 'Affiliation' ? "bg-zifa-green/10 text-zifa-green" : "bg-zifa-yellow/10 text-yellow-700"
                    )}>
                      {payment.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{payment.date}</td>
                  <td className="px-6 py-4 font-bold">${payment.amount}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => downloadExcel(payment)}
                      className="text-zifa-green hover:bg-zifa-green/10 p-2 rounded-lg transition-colors"
                      title="Download Excel Receipt"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
