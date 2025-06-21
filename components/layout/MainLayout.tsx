'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConnected, Profile } from '@/lib/supabase';
import { getUserProfile } from '@/lib/auth';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import LeftSidebar from './LeftSidebar';
import CenterFeed from './CenterFeed';
import RightSidebar from './RightSidebar';
import { AuthModal } from '@/components/auth/AuthModal';
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

  const onVerificationUpdate = useCallback(async (userId: string) => {
    try {
      const profileData = await getUserProfile(userId);
      if (profileData) {
        setProfile(profileData);
      }
    } catch (e) {
      console.error("Error reloading profile", e);
    }
  }, []);


  // This effect handles the initial session check and subscribes to auth changes.
  useEffect(() => {
    // Show hackathon popup on first visit
    if (currentPage === 'feed' && !sessionStorage.getItem('hackathonPopupShown')) {
        setTimeout(() => {
            setShowHackathonPopup(true);
            sessionStorage.setItem('hackathonPopupShown', 'true');
        }, 1500);
    }

    if (!isSupabaseConnected) {
        setLoading(false);
        return;
    }

    setLoading(true);

    const checkSessionAndLoadProfile = async (session: Session | null) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
            // Retry logic for fetching profile
            let profileData = null;
            for (let i = 0; i < 3; i++) {
                profileData = await getUserProfile(currentUser.id);
                if (profileData) break;
                await new Promise(res => setTimeout(res, 1000)); // wait 1s before retrying
            }
            
            if (profileData) {
                setProfile(profileData);
                setError(null);
            } else {
                setProfile(null);
                setError("Could not load user profile. Please try refreshing the page.");
            }
        } else {
            setProfile(null);
        }
        setLoading(false);
    };

    // Check initial session
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
        checkSessionAndLoadProfile(data.session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        // Only re-check session on sign-in or sign-out to avoid loops
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
           checkSessionAndLoadProfile(session);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [currentPage]); // Re-run only if the page fundamentally changes

  // This separate effect handles the one-time "verified" toast.
  useEffect(() => {
    const isVerified = searchParams.get('verified') === 'true';
    if (isVerified) {
        toast.success("Email Verified! Welcome to Edubridgepeople.");
        // Clean the URL
        router.replace('/?page=feed');
    }
  }, [searchParams, router]);


  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // The onAuthStateChange listener will handle the profile reload.
  };

  const openAuthModal = (mode: 'signup' | 'signin') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };
  
  const renderPage = () => {
    if (!isSupabaseConnected) {
      return (
        <Card className="max-w-md mx-auto mt-10">
            <CardContent className="p-8 text-center">
                 <Database className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Database Not Connected</h2>
                <p className="text-gray-600">
                  Application features are disabled. Please ensure Supabase credentials are set correctly in your environment.
                </p>
            </CardContent>
        </Card>
      );
    }
    
    if (user && !user.email_confirmed_at) {
       return (
        <Card className="max-w-md mx-auto mt-10">
            <CardContent className="p-8 text-center">
                <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Please Verify Your Email</h2>
                <p className="text-gray-600">
                  A verification link has been sent to your email address. Please click it to continue.
                </p>
            </CardContent>
        </Card>
      );
    }

    switch (currentPage) {
      case 'profile':
        return <ProfilePage user={user} profile={profile} onVerificationUpdate={onVerificationUpdate} />;
      case 'privacy':
        return <PrivacyPage />;
      case 'verification':
        return <VerificationPage user={user} profile={profile} onVerificationUpdate={onVerificationUpdate} />;
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