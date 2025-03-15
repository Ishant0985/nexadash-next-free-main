'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, orderBy, doc, getDoc, updateDoc, deleteDoc, increment, arrayUnion } from 'firebase/firestore';
import { auth, db } from '@/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
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
import PageHeading from '@/components/layout/page-heading'
import { Eye, Users, Clock, MoreVertical, Edit, Trash2 } from "lucide-react";

interface Author {
  name: string;
  image: string;
  designation: string;
  uid?: string;
}

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  paragraph: string;
  image: string;
  publishDate: any;
  status?: string;
  scheduledPublish?: boolean;
  author: Author;
  tags: string[];
  locations?: string[];
  createdBy?: string;
  views?: number;
  viewedBy?: string[];
}

const BlogListPage = () => {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);

      // If user is not authenticated, redirect to login
      if (!currentUser) {
        router.push('/login');
      } else {
        fetchBlogs();
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchBlogs = async () => {
    try {
      const q = query(collection(db, 'blogs'), orderBy('publishDate', 'desc'));
      const querySnapshot = await getDocs(q);

      const fetchedBlogs: Blog[] = [];
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        fetchedBlogs.push({
          id: doc.id,
          views: docData.views || 0, // Use existing value or default to 0
          viewedBy: docData.viewedBy || [], // Use existing value or default to empty array
          ...docData,
        } as Blog);
      });

      setBlogs(fetchedBlogs);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Error loading blogs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to format Firestore timestamp to readable date
  const formatDate = (timestamp: any) => {
    try {
      const date = timestamp?.toDate();
      if (!date) return '';
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch (e) {
      return '';
    }
  };

  // Function to calculate read time (assumes 200 words per minute)
  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  // Handle blog click and increment view
  const handleBlogClick = async (blog: Blog) => {
    if (!user) return;

    try {
      const blogRef = doc(db, 'blogs', blog.id);
      const blogDoc = await getDoc(blogRef);

      if (blogDoc.exists()) {
        const blogData = blogDoc.data();
        const viewedBy = blogData.viewedBy || [];

        // Check if current user has already viewed this blog
        if (!viewedBy.includes(user.uid)) {
          // Increment view count and add user to viewedBy array
          await updateDoc(blogRef, {
            views: increment(1),
            viewedBy: arrayUnion(user.uid)
          });

          // Update local state
          setBlogs(prevBlogs =>
            prevBlogs.map(b =>
              b.id === blog.id
                ? {
                  ...b,
                  views: (b.views || 0) + 1,
                  viewedBy: [...(b.viewedBy || []), user.uid]
                }
                : b
            )
          );
        }
      }

      // Navigate to preview page
      router.push(`/blog/preview/${blog.id}`);
    } catch (error) { 
      console.error('Error updating view count:', error);
      // Still navigate even if view count update fails
      router.push(`/blog/preview/${blog.id}`);
    }
  };

  // Handle edit blog navigation
  const handleEditBlog = (blog: Blog, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    router.push(`/blog/edit/${blog.id}`);
  };

  // Handle delete blog
  const handleDeleteBlog = (blog: Blog, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setBlogToDelete(blog);
    setShowDeleteDialog(true);
  };

  // Confirm and execute delete
  const confirmDelete = async () => {
    if (!blogToDelete) return;

    try {
      await deleteDoc(doc(db, 'blogs', blogToDelete.id));

      // Update local state
      setBlogs(blogs.filter(blog => blog.id !== blogToDelete.id));
      toast.success('Blog deleted successfully');
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog');
    } finally {
      setShowDeleteDialog(false);
      setBlogToDelete(null);
    }
  };

  // Filter blogs based on selected tab
  const filteredBlogs =
    activeTab === 'all'
      ? blogs
      : blogs.filter(
        (blog) =>
          blog.status === activeTab ||
          (activeTab === 'published' && !blog.status) || // For backward compatibility
          (activeTab === 'scheduled' && blog.scheduledPublish)
      );

  if (isAuthChecking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
      <PageHeading heading={'Blog Management'} />

      <div className="min-h-[calc(100vh_-_160px)] w-full rounded-lg">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex justify-between items-center mb-5 overflow-x-auto rounded-lg bg-white shadow-sm">
            <div className="inline-flex gap-2.5 px-5 py-[11px] text-sm/[18px] font-semibold">
              <TabsTrigger
                value="all"
                className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="published"
                className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white"
              >
                Published
              </TabsTrigger>
              <TabsTrigger
                value="scheduled"
                className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white"
              >
                Scheduled
              </TabsTrigger>
              <TabsTrigger
                value="draft"
                className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white"
              >
                Drafts
              </TabsTrigger>
            </div>
            <div className="inline-flex text-sm/[18px] font-semibold">
              <Link href="/blog/add">
                <Button>
                  Add New Blog
                </Button>
              </Link>
            </div>
          </TabsList>

          <TabsContent value={activeTab} className="font-medium text-black">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-5">
                      <Skeleton className="h-4 w-1/3 mb-3" />
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium text-gray-700">No blogs found</h3>
                <p className="text-gray-500 mt-2">
                  {activeTab === 'all'
                    ? 'Start creating your first blog by clicking the Add New Blog button.'
                    : `No ${activeTab} blogs found. Change the filter or add a new blog.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBlogs.map((blog) => (
                  <Card key={blog.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleBlogClick(blog)}>
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={blog.image || 'https://via.placeholder.com/400x200?text=No+Image'}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        {(blog.status === 'scheduled' || blog.scheduledPublish) && (
                          <Badge variant="orange" className="mr-1">
                            Scheduled
                          </Badge>
                        )}
                        {blog.status === 'draft' && (
                          <Badge variant="grey" className="mr-1">
                            Draft
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-white bg-opacity-80 hover:bg-opacity-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleEditBlog(blog, e)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteBlog(blog, e)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <CardContent className="p-5">
                      <div className="mb-3 flex justify-between items-center">
                        <div>
                          {blog.tags && blog.tags.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {blog.tags[0]}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(blog.publishDate)}
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold mb-2 line-clamp-2">{blog.title}</h3>

                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {blog.paragraph || 'No description provided.'}
                      </p>

                      <div className="flex justify-between items-center text-muted-foreground text-sm">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{blog.views?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{blog.content ? calculateReadTime(blog.content) : '1 min read'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the blog "{blogToDelete?.title}".
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

export default BlogListPage;