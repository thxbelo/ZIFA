import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download, TrendingUp, DollarSign, Users, Plus, X, Loader2, RefreshCw, Wallet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { getAuthHeaders } from '@/store/authStore';
import { apiFetch } from '@/lib/apiClient';
import { useSocket } from '@/lib/socket';
import LiveDataState from './LiveDataState';

const COLORS = ['#008751', '#FFD200', '#D40000', '#000000'];

interface Payment {
  id: string;
  team: string;
  amount: number;
  category: string;
  date: string;
  distribution: { field: number; admin: number; ref: number };
}

export default function PaymentsSection() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewPeriod, setViewPeriod] = useState('6months');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { socket } = useSocket();
  const [newPayment, setNewPayment] = useState({
    team: '',
    amount: '',
    category: 'Affiliation',
    date: '',
    field: '',
    admin: '',
    ref: '',
  });

  const fetchPayments = async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const data = await apiFetch('/payments', { headers: getAuthHeaders() });
      setPayments(Array.isArray(data) ? data : []);
      setLoadError(null);
    } catch (err) {
      console.error('Failed to load payments:', err);
      setPayments([]);
      setLoadError('Payment records could not be synced from the database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments('initial');
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      fetchPayments('refresh');
    };

    socket.on('paymentsUpdate', handleRefresh);

    return () => {
      socket.off('paymentsUpdate', handleRefresh);
    };
  }, [socket]);

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
      },
    };

    setIsSubmitting(true);

    try {
      await apiFetch('/payments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payment),
      });
      await fetchPayments('refresh');
      setNewPayment({ team: '', amount: '', category: 'Affiliation', date: '', field: '', admin: '', ref: '' });
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to save payment:', err);
      setLoadError('The payment was not saved. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
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
    XLSX.utils.book_append_sheet(wb, ws, 'Receipt');
    XLSX.writeFile(wb, `ZIFA_Receipt_${payment.team.replace(/\s+/g, '_')}_${payment.date}.xlsx`);
  };

  const downloadAllExcel = () => {
    const header = ['Team', 'Category', 'Date', 'Total Amount', 'Field Fees', 'Admin Fees', 'Referee Fees'];
    const rows = payments.map((payment) => [
      payment.team,
      payment.category,
      payment.date,
      payment.amount,
      payment.distribution.field,
      payment.distribution.admin,
      payment.distribution.ref,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([['ZIFA Financial Report'], [''], header, ...rows]);
    ws['!cols'] = header.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financial Report');
    XLSX.writeFile(wb, `ZIFA_Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const affiliationTotal = payments
    .filter((payment) => payment.category === 'Affiliation')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const fieldTotal = payments
    .filter((payment) => payment.category === 'Field Booking')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const monthlyData: Record<string, { revenue: number; expenditure: number }> = {};
  payments.forEach((payment) => {
    const month = payment.date.substring(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenditure: 0 };
    monthlyData[month].revenue += payment.amount;
    monthlyData[month].expenditure += payment.distribution.admin + payment.distribution.ref;
  });

  const revenueData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      name: new Date(`${month}-01`).toLocaleString('default', { month: 'short' }),
      revenue: data.revenue,
      expenditure: data.expenditure,
    }));

  const hasPayments = payments.length > 0;
  const hasChartData = revenueData.length > 0;

  if (loading) {
    return (
      <LiveDataState
        icon={RefreshCw}
        title="Loading financial data"
        description="We are pulling the latest payment records and summary totals from the database."
        loading
      />
    );
  }

  if (loadError && !hasPayments) {
    return (
      <LiveDataState
        icon={Wallet}
        title="Payments feed unavailable"
        description={loadError}
        actionLabel="Retry payment sync"
        onAction={() => fetchPayments('initial')}
        tone="warning"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-zifa-green/10 p-3">
            <DollarSign className="h-6 w-6 text-zifa-green" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <h3 className="text-2xl font-bold">${totalRevenue.toLocaleString()}</h3>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-zifa-yellow/10 p-3">
            <TrendingUp className="h-6 w-6 text-zifa-yellow" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Affiliation Fees</p>
            <h3 className="text-2xl font-bold">${affiliationTotal.toLocaleString()}</h3>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-zifa-red/10 p-3">
            <Users className="h-6 w-6 text-zifa-red" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Field Bookings</p>
            <h3 className="text-2xl font-bold">${fieldTotal.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={viewPeriod}
            onChange={(e) => setViewPeriod(e.target.value)}
            className="rounded-lg border px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-zifa-green"
          >
            <option value="monthly">Monthly</option>
            <option value="6months">6 Months</option>
            <option value="yearly">Yearly</option>
          </select>
          <span className="inline-flex items-center gap-1 rounded-full bg-zifa-green/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-zifa-green">
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="h-2 w-2 rounded-full bg-current" />}
            {refreshing ? 'Refreshing' : 'Live database'}
          </span>
          {loadError ? <span className="text-xs font-bold uppercase tracking-wider text-yellow-700">{loadError}</span> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 rounded-lg bg-zifa-green px-4 py-2 font-semibold text-white transition hover:bg-green-800"
          >
            <Plus className="h-4 w-4" /> Log Payment
          </button>
          <button
            onClick={downloadAllExcel}
            disabled={!hasPayments}
            className="flex items-center gap-2 rounded-lg bg-zifa-yellow px-4 py-2 font-semibold text-black transition hover:bg-yellow-500 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export All
          </button>
        </div>
      </div>

      {showAddForm ? (
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Log New Payment</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 transition hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <input
              value={newPayment.team}
              onChange={(e) => setNewPayment({ ...newPayment, team: e.target.value })}
              placeholder="Team Name"
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zifa-green"
            />
            <input
              type="number"
              value={newPayment.amount}
              onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
              placeholder="Total Amount"
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zifa-green"
            />
            <select
              value={newPayment.category}
              onChange={(e) => setNewPayment({ ...newPayment, category: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zifa-green"
            >
              <option>Affiliation</option>
              <option>Field Booking</option>
            </select>
            <input
              type="date"
              value={newPayment.date}
              onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zifa-green"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="number"
              value={newPayment.field}
              onChange={(e) => setNewPayment({ ...newPayment, field: e.target.value })}
              placeholder="Field Booking Fee"
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zifa-green"
            />
            <input
              type="number"
              value={newPayment.admin}
              onChange={(e) => setNewPayment({ ...newPayment, admin: e.target.value })}
              placeholder="Admin Fee"
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zifa-green"
            />
            <input
              type="number"
              value={newPayment.ref}
              onChange={(e) => setNewPayment({ ...newPayment, ref: e.target.value })}
              placeholder="Referee Fee"
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zifa-green"
            />
          </div>
          <button
            onClick={addPayment}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-zifa-green py-2.5 font-semibold text-white transition hover:bg-green-800 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Saving Payment...' : 'Save Payment'}
          </button>
        </div>
      ) : null}

      {!hasPayments ? (
        <LiveDataState
          icon={Wallet}
          title="No payments logged yet"
          description="As soon as payments are recorded, revenue charts and receipts will appear here automatically."
          actionLabel="Refresh payments"
          onAction={() => fetchPayments('initial')}
          tone="muted"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold">Revenue vs Expenditure</h3>
              <div className="min-w-0">
                {hasChartData ? (
                  <div className="h-[300px] min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
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
                ) : (
                  <LiveDataState
                    icon={TrendingUp}
                    title="Not enough chart data yet"
                    description="We need at least one dated payment before the revenue timeline can be drawn."
                    compact
                    tone="muted"
                  />
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold">Revenue by Category</h3>
              <div className="min-w-0">
                {affiliationTotal > 0 || fieldTotal > 0 ? (
                  <div className="h-[300px] min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
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
                          {COLORS.slice(0, 2).map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <LiveDataState
                    icon={DollarSign}
                    title="Category totals still empty"
                    description="Once fees are recorded, this breakdown will update automatically."
                    compact
                    tone="muted"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-50 p-6">
              <h3 className="text-lg font-bold">Recent Payments</h3>
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
                    <tr key={payment.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{payment.team}</td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'rounded-full px-2 py-1 text-[10px] font-bold uppercase',
                            payment.category === 'Affiliation'
                              ? 'bg-zifa-green/10 text-zifa-green'
                              : 'bg-zifa-yellow/10 text-yellow-700'
                          )}
                        >
                          {payment.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{payment.date}</td>
                      <td className="px-6 py-4 font-bold">${payment.amount}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => downloadExcel(payment)}
                          className="rounded-lg p-2 text-zifa-green transition-colors hover:bg-zifa-green/10"
                          title="Download Excel Receipt"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
