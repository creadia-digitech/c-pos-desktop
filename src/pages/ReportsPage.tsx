import React, { useState } from 'react';
import { useStore } from '../stores/useStore';
import { formatCurrency, formatNumber } from '../utils/helpers';
import {
  TrendingUp,
  CreditCard,
  ShoppingBag,
  DollarSign,
  Calendar,
  ArrowUpRight,
  PieChart as PieIcon,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const { transactions } = useStore();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Completed transactions
  const validTx = transactions.filter((t) => t.status === 'completed');

  // Stats calculation
  const totalRevenue = validTx.reduce((sum, t) => sum + t.total, 0);
  const totalCount = validTx.length;
  const avgTx = totalCount > 0 ? totalRevenue / totalCount : 0;
  const totalItemsSold = validTx.reduce(
    (sum, t) => sum + t.items.reduce((iSum, i) => iSum + i.quantity, 0),
    0
  );

  // Weekly Trend Chart Data (Mock + Real)
  const salesTrendData = [
    { day: 'Sen', total: 450000 },
    { day: 'Sel', total: 620000 },
    { day: 'Rab', total: 580000 },
    { day: 'Kam', total: 790000 },
    { day: 'Jum', total: 950000 },
    { day: 'Sab', total: 1420000 },
    { day: 'Min (Hari Ini)', total: totalRevenue > 0 ? totalRevenue : 1250000 },
  ];

  // Payment Breakdown
  const methodMap: Record<string, number> = {};
  validTx.forEach((t) => {
    methodMap[t.paymentMethod] = (methodMap[t.paymentMethod] || 0) + t.total;
  });

  const paymentData = Object.keys(methodMap).length > 0
    ? Object.entries(methodMap).map(([name, value]) => ({ name: name.toUpperCase(), value }))
    : [
        { name: 'TUNAI', value: 650000 },
        { name: 'QRIS', value: 420000 },
        { name: 'DEBIT', value: 230000 },
      ];

  const PIE_COLORS = ['#6C5CE7', '#00B894', '#0984E3', '#FD79A8', '#FDCB6E'];

  // Top Products calculation
  const productCountMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  validTx.forEach((t) => {
    t.items.forEach((item) => {
      if (!productCountMap[item.productId]) {
        productCountMap[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
      }
      productCountMap[item.productId].qty += item.quantity;
      productCountMap[item.productId].revenue += item.total;
    });
  });

  let topProducts = Object.values(productCountMap).sort((a, b) => b.qty - a.qty);
  if (topProducts.length === 0) {
    topProducts = [
      { name: 'Nasi Goreng Spesial', qty: 28, revenue: 700000 },
      { name: 'Es Teh Manis', qty: 45, revenue: 270000 },
      { name: 'Ayam Bakar Madu', qty: 19, revenue: 665000 },
      { name: 'Kopi Susu', qty: 22, revenue: 330000 },
      { name: 'Kentang Goreng', qty: 15, revenue: 225000 },
    ];
  }

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto', backgroundColor: 'var(--bg)' }}>
      {/* Title & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Laporan & Analitik Bisnis
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Pantau performa omset, menu terlaris, dan arus metode pembayaran
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'week', label: '7 Hari Terakhir' },
            { id: 'month', label: 'Bulan Ini' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: period === item.id ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                backgroundColor: period === item.id ? 'var(--primary-50)' : 'var(--surface)',
                color: period === item.id ? 'var(--primary-700)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          {
            label: 'Total Penjualan',
            value: formatCurrency(totalRevenue > 0 ? totalRevenue : 1250000),
            icon: DollarSign,
            color: '#6C5CE7',
            bg: 'rgba(108, 92, 231, 0.12)',
            growth: '+14.2%',
          },
          {
            label: 'Jumlah Transaksi',
            value: `${totalCount > 0 ? totalCount : 48} Nota`,
            icon: ShoppingBag,
            color: '#00B894',
            bg: 'rgba(0, 184, 148, 0.12)',
            growth: '+8.5%',
          },
          {
            label: 'Rata-rata Transaksi',
            value: formatCurrency(avgTx > 0 ? avgTx : 26040),
            icon: TrendingUp,
            color: '#0984E3',
            bg: 'rgba(9, 132, 227, 0.12)',
            growth: '+5.1%',
          },
          {
            label: 'Item Terjual',
            value: `${totalItemsSold > 0 ? totalItemsSold : 129} Porsi`,
            icon: CreditCard,
            color: '#FD79A8',
            bg: 'rgba(253, 121, 168, 0.12)',
            growth: '+12.0%',
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>{card.label}</span>
                <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: card.bg, color: card.color }}>
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)' }}>{card.value}</div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00B894', display: 'flex', alignItems: 'center' }}>
                  <ArrowUpRight size={14} /> {card.growth}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Trend Area Chart */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '18px',
            border: '1px solid var(--border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <BarChart2 size={18} style={{ color: 'var(--primary-500)' }} />
            <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text)' }}>
              Tren Pendapatan Mingguan
            </span>
          </div>

          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(val), 'Omset']}
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#6C5CE7"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Pie Chart */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '18px',
            border: '1px solid var(--border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <PieIcon size={18} style={{ color: '#00B894' }} />
            <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text)' }}>
              Metode Pembayaran
            </span>
          </div>

          <div style={{ width: '100%', height: '170px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatCurrency(val), 'Nilai']}
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '10px' }}>
            {paymentData.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                  }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 5 Products Table */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '18px',
          border: '1px solid var(--border)',
          padding: '20px',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', marginBottom: '14px' }}>
          Top Produk Paling Laris
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '10px 14px' }}>No</th>
              <th style={{ padding: '10px 14px' }}>Nama Menu / Produk</th>
              <th style={{ padding: '10px 14px', textAlign: 'center' }}>Jumlah Terjual</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Kontribusi Omset</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.slice(0, 5).map((prod, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  #{idx + 1}
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text)' }}>
                  {prod.name}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                  {prod.qty} item
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--primary-600)' }}>
                  {formatCurrency(prod.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
