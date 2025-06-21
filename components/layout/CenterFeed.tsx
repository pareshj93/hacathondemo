'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile, Post, supabase, isSupabaseConnected } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Heart, MessageCircle, Flag, Share2, CheckCircle, BookOpen, Gift, AlertCircle, Database, Phone, Mail, Lock, Edit, Trash2, Eye, EyeOff, Users, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CenterFeedProps {
  user: User | null;
  profile: Profile | null;
}

// Enhanced sample posts with more realistic content and varied timestamps
const samplePosts = [
  {
    id: 'sample-1',
    user_id: 'sample-user-1',
    post_type: 'wisdom' as const,
    content: 'Just finished my first semester of Computer Science! 🎉 The biggest lesson I learned: don\'t be afraid to ask for help. Your professors and TAs are there to support you. Also, form study groups early - explaining concepts to others really helps solidify your understanding. Keep pushing forward, future developers! 💻',
    created_at: '2024-12-15T14:30:00Z',
    profiles: {
      id: 'sample-user-1',
      username: 'CodeNewbie2024',
      email: 'student@example.com',
      role: 'student' as const,
      verification_status: 'verified' as const,
      created_at: '2024-09-01T00:00:00Z'
    }
  },
  {
    id: 'sample-2',
    user_id: 'sample-user-2',
    post_type: 'donation' as const,
    resource_title: 'Complete Web Development Course Bundle (React, Node.js, MongoDB)',
    resource_category: 'courses',
    resource_contact: 'Sign in to view contact details',
    created_at: '2024-12-14T09:45:00Z',
    profiles: {
      id: 'sample-user-2',
      username: 'TechMentor_Sarah',
      email: 'mentor@example.com',
      role: 'donor' as const,
      verification_status: 'verified' as const,
      created_at: '2024-08-15T00:00:00Z'
    }
  },
  {
    id: 'sample-3',
    user_id: 'sample-user-3',
    post_type: 'wisdom' as const,
    content: 'To all the students struggling with imposter syndrome: YOU BELONG HERE! 🌟 I remember feeling like everyone else was smarter than me during my first year. But here\'s the truth - we\'re all learning, we all make mistakes, and that\'s perfectly normal. Focus on your own growth, celebrate small wins, and remember that every expert was once a beginner. You\'ve got this! 💪',
    created_at: '2024-12-13T16:20:00Z',
    profiles: {
      id: 'sample-user-3',
      username: 'MotivatedGrad',
      email: 'grad@example.com',
      role: 'student' as const,
      verification_status: 'verified' as const,
      created_at: '2024-07-20T00:00:00Z'
    }
  },
  {
    id: 'sample-4',
    user_id: 'sample-user-4',
    post_type: 'donation' as const,
    resource_title: 'Programming Books Collection: Clean Code, Design Patterns, Algorithms',
    resource_category: 'books',
    resource_contact: 'Sign in to view contact details',
    created_at: '2024-12-12T11:15:00Z',
    profiles: {
      id: 'sample-user-4',
      username: 'BookLover_Dev',
      email: 'books@example.com',
      role: 'donor' as const,
      verification_status: 'verified' as const,
      created_at: '2024-06-10T00:00:00Z'
    }
  },
  {
    id: 'sample-5',
    user_id: 'sample-user-5',
    post_type: 'wisdom' as const,
    content: 'Pro tip for CS students: Start building projects from day one! 🚀 Don\'t wait until you feel "ready" - you never will. I built my first terrible website after just 2 weeks of learning HTML/CSS. It was awful, but it taught me more than any tutorial ever could. Build, break, fix, repeat. That\'s how you really learn to code!',
    created_at: '2024-12-11T08:30:00Z',
    profiles: {
      id: 'sample-user-5',
      username: 'ProjectBuilder',
      email: 'builder@example.com',
      role: 'student' as const,
      verification_status: 'verified' as const,
      created_at: '2024-05-15T00:00:00Z'
    }
  },
  {
    id: 'sample-6',
    user_id: 'sample-user-6',
    post_type: 'donation' as const,
    resource_title: 'Free 1-on-1 Career Mentorship Sessions (Software Engineering)',
    resource_category: 'mentorship',
    resource_contact: 'Sign in to view contact details',
    created_at: '2024-12-10T15:45:00Z',
    profiles: {
      id: 'sample-user-6',
      username: 'SeniorEngineer_Mike',
      email: 'mentor2@example.com',
      role: 'donor' as const,
      verification_status: 'verified' as const,
      created_at: '2024-04-20T00:00:00Z'
    }
  },
  {
    id: 'sample-7',
    user_id: 'sample-user-7',
    post_type: 'wisdom' as const,
    content: 'Networking isn\'t just about collecting LinkedIn connections! 🤝 The best opportunities come from genuine relationships. Attend local meetups, contribute to open source projects, help others in online communities. Be genuinely interested in people and their work. The opportunities will follow naturally. Quality over quantity, always!',
    created_at: '2024-12-09T13:20:00Z',
    profiles: {
      id: 'sample-user-7',
      username: 'NetworkingPro',
      email: 'network@example.com',
      role: 'student' as const,
      verification_status: 'verified' as const,
      created_at: '2024-03-10T00:00:00Z'
    }
  },
  {
    id: 'sample-8',
    user_id: 'sample-user-8',
    post_type: 'donation' as const,
    resource_title: 'MacBook Pro 2019 (16-inch) - Perfect for Development',
    resource_category: 'electronics',
    resource_contact: 'Sign in to view contact details',
    created_at: '2024-12-08T10:00:00Z',
    profiles: {
      id: 'sample-user-8',
      username: 'TechDonor_Alex',
      email: 'tech@example.com',
      role: 'donor' as const,
      verification_status: 'verified' as const,
      created_at: '2024-02-28T00:00:00Z'
    }
  },
  {
    id: 'sample-9',
    user_id: 'sample-user-9',
    post_type: 'wisdom' as const,
    content: 'Time management tip that changed my life: Time-blocking! 📅 Instead of just making to-do lists, I assign specific time slots to each task. "Study algorithms 2-4 PM", "Work on project 7-9 PM". It helps me stay focused and gives me a realistic view of what I can actually accomplish in a day. Game changer for productivity!',
    created_at: '2024-12-07T17:30:00Z',
    profiles: {
      id: 'sample-user-9',
      username: 'ProductivityHacker',
      email: 'productivity@example.com',
      role: 'student' as const,
      verification_status: 'verified' as const,
      created_at: '2024-01-15T00:00:00Z'
    }
  },
  {
    id: 'sample-10',
    user_id: 'sample-user-10',
    post_type: 'donation' as const,
    resource_title: 'Scholarship Opportunity: $2000 for Underrepresented Students in STEM',
    resource_category: 'scholarships',
    resource_contact: 'Sign in to view contact details',
    created_at: '2024-12-06T12:15:00Z',
    profiles: {
      id: 'sample-user-10',
      username: 'ScholarshipHelper',
      email: 'scholarship@example.com',
      role: 'donor' as const,
      verification_status: 'verified' as const,
      created_at: '2023-12-01T00:00:00Z'
    }
  },
  {
    id: 'sample-11',
    user_id: 'sample-user-11',
    post_type: 'wisdom' as const,
    content: 'Failed my first technical interview spectacularly, but it was the best thing that happened to me! 😅 It showed me exactly what I needed to work on. Spent the next 3 months practicing data structures and algorithms daily. Got my dream job on the next try! Failure is just feedback in disguise. Keep going! 🎯',
    created_at: '2024-11-28T14:45:00Z',
    profiles: {
      id: 'sample-user-11',
      username: 'InterviewSurvivor',
      email: 'survivor@example.com',
      role: 'student' as const,
      verification_status: 'verified' as const,
      created_at: '2023-11-10T00:00:00Z'
    }
  },
  {
    id: 'sample-12',
    user_id: 'sample-user-12',
    post_type: 'donation' as const,
    resource_title: 'Complete Adobe Creative Suite License (1 Year)',
    resource_category: 'software',
    resource_contact: 'Sign in to view contact details',
    created_at: '2024-11-25T09:30:00Z',
    profiles: {
      id: 'sample-user-12',
      username: 'DesignMentor_Lisa',
      email: 'design@example.com',
      role: 'donor' as const,
      verification_status: 'verified' as const,
      created_at: '2023-10-05T00:00:00Z'
    }
  }
];

export default function CenterFeed({ user, profile }: CenterFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerType, setComposerType] = useState<'wisdom' | 'donation'>('wisdom');
  const [showDatabaseError, setShowDatabaseError] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  
  // Form states
  const [content, setContent] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceCategory, setResourceCategory] = useState('');
  const [resourceContact, setResourceContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit form states
  const [editContent, setEditContent] = useState('');
  const [editResourceTitle, setEditResourceTitle] = useState('');
  const [editResourceCategory, setEditResourceCategory] = useState('');
  const [editResourceContact, setEditResourceContact] = useState('');

  useEffect(() => {
    if (!isSupabaseConnected) {
      // Show sample posts when not connected to Supabase
      setPosts(samplePosts);
      setLoading(false);
      return;
    }

    if (!user || !user.email_confirmed_at) {
      // Show sample posts for unauthenticated or unverified users
      setPosts(samplePosts);
      setLoading(false);
      return;
    }

    fetchPosts();
    
    // Subscribe to real-time updates only for authenticated users
    const subscription = supabase
      .channel('posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchPosts = async () => {
    if (!isSupabaseConnected || !user || !user.email_confirmed_at) {
      setPosts(samplePosts);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        
        if (error.code === 'PGRST116' || error.message.includes('relation "posts" does not exist')) {
          setShowDatabaseError(true);
          setPosts(samplePosts);
          setLoading(false);
          return;
        }
        throw error;
      }
      
      // If no real posts, show sample posts
      setPosts(data && data.length > 0 ? data : samplePosts);
      setShowDatabaseError(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts(samplePosts);
      setShowDatabaseError(true);
    } finally {
      setLoading(false);
    }
  };

  const canPost = () => {
    return !!(user && user.email_confirmed_at && profile && isSupabaseConnected);
  };

  const canClaimResource = () => {
    if (!user || !user.email_confirmed_at || !profile) return false;
    return profile.role === 'student' && profile.verification_status === 'verified';
  };

  const canSeeContactInfo = (post: Post) => {
    if (!user || !user.email_confirmed_at || !profile) return false;
    return profile.role === 'student' && profile.verification_status === 'verified';
  };

  const canEditPost = (post: Post) => {
    return user && user.email_confirmed_at && post.user_id === user.id && !post.id.startsWith('sample-');
  };

  const getPostingRestrictionMessage = () => {
    if (!user) return 'Sign in to share content';
    if (!user.email_confirmed_at) return 'Verify your email to share content';
    if (!profile) return 'Profile loading...';
    return 'Share your thoughts with the community!';
  };

  const getUserBadges = (userProfile: Profile) => {
    const badges = [];
    
    // Role badge
    if (userProfile.role === 'donor') {
      badges.push(
        <Badge key="role" variant="outline" className="text-green-700 border-green-300 bg-green-50">
          ❤️ Donor
        </Badge>
      );
    } else {
      badges.push(
        <Badge key="role" variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
          🎓 Student
        </Badge>
      );
    }
    
    // Verification badge
    if (userProfile.role === 'donor' || userProfile.verification_status === 'verified') {
      badges.push(
        <CheckCircle key="verified" className="w-4 h-4 text-green-600" />
      );
    }
    
    return badges;
  };

  const handleSubmitPost = async () => {
    if (!user || !user.email_confirmed_at || !profile || !canPost()) return;

    if (composerType === 'wisdom' && !content.trim()) {
      toast.error('Please enter some wisdom to share');
      return;
    }

    if (composerType === 'donation' && (!resourceTitle.trim() || !resourceCategory || !resourceContact.trim())) {
      toast.error('Please fill in all donation details');
      return;
    }

    setSubmitting(true);

    try {
      const postData = {
        user_id: user.id,
        post_type: composerType,
        ...(composerType === 'wisdom' 
          ? { content: content.trim() }
          : {
              resource_title: resourceTitle.trim(),
              resource_category: resourceCategory,
              resource_contact: resourceContact.trim()
            })
      };

      const { error } = await supabase
        .from('posts')
        .insert(postData);

      if (error) throw error;

      // Reset form
      setContent('');
      setResourceTitle('');
      setResourceCategory('');
      setResourceContact('');
      
      toast.success(composerType === 'wisdom' ? 'Wisdom shared!' : 'Resource posted!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    if (post.post_type === 'wisdom') {
      setEditContent(post.content || '');
    } else {
      setEditResourceTitle(post.resource_title || '');
      setEditResourceCategory(post.resource_category || '');
      setEditResourceContact(post.resource_contact || '');
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;

    try {
      const updateData = editingPost.post_type === 'wisdom' 
        ? { content: editContent.trim() }
        : {
            resource_title: editResourceTitle.trim(),
            resource_category: editResourceCategory,
            resource_contact: editResourceContact.trim()
          };

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', editingPost.id);

      if (error) throw error;

      setEditingPost(null);
      toast.success('Post updated successfully!');
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast.success('Post deleted successfully!');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleClaimResource = (post: Post) => {
    if (post.id.startsWith('sample-')) {
      toast.error('Please sign in to claim resources');
      return;
    }

    if (!canClaimResource()) {
      if (!user) {
        toast.error('Please sign in to claim resources');
        return;
      }
      if (!user.email_confirmed_at) {
        toast.error('Please verify your email to claim resources');
        return;
      }
      if (profile?.role !== 'student') {
        toast.error('Only students can claim resources');
        return;
      }
      if (profile?.verification_status !== 'verified') {
        toast.error('You need to be a verified student to claim resources');
        return;
      }
    }

    toast.success(`Contact the donor: ${post.resource_contact}`);
  };

  // Show database connection required message
  if (!isSupabaseConnected) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <Database className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Connection Required</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              Connect to Supabase to start sharing wisdom and resources with the community.
            </p>
            <Button onClick={() => window.open('https://supabase.com', '_blank')} className="w-full sm:w-auto">
              Connect to Supabase
            </Button>
          </CardContent>
        </Card>

        {/* Show sample posts even without database connection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Community Preview</h2>
            <Badge variant="outline" className="text-blue-600">
              <Users className="w-3 h-3 mr-1" />
              Demo Content
            </Badge>
          </div>
          
          {samplePosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                    <AvatarFallback className={`text-white text-sm sm:text-base ${post.profiles?.role === 'donor' ? 'bg-green-600' : 'bg-blue-600'}`}>
                      {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {post.profiles?.username || 'Unknown User'}
                        </span>
                        
                        {/* User badges */}
                        <div className="flex items-center space-x-1">
                          {post.profiles && getUserBadges(post.profiles)}
                        </div>
                        
                        {/* Post type badge */}
                        <Badge 
                          variant={post.post_type === 'wisdom' ? 'default' : 'secondary'}
                          className={`text-xs ${post.post_type === 'wisdom' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
                        >
                          {post.post_type === 'wisdom' ? '💡 Wisdom' : '🎁 Resource'}
                        </Badge>
                        
                        <span className="text-xs sm:text-sm text-gray-500">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    {post.post_type === 'wisdom' ? (
                      <p className="text-sm sm:text-base text-gray-900 mb-4 leading-relaxed">{post.content}</p>
                    ) : (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 sm:p-4 rounded-lg mb-4 border border-green-200">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center text-sm sm:text-base">
                          <Gift className="w-4 h-4 mr-2 text-green-600" />
                          {post.resource_title}
                        </h4>
                        <div className="flex items-center space-x-4 text-xs sm:text-sm text-gray-600 mb-3">
                          <span className="flex items-center">
                            <span className="font-medium">Category:</span>
                            <span className="ml-1">{post.resource_category}</span>
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <Lock className="w-4 h-4 mr-1 text-gray-400" />
                            <span className="font-medium">Contact:</span>
                            <span className="ml-1 text-gray-400">Sign in to view</span>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-gray-400 cursor-not-allowed w-full sm:w-auto"
                            disabled
                          >
                            <Lock className="w-3 h-3 mr-1" />
                            Sign In Required
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 sm:space-x-4 text-gray-500">
                      <Button variant="ghost" size="sm" className="hover:text-red-600 text-xs sm:text-sm p-1 sm:p-2" disabled>
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Like
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:text-blue-600 text-xs sm:text-sm p-1 sm:p-2" disabled>
                        <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Comment
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:text-green-600 text-xs sm:text-sm p-1 sm:p-2" disabled>
                        <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Card className="border-dashed border-2 border-blue-300">
            <CardContent className="p-6 sm:p-8 text-center">
              <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Join the Community</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Sign up to share your wisdom, donate resources, and connect with verified students and mentors.
              </p>
              <Button onClick={() => window.location.reload()} className="w-full sm:w-auto">
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showDatabaseError) {
    return (
      <div className="space-y-6">
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Database Setup Required</p>
              <p className="text-sm">
                The database tables haven't been created yet. Please ensure your Supabase project is properly configured.
              </p>
              <div className="mt-3">
                <Button 
                  onClick={() => {
                    setShowDatabaseError(false);
                    setLoading(true);
                    fetchPosts();
                  }}
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 sm:p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Composer */}
      {user && user.email_confirmed_at && profile && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <Tabs value={composerType} onValueChange={(value) => setComposerType(value as 'wisdom' | 'donation')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="wisdom" className="flex items-center text-xs sm:text-sm">
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Share Wisdom
                </TabsTrigger>
                <TabsTrigger value="donation" className="flex items-center text-xs sm:text-sm">
                  <Gift className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Donate Resource
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="wisdom" className="space-y-4">
                <Textarea
                  placeholder={canPost() ? "Share your knowledge, experience, or advice with the community..." : getPostingRestrictionMessage()}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={!canPost()}
                  className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                />
              </TabsContent>
              
              <TabsContent value="donation" className="space-y-4">
                <Input
                  placeholder={canPost() ? "What are you donating? (e.g., 'Programming Books', 'Laptop', 'Mentorship Sessions')" : getPostingRestrictionMessage()}
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  disabled={!canPost()}
                  className="text-sm sm:text-base"
                />
                <Select value={resourceCategory} onValueChange={setResourceCategory} disabled={!canPost()}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select donation category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="books">📚 Books & Study Materials</SelectItem>
                    <SelectItem value="stationery">✏️ Stationery & Supplies</SelectItem>
                    <SelectItem value="electronics">💻 Electronics & Gadgets</SelectItem>
                    <SelectItem value="courses">🎓 Online Courses & Subscriptions</SelectItem>
                    <SelectItem value="mentorship">👨‍🏫 Mentorship & Guidance</SelectItem>
                    <SelectItem value="scholarships">💰 Scholarships & Financial Aid</SelectItem>
                    <SelectItem value="internships">🏢 Internship Opportunities</SelectItem>
                    <SelectItem value="software">⚡ Software & Tools</SelectItem>
                    <SelectItem value="other">🎁 Other Resources</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="How can students contact you? (email, phone, or preferred method)"
                  value={resourceContact}
                  onChange={(e) => setResourceContact(e.target.value)}
                  disabled={!canPost()}
                  className="text-sm sm:text-base"
                />
              </TabsContent>
            </Tabs>
            
            {canPost() ? (
              <Button 
                onClick={handleSubmitPost} 
                disabled={submitting}
                className="w-full text-sm sm:text-base"
              >
                {submitting ? 'Posting...' : `Share ${composerType === 'wisdom' ? 'Wisdom' : 'Resource'}`}
              </Button>
            ) : (
              <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-2 text-sm sm:text-base">{getPostingRestrictionMessage()}</p>
                {!user && (
                  <Button 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    Join Community
                  </Button>
                )}
                {user && !user.email_confirmed_at && (
                  <Button 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    Verify Email
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
        </Card>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">Be the first to share wisdom or donate resources!</p>
              {!user && (
                <Button onClick={() => window.location.reload()} className="w-full sm:w-auto">
                  Join Community
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                    <AvatarFallback className={`text-white text-sm sm:text-base ${post.profiles?.role === 'donor' ? 'bg-green-600' : 'bg-blue-600'}`}>
                      {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {post.profiles?.username || 'Unknown User'}
                        </span>
                        
                        {/* User badges */}
                        <div className="flex items-center space-x-1">
                          {post.profiles && getUserBadges(post.profiles)}
                        </div>
                        
                        {/* Post type badge */}
                        <Badge 
                          variant={post.post_type === 'wisdom' ? 'default' : 'secondary'}
                          className={`text-xs ${post.post_type === 'wisdom' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
                        >
                          {post.post_type === 'wisdom' ? '💡 Wisdom' : '🎁 Resource'}
                        </Badge>
                        
                        <span className="text-xs sm:text-sm text-gray-500">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {/* Edit/Delete buttons for post owner */}
                      {canEditPost(post) && (
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditPost(post)}
                            className="p-1 sm:p-2"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-600 hover:text-red-700 p-1 sm:p-2"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {post.post_type === 'wisdom' ? (
                      <p className="text-sm sm:text-base text-gray-900 mb-4 leading-relaxed">{post.content}</p>
                    ) : (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 sm:p-4 rounded-lg mb-4 border border-green-200">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center text-sm sm:text-base">
                          <Gift className="w-4 h-4 mr-2 text-green-600" />
                          {post.resource_title}
                        </h4>
                        <div className="flex items-center space-x-4 text-xs sm:text-sm text-gray-600 mb-3">
                          <span className="flex items-center">
                            <span className="font-medium">Category:</span>
                            <span className="ml-1">{post.resource_category}</span>
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            {canSeeContactInfo(post) ? (
                              <>
                                {post.resource_contact?.includes('@') ? (
                                  <Mail className="w-4 h-4 mr-1 text-blue-600" />
                                ) : (
                                  <Phone className="w-4 h-4 mr-1 text-green-600" />
                                )}
                                <span className="font-medium">Contact:</span>
                                <span className="ml-1 break-all">{post.resource_contact}</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-4 h-4 mr-1 text-gray-400" />
                                <span className="font-medium">Contact:</span>
                                <span className="ml-1 text-gray-400">
                                  {post.id.startsWith('sample-') ? 'Sign in to view' : 'Verification required to view'}
                                </span>
                              </>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            className={`w-full sm:w-auto text-xs sm:text-sm ${canClaimResource() ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}`}
                            onClick={() => handleClaimResource(post)}
                            disabled={!canClaimResource() && !post.id.startsWith('sample-')}
                          >
                            {!canClaimResource() && (
                              <Lock className="w-3 h-3 mr-1" />
                            )}
                            {post.id.startsWith('sample-') 
                              ? 'Sign In Required'
                              : canClaimResource() 
                                ? 'Claim Resource' 
                                : 'Verification Required'
                            }
                          </Button>
                        </div>
                        {!canClaimResource() && user && user.email_confirmed_at && (
                          <div className="mt-2 text-xs text-gray-500">
                            {profile?.role !== 'student' 
                              ? 'Only students can claim resources' 
                              : 'Verify your student status to claim resources'
                            }
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 sm:space-x-4 text-gray-500">
                      <Button variant="ghost" size="sm" className="hover:text-red-600 text-xs sm:text-sm p-1 sm:p-2" disabled={post.id.startsWith('sample-')}>
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Like
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:text-blue-600 text-xs sm:text-sm p-1 sm:p-2" disabled={post.id.startsWith('sample-')}>
                        <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Comment
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:text-green-600 text-xs sm:text-sm p-1 sm:p-2" disabled={post.id.startsWith('sample-')}>
                        <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Share
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:text-red-600 ml-auto text-xs sm:text-sm p-1 sm:p-2" disabled={post.id.startsWith('sample-')}>
                        <Flag className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Report
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Post Dialog */}
      {editingPost && (
        <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {editingPost.post_type === 'wisdom' ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edit your wisdom..."
                  className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                />
              ) : (
                <>
                  <Input
                    value={editResourceTitle}
                    onChange={(e) => setEditResourceTitle(e.target.value)}
                    placeholder="Resource title"
                    className="text-sm sm:text-base"
                  />
                  <Select value={editResourceCategory} onValueChange={setEditResourceCategory}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="books">📚 Books & Study Materials</SelectItem>
                      <SelectItem value="stationery">✏️ Stationery & Supplies</SelectItem>
                      <SelectItem value="electronics">💻 Electronics & Gadgets</SelectItem>
                      <SelectItem value="courses">🎓 Online Courses & Subscriptions</SelectItem>
                      <SelectItem value="mentorship">👨‍🏫 Mentorship & Guidance</SelectItem>
                      <SelectItem value="scholarships">💰 Scholarships & Financial Aid</SelectItem>
                      <SelectItem value="internships">🏢 Internship Opportunities</SelectItem>
                      <SelectItem value="software">⚡ Software & Tools</SelectItem>
                      <SelectItem value="other">🎁 Other Resources</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={editResourceContact}
                    onChange={(e) => setEditResourceContact(e.target.value)}
                    placeholder="Contact information"
                    className="text-sm sm:text-base"
                  />
                </>
              )}
              <Button onClick={handleUpdatePost} className="w-full text-sm sm:text-base">
                Update Post
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}