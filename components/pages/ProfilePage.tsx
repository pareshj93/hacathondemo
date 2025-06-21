'use client';

import { User } from '@supabase/supabase-js';
import { Profile } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, AlertCircle, User as UserIcon, Mail, Calendar, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProfilePageProps {
  user: User | null;
  profile: Profile | null;
}

export default function ProfilePage({ user, profile }: ProfilePageProps) {
  const router = useRouter();

  if (!user || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">Please sign in to view your profile.</p>
            <Button className="mt-4" onClick={() => router.push('/?page=feed')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getVerificationBadge = () => {
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
            Pending Verification
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Unverified
          </Badge>
        );
    }
  };

  const getRoleBadge = () => {
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
    <div className="max-w-2xl mx-auto px-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserIcon className="w-6 h-6 mr-2 text-blue-600" />
            My Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className={`text-white text-xl ${profile.role === 'donor' ? 'bg-green-600' : 'bg-blue-600'}`}>
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{profile.username}</h2>
              <div className="flex items-center space-x-2 mt-1">
                {getRoleBadge()}
                {getVerificationBadge()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{profile.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {profile.role === 'donor' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">✨ Thank You for Being a Donor!</h3>
              <p className="text-green-800 text-sm mb-3">
                As a verified donor, you have full access to all platform features and can help students immediately.
              </p>
              <div className="text-sm text-green-700">
                <p className="font-medium mb-1">What you can do:</p>
                <ul className="space-y-1">
                  <li>• Share wisdom and knowledge with the community</li>
                  <li>• Donate resources to verified students</li>
                  <li>• Mentor students and provide guidance</li>
                  <li>• Access all platform features without restrictions</li>
                </ul>
              </div>
            </div>
          )}

          {profile.role === 'student' && profile.verification_status === 'unverified' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Get Verified</h3>
              <p className="text-blue-800 text-sm mb-3">
                Verify your student status to unlock all features including sharing wisdom and accessing exclusive resources.
              </p>
              <Button 
                size="sm" 
                onClick={() => router.push('/?page=verification')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Verification
              </Button>
            </div>
          )}

          {profile.verification_status === 'pending' && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">Verification in Progress</h3>
              <p className="text-yellow-800 text-sm">
                Your verification is under review. We'll notify you once it's approved. This typically takes 24-48 hours.
              </p>
            </div>
          )}

          {profile.role === 'student' && profile.verification_status === 'verified' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Account Verified ✓</h3>
              <p className="text-green-800 text-sm">
                Your student account is verified! You now have access to all platform features.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Share Wisdom Posts</span>
              <Badge variant={profile.role === 'donor' || profile.verification_status === 'verified' ? 'default' : 'secondary'}>
                {profile.role === 'donor' || profile.verification_status === 'verified' ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Donate Resources</span>
              <Badge variant={profile.role === 'donor' || profile.verification_status === 'verified' ? 'default' : 'secondary'}>
                {profile.role === 'donor' || profile.verification_status === 'verified' ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Claim Resources</span>
              <Badge variant={profile.role === 'student' && profile.verification_status === 'verified' ? 'default' : 'secondary'}>
                {profile.role === 'student' && profile.verification_status === 'verified' ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">View All Posts</span>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Report Content</span>
              <Badge variant="default">Enabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}