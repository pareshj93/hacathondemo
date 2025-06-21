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
import { toast } from 'sonner';
import { Heart, MessageCircle, Share2, CheckCircle, BookOpen, Gift, Lock, ImagePlus, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CenterFeedProps {
  user: User | null;
  profile: Profile | null;
}

export default function CenterFeed({ user, profile }: CenterFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerType, setComposerType] = useState<'wisdom' | 'donation'>('wisdom');
  
  // Form states
  const [content, setContent] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceCategory, setResourceCategory] = useState('');
  const [resourceContact, setResourceContact] = useState('');
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Interaction states
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isSupabaseConnected || !user || !user.email_confirmed_at) {
      setLoading(false);
      return;
    }

    fetchPosts();
    
    const subscription = supabase
      .channel('public-feed')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
          fetchPosts();
       })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const fetchPosts = async () => {
    if (!isSupabaseConnected || !user || !user.email_confirmed_at) {
      setLoading(false);
      return;
    }

    setLoading(true);
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
      toast.error("Could not fetch posts from the database.");
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
            const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, postImageFile);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(filePath);
            imageUrl = publicUrl;
        }

        const postData = {
            user_id: user.id, post_type: composerType,
            content: composerType === 'wisdom' ? content.trim() : null,
            resource_title: composerType === 'donation' ? resourceTitle.trim() : null,
            resource_category: composerType === 'donation' ? resourceCategory : null,
            resource_contact: composerType === 'donation' ? resourceContact.trim() : null,
            image_url: imageUrl,
        };

        const { error } = await supabase.from('posts').insert(postData);
        if (error) throw error;

        setContent(''); setResourceTitle(''); setResourceCategory(''); setResourceContact(''); setPostImageFile(null);
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
      if (hasLiked) await supabase.from('likes').delete().match({ post_id: post.id, user_id: user.id });
      else await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
    } catch (error: any) { toast.error(error.message || "Could not update like."); }
  };

  const handleAddComment = async (postId: string) => {
      const commentText = newComments[postId]?.trim();
      if (!user || !commentText) return;
      try {
          await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content: commentText });
          setNewComments(prev => ({ ...prev, [postId]: '' }));
      } catch (error: any) { toast.error(error.message || "Failed to add comment."); }
  };
  
  const handleShare = (postId: string) => {
      const postUrl = `${window.location.origin}/?page=feed&post=${postId}`;
      navigator.clipboard.writeText(postUrl);
      toast.success('Post link copied to clipboard!');
  };

  const toggleComments = (postId: string) => setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  const handleCommentChange = (postId: string, text: string) => setNewComments(prev => ({ ...prev, [postId]: text }));

  const canClaimResource = () => !!(user && profile?.role === 'student' && profile.verification_status === 'verified');
  const canSeeContactInfo = (post: Post) => canClaimResource();

  const handleClaimResource = (post: Post) => {
      if (!canClaimResource()) {
          toast.error('Only verified students can claim resources.');
          return;
      }
      toast.success(`Contact the donor: ${post.resource_contact}`);
  };
  
  const getUserBadges = (postProfile: Profile) => (
    <>
      <Badge variant="outline" className={`text-xs ${postProfile.role === 'donor' ? 'text-green-700 border-green-300 bg-green-50' : 'text-blue-700 border-blue-300 bg-blue-50'}`}>
          {postProfile.role === 'donor' ? <Heart className="w-3 h-3 mr-1" /> : <UserIcon className="w-3 h-3 mr-1" />}
          {postProfile.role === 'donor' ? 'Donor' : 'Student'}
      </Badge>
      {(postProfile.role === 'donor' || postProfile.verification_status === 'verified') && (
        <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
            <CheckCircle className="w-3 h-3 mr-1" /> Verified
        </Badge>
      )}
    </>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {user && profile && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
             <Tabs value={composerType} onValueChange={(value) => setComposerType(value as 'wisdom' | 'donation')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="wisdom">Share Wisdom</TabsTrigger>
                    <TabsTrigger value="donation">Donate Resource</TabsTrigger>
                </TabsList>
                <TabsContent value="wisdom" className="space-y-4 pt-4"><Textarea placeholder="Share your knowledge..." value={content} onChange={e => setContent(e.target.value)} /></TabsContent>
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
                <Label htmlFor="post-image-upload" className="cursor-pointer text-blue-600 hover:text-blue-800"><ImagePlus className="w-6 h-6" /><Input id="post-image-upload" type="file" className="hidden" accept="image/*" onChange={e => setPostImageFile(e.target.files ? e.target.files[0] : null)} /></Label>
                {postImageFile && <span className="text-sm text-gray-500 truncate max-w-xs">{postImageFile.name}</span>}
                <Button onClick={handlePostSubmit} disabled={submitting}>{submitting ? 'Posting...' : 'Post'}</Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {loading && <p className="text-center text-gray-500">Loading posts...</p>}
      
      {!loading && (
        <div className="space-y-4">
            {posts.map((post) => {
                const hasLiked = user && post.likes?.some(like => like.user_id === user.id);
                return (
                  <Card key={post.id}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start space-x-3">
                        <Avatar><AvatarImage src={post.profiles?.avatar_url} /><AvatarFallback>{post.profiles?.username?.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                                <span className="font-semibold">{post.profiles?.username}</span>
                                <div className="flex items-center space-x-2 mt-1">{post.profiles && getUserBadges(post.profiles)}</div>
                                <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                            </div>
                          </div>
                          <p className="my-2">{post.post_type === 'wisdom' ? post.content : post.resource_title}</p>
                          {post.image_url && <img src={post.image_url} alt="Post content" className="mt-2 rounded-lg max-h-96 w-full object-cover"/>}
                          {post.post_type === 'donation' && (
                            <div className="bg-blue-50 p-3 rounded-lg mt-2 space-y-2">
                              <div className="flex items-center text-sm"><Gift className="w-4 h-4 mr-2 text-blue-600" />Category: {post.resource_category}</div>
                              {canSeeContactInfo(post) ? (
                                <div className="flex items-center text-sm"><CheckCircle className="w-4 h-4 mr-2 text-green-600" />Contact: {post.resource_contact}</div>
                              ) : (
                                <div className="flex items-center text-sm text-gray-500"><Lock className="w-4 h-4 mr-2" />Contact hidden (Verified students only)</div>
                              )}
                              <Button size="sm" className="w-full mt-2" onClick={() => handleClaimResource(post)} disabled={!canClaimResource()}>Claim Resource</Button>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-4 text-gray-500">
                             <Button variant="ghost" size="sm" onClick={() => handleLikeToggle(post)}><Heart className={`w-5 h-5 mr-1 ${hasLiked ? 'text-red-500 fill-current' : ''}`} /> {post.likes?.length || 0}</Button>
                             <Button variant="ghost" size="sm" onClick={() => toggleComments(post.id)}><MessageCircle className="w-5 h-5 mr-1" /> {post.comments?.length || 0}</Button>
                             <Button variant="ghost" size="sm" onClick={() => handleShare(post.id)}><Share2 className="w-5 h-5 mr-1" /> Share</Button>
                          </div>
                          {expandedComments[post.id] && (
                              <div className="mt-4 pt-4 border-t">
                                  <div className="flex space-x-2"><Input placeholder="Write a comment..." value={newComments[post.id] || ''} onChange={e => handleCommentChange(post.id, e.target.value)}/><Button onClick={() => handleAddComment(post.id)}>Post</Button></div>
                                  <div className="mt-4 space-y-4">
                                      {post.comments?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(comment => (
                                          <div key={comment.id} className="flex items-start space-x-2">
                                              <Avatar className="w-8 h-8"><AvatarImage src={comment.profiles?.avatar_url} /><AvatarFallback>{comment.profiles?.username?.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                                              <div className="bg-gray-100 rounded-lg p-2 flex-1"><span className="font-semibold text-sm">{comment.profiles?.username}</span><p className="text-sm">{comment.content}</p></div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
            })}
        </div>
      )}
    </div>
  );
}
