import React, { useState, useMemo } from 'react';
import { BroadcastAlert, User, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Search, Calendar, User as UserIcon, MessageSquare, Eye } from 'lucide-react';

interface BroadcastHistoryProps {
  user: User;
  language: Language;
  broadcastAlerts: BroadcastAlert[];
}

const BroadcastHistory: React.FC<BroadcastHistoryProps> = ({ user, language, broadcastAlerts }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<BroadcastAlert | null>(null);

  const filteredAlerts = useMemo(() => {
    return broadcastAlerts.filter(alert =>
      alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.senderName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [broadcastAlerts, searchQuery]);

  const t = TRANSLATIONS[language];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t.broadcastHistory || 'Broadcast History'}
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder={t.search || 'Search broadcasts...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">
              {searchQuery ? 'No broadcasts found matching your search.' : 'No broadcast alerts yet.'}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <UserIcon className="w-4 h-4" />
                      <span>{alert.senderName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>
                  <p className="text-slate-900 dark:text-white font-medium mb-2">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{alert.readBy?.length || 0} read</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{alert.recipients?.length || 0} recipients</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t.broadcastDetails || 'Broadcast Details'}
                </h2>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t.sender || 'Sender'}
                  </label>
                  <p className="text-slate-900 dark:text-white">{selectedAlert.senderName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t.timestamp || 'Timestamp'}
                  </label>
                  <p className="text-slate-900 dark:text-white">{selectedAlert.timestamp}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t.message || 'Message'}
                  </label>
                  <p className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                    {selectedAlert.message}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t.recipients || 'Recipients'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedAlert.recipients?.map((recipient, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                      >
                        {recipient}
                      </span>
                    )) || <span className="text-slate-500 dark:text-slate-400">All users</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t.readBy || 'Read By'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedAlert.readBy?.length ? (
                      selectedAlert.readBy.map((reader, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full"
                        >
                          {reader}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">No one has read this yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BroadcastHistory;
