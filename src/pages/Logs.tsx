import React, { useState, useEffect, useCallback } from 'react';
import {
  Terminal,
  Clock,
  ShieldAlert,
  RefreshCcw,
  FileText,
  Lock,
  History,
  ChevronRight,
  Search,
  Filter,
  Download,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { auditService } from '../services/api';

interface AuditLog {
  id: string;
  createdAt: string;
  action: string;
  module: string;
  entityType?: string;
  entityId?: string;
  performedByRole?: string;
  ipAddress?: string;
  severity: string;
  status: string;
  metadata?: any;
  user?: { name: string; email: string; role: string };
}

interface ApiRequestLog {
  id: string;
  createdAt: string;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  ip?: string;
  userId?: string;
  userRole?: string;
  requestId?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-50 text-slate-500 border',
  MEDIUM: 'bg-amber-50 border border-amber-200 text-amber-700',
  HIGH: 'bg-rose-50 border border-rose-200 text-rose-700 animate-pulse',
  CRITICAL: 'bg-rose-100 border border-rose-400 text-rose-800 animate-pulse',
};

const MODULE_COLORS: Record<string, string> = {
  auth: 'bg-blue-50 text-blue-700 border-blue-200',
  bookings: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reports: 'bg-purple-50 text-purple-700 border-purple-200',
  roles_permissions: 'bg-rose-50 text-rose-700 border-rose-200',
  finance: 'bg-green-50 text-green-700 border-green-200',
  inventory: 'bg-amber-50 text-amber-700 border-amber-200',
  cms: 'bg-slate-100 text-slate-700 border-slate-200',
  notifications: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export const LogsPage: React.FC = () => {
  const [activeView, setActiveView] = useState<'audit' | 'gateway'>('audit');

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPagination, setAuditPagination] = useState<Pagination | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModule, setAuditModule] = useState('');
  const [auditSeverity, setAuditSeverity] = useState('');
  const [auditFrom, setAuditFrom] = useState('');
  const [auditTo, setAuditTo] = useState('');
  const [availableModules, setAvailableModules] = useState<string[]>([]);

  const [apiLogs, setApiLogs] = useState<ApiRequestLog[]>([]);
  const [apiPagination, setApiPagination] = useState<Pagination | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiPage, setApiPage] = useState(1);
  const [apiMethod, setApiMethod] = useState('');
  const [apiStatus, setApiStatus] = useState('');
  const [apiSearch, setApiSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const [exportLoading, setExportLoading] = useState(false);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const data = await auditService.getAuditLogs({
        page: auditPage,
        limit: 50,
        search: auditSearch || undefined,
        module: auditModule || undefined,
        severity: auditSeverity || undefined,
        from: auditFrom || undefined,
        to: auditTo || undefined,
      });
      setAuditLogs(data.data);
      setAuditPagination(data.pagination);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }, [auditPage, auditSearch, auditModule, auditSeverity, auditFrom, auditTo]);

  const fetchApiLogs = useCallback(async () => {
    setApiLoading(true);
    try {
      const data = await auditService.getApiRequestLogs({
        page: apiPage,
        limit: 100,
        method: apiMethod || undefined,
        status: apiStatus || undefined,
        search: apiSearch || undefined,
      });
      setApiLogs(data.data);
      setApiPagination(data.pagination);
    } catch {
      setApiLogs([]);
    } finally {
      setApiLoading(false);
    }
  }, [apiPage, apiMethod, apiStatus, apiSearch]);

  useEffect(() => {
    auditService.getAuditModules().then(setAvailableModules).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeView === 'audit') fetchAuditLogs();
  }, [activeView, fetchAuditLogs]);

  useEffect(() => {
    if (activeView === 'gateway') fetchApiLogs();
  }, [activeView, fetchApiLogs]);

  useEffect(() => {
    if (!autoRefresh || activeView !== 'gateway') return;
    const interval = setInterval(fetchApiLogs, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, activeView, fetchApiLogs]);

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const blob = await auditService.exportAuditLogs({
        module: auditModule || undefined,
        severity: auditSeverity || undefined,
        from: auditFrom || undefined,
        to: auditTo || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'text-emerald-400';
    if (code >= 400 && code < 500) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History className="h-7 w-7 text-slate-700" /> Security Ledger & Ingress Console
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time audit trail and API gateway stream from PostgreSQL.
          </p>
        </div>
        <div className="flex bg-muted p-1 rounded-xl border select-none">
          <button
            onClick={() => setActiveView('audit')}
            className={cn(
              'px-4 py-2 text-xs font-black rounded-lg flex items-center gap-1 transition-all',
              activeView === 'audit' ? 'bg-card text-slate-900 shadow' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Lock className="h-3.5 w-3.5" /> Audit Trail
          </button>
          <button
            onClick={() => setActiveView('gateway')}
            className={cn(
              'px-4 py-2 text-xs font-black rounded-lg flex items-center gap-1 transition-all',
              activeView === 'gateway' ? 'bg-card text-slate-900 shadow' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Terminal className="h-3.5 w-3.5" /> Gateway Stream
          </button>
        </div>
      </div>

      {activeView === 'audit' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center bg-card border rounded-xl p-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                className="pl-8 pr-3 py-1.5 text-xs border rounded-lg w-full bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Search actions, modules, users..."
                value={auditSearch}
                onChange={e => { setAuditSearch(e.target.value); setAuditPage(1); }}
              />
            </div>
            <select
              className="text-xs border rounded-lg px-2 py-1.5 bg-background focus:outline-none"
              value={auditModule}
              onChange={e => { setAuditModule(e.target.value); setAuditPage(1); }}
            >
              <option value="">All Modules</option>
              {availableModules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              className="text-xs border rounded-lg px-2 py-1.5 bg-background focus:outline-none"
              value={auditSeverity}
              onChange={e => { setAuditSeverity(e.target.value); setAuditPage(1); }}
            >
              <option value="">All Severity</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <input
              type="date"
              className="text-xs border rounded-lg px-2 py-1.5 bg-background focus:outline-none"
              value={auditFrom}
              onChange={e => { setAuditFrom(e.target.value); setAuditPage(1); }}
            />
            <input
              type="date"
              className="text-xs border rounded-lg px-2 py-1.5 bg-background focus:outline-none"
              value={auditTo}
              onChange={e => { setAuditTo(e.target.value); setAuditPage(1); }}
            />
            <button
              onClick={handleExportCSV}
              disabled={exportLoading}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-black bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> {exportLoading ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>

          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600 font-black text-xs uppercase tracking-wider">
                <FileText className="h-4 w-4" /> Immutable Operation Audit Ledger
              </div>
              {auditPagination && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {auditPagination.total.toLocaleString()} total records
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">UTC Timestamp</th>
                    <th className="px-6 py-4">Module</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Performed By</th>
                    <th className="px-6 py-4">Severity</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium text-slate-600">
               {auditLoading ? (
                    <>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4">
                            <div className="h-3 w-28 bg-slate-100 rounded" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 w-16 bg-slate-100 rounded" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-3 w-40 bg-slate-100 rounded mb-1.5" />
                            <div className="h-2.5 w-24 bg-slate-100 rounded" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-3 w-20 bg-slate-100 rounded mb-1.5" />
                            <div className="h-2.5 w-16 bg-slate-100 rounded" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 w-14 bg-slate-100 rounded" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 w-16 bg-slate-100 rounded" />
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                        No audit records found.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-slate-400 font-mono whitespace-nowrap">
                          {new Date(a.createdAt).toLocaleString([], {
                            month: 'short', day: '2-digit',
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            'px-2 py-0.5 rounded text-[9px] font-black uppercase border',
                            MODULE_COLORS[a.module] ?? 'bg-slate-100 text-slate-700 border-slate-200'
                          )}>
                            {a.module}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-slate-800 max-w-xs leading-relaxed">
                          {a.action}
                          {a.entityType && (
                            <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                              {a.entityType}{a.entityId ? ` · ${a.entityId.slice(0, 8)}` : ''}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-700">{a.user?.name ?? '-'}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            {a.performedByRole ?? a.user?.role ?? ''}
                          </div>
                          {a.ipAddress && (
                            <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                              IP: {a.ipAddress}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            'text-[9px] font-black px-2 py-0.5 rounded uppercase',
                            SEVERITY_COLORS[a.severity] ?? SEVERITY_COLORS.LOW
                          )}>
                            {a.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            'text-[9px] font-black px-2 py-0.5 rounded uppercase border',
                            a.status === 'SUCCESS'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          )}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {auditPagination && auditPagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t bg-slate-50/30">
                <span className="text-[10px] text-slate-500 font-mono">
                  Page {auditPagination.page} of {auditPagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                    disabled={auditPagination.page <= 1}
                    className="p-1 rounded border hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setAuditPage(p => Math.min(auditPagination.totalPages, p + 1))}
                    disabled={auditPagination.page >= auditPagination.totalPages}
                    className="p-1 rounded border hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-lg">
              <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1 uppercase tracking-wider">
                <ShieldAlert className="h-3 w-3 text-slate-400" /> Kubernetes Engine
              </div>
              <div className="text-sm font-black text-slate-400 mt-1">Not Available</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-lg">
              <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1 uppercase tracking-wider">
                <Clock className="h-3 w-3 text-teal-400" /> Avg Latency
              </div>
              <div className="text-lg font-black text-slate-200 mt-1 font-mono">
                {apiLogs.length > 0
                  ? `${Math.round(apiLogs.slice(0, 20).reduce((s, l) => s + l.latencyMs, 0) / Math.min(apiLogs.length, 20))}ms`
                  : 'Not Available'}
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-lg">
              <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1 uppercase tracking-wider">
                <ShieldAlert className="h-3 w-3 text-indigo-400" /> Cluster CPU
              </div>
              <div className="text-sm font-black text-slate-400 mt-1">Not Available</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-lg">
              <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1 uppercase tracking-wider">
                <ShieldAlert className="h-3 w-3 text-rose-500" /> Error Rate
              </div>
              <div className="text-lg font-black text-slate-200 mt-1 font-mono">
                {apiLogs.length > 0
                  ? `${((apiLogs.filter(l => l.statusCode >= 500).length / apiLogs.length) * 100).toFixed(2)}%`
                  : 'Not Available'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center bg-card border rounded-xl p-3">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                className="pl-8 pr-3 py-1.5 text-xs border rounded-lg w-full bg-background focus:outline-none"
                placeholder="Search path or IP..."
                value={apiSearch}
                onChange={e => { setApiSearch(e.target.value); setApiPage(1); }}
              />
            </div>
            <select
              className="text-xs border rounded-lg px-2 py-1.5 bg-background focus:outline-none"
              value={apiMethod}
              onChange={e => { setApiMethod(e.target.value); setApiPage(1); }}
            >
              <option value="">All Methods</option>
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              className="text-xs border rounded-lg px-2 py-1.5 bg-background focus:outline-none"
              value={apiStatus}
              onChange={e => { setApiStatus(e.target.value); setApiPage(1); }}
            >
              <option value="">All Status</option>
              <option value="2xx">2xx Success</option>
              <option value="4xx">4xx Client Error</option>
              <option value="5xx">5xx Server Error</option>
            </select>
            <button
              onClick={() => setAutoRefresh(r => !r)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-xs font-black rounded-lg border transition-all',
                autoRefresh ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-background hover:bg-slate-50'
              )}
            >
              <RefreshCcw className={cn('h-3.5 w-3.5', autoRefresh && 'animate-spin')} />
              {autoRefresh ? 'Auto ON' : 'Auto Refresh'}
            </button>
            <button
              onClick={fetchApiLogs}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-black bg-slate-900 text-white rounded-lg hover:bg-slate-700"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>

          <div className="bg-[#1e1e24] border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden h-[500px]">
            <div className="bg-[#2d2d35] px-4 py-3 flex items-center justify-between border-b border-slate-900/50">
              <div className="flex gap-1.5 items-center">
                <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
                <span className="text-[10px] font-mono font-black text-slate-400 flex items-center gap-1.5 ml-3 uppercase tracking-wider">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" /> api-gateway-request-log
                </span>
              </div>
              {apiPagination && (
                <span className="text-[9px] font-mono text-slate-500">
                  {apiPagination.total.toLocaleString()} total requests
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] text-slate-300 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800">
            {apiLoading ? (
                <div className="space-y-3 animate-pulse">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 border-b border-slate-800/30 pb-2">
                      <div className="h-2.5 w-14 bg-slate-700 rounded" />
                      <div className="h-4 w-10 bg-slate-700 rounded" />
                      <div className="h-2.5 w-48 bg-slate-700 rounded" />
                      <div className="h-2.5 w-8 bg-slate-700 rounded" />
                      <div className="h-2.5 w-12 bg-slate-700 rounded" />
                    </div>
                  ))}
                </div>
              ) : apiLogs.length === 0 ? (
                <div className="text-slate-500 italic">No API requests recorded yet.</div>
              ) : (
                apiLogs.map(log => (
                  <div key={log.id} className="group flex flex-col border-b border-slate-800/30 pb-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 leading-relaxed">
                      <span className="text-slate-500 text-[9px]">
                        [{new Date(log.createdAt).toLocaleTimeString()}]
                      </span>
                      <span className={cn(
                        'font-black uppercase px-1.5 py-0.5 rounded text-[9px]',
                        log.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.method === 'POST' ? 'bg-blue-500/10 text-blue-400' :
                        log.method === 'PUT' || log.method === 'PATCH' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-rose-500/10 text-rose-400'
                      )}>
                        {log.method}
                      </span>
                      <span className="text-slate-100 font-bold">{log.path}</span>
                      <span className={cn('font-black', getStatusColor(log.statusCode))}>
                        {log.statusCode}
                      </span>
                      <span className="text-slate-500">{log.latencyMs}ms</span>
                      {log.ip && (
                        <span className="text-slate-600 text-[9px] italic hidden md:inline">
                          IP: {log.ip}
                        </span>
                      )}
                      {log.userRole && (
                        <span className="text-slate-600 text-[9px] italic hidden md:inline">
                          · {log.userRole}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div className="pt-2 flex items-center gap-1 text-slate-500 animate-pulse">
                <ChevronRight className="h-3 w-3" />
                <span className="w-1.5 h-3.5 bg-slate-400" />
              </div>
            </div>

            {apiPagination && apiPagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-[#2d2d35]">
                <span className="text-[9px] font-mono text-slate-500">
                  Page {apiPagination.page} of {apiPagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setApiPage(p => Math.max(1, p - 1))}
                    disabled={apiPagination.page <= 1}
                    className="p-1 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => setApiPage(p => Math.min(apiPagination.totalPages, p + 1))}
                    disabled={apiPagination.page >= apiPagination.totalPages}
                    className="p-1 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};