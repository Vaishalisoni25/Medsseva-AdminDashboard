import { useState, useEffect, useCallback } from 'react';
import { useNotificationLogsQuery } from '@/hooks/useAdminQueries';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
type Tab = 'logs' | 'broadcast';
type LogStatus = 'ALL' | 'SENT' | 'FAILED' | 'PENDING';

interface NotifLog {
  id: string;
  userId: string | null;
  title: string;
  body: string;
  type: string;
  status: string;
  retryCount: number;
  sentAt: string | null;
  error: string | null;
  createdAt: string;
}

interface LogsResponse {
  logs: NotifLog[];
  pagination: { total: number; totalPages: number; page: number };
}

type BroadcastTarget = 'ALL_USERS' | 'ALL_PARTNERS' | 'SELECTED_USERS' | 'SELECTED_PARTNERS';

export default function Notifications() {
  const [tab, setTab] = useState<Tab>('logs');
  const [logs, setLogs] = useState<NotifLog[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1 });
  const [statusFilter, setStatusFilter] = useState<LogStatus>('ALL');
const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const { data: logsData, isLoading: isLogsLoading } = useNotificationLogsQuery(currentPage, statusFilter);
  const [isRetrying, setIsRetrying] = useState(false);

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<BroadcastTarget>('ALL_USERS');
  const [isSending, setIsSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ ok: boolean; msg: string } | null>(null);

useEffect(() => {
    if (logsData) {
      setLogs(logsData.logs);
      setPagination(logsData.pagination);
    }
  }, [logsData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const fetchLogs = (page = 1) => {
    setCurrentPage(page);
    queryClient.invalidateQueries({ queryKey: ['notificationLogs', page, statusFilter] });
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await api.post('/notifications/retry-failed');
      fetchLogs(1);
    } catch {
      console.error('Retry failed');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
    setIsSending(true);
    setBroadcastResult(null);
    try {
      await api.post('/notifications/broadcast', {
        title: broadcastTitle.trim(),
        body: broadcastBody.trim(),
        target: broadcastTarget,
      });
      setBroadcastResult({ ok: true, msg: 'Broadcast sent successfully.' });
      setBroadcastTitle('');
      setBroadcastBody('');
    } catch (e: any) {
      setBroadcastResult({ ok: false, msg: e?.response?.data?.error || 'Failed to send broadcast.' });
    } finally {
      setIsSending(false);
    }
  };

  const statusColor: Record<string, string> = {
    SENT: '#059669',
    FAILED: '#DC2626',
    PENDING: '#D97706',
    RETRYING: '#7C3AED',
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Notification Management</h1>
        <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>Monitor delivery logs, retry failures, and send broadcasts.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['logs', 'broadcast'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
              background: tab === t ? '#006D6F' : '#F1F5F9',
              color: tab === t ? '#fff' : '#475569',
            }}
          >
            {t === 'logs' ? 'Delivery Logs' : 'Send Broadcast'}
          </button>
        ))}
      </div>

      {tab === 'logs' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['ALL', 'SENT', 'FAILED', 'PENDING'] as LogStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: '5px 14px', borderRadius: 6, border: '1px solid #E2E8F0',
                    cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    background: statusFilter === s ? '#006D6F' : '#fff',
                    color: statusFilter === s ? '#fff' : '#475569',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              style={{
                marginLeft: 'auto', padding: '7px 16px', borderRadius: 8,
                background: '#FEF3C7', border: '1px solid #FDE68A',
                color: '#92400E', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >
              {isRetrying ? 'Retrying...' : 'Retry Failed'}
            </button>
          </div>

       {isLogsLoading ? (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    {['Title', 'Type', 'Status', 'Retries', 'Sent At', 'Error'].map(h => (
                      <th key={h} style={{ padding: '10px 14px' }}>
                        <div style={{ height: 10, background: '#E2E8F0', borderRadius: 4, width: 60 }} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px' }}><div style={{ height: 12, background: '#F1F5F9', borderRadius: 4, width: 140 }} /></td>
                      <td style={{ padding: '12px 14px' }}><div style={{ height: 10, background: '#F1F5F9', borderRadius: 4, width: 60 }} /></td>
                      <td style={{ padding: '12px 14px' }}><div style={{ height: 20, background: '#F1F5F9', borderRadius: 6, width: 56 }} /></td>
                      <td style={{ padding: '12px 14px' }}><div style={{ height: 10, background: '#F1F5F9', borderRadius: 4, width: 20 }} /></td>
                      <td style={{ padding: '12px 14px' }}><div style={{ height: 10, background: '#F1F5F9', borderRadius: 4, width: 100 }} /></td>
                      <td style={{ padding: '12px 14px' }}><div style={{ height: 10, background: '#F1F5F9', borderRadius: 4, width: 80 }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>No logs found.</div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    {['Title', 'Type', 'Status', 'Retries', 'Sent At', 'Error'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 14px', color: '#0F172A', fontWeight: 600 }}>{log.title}</td>
                      <td style={{ padding: '10px 14px', color: '#64748B', fontSize: 11 }}>{log.type}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: `${statusColor[log.status]}20`, color: statusColor[log.status] || '#475569' }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748B' }}>{log.retryCount}</td>
                      <td style={{ padding: '10px 14px', color: '#64748B', fontSize: 11 }}>
                        {log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#EF4444', fontSize: 11, maxWidth: 200 }}>
                        {log.error ? log.error.substring(0, 60) + (log.error.length > 60 ? '...' : '') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 12, color: '#64748B' }}>Total: {pagination.total} logs</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).slice(0, 7).map(p => (
                    <button
                      key={p}
                      onClick={() => fetchLogs(p)}
                      style={{
                        width: 30, height: 30, borderRadius: 6, border: '1px solid #E2E8F0',
                        background: pagination.page === p ? '#006D6F' : '#fff',
                        color: pagination.page === p ? '#fff' : '#475569',
                        fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'broadcast' && (
        <div style={{ maxWidth: 540 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 20px' }}>Send Broadcast Notification</h2>

            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Target Audience</label>
            <select
              value={broadcastTarget}
              onChange={e => setBroadcastTarget(e.target.value as BroadcastTarget)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 14, marginBottom: 16, outline: 'none' }}
            >
              <option value="ALL_USERS">All Users</option>
              <option value="ALL_PARTNERS">All Partners</option>
            </select>

            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Title</label>
            <input
              value={broadcastTitle}
              onChange={e => setBroadcastTitle(e.target.value)}
              placeholder="Notification title"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 14, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }}
            />

            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Message</label>
            <textarea
              value={broadcastBody}
              onChange={e => setBroadcastBody(e.target.value)}
              placeholder="Notification body"
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 14, marginBottom: 20, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />

            {broadcastResult && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: broadcastResult.ok ? '#DCFCE7' : '#FEE2E2', color: broadcastResult.ok ? '#059669' : '#DC2626', fontSize: 13, fontWeight: 600 }}>
                {broadcastResult.msg}
              </div>
            )}

            <button
              onClick={handleBroadcast}
              disabled={isSending || !broadcastTitle.trim() || !broadcastBody.trim()}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: '#006D6F', color: '#fff', fontWeight: 800, fontSize: 15,
                cursor: isSending ? 'not-allowed' : 'pointer', opacity: isSending ? 0.7 : 1,
              }}
            >
              {isSending ? 'Sending...' : 'Send Broadcast'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}