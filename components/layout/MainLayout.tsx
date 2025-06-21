'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConnected } from '@/lib/supabase';
import { getUserProfile } from '@/lib/auth';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Profile } from '@/lib/supabase';
import LeftSidebar from './LeftSidebar';
import CenterFeed from './CenterFeed';
import RightSidebar from './RightSidebar';
import AuthModal from '@/components/auth/AuthModal';
import ProfilePage from '@/components/pages/ProfilePage';
import PrivacyPage from '@/components/pages/PrivacyPage';
import VerificationPage from '@/components/pages/VerificationPage';
import TermsAndConditionsPage from '@/components/pages/TermsAndConditionsPage'; // Import the new T&C page
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

  useEffect(() => {
    console.log('🔍 MainLayout mounted, Supabase connected:', isSupabaseConnected);
    
    // Show hackathon popup every time on home page
    if (currentPage === 'feed') {
      setTimeout(() => {
        setShowHackathonPopup(true);
      }, 1500); // Show after 1.5 seconds
    }
    
    // Show verification success message if redirected from email
    if (isVerified) {
      toast.success(
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">Email Verified!</p>
            <p className="text-sm text-gray-600 mt-1">
              Your account has been successfully verified. Welcome to Edubridgepeople!
            </p>
          </div>
        </div>,
        { duration: 5000 }
      );
      
      // Clean up the URL
      router.replace('/?page=feed');
    }
    
    if (!isSupabaseConnected) {
      setLoading(false);
      return;
    }

    // Set up auth state listener first
    const { data } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check if user's email is confirmed
        if (!session.user.email_confirmed_at) {
          console.log('📧 User email not confirmed yet');
          setProfile(null);
          setLoading(false);
          return;
        }
        
        // For sign-ins, load the profile
        if (event === 'SIGNED_IN') {
          console.log('👤 User authenticated, loading profile...');
          setTimeout(() => loadProfile(session.user.id), 1000);
        } else {
          await loadProfile(session.user.id);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    // Initialize auth
    initializeAuth();

    return () => {
      data.subscription.unsubscribe();
    };
  }, [isVerified, router, currentPage]);

  const initializeAuth = async () => {
    try {
      console.log('🔍 Getting current user...');
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        if (error.message.includes('Auth session missing')) {
          console.log('ℹ️ No active session');
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        throw error;
      }
      
      console.log('👤 Current user:', user?.email || 'None');
      setUser(user);
      
      if (user) {
        // Check if email is confirmed
        if (!user.email_confirmed_at) {
          console.log('📧 User email not confirmed');
          setProfile(null);
          setLoading(false);
          return;
        }
        
        await loadProfile(user.id);
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('❌ Auth initialization error:', error);
      setError(`Authentication error: ${error.message}`);
      setLoading(false);
    }
  };

  const loadProfile = async (userId: string, retryCount = 0) => {
    try {
      console.log(`📝 Loading profile for: ${userId} (attempt ${retryCount + 1})`);
      
      const profileData = await getUserProfile(userId);
      
      if (profileData) {
        setProfile(profileData);
        setError(null);
        console.log('✅ Profile loaded successfully');
      } else if (retryCount < 3) {
        // If no profile found and we haven't retried much, try again
        // This handles the case where the database trigger is still processing
        console.log('⏳ Profile not found, retrying in 1 second...');
        setTimeout(() => loadProfile(userId, retryCount + 1), 1000);
      } else {
        console.log('⚠️ Profile not found after retries');
        setProfile(null);
      }
    } catch (error: any) {
      console.error('❌ Profile loading error:', error);
      if (retryCount < 2) {
        setTimeout(() => loadProfile(userId, retryCount + 1), 1000);
      } else {
        setProfile(null);
      }
    }
  };

  const handleAuthSuccess = () => {
    console.log('✅ Auth success');
    setError(null);
    setShowAuthModal(false);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    initializeAuth();
  };

  const openAuthModal = (mode: 'signup' | 'signin') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const renderPage = () => {
    if (!isSupabaseConnected) {
      return (
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <Database className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 mx-auto mb-4 sm:mb-6" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Connect to Supabase</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto">
                To use Edubridgepeople, you need to connect to a Supabase database. Click the "Connect to Supabase" 
                button in the top right corner to set up your database connection.
              </p>
              
              <Alert className="max-w-2xl mx-auto mb-4 sm:mb-6">
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <div className="text-left">
                    <p className="font-medium mb-2">What you'll need:</p>
                    <ul className="text-sm space-y-1">
                      <li>• A Supabase account (free tier available)</li>
                      <li>• Your Supabase project URL</li>
                      <li>• Your Supabase anon key</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <Button 
                  onClick={() => window.open('https://supabase.com', '_blank')}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get Started with Supabase
                </Button>
                
                <div className="text-sm text-gray-500">
                  <p>Once connected, you'll be able to:</p>
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-2">
                    <span>✓ Create an account</span>
                    <span>✓ Share wisdom</span>
                    <span>✓ Donate resources</span>
                    <span>✓ Get verified</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Show email verification notice if user is signed in but email not confirmed
    if (user && !user.email_confirmed_at) {
      return (
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <Mail className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 mx-auto mb-4 sm:mb-6" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Verify Your Email</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                We've sent a verification link to <strong className="break-all">{user.email}</strong>. 
                Please click the link in your email to activate your account and start using Edubridgepeople.
              </p>
              
              <Alert className="mb-4 sm:mb-6">
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  <div className="text-left">
                    <p className="font-medium mb-2">Next steps:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Check your email inbox for our verification message</li>
                      <li>• Click the verification link in the email</li>
                      <li>• Return to this page to access your account</li>
                      <li>• Check your spam folder if you don't see the email</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button 
                  onClick={() => openAuthModal('signup')}
                  variant="outline"
                  className="w-full"
                >
                  Resend Verification Email
                </Button>
                
                <Button 
                  onClick={() => {
                    supabase.auth.signOut();
                    setUser(null);
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    switch (currentPage) {
      case 'profile':
        return <ProfilePage user={user} profile={profile} />;
      case 'privacy':
        return <PrivacyPage />;
      case 'verification':
        return <VerificationPage user={user} profile={profile} onVerificationUpdate={loadProfile} />;
      case 'terms': // New case for Terms & Conditions page
        return <TermsAndConditionsPage />;
      default:
        return (
          <div className="grid grid-cols-12 gap-4 sm:gap-6 max-w-7xl mx-auto px-4">
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
              <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}
            
            {/* Left Sidebar - Mobile Drawer */}
            <div className={`
              fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 lg:relative lg:transform-none lg:shadow-none lg:bg-transparent lg:w-auto lg:col-span-3
              ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
              <div className="h-full overflow-y-auto p-4 lg:p-0">
                <div className="flex justify-between items-center mb-4 lg:hidden">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <LeftSidebar 
                  user={user} 
                  profile={profile} 
                  onAuthClick={() => {
                    openAuthModal('signup');
                    setMobileMenuOpen(false);
                  }} 
                />
              </div>
            </div>
            
            {/* Center Feed */}
            <div className="col-span-12 lg:col-span-6">
              <CenterFeed user={user} profile={profile} />
            </div>
            
            {/* Right Sidebar - Hidden on mobile */}
            <div className="hidden lg:block lg:col-span-3">
              <RightSidebar />
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2 text-sm sm:text-base">Loading Edubridgepeople...</p>
          {isSupabaseConnected ? (
            <div className="flex items-center justify-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="text-sm">Connected to Supabase</span>
            </div>
          ) : (
            <div className="flex items-center justify-center text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              <span className="text-sm">Supabase not connected</span>
            </div>
          )}
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLoading(false)}
            >
              Skip Loading
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-4 text-sm break-words">{error}</p>
              
              <div className="space-y-2">
                <Button onClick={handleRetry} className="w-full">
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setError(null)}
                  className="w-full"
                >
                  Continue Anyway
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden mr-2 p-1"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div 
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:opacity-80 transition-opacity flex-1 lg:flex-none"
              onClick={() => router.push('/?page=feed')}
            >
              {/* Modern Logo Design */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <div className="flex items-center space-x-0.5">
                      <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      <Users className="w-2 h-2 sm:w-3 sm:h-3 text-white/80" />
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex items-baseline">
                  <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Edubridge
                  </span>
                  <span className="text-lg sm:text-2xl font-bold text-orange-500 ml-0.5">
                    people
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {isSupabaseConnected ? (
                <div className="hidden md:flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Connected</span>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Not Connected</span>
                </div>
              )}
              
              {user && user.email_confirmed_at && profile && (
                <div className="hidden md:flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Welcome,</span>
                  <span className="font-medium text-gray-900 truncate max-w-20 sm:max-w-none">{profile.username}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    profile.role === 'donor' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {profile.role === 'donor' ? '❤️ Donor' : '🎓 Student'}
                  </span>
                  {(profile.role === 'donor' || profile.verification_status === 'verified') && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>
              )}
              
              {(!user || !user.email_confirmed_at) && isSupabaseConnected && (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg text-xs sm:text-sm"
                  >
                    Join Community
                  </button>
                  <button
                    onClick={() => openAuthModal('signin')}
                    className="text-blue-600 hover:text-blue-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-blue-50 transition-all duration-200 font-medium text-xs sm:text-sm flex items-center"
                  >
                    <LogIn className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Sign In</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="py-4 sm:py-6">
        {renderPage()}
      </div>

      {isSupabaseConnected && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={handleAuthSuccess}
          initialMode={authMode}
        />
      )}

      <HackathonPopup 
        isOpen={showHackathonPopup}
        onClose={() => setShowHackathonPopup(false)}
      />
    </div>
  );
}
