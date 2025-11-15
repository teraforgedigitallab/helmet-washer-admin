import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  FiSearch,
  FiStar,
  FiClock,
  FiUser,
  FiTrendingUp,
  FiCopy
} from 'react-icons/fi';

const short = (s = '', len = 12) =>
  s.length > len ? `${s.slice(0, Math.floor(len / 2))}…${s.slice(-Math.floor(len / 2))}` : s;

const capitalize = (v = '') =>
  String(v)
    .toLowerCase()
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(' ');

const formatDate = (ts) => {
  try {
    return ts?.toDate ? ts.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—';
  } catch {
    return '—';
  }
};

const Metrics = ({ metrics = {} }) => {
  const order = ['overall', 'communication', 'timeliness', 'serviceQuality', 'packaging'];
  return (
    <div className="flex items-center gap-2">
      {order.map(key => (
        <div key={key} className="flex flex-col items-center text-center min-w-11">
          <div className="text-[10px] text-gray-400 uppercase">{key === 'serviceQuality' ? 'Quality' : key}</div>
          <div className="text-sm font-semibold text-gray-800">
            {metrics[key] ?? '—'}
          </div>
        </div>
      ))}
    </div>
  );
};

const Ratings = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchRatings = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, 'DeliveryRatings'));
        const list = [];
        snap.forEach(d => {
          const data = d.data();
          // Normalize and protect missing fields
          list.push({
            id: d.id,
            bookingId: data.bookingId ?? '',
            createdAt: data.createdAt ?? null,
            deliveryType: data.deliveryType ?? '',
            feedback: data.feedback ?? '',
            metadata: data.metadata ?? {},
            ratings: data.ratings ?? {},
            selectedQualities: Array.isArray(data.selectedQualities) ? data.selectedQualities : [],
            serviceType: data.serviceType ?? '',
            userId: data.userId ?? '',
            riderId: data.riderId ?? '',
            riderName: data.riderName ?? ''
          });
        });
        if (mounted) {
          // newest first
          setRatings(list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        }
      } catch (e) {
        console.error('Failed to load ratings', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchRatings();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return ratings;
    return ratings.filter(r =>
      (r.bookingId || '').toLowerCase().includes(t) ||
      (r.riderName || '').toLowerCase().includes(t) ||
      (r.serviceType || '').toLowerCase().includes(t) ||
      (r.userId || '').toLowerCase().includes(t)
    );
  }, [ratings, searchTerm]);

  const stats = useMemo(() => {
    if (!ratings.length) return null;
    const overallVals = ratings.map(r => Number(r.ratings?.overall)).filter(v => !isNaN(v));
    const avgOverall = overallVals.length ? (overallVals.reduce((a, b) => a + b, 0) / overallVals.length) : 0;
    const metrics = ['communication', 'timeliness', 'serviceQuality', 'packaging'];
    const avgMetrics = Object.fromEntries(metrics.map(m => {
      const vals = ratings.map(r => Number(r.ratings?.[m])).filter(v => !isNaN(v));
      return [m, vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0];
    }));
    return { total: ratings.length, avgOverall: +avgOverall.toFixed(1), avgMetrics };
  }, [ratings]);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text || '');
      // minimal feedback to console to avoid duplicate toasts
      console.info('Copied', text);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">Delivery Ratings</h1>
          <p className="text-sm text-gray-500 mt-1">{stats ? `${stats.total} entries · Average ${stats.avgOverall}` : 'No ratings yet'}</p>
        </div>

        {stats && (
          <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-primary-50">
                <FiTrendingUp className="text-primary-600 w-5 h-5" />
              </div>
              <div className="leading-tight">
                <div className="text-xs text-gray-500">Avg Overall</div>
                <div className="text-lg font-semibold flex items-center gap-2">
                  <FiStar className="text-yellow-500" /> {stats.avgOverall}
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              {Object.entries(stats.avgMetrics).map(([k, v]) => (
                <div key={k} className="text-center min-w-14">
                  <div className="text-xs text-gray-400">{k === 'serviceQuality' ? 'Quality' : capitalize(k)}</div>
                  <div className="text-sm font-medium text-gray-800">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-xl relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          placeholder="Search booking id, rider, user or service..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-8 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-gray-500 border border-dashed border-gray-200 rounded-lg">No ratings found</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(r => (
            <article key={r.id} className="flex items-center justify-between gap-4 bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex flex-col">
                  <div className="text-xs text-gray-400">Booking</div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm text-primary-700 bg-primary-50 px-2 py-0.5 rounded">{short(r.bookingId || '—', 14)}</code>
                    <button onClick={() => copy(r.bookingId)} title="Copy booking id" className="p-1 text-gray-400 hover:text-gray-600 rounded">
                      <FiCopy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{formatDate(r.createdAt)}</div>
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{capitalize(r.serviceType || '—')}</h3>
                  <div className="text-xs text-gray-500 mt-1">
                    {capitalize(r.deliveryType || '—')} · User <span className="font-mono text-xs text-gray-700">{short(r.userId || '—', 12)}</span>
                  </div>
                  {r.feedback ? <p className="text-sm text-gray-700 mt-2 line-clamp-2">{r.feedback}</p> : null}
                  {r.selectedQualities?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.selectedQualities.slice(0, 6).map((q, i) => (
                        <span key={i} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">{capitalize(q)}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-yellow-50 rounded px-2 py-1">
                    <FiStar className="text-yellow-500 w-4 h-4" />
                    <span className="text-sm font-semibold text-gray-900">{r.ratings?.overall ?? '—'}</span>
                  </div>
                </div>

                <div className="mt-1">
                  <Metrics metrics={{ overall: r.ratings?.overall, communication: r.ratings?.communication, timeliness: r.ratings?.timeliness, serviceQuality: r.ratings?.serviceQuality, packaging: r.ratings?.packaging }} />
                </div>

                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <FiUser className="w-3 h-3" />
                  <span className="font-medium text-gray-700">{short(r.riderName || '—', 12)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Ratings;