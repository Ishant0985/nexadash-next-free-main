'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { ArrowLeft, Edit, Trash2, CalendarIcon, User, Tag, MapPin } from 'lucide-react';

interface Author {
  name: string;
  image: string;
  designation: string;
  uid?: string;
}

interface BlogData {
  id: string;
  title: string;
  slug: string;
  content: string;
  paragraph: string;
  image: string;
  publishDate: any;
  status: string;
  scheduledPublish: boolean;
  author: Author;
  tags: string[];
  locations: string[];
  createdBy: string;
  views: number;
  viewedBy: string[];
}

const PreviewBlogPage = () => {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;
  
  const [blog, setBlog] = useState<BlogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
      
      // If user is not authenticated, redirect to login
      if (!currentUser) {
        router.push('/login');
      } else {
        fetchBlogData();
      }
    });
    return () => unsubscribe();
  }, [blogId, router]);

  const fetchBlogData = async () => {
    if (!blogId) return;
    
    try {
      setLoading(true);
      const blogRef = doc(db, 'blogs', blogId);
      const blogSnap = await getDoc(blogRef);
      
      if (blogSnap.exists()) {
        const blogData = blogSnap.data();
        setBlog({
          id: blogId,
          ...blogData,
        } as BlogData);
      } else {
        toast.error('Blog post not found');
        router.push('/blog/list');
      }
    } catch (error) {
      console.error('Error fetching blog data:', error);
      toast.error('Failed to load blog data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBlog = () => {
    router.push(`/blog/edit/${blogId}`);
  };

  const handleDeleteBlog = () => {
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'blogs', blogId));
      toast.success('Blog deleted successfully');
      router.push('/blog/list');
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  // Format date helper
  const formatDate = (timestamp: any) => {
    try {
      if (!timestamp) return '';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'MMMM d, yyyy');
    } catch (e) {
      return '';
    }
  };

  if (isAuthChecking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <Skeleton className="h-10 w-10 rounded-full mr-2" />
          <Skeleton className="h-8 w-40" />
        </div>
        
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/4 mb-8" />
        
        <Skeleton className="h-64 w-full mb-8" />
        
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Blog post not found</h2>
        <p className="text-gray-500 mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
        <Link href="/blog/list">
          <Button>Back to Blog List</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/blog/list">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Blog Preview</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handleEditBlog}
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleDeleteBlog}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden">
        {/* Blog featured image */}
        {blog.image && (
          <div className="w-full h-72 md:h-96 overflow-hidden">
            <img 
              src={blog.image} 
              alt={blog.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <CardContent className="p-6 md:p-8">
          {/* Status badge */}
          {blog.status && blog.status !== 'published' && (
            <Badge variant="outline" className={`mb-4 ${
              blog.status === 'draft' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 
              blog.scheduledPublish ? 'bg-blue-50 text-blue-800 border-blue-200' : ''
            }`}>
              {blog.status === 'draft' ? 'Draft' : 
               blog.scheduledPublish ? 'Scheduled' : blog.status}
            </Badge>
          )}
          
          {/* Blog title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{blog.title}</h1>
          
          {/* Blog meta info (date and author) */}
          <div className="flex flex-wrap items-center text-sm text-gray-500 mb-6 gap-3">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDate(blog.publishDate)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{blog.author?.name || 'Unknown Author'}</span>
              {blog.author?.designation && (
                <span className="text-gray-400">({blog.author.designation})</span>
              )}
            </div>
          </div>
          
          {/* Blog description/summary */}
          {blog.paragraph && (
            <div className="mb-8">
              <p className="text-lg text-gray-700 italic border-l-4 border-gray-200 pl-4">
                {blog.paragraph}
              </p>
            </div>
          )}
          
          {/* Blog content */}
          <div 
            className="prose prose-slate max-w-none mb-8" 
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
          
          {/* Tags and locations */}
          <div className="pt-6 border-t border-gray-100 space-y-4">
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 mt-1 text-gray-400" />
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag, index) => (
                    <Badge key={index} variant="green">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {blog.locations && blog.locations.length > 0 && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-gray-400" />
                <div className="flex flex-wrap gap-2">
                  {blog.locations.map((location, index) => (
                    <Badge key={index} variant="outline">
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the blog "{blog.title}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PreviewBlogPage;