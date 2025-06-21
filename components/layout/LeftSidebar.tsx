'use client';

import { User } from '@supabase/supabase-js';
import { Profile } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { signOut } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Clock, AlertCircle, Home, User as UserIcon, Shield, LogOut, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface LeftSidebarProps {
  user: User | null;
  profile: Profile | null;
  onAuthClick: () => void;
}

export default function LeftSidebar({ user, profile, onAuthClick }: LeftSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = searchParams.get('page') || 'feed';

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/?page=feed');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const getVerificationBadge = () => {
    if (!profile) return null;

    // Donors are automatically verified
    if (profile.role === 'donor') {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified Donor
        </Badge>
      );
    }

    // Students need verification
    switch (profile.verification_status) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified Student
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
            onClick={() => router.push('/?page=verification')}
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Get Verified
          </Button>
        );
    }
  };

  const getRoleBadge = () => {
    if (!profile) return null;

    if (profile.role === 'donor') {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <Heart className="w-3 h-3 mr-1" />
          Donor/Mentor
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          <UserIcon className="w-3 h-3 mr-1" />
          Student
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-4 sticky top-24">
      {user && user.email_confirmed_at && profile ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={profile.avatar_url} alt={profile.username} />
                <AvatarFallback className={`text-white text-lg ${profile.role === 'donor' ? 'bg-green-600' : 'bg-blue-600'}`}>
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{profile.username}</h3>
                <p className="text-sm text-gray-600 truncate">{profile.email}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              {getRoleBadge()}
              {getVerificationBadge()}
            </div>

            {profile.role === 'donor' && (
              <div className="bg-green-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-green-800 font-medium">
                  ✨ Thank you for being a donor! You can share resources and wisdom immediately.
                </p>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full mb-2"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Welcome to Edubridgepeople</h3>
            <p className="text-sm text-gray-600 mb-4">
              Join our community to share knowledge and resources with verified students.
            </p>
            <Button onClick={onAuthClick} className="w-full">
              Join Community
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <nav className="space-y-2">
            <Button 
              variant={currentPage === 'feed' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => router.push('/?page=feed')}
            >
              <Home className="w-4 h-4 mr-2" />
              Home Feed
            </Button>
            {user && user.email_confirmed_at && (
              <Button 
                variant={currentPage === 'profile' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => router.push('/?page=profile')}
              >
                <UserIcon className="w-4 h-4 mr-2" />
                My Profile
              </Button>
            )}
            <Button 
              variant={currentPage === 'privacy' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => router.push('/?page=privacy')}
            >
              <Shield className="w-4 h-4 mr-2" />
              Privacy Policy
            </Button>
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}
