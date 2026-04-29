import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { SkeletonTable } from '../components/SkeletonLoader';
import {
  FiActivity,
  FiUser,
  FiCalendar,
  FiClock,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiDatabase,
  FiMonitor,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AuditLog() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'Admin') {
      navigate('/dashboard');
      return;
    }
    fetchLogs();
  }, [user, authLoading, page, limit]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/activities', { params: { page, limit } });

      if (res.data?.logs) {
        setLogs(res.data.logs);
        setTotalLogs(res.data.pagination?.total || res.data.logs.length);
        setTotalPages(res.data.pagination?.pages || 1);
      } else if (Array.isArray(res.data)) {
        setLogs(res.data);
        setTotalLogs(res.data.length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('created') || lowerAction.includes('added'))
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded';
    if (lowerAction.includes('updated') || lowerAction.includes('modified'))
      return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded';
    if (lowerAction.includes('deleted') || lowerAction.includes('removed'))
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded';
    if (lowerAction.includes('rejected'))
      return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded';
    return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded';
  };

  const getResourceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'user':
        return <FiUser className="inline mr-2" />;
      case 'site':
        return <FiActivity className="inline mr-2" />;
      case 'report':
        return <FiMonitor className="inline mr-2" />;
      case 'auth':
        return <FiClock className="inline mr-2" />;
      default:
        return <FiDatabase className="inline mr-2" />;
    }
  };

  if (!user || user.role !== 'Admin') return null;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <button
                onClick={() => navigate(-1)}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-yellow-500 hover:border-yellow-500/50 transition-all shadow-sm group"
              >
                <FiArrowLeft className="text-xl group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase flex items-center gap-3">
                  <FiActivity className="text-yellow-500" /> Audit Trail
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
                  Full historical record of system activities and administrative actions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchLogs}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:border-yellow-500/50 transition-all shadow-sm"
              >
                <FiFilter className="text-yellow-500" />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Total Trail Events
              </p>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                {totalLogs.toLocaleString()}
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Events This Page
              </p>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                {logs.length}
              </p>
            </div>
          </div>

          {/* Table Implementation */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
            {loading ? (
              <div className="p-8">
                <SkeletonTable rows={10} columns={5} />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                          Timestamp
                        </th>
                        <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                          User
                        </th>
                        <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                          Action
                        </th>
                        <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                          Resource
                        </th>
                        <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                          ID
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {logs.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-6 py-20 text-center text-slate-500 font-medium"
                          >
                            No audit events recorded yet.
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr
                            key={log._id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-slate-900 dark:text-slate-200 font-bold text-sm">
                                  {new Date(log.timestamp).toLocaleDateString()}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500 text-xs flex items-center gap-1">
                                  <FiClock className="text-slate-300" />{' '}
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                                  <FiUser className="text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-slate-900 dark:text-slate-200 font-bold text-sm">
                                    {log.userId?.name || 'Unknown User'}
                                  </span>
                                  <span className="text-slate-400 dark:text-slate-500 text-xs">
                                    {log.userId?.role || 'Guest'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span
                                className={`text-xs font-black uppercase tracking-wider ${getActionColor(log.action)}`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-slate-600 dark:text-slate-400 font-medium text-sm">
                              <div className="flex items-center">
                                {getResourceIcon(log.resourceType)}
                                {log.resourceType || 'General'}
                              </div>
                            </td>
                            <td className="px-6 py-5 text-slate-400 font-mono text-xs">
                              {log.resourceId ? log.resourceId.slice(-8) : 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Drawer */}
                {totalPages > 1 && (
                  <div className="mt-auto px-6 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-30 hover:border-yellow-500/50 transition-all font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-xs"
                      >
                        <FiChevronLeft /> PREV
                      </button>
                      <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-30 hover:border-yellow-500/50 transition-all font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-xs"
                      >
                        NEXT <FiChevronRight />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
