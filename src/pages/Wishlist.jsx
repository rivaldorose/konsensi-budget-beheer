import React from 'react';
import { User } from '@/api/entities';
import WishlistManager from '@/components/potjes/WishlistManager';

export default function WishlistPage() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-[#F8F8F8] dark:bg-[#0a0a0a]">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary dark:border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-8 bg-[#F8F8F8] dark:bg-[#0a0a0a] min-h-screen">
      <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white">🎁 Verlanglijsten</h1>
      <WishlistManager userEmail={user?.email} />
    </div>
  );
}