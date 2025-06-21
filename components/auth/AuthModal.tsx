'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { signUp, signIn, resendVerificationEmail } from '@/lib/auth';
import { toast } from 'sonner';
import { GraduationCap, Heart, CheckCircle, Mail, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'signup' | 'signin';
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'signup' }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'donor'>('student');
  const [loading, setLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Update mode when initialMode changes
  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        console.log('🚀 Starting signup for:', email, 'as', role);
        const { user } = await signUp(email, password, role);
        
        if (user && !user.email_confirmed_at) {
          // User needs to verify email
          setUserEmail(email);
          setShowEmailVerification(true);
          
          toast.success(
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Check Your Email!</p>
                <p className="text-sm text-gray-600 mt-1">
                  We've sent a verification link to <span className="font-medium">{email}</span>. 
                  Please click the link to activate your account.
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Check your spam folder if you don't see the email.
                </p>
              </div>
            </div>,
            { 
              duration: 8000,
              style: {
                maxWidth: '500px',
              }
            }
          );
        } else {
          // User is already verified (shouldn't happen with email confirmation enabled)
          handleClose();
          toast.success(
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Registration Successful!</p>
                <p className="text-sm text-gray-600 mt-1">
                  Welcome to Edubridgepeople as a <span className="font-medium capitalize">{role}</span>!
                </p>
              </div>
            </div>,
            { duration: 5000 }
          );
          onSuccess();
        }
        
      } else {
        console.log('🔑 Starting signin for:', email);
        await signIn(email, password);
        
        handleClose();
        toast.success('Welcome back to Edubridgepeople!');
        onSuccess();
      }
      
    } catch (error: any) {
      console.error('Auth error:', error);
      
      let errorMessage = 'Authentication failed';
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account before signing in';
          setUserEmail(email);
          setShowEmailVerification(true);
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Try signing in instead.';
          setIsSignUp(false);
        } else if (error.message.includes('duplicate key value')) {
          errorMessage = 'An account with this email already exists. Try signing in instead.';
          setIsSignUp(false);
        } else if (error.message.includes('Please connect to Supabase')) {
          errorMessage = 'Database connection required. Please connect to Supabase first.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      await resendVerificationEmail();
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      console.error('Resend error:', error);
      toast.error('Failed to resend verification email. Please try signing up again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setRole('student');
    setIsSignUp(initialMode === 'signup');
    setLoading(false);
    setShowEmailVerification(false);
    setUserEmail('');
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (showEmailVerification) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] max-w-sm mx-auto max-h-[85vh] overflow-hidden" aria-labelledby="email-verification-title">
          <DialogHeader className="pb-2">
            <DialogTitle id="email-verification-title" className="text-center text-base sm:text-lg font-bold flex items-center justify-center">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
              Verify Your Email
            </DialogTitle>
            <DialogDescription className="text-center text-xs sm:text-sm">
              We've sent a verification link to activate your account
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 max-h-[60vh] pr-4">
            <div className="space-y-3 text-center">
              <Alert className="text-left">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                <AlertDescription className="text-xs sm:text-sm">
                  We've sent a verification link to <strong className="break-all">{userEmail}</strong>. 
                  Please click the link in your email to activate your account.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-xs sm:text-sm text-gray-600">
                  Didn't receive the email? Check your spam folder or click below to resend.
                </p>
                
                <Button 
                  onClick={handleResendVerification}
                  disabled={loading}
                  variant="outline"
                  className="w-full text-xs sm:text-sm h-8 sm:h-9"
                >
                  {loading ? 'Sending...' : 'Resend Verification Email'}
                </Button>
                
                <Button 
                  onClick={() => {
                    setShowEmailVerification(false);
                    setIsSignUp(false); // Switch to sign in mode
                  }}
                  variant="ghost"
                  className="w-full text-xs sm:text-sm h-8 sm:h-9"
                >
                  Already verified? Sign In
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-sm mx-auto max-h-[90vh] overflow-hidden" aria-labelledby="auth-modal-title">
        <DialogHeader className="pb-2">
          <DialogTitle id="auth-modal-title" className="text-center text-base sm:text-lg font-bold">
            {isSignUp ? 'Join Edubridgepeople' : 'Welcome Back'}
          </DialogTitle>
          <DialogDescription className="text-center text-xs sm:text-sm">
            {isSignUp 
              ? 'Create your account to start sharing and learning' 
              : 'Sign in to continue your learning journey'
            }
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 max-h-[75vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs sm:text-sm">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
                className="w-full text-xs sm:text-sm h-8 sm:h-9"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                minLength={6}
                className="w-full text-xs sm:text-sm h-8 sm:h-9"
              />
              {isSignUp && (
                <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
              )}
            </div>
            
            {isSignUp && (
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Choose your role:</Label>
                <RadioGroup 
                  value={role} 
                  onValueChange={(value) => setRole(value as 'student' | 'donor')}
                  disabled={loading}
                  className="space-y-2"
                >
                  <div 
                    className={`flex items-start space-x-2 p-2 border-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer ${role === 'student' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    onClick={() => !loading && setRole('student')}
                  >
                    <RadioGroupItem value="student" id="student" className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="student" className="cursor-pointer font-medium flex items-center text-xs sm:text-sm">
                        <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-blue-600 flex-shrink-0" />
                        Student
                      </Label>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Looking for educational resources and mentorship
                      </p>
                      <p className="text-xs text-blue-600 mt-0.5 font-medium">
                        • Verify email to post • Get verified for resources
                      </p>
                    </div>
                  </div>
                  <div 
                    className={`flex items-start space-x-2 p-2 border-2 rounded-lg hover:bg-green-50 transition-colors cursor-pointer ${role === 'donor' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                    onClick={() => !loading && setRole('donor')}
                  >
                    <RadioGroupItem value="donor" id="donor" className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="donor" className="cursor-pointer font-medium flex items-center text-xs sm:text-sm">
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-green-600 flex-shrink-0" />
                        Donor / Mentor
                      </Label>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Sharing knowledge and resources with students
                      </p>
                      <p className="text-xs text-green-600 mt-0.5 font-medium">
                        • Verify email to access • Auto-verified status
                      </p>
                    </div>
                  </div>
                </RadioGroup>
                
                <div className="text-xs text-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">Selected: </span>
                  <span className={`capitalize font-bold ${role === 'student' ? 'text-blue-600' : 'text-green-600'}`}>
                    {role}
                  </span>
                </div>
              </div>
            )}
            
            <Button type="submit" className="w-full text-xs sm:text-sm h-8 sm:h-9" disabled={loading}>
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
            
            <div className="text-center pt-3 border-t border-gray-100 space-y-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs sm:text-sm text-blue-600 hover:underline font-medium block w-full"
                disabled={loading}
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}