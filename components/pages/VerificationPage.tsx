'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile, supabase, isSupabaseConnected } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle, AlertCircle, FileImage, Heart, Database } from 'lucide-react';

interface VerificationPageProps {
  user: User | null;
  profile: Profile | null;
  onVerificationUpdate: (userId: string) => void;
}

export default function VerificationPage({ user, profile, onVerificationUpdate }: VerificationPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  // Check if Supabase is connected
  if (!isSupabaseConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Database className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Database Connection Required</h2>
            <p className="text-gray-600 mb-4">
              Connect to Supabase to access verification features.
            </p>
            <Button onClick={() => router.push('/?page=feed')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">Please sign in to access verification.</p>
            <Button className="mt-4" onClick={() => router.push('/?page=feed')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Donors don't need verification
  if (profile.role === 'donor') {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Heart className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verification Not Required</h2>
            <p className="text-gray-600 mb-4">
              As a donor/mentor, you can start sharing resources and wisdom immediately. 
              No verification is needed for your account.
            </p>
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-green-900 mb-2">What you can do:</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>✓ Share wisdom and knowledge</li>
                <li>✓ Donate resources to students</li>
                <li>✓ Mentor students in the community</li>
                <li>✓ Access all platform features</li>
              </ul>
            </div>
            <Button className="mt-4" onClick={() => router.push('/?page=feed')}>
              Start Sharing Resources
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile.verification_status === 'verified') {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Already Verified</h2>
            <p className="text-gray-600">Your student account is already verified. You can now share wisdom and claim resources.</p>
            <Button className="mt-4" onClick={() => router.push('/?page=feed')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile.verification_status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verification Pending</h2>
            <p className="text-gray-600">Your verification is under review. We'll notify you once it's approved.</p>
            <Button className="mt-4" onClick={() => router.push('/?page=feed')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);

    try {
      // Upload file to Supabase Storage with user ID folder structure
      const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('verification-uploads')
        .upload(fileName, selectedFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // If bucket doesn't exist, show a helpful message
        if (uploadError.message.includes('The resource was not found')) {
          toast.error('Verification storage not set up. Please contact support.');
          return;
        }
        throw uploadError;
      }

      // Update profile status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ verification_status: 'pending' })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Verification document uploaded successfully! Your verification is now pending review.');
      onVerificationUpdate(user.id);
      router.push('/?page=feed');
    } catch (error: any) {
      console.error('Verification upload error:', error);
      toast.error('Failed to upload verification document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="w-6 h-6 mr-2 text-blue-600" />
            Student Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To maintain trust and safety in our community, students need to verify their identity by uploading a clear photo of their student ID card.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold">Requirements:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Clear, readable photo of your current student ID</li>
              <li>All text on the ID should be clearly visible</li>
              <li>Image size should be less than 5MB</li>
              <li>Accepted formats: JPG, PNG, JPEG</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-id">Upload Student ID</Label>
              <Input
                id="student-id"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {selectedFile && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                <FileImage className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">{selectedFile.name}</span>
              </div>
            )}

            <Button type="submit" disabled={!selectedFile || uploading} className="w-full">
              {uploading ? 'Uploading...' : 'Submit for Verification'}
            </Button>
          </form>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Privacy Notice:</strong> Your student ID will only be used for verification purposes and will be handled according to our privacy policy.</p>
            <p><strong>Processing Time:</strong> Verification typically takes 24-48 hours during business days.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}