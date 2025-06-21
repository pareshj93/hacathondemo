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
import { Heart, MessageCircle, Share2, CheckCircle, BookOpen, Gift, Lock, ImagePlus, User as UserIcon, Link2, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface CenterFeedProps {
  user: User | null;
  profile: Profile | null;
}

// Simple URL regex to find the first link in a body of text
const URL_REGEX = /https?:\/\/[^\s/$.?#].[^\s]*/i;

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
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);


  const fetchPosts = async () => {
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

  useEffect(() => {
    // This effect now depends on `user?.id`. It will run once on mount,
    // and then re-run if the user logs in or out.
    if (!isSupabaseConnected || !user?.id) {
        setPosts([]); // Clear posts if user logs out
        setLoading(false);
        return;
    }

    fetchPosts();
    
    // Set up a more robust real-time subscription.
    const subscription = supabase
      .channel('public-feed-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        // On any change, simply refetch the entire list.
        // This is simpler and more reliable than trying to patch the state.
        fetchPosts();
      })
      .subscribe();

    // Cleanup: remove the subscription when the component unmounts or the user changes.
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id]); // The key change: dependency on user.id

  const handlePostSubmit = async () => {
    if (!user || !profile) return;
    setSubmitting(true);
    let imageUrl: string | undefined = undefined;

    const foundUrl = content.match(URL_REGEX);
    const linkUrl = foundUrl ? foundUrl[0] : undefined;
    
    try {
        if (postImageFile) {
            const filePath = `${user.id}/${Date.now()}_${postImageFile.name}`;
            const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, postImageFile);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(filePath);
            imageUrl = publicUrl;
        }

        const postData: Partial<Post> = {
            user_id: user.id, 
            post_type: composerType,
            content: composerType === 'wisdom' ? content.trim() : undefined,
            resource_title: composerType === 'donation' ? resourceTitle.trim() : undefined,
            resource_category: composerType === 'donation' ? resourceCategory : undefined,
            resource_contact: composerType === 'donation' ? resourceContact.trim() : undefined,
            image_url: imageUrl,
            link_url: linkUrl,
        };
        
        // Use .select().single() to get the newly created post back from the DB
        const { data: newPost, error } = await supabase.from('posts').insert(postData).select().single();

        if (error) throw error;

        // Optimistic UI Update: Add the new post with profile data to the top of the feed
        if(newPost) {
            const postWithProfile: Post = {
                ...newPost,
                profiles: profile,
                likes: [],
                comments: []
            };
            setPosts(prevPosts => [postWithProfile, ...prevPosts]);
        }

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
    const originalLikes = post.likes || [];
    
    const newLikes = hasLiked
      ? originalLikes.filter(like => like.user_id !== user.id)
      : [...originalLikes, { id: -1, post_id: post.id, user_id: user.id, created_at: new Date().toISOString() }];

    setPosts(prevPosts => prevPosts.map(p => p.id === post.id ? { ...p, likes: newLikes } : p));

    try {
      if (hasLiked) {
        await supabase.from('likes').delete().match({ post_id: post.id, user_id: user.id });
      } else {
        await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
      }
    } catch (error: any) { 
      setPosts(prevPosts => prevPosts.map(p => p.id === post.id ? { ...p, likes: originalLikes } : p));
      toast.error(error.message || "Could not update like."); 
    }
  };

  const handleAddComment = async (postId: string) => {
      const commentText = newComments[postId]?.trim();
      if (!user || !commentText || !profile) return;
      const tempCommentId = Date.now();
      const newComment: Comment = {
        id: tempCommentId,
        post_id: postId,
        user_id: user.id,
        content: commentText,
        created_at: new Date().toISOString(),
        profiles: profile,
      };

      setPosts(prevPosts => prevPosts.map(p => 
        p.id === postId ? { ...p, comments: [...(p.comments || []), newComment] } : p
      ));
      setNewComments(prev => ({ ...prev, [postId]: '' }));

      try {
        const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content: commentText });
        if (error) throw error;
        fetchPosts(); // Refetch to get the real comment ID
      } catch (error: any) { 
        setPosts(prevPosts => prevPosts.map(p => 
            p.id === postId ? { ...p, comments: p.comments?.filter(c => c.id !== tempCommentId) } : p
        ));
        toast.error(error.message || "Failed to add comment."); 
      }
  };
  
  const handleShare = (postId: string) => {
      const postUrl = `${window.location.origin}/?page=feed&post=${postId}`;
      navigator.clipboard.writeText(postUrl);
      toast.success('Post link copied to clipboard!');
  };

  const handleDeletePost = async () => {
    if (!postToDelete || !user) return;
    const originalPosts = posts;
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postToDelete.id));
    setPostToDelete(null);

    try {
      const { error } = await supabase.from('posts').delete().match({ id: postToDelete.id, user_id: user.id });
      if (error) throw error;
      toast.success('Post deleted.');
    } catch (error: any) {
      setPosts(originalPosts);
      toast.error(error.message || 'Failed to delete post.');
    }
  };

  const handleEditClick = (post: Post) => {
    setEditingPost(post);
    setEditedContent(post.content || '');
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditedContent('');
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !user) return;
    const foundUrl = editedContent.match(URL_REGEX);
    const linkUrl = foundUrl ? foundUrl[0] : null;

    try {
      const { error } = await supabase
        .from('posts')
        .update({ content: editedContent, link_url: linkUrl })
        .match({ id: editingPost.id, user_id: user.id });
      if (error) throw error;
      toast.success('Post updated.');
      handleCancelEdit();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update post.');
    }
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
                <TabsContent value="wisdom" className="space-y-4 pt-4"><Textarea placeholder="Share your knowledge or a helpful link..." value={content} onChange={e => setContent(e.target.value)} /></TabsContent>
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
                // Extract domain for display in the link preview
                const domain = post.link_url ? new URL(post.link_url).hostname.replace('www.', '') : '';
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
                            {user?.id === post.user_id && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditClick(post)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            <span>Edit</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setPostToDelete(post)} className="text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Delete</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                          </div>
                          
                          {/* Post Content */}
                          {editingPost?.id === post.id ? (
                            <div className="my-2">
                                <Textarea 
                                    value={editedContent} 
                                    onChange={(e) => setEditedContent(e.target.value)} 
                                    className="mb-2"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                                    <Button size="sm" onClick={handleUpdatePost}>Save</Button>
                                </div>
                            </div>
                          ) : (
                             <>
                              {post.content && <p className="my-2 whitespace-pre-wrap">{post.content}</p>}
                              {post.resource_title && <p className="my-2">{post.resource_title}</p>}
                             </>
                          )}


                          {/* Link Preview Card */}
                          {post.link_url && !editingPost && (
                            <a href={post.link_url} target="_blank" rel="noopener noreferrer" className="block mt-2 border rounded-lg hover:bg-gray-50 transition-colors overflow-hidden">
                              {post.link_image && <img src={post.link_image} alt={post.link_title || 'Link preview'} className="rounded-t-lg w-full max-h-64 object-cover" />}
                              <div className="p-3">
                                <div className="text-xs text-gray-500 uppercase flex items-center"><Link2 className="w-3 h-3 mr-1" />{domain}</div>
                                <h4 className="font-semibold text-gray-800 mt-1">{post.link_title || post.link_url}</h4>
                                {post.link_description && <p className="text-sm text-gray-600 line-clamp-2 mt-1">{post.link_description}</p>}
                              </div>
                            </a>
                          )}
                          
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

      <AlertDialog open={postToDelete !== null} onOpenChange={() => setPostToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your post from our servers.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPostToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePost} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
