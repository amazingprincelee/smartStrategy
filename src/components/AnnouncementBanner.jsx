import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchActiveAnnouncement } from '../redux/slices/adminSlice';

const CONFIG = {
  info:    { bg: 'bg-blue-600',    icon: Info,          text: 'text-white' },
  warning: { bg: 'bg-amber-500',   icon: AlertTriangle, text: 'text-white' },
  success: { bg: 'bg-green-600',   icon: CheckCircle,   text: 'text-white' },
  error:   { bg: 'bg-red-600',     icon: AlertCircle,   text: 'text-white' },
};

export default function AnnouncementBanner() {
  const dispatch = useDispatch();
  const announcement = useSelector(s => s.admin.announcement);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    dispatch(fetchActiveAnnouncement());
    // Refresh every 5 minutes
    const interval = setInterval(() => dispatch(fetchActiveAnnouncement()), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dispatch]);

  if (!announcement || dismissed) return null;

  const type   = announcement.type || 'info';
  const config = CONFIG[type] || CONFIG.info;
  const Icon   = config.icon;

  return (
    <div className={`${config.bg} ${config.text} px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-medium z-50`}>
      <div className="flex items-center gap-2 flex-1 justify-center">
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span>{announcement.message}</span>
      </div>
      <button onClick={() => setDismissed(true)} className="p-1 rounded hover:bg-black/20 flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
