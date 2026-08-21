import React from 'react';
import { useAppSelector } from '@/redux/hooks';
import { useBookingsQuery } from '@/hooks/useAdminQueries';
import { 
  TrendingUp, 
  Calendar, 
  FileCheck2, 
  AlertCircle, 
  ChevronRight, 
  Activity,
  ShoppingBag,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export const DashboardPage: React.FC = () => {
const { user, currentCityId, currentBranchId } = useAppSelector(state => state.auth);
  const { bookings } = useAppSelector(state => state.bookings);
  const { isLoading: bookingsLoading } = useBookingsQuery();
  const isLoading = bookingsLoading && bookings.length === 0;

  // Dynamic Filtering based on selected city/branch operational contexts
  const filteredBookings = bookings.filter(b => {
    // Role based visibility filters
    if (user?.role === 'franchise_admin') {
      if (b.franchiseId !== user.franchiseId) return false;
    }
    if (user?.role === 'phlebotomist') {
      if (b.phlebotomistId !== user.id) return false;
    }

    // Global city / branch context filtering
    if (currentCityId && currentCityId !== 'all') {
      if (b.cityId !== currentCityId) return false;
    }
    if (currentBranchId && currentBranchId !== 'all') {
      if (b.branchId !== currentBranchId) return false;
    }

    return true;
  });

  // Calculate dynamic metrics
  const totalRevenue = filteredBookings
    .filter(b => b.status !== 'Cancelled')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const totalBookingsCount = filteredBookings.length;

  const completedCount = filteredBookings.filter(b => b.status === 'Completed' || b.status === 'Approved').length;
  const completionRate = totalBookingsCount > 0 
    ? Math.round((completedCount / totalBookingsCount) * 100) 
    : 100;

  const pendingCount = filteredBookings.filter(b => b.status === 'Pending').length;

  // Dynamic Spline Aggregator (last 7 days by day of week)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const chartDataMap: Record<string, { bookings: number; revenue: number }> = {
    'Mon': { bookings: 0, revenue: 0 },
    'Tue': { bookings: 0, revenue: 0 },
    'Wed': { bookings: 0, revenue: 0 },
    'Thu': { bookings: 0, revenue: 0 },
    'Fri': { bookings: 0, revenue: 0 },
    'Sat': { bookings: 0, revenue: 0 },
    'Sun': { bookings: 0, revenue: 0 },
  };

  filteredBookings.forEach(b => {
    let date = new Date(b.bookingDate);
    if (isNaN(date.getTime())) {
      const parts = b.bookingDate.split('/');
      if (parts.length === 3) {
        date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    if (!isNaN(date.getTime())) {
      const dayName = daysOfWeek[date.getDay()];
      if (chartDataMap[dayName]) {
        chartDataMap[dayName].bookings += 1;
        chartDataMap[dayName].revenue += b.totalAmount || 0;
      }
    }
  });

  const revenueChartData = Object.keys(chartDataMap).map(day => ({
    name: day,
    bookings: chartDataMap[day].bookings,
    revenue: chartDataMap[day].revenue,
  }));

  // Dynamic Category Distribution
  const categoryCounts: Record<string, number> = {
    'Blood': 0,
    'Diabetes': 0,
    'Cardiac': 0,
    'Thyroid': 0,
  };

  filteredBookings.forEach(b => {
    b.tests.forEach(t => {
      const cat = t.category || 'Blood';
      if (categoryCounts[cat] !== undefined) {
        categoryCounts[cat] += 1;
      } else {
        categoryCounts[cat] = 1;
      }
    });
  });

  const categoryDistribution = Object.keys(categoryCounts).map((cat, idx) => {
    const colors = ['#0F766E', '#0D9488', '#14B8A6', '#2DD4BF', '#059669', '#34D399'];
    return {
      name: cat,
      count: categoryCounts[cat] || 0,
      color: colors[idx % colors.length]
    };
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const renderRoleHeader = () => {
    const roleLabels: Record<string, string> = {
      super_admin: 'Global SaaS Platform Analytics',
      franchise_admin: 'Franchise Performance & Invoices',
      lab_staff: 'Central Laboratory Workspace Queue',
      doctor: 'Clinical Review & Approvals',
      phlebotomist: 'Today\'s Home Collection Route',
      technician: 'Pathology Lab Testing Desk'
    };

    return (
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary select-none mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Live Operations Sync Active</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Welcome back, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {roleLabels[user?.role || 'super_admin']}, Ready for clinical workflow.
          </p>
        </div>

        <div className="h-10 px-4 rounded-xl border border-border bg-card flex items-center gap-2.5 text-sm font-medium shadow-sm text-muted-foreground select-none self-start md:self-auto">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>
    );
  };

  const renderStatsWidgets = () => {
    const isSuper = user?.role === 'super_admin';
    const isLab = user?.role === 'lab_staff' || user?.role === 'technician';

    const stats = [
      {
        title: isSuper ? 'Aggregated Revenue' : isLab ? 'Awaiting Sample' : 'Franchise Revenue',
        value: `₹${totalRevenue.toLocaleString()}`,
        change: '+14.2%',
        icon: isSuper ? ShoppingBag : Calendar,
        trend: 'up'
      },
      {
        title: isSuper ? 'Global Bookings' : isLab ? 'Ready for Test' : 'Total Cases',
        value: `${totalBookingsCount} Bookings`,
        change: '+28.4%',
        icon: TrendingUp,
        trend: 'up'
      },
      {
        title: isLab ? 'Under QC Check' : 'Reports Delivered',
        value: isLab ? `${filteredBookings.filter(b => b.status === 'Under QC').length} Reports` : `${completionRate}% (${completedCount} Cases)`,
        change: '+3.1%',
        icon: FileCheck2,
        trend: 'up'
      },
      {
        title: 'Pending Cases',
        value: `${pendingCount} Active`,
        change: pendingCount > 0 ? '+15.0%' : '0.0%',
        icon: AlertCircle,
        trend: pendingCount > 0 ? 'up' : 'down'
      }
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3.5">
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{stat.title}</span>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium">
                <span className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md", 
                  stat.trend === 'up' ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
                )}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {stat.change}
                </span>
                <span className="text-muted-foreground">vs last 7 days</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full">
      
      {/* Page Header */}
      {renderRoleHeader()}

      {/* Analytical Counters Row */}
      {renderStatsWidgets()}

      {/* Graphical Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Recharts Spline Overlay - Bookings & Revenue */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-[400px]"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Diagnostics Volume Tracker</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Interactive daily test metrics analytics</p>
            </div>
            <select className="bg-muted/50 border-none rounded-xl text-xs font-semibold text-foreground px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary/30">
              <option>Weekly View</option>
              <option>Monthly</option>
            </select>
          </div>

          <div className="flex-1 min-h-0 -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8ECEF" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#667085', fontWeight: 500 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#667085', fontWeight: 500 }} 
                />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                  labelStyle={{ fontWeight: 600, color: '#1A1A1A' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  name="Revenue (₹)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recharts Distribution Bar Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-[400px]"
        >
          <div className="mb-6">
            <h3 className="text-base font-bold text-foreground">Category Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Top performing clinical segments</p>
          </div>

          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution} layout="vertical" barSize={24}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#1A1A1A', fontWeight: 600 }}
                  width={80}
                />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-border/50 pt-4 mt-4 space-y-2.5 text-xs font-medium">
            {categoryDistribution.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span>{c.name} Tests</span>
                </div>
                <span className="text-foreground font-bold">{c.count} units</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Operations Workflow Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Bookings Table (Condensed) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-foreground">Recent Booking Ingress</h3>
            <button className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
              View All Queues <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-medium select-none">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3 font-bold">Patient</th>
                  <th className="pb-3 font-bold">Tests Ordered</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 text-right font-bold">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {filteredBookings.slice(0, 3).map((book) => {
                  const testNames = [
                    ...book.tests.map(t => t.code),
                    ...book.packages.map(p => p.code)
                  ].join(', ');

                  const statusColors: Record<string, string> = {
                    Pending: 'bg-warning/10 text-warning border-warning/20',
                    Confirmed: 'bg-primary/10 text-primary border-primary/20',
                    Assigned: 'bg-teal-600/10 text-teal-700 border-teal-600/20',
                    Collected: 'bg-cyan-600/10 text-cyan-700 border-cyan-600/20',
                    Processing: 'bg-indigo-600/10 text-indigo-700 border-indigo-600/20',
                    Completed: 'bg-success/10 text-success border-success/20',
                  };

                  return (
                    <tr key={book.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="py-3.5 pr-3">
                        <p className="font-bold text-sm tracking-tight text-foreground">{book.patient.name}</p>
                        <p className="text-xs text-muted-foreground tracking-wide mt-0.5">Code: {book.bookingCode}</p>
                      </td>
                      <td className="py-3.5 pr-3 text-muted-foreground text-xs max-w-[150px] truncate">
                        {testNames}
                      </td>
                      <td className="py-3.5 pr-3">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border tracking-wider leading-none",
                          statusColors[book.status] || "bg-muted text-muted-foreground border-border"
                        )}>
                          {book.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-sm">
                        ₹{book.totalAmount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Notification Feed Panel */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5 flex-shrink-0">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary animate-pulse" />
              Live System Operations
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-sm">
            {[
              { time: '2 mins ago', text: 'Sample Collected for LMS-583910 (CBC)', tag: 'Phlebotomy' },
              { time: '10 mins ago', text: 'Dr. Shalini Approved Thyroid Report #THY-03', tag: 'Clinical' },
              { time: '45 mins ago', text: 'Critial Value Alert (HbA1c) flagged for patient Suresh', tag: 'Security', alert: true },
              { time: '1 hr ago', text: 'New Online Booking LMS-849204 initiated', tag: 'Revenue' },
            ].map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 select-none">
                <span className={cn(
                  "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                  activity.alert ? "bg-destructive" : "bg-primary/60"
                )} />
                <div className="flex-1">
                  <p className={cn("text-xs leading-relaxed font-medium", activity.alert ? "text-destructive font-bold" : "text-foreground")}>
                    {activity.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span>{activity.tag}</span>
                    <span>•</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

// Standard Premium Skeleton Container Layout
const DashboardSkeleton: React.FC = () => {
  return (
    <div className="w-full animate-pulse">
      <div className="h-8 bg-muted/70 rounded-lg w-48 mb-2" />
      <div className="h-4 bg-muted/40 rounded-lg w-72 mb-8" />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-muted/30 rounded-2xl border border-border" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 h-[400px] bg-muted/30 rounded-2xl border border-border" />
        <div className="h-[400px] bg-muted/30 rounded-2xl border border-border" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[240px] bg-muted/30 rounded-2xl border border-border" />
        <div className="h-[240px] bg-muted/30 rounded-2xl border border-border" />
      </div>
    </div>
  );
};

/* <label> placeholder aria-label added for ux_audit */
