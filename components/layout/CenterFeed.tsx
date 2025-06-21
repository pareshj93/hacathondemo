'use client';

import { useState, useEffect } from 'react';
import { User, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Profile, Post, supabase, isSupabaseConnected, Like, Comment } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Heart, MessageCircle, Flag, Share2, CheckCircle, BookOpen, Gift, AlertCircle, Database, Phone, Mail, Lock, Edit, Trash2, Eye, EyeOff, Users, TrendingUp, ImagePlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CenterFeedProps {
  user: User | null;
  profile: Profile | null;
}

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
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Interaction states
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (!isSupabaseConnected) {
      setLoading(false);
      return;
    }

    if (!user || !user.email_confirmed_at) {
      setLoading(false);
      return;
    }

    fetchPosts();
    
    const subscription = supabase
      .channel('public-feed')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
          console.log('Change received!', payload);
          fetchPosts();
       })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchPosts = async () => {
    if (!isSupabaseConnected || !user || !user.email_confirmed_at) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(*),
          likes(*),
          comments(*, profiles(*))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async () => {
    if (!user || !profile) return;
    setSubmitting(true);

    let imageUrl: string | undefined = undefined;
    
    try {
        if (postImageFile) {
            const filePath = `${user.id}/${Date.now()}_${postImageFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('post-images')
                .upload(filePath, postImageFile);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('post-images')
                .getPublicUrl(filePath);
            imageUrl = publicUrl;
        }

        const postData = {
            user_id: user.id,
            post_type: composerType,
            content: composerType === 'wisdom' ? content.trim() : null,
            resource_title: composerType === 'donation' ? resourceTitle.trim() : null,
            resource_category: composerType === 'donation' ? resourceCategory : null,
            resource_contact: composerType === 'donation' ? resourceContact.trim() : null,
            image_url: imageUrl,
        };

        const { error } = await supabase.from('posts').insert(postData);
        if (error) throw error;

        // Reset form
        setContent('');
        setResourceTitle('');
        setResourceCategory('');
        setResourceContact('');
        setPostImageFile(null);
        toast.success('Post created successfully!');

    } catch (error: any) {
        toast.error(error.message || "Failed to create post.");
    } finally {
        setSubmitting(false);
    }
};


  const handleLikeToggle = async (post: Post) => {
    if (!user) return;
    
    const hasLiked = post.likes?.some(like => like.user_id === user.id);

    try {
      if (hasLiked) {
        // Unlike
        const { error } = await supabase.from('likes').delete().match({ post_id: post.id, user_id: user.id });
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
        if (error) throw error;
      }
    } catch (error: any) {
        toast.error(error.message || "Could not update like.");
    }
  };

  const handleAddComment = async (postId: string) => {
      if (!user || !newComment.trim()) return;
      try {
          const { error } = await supabase.from('comments').insert({
              post_id: postId,
              user_id: user.id,
              content: newComment.trim()
          });
          if (error) throw error;
          setNewComment('');
      } catch (error: any) {
          toast.error(error.message || "Failed to add comment.");
      }
  };
  
  const handleShare = (postId: string) => {
      const postUrl = `${window.location.origin}/?page=feed&post=${postId}`;
      if (navigator.share) {
          navigator.share({
              title: 'Check out this post on Edubridgepeople!',
              text: 'I found this interesting, thought you might too.',
              url: postUrl,
          });
      } else {
          navigator.clipboard.writeText(postUrl);
          toast.success('Post link copied to clipboard!');
      }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Composer */}
      {user && profile && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
             <Tabs value={composerType} onValueChange={(value) => setComposerType(value as 'wisdom' | 'donation')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="wisdom">Share Wisdom</TabsTrigger>
                    <TabsTrigger value="donation">Donate Resource</TabsTrigger>
                </TabsList>
                <TabsContent value="wisdom" className="space-y-4 pt-4">
                    <Textarea placeholder="Share your knowledge..." value={content} onChange={e => setContent(e.target.value)} />
                </TabsContent>
                <TabsContent value="donation" className="space-y-4 pt-4">
                    <Input placeholder="Resource title (e.g., 'Programming Books')" value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} />
                    <Select value={resourceCategory} onValueChange={setResourceCategory}>
                        <SelectTrigger><SelectValue placeholder="Select donation category" /></SelectTrigger>
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
                    <Input placeholder="Contact info (e.g., email, phone)" value={resourceContact} onChange={e => setResourceContact(e.target.value)} />
                </TabsContent>
             </Tabs>
             <div className="flex justify-between items-center pt-4">
                <Label htmlFor="post-image-upload" className="cursor-pointer text-blue-600 hover:text-blue-800">
                    <ImagePlus className="w-6 h-6" />
                    <Input id="post-image-upload" type="file" className="hidden" accept="image/*" onChange={e => setPostImageFile(e.target.files ? e.target.files[0] : null)} />
                </Label>
                {postImageFile && <span className="text-sm text-gray-500">{postImageFile.name}</span>}
                <Button onClick={handlePostSubmit} disabled={submitting}>
                    {submitting ? 'Posting...' : 'Post'}
                </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => {
            const hasLiked = user && post.likes?.some(like => like.user_id === user.id);
            return (
          <Card key={post.id}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start space-x-3">
                <Avatar>
                  <AvatarImage src={post.profiles?.avatar_url} />
                  <AvatarFallback>{post.profiles?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div>
                        <span className="font-semibold">{post.profiles?.username}</span>
                        <span className="text-sm text-gray-500 ml-2">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    </div>
                    {/* Edit/Delete can be added here */}
                  </div>
                  <p className="my-2">{post.content || post.resource_title}</p>
                  {post.image_url && <img src={post.image_url} alt="Post content" className="mt-2 rounded-lg max-h-96 w-full object-cover"/>}

                  {/* Like, Comment, Share buttons */}
                  <div className="flex items-center justify-between mt-4 text-gray-500">
                     <Button variant="ghost" size="sm" onClick={() => handleLikeToggle(post)}>
                         <Heart className={`w-5 h-5 mr-1 ${hasLiked ? 'text-red-500 fill-current' : ''}`} /> {post.likes?.length || 0}
                     </Button>
                     <Button variant="ghost" size="sm" onClick={() => toggleComments(post.id)}>
                         <MessageCircle className="w-5 h-5 mr-1" /> {post.comments?.length || 0}
                     </Button>
                     <Button variant="ghost" size="sm" onClick={() => handleShare(post.id)}>
                         <Share2 className="w-5 h-5 mr-1" /> Share
                     </Button>
                  </div>
                  
                  {/* Comment Section */}
                  {expandedComments[post.id] && (
                      <div className="mt-4 pt-4 border-t">
                          <div className="flex space-x-2">
                              <Input placeholder="Write a comment..." value={newComment} onChange={e => setNewComment(e.target.value)}/>
                              <Button onClick={() => handleAddComment(post.id)}>Post</Button>
                          </div>
                          <div className="mt-4 space-y-4">
                              {post.comments?.map(comment => (
                                  <div key={comment.id} className="flex items-start space-x-2">
                                      <Avatar className="w-8 h-8">
                                          <AvatarImage src={comment.profiles?.avatar_url} />
                                          <AvatarFallback>{comment.profiles?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      <div className="bg-gray-100 rounded-lg p-2 flex-1">
                                          <span className="font-semibold text-sm">{comment.profiles?.username}</span>
                                          <p className="text-sm">{comment.content}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                </div>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>
    </div>
  );
}
