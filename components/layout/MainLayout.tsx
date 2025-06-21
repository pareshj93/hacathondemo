'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConnected, Profile } from '@/lib/supabase';
import { getUserProfile } from '@/lib/auth';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import LeftSidebar from './LeftSidebar';
import CenterFeed from './CenterFeed';
import RightSidebar from './RightSidebar';
import { AuthModal } from '@/components/auth/AuthModal'; // Corrected to named import
import ProfilePage from '@/components/pages/ProfilePage';
import PrivacyPage from '@/components/pages/PrivacyPage';
import VerificationPage from '@/components/pages/VerificationPage';
import TermsAndConditionsPage from '@/components/pages/TermsAndConditionsPage';
import HackathonPopup from '@/components/ui/HackathonPopup';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Database, ExternalLink, CheckCircle, AlertCircle, Mail, GraduationCap, Users, Menu, X, LogIn } from 'lucide-react';

export default function MainLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [showHackathonPopup, setShowHackathonPopup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = searchParams.get('page') || 'feed';
  const isVerified = searchParams.get('verified') === 'true';

  const loadProfile = useCallback(async (userId: string, retryCount = 0) => {
    try {
      const profileData = await getUserProfile(userId);
      if (profileData) {
        setProfile(profileData);
        setError(null);
      } else if (retryCount < 3) {
        setTimeout(() => loadProfile(userId, retryCount + 1), 1000);
      } else {
        setProfile(null);
        setError("Could not load user profile. Please try again later.");
      }
    } catch (error: any) {
       if (retryCount < 2) {
        setTimeout(() => loadProfile(userId, retryCount + 1), 1000);
      } else {
        setProfile(null);
        setError("Could not load user profile. Please try again later.");
      }
    }
  }, []);

  useEffect(() => {
    if (currentPage === 'feed' && !sessionStorage.getItem('hackathonPopupShown')) {
      setTimeout(() => {
        setShowHackathonPopup(true);
        sessionStorage.setItem('hackathonPopupShown', 'true');
      }, 1500);
    }
    
    if (isVerified) {
      toast.success("Email Verified! Welcome to Edubridgepeople.");
      router.replace('/?page=feed');
    }
    
    if (!isSupabaseConnected) {
      setLoading(false);
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        setLoading(true);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
            if (currentUser.email_confirmed_at) {
                await loadProfile(currentUser.id);
            } else {
                setProfile(null);
            }
        } else {
            setProfile(null);
        }
        setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [isVerified, router, currentPage, loadProfile]);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const openAuthModal = (mode: 'signup' | 'signin') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };
  
  const renderPage = () => {
    if (!isSupabaseConnected) {
      return <div className="p-4 text-center">Please connect to Supabase to use the application.</div>;
    }
    
    if (user && !user.email_confirmed_at) {
      return <div className="p-4 text-center">Please check your email to verify your account.</div>;
    }

    switch (currentPage) {
      case 'profile':
        return <ProfilePage user={user} profile={profile} onVerificationUpdate={loadProfile} />;
      case 'privacy':
        return <PrivacyPage />;
      case 'verification':
        return <VerificationPage user={user} profile={profile} onVerificationUpdate={loadProfile} />;
      case 'terms':
        return <TermsAndConditionsPage />;
      default:
        return (
          <div className="grid grid-cols-12 gap-4 sm:gap-6 max-w-7xl mx-auto px-4">
            {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}
            <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 lg:relative lg:transform-none lg:shadow-none lg:bg-transparent lg:w-auto lg:col-span-3 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
              <div className="h-full overflow-y-auto p-4 lg:p-0">
                <div className="flex justify-between items-center mb-4 lg:hidden"><h2 className="text-lg font-semibold">Menu</h2><Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}><X className="w-5 h-5" /></Button></div>
                <LeftSidebar user={user} profile={profile} onAuthClick={() => { openAuthModal('signup'); setMobileMenuOpen(false); }} />
              </div>
            </div>
            <div className="col-span-12 lg:col-span-6"><CenterFeed user={user} profile={profile} /></div>
            <div className="hidden lg:block lg:col-span-3"><RightSidebar /></div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm"><div className="max-w-7xl mx-auto px-4 py-3 sm:py-4"><div className="flex items-center justify-between"><Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(true)} className="lg:hidden mr-2 p-1"><Menu className="w-5 h-5" /></Button><div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:opacity-80 transition-opacity flex-1 lg:flex-none" onClick={() => router.push('/?page=feed')}><div className="flex items-center space-x-2"><div className="relative"><div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"><div className="flex items-center space-x-0.5"><GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-white" /><Users className="w-2 h-2 sm:w-3 sm:h-3 text-white/80" /></div></div><div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full border-2 border-white"></div></div><div className="flex items-baseline"><span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Edubridge</span><span className="text-lg sm:text-2xl font-bold text-orange-500 ml-0.5">people</span></div></div></div><div className="flex items-center space-x-2 sm:space-x-4">{isSupabaseConnected ? <div className="hidden md:flex items-center space-x-2 text-green-600"><CheckCircle className="w-4 h-4" /><span className="text-sm">Connected</span></div> : <div className="hidden md:flex items-center space-x-2 text-red-600"><AlertCircle className="w-4 h-4" /><span className="text-sm">Not Connected</span></div>}{user && user.email_confirmed_at && profile && <div className="hidden md:flex items-center space-x-2"><span className="text-sm text-gray-600">Welcome,</span><span className="font-medium text-gray-900 truncate max-w-20 sm:max-w-none">{profile.username}</span><span className={`text-xs px-2 py-1 rounded-full ${profile.role === 'donor' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{profile.role === 'donor' ? '❤️ Donor' : '🎓 Student'}</span>{(profile.role === 'donor' || profile.verification_status === 'verified') && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">✓ Verified</span>}</div>}{(!user || !user.email_confirmed_at) && isSupabaseConnected && <div className="flex items-center space-x-1 sm:space-x-2"><button onClick={() => openAuthModal('signup')} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg text-xs sm:text-sm">Join Community</button><button onClick={() => openAuthModal('signin')} className="text-blue-600 hover:text-blue-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-blue-50 transition-all duration-200 font-medium text-xs sm:text-sm flex items-center"><LogIn className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /><span className="hidden sm:inline">Sign In</span></button></div>}</div></div></div></nav>
      <div className="py-4 sm:py-6">{renderPage()}</div>
      {isSupabaseConnected && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} initialMode={authMode} />}
      <HackathonPopup isOpen={showHackathonPopup} onClose={() => setShowHackathonPopup(false)} />
    </div>
  );
}
