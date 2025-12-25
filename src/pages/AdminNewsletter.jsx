import React, { useState, useEffect } from 'react';
import { Mail, Download, Search, Users, TrendingUp, Eye, Loader2 } from 'lucide-react';
import { User } from '@/api/entities';
import { PrivacySettings } from '@/api/entities';

export default function AdminNewsletterDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDataSharing, setFilterDataSharing] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const me = await User.me();
        setCurrentUser(me);
        
        if (!me.is_admin && me.role !== 'admin') {
          window.location.href = '/';
          return;
        }

        const [allUsers, allPrivacySettings] = await Promise.all([
          User.list(undefined, 1000),
          PrivacySettings.list(undefined, 1000)
        ]);

        const combined = allUsers.map(user => {
          const privacy = allPrivacySettings.find(p => p.created_by === user.email);
          return {
            id: user.id,
            name: user.full_name || user.voornaam || 'Onbekend',
            email: user.email,
            newsletter_enabled: privacy?.nieuwsbrief_optin || false,
            data_sharing_enabled: privacy?.data_delen || false,
            subscribed_date: privacy?.created_date || null,
            last_opened: null
          };
        });

        setUsers(combined);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesNewsletterFilter = 
      filterStatus === 'all' ? true :
      filterStatus === 'subscribed' ? user.newsletter_enabled :
      !user.newsletter_enabled;
    
    const matchesDataSharingFilter =
      filterDataSharing === 'all' ? true :
      filterDataSharing === 'yes' ? user.data_sharing_enabled :
      !user.data_sharing_enabled;

    return matchesSearch && matchesNewsletterFilter && matchesDataSharingFilter;
  });

  const stats = {
    total: users.length,
    subscribed: users.filter(u => u.newsletter_enabled).length,
    unsubscribed: users.filter(u => !u.newsletter_enabled).length,
    dataSharing: users.filter(u => u.data_sharing_enabled).length
  };

  const handleExportCSV = () => {
    const subscribers = users.filter(u => u.newsletter_enabled);
    
    const headers = ['Naam', 'Email', 'Ingeschreven op', 'Data delen'];
    const rows = subscribers.map(u => [
      u.name,
      u.email,
      u.subscribed_date ? new Date(u.subscribed_date).toLocaleDateString('nl-NL') : 'N/A',
      u.data_sharing_enabled ? 'Ja' : 'Nee'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `konsensi-nieuwsbrief-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!currentUser?.is_admin && currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Geen toegang</p>
          <p className="text-gray-600">Deze pagina is alleen toegankelijk voor admins</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Mail className="w-8 h-8 text-emerald-600" />
            Nieuwsbrief Beheer
          </h1>
          <p className="text-gray-600">Beheer alle gebruikers die zich hebben ingeschreven voor de nieuwsbrief</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Totaal gebruikers</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-10 h-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ingeschreven</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.subscribed}</p>
              </div>
              <Mail className="w-10 h-10 text-emerald-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Uitgeschreven</p>
                <p className="text-3xl font-bold text-gray-400">{stats.unsubscribed}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-gray-300" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Data delen</p>
                <p className="text-3xl font-bold text-blue-600">{stats.dataSharing}</p>
              </div>
              <Eye className="w-10 h-10 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Zoek op naam of email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">Alle statussen</option>
              <option value="subscribed">✅ Ingeschreven</option>
              <option value="unsubscribed">❌ Uitgeschreven</option>
            </select>

            <select
              value={filterDataSharing}
              onChange={(e) => setFilterDataSharing(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">Data delen: Alle</option>
              <option value="yes">Data delen: Ja</option>
              <option value="no">Data delen: Nee</option>
            </select>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Gebruiker</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Nieuwsbrief</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Data delen</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Ingeschreven op</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      Geen gebruikers gevonden
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {user.newsletter_enabled ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
                            ✓ Ja
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                            × Nee
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {user.data_sharing_enabled ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                            ✓ Ja
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                            × Nee
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(user.subscribed_date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {filteredUsers.length} van {users.length} gebruikers getoond
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}