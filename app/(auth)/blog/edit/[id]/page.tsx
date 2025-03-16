'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  Timestamp, 
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '@/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import toast from 'react-hot-toast';
import TiptapEditor from '@/components/TiptapEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, ArrowLeft, ImageIcon, InfoIcon, Loader2 } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import PageHeading from '@/components/layout/page-heading';
import Image from 'next/image';

const EditBlogPage = () => {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;

  // State variables
  const [title, setTitle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [labels, setLabels] = useState('');
  const [locations, setLocations] = useState('');
  const [publishType, setPublishType] = useState('automatic');
  const [publishDate, setPublishDate] = useState<Date | undefined>(new Date());
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [status, setStatus] = useState('published');
  const [createdAt, setCreatedAt] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // Check if user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
      if (!currentUser) {
        router.push('/login'); // Redirect if not authenticated
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch blog data
  useEffect(() => {
    const fetchBlogData = async () => {
      if (!blogId) return;
      
      try {
        setIsFetching(true);
        const blogRef = doc(db, 'blogs', blogId);
        const blogSnap = await getDoc(blogRef);
        
        if (blogSnap.exists()) {
          const blogData = blogSnap.data();
          setTitle(blogData.title || '');
          setDescription(blogData.paragraph || '');
          setBlogContent(blogData.content || '');
          setImageUrl(blogData.image || '');
          setDisplayName(blogData.author?.name || '');
          setLabels(blogData.tags?.join(', ') || '');
          setLocations(blogData.locations?.join(', ') || '');
          setStatus(blogData.status || 'published');
          setCreatedAt(blogData.createdAt || null);
          
          // Set publish type and date
          if (blogData.scheduledPublish) {
            setPublishType('setDate');
            if (blogData.publishDate) {
              setPublishDate(blogData.publishDate.toDate());
            }
          } else {
            setPublishType('automatic');
          }
        } else {
          toast.error('Blog post not found');
          router.push('/blog/list');
        }
      } catch (error) {
        console.error('Error fetching blog data:', error);
        toast.error('Failed to load blog data');
      } finally {
        setIsFetching(false);
      }
    };

    if (!isAuthChecking && user) {
      fetchBlogData();
    }
  }, [blogId, isAuthChecking, user, router]);

  // Create a URL-friendly slug from the title
  const createSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  // Handle image selection - convert to base64
  const handleImageSelection = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    // Check required fields
    if (!title) {
      toast.error('Please add a title for your blog');
      return false;
    }
    if (!displayName) {
      toast.error('Please add your display name');
      return false;
    }
    if (!description) {
      toast.error('Please add a short description for your blog');
      return false;
    }
    if (!blogContent || blogContent === '<p></p>') {
      toast.error('Please add content to your blog');
      return false;
    }
    return true;
  };

  const handleSubmit = async (action: 'preview' | 'update' | 'draft') => {
    try {
      setIsLoading(true);

      // For preview, just do a basic validation
      if (action === 'preview') {
        if (!validateForm()) {
          setIsLoading(false);
          return;
        }
        setPreviewMode(true);
        setIsLoading(false);
        return;
      }

      // For update or draft, do full validation
      if (!validateForm()) {
        setIsLoading(false);
        return;
      }

      if (!user) {
        toast.error('You must be logged in to update a blog');
        router.push('/login');
        return;
      }

      // Determine publish date and time
      let finalPublishDate;
      if (publishType === 'automatic') {
        finalPublishDate = createdAt || Timestamp.now();
      } else if (publishDate) {
        finalPublishDate = Timestamp.fromDate(publishDate);
      } else {
        toast.error('Please select a publish date');
        setIsLoading(false);
        return;
      }

      // Prepare blog data following the Firebase structure
      const slug = createSlug(title);
      const blogData = {
        title,
        slug,
        content: blogContent,
        paragraph: description,
        image: imageUrl,
        publishDate: finalPublishDate,
        status:
          action === 'draft'
            ? 'draft'
            : publishType === 'setDate' && new Date(finalPublishDate.toDate()) > new Date()
            ? 'scheduled'
            : 'published',
        scheduledPublish:
          publishType === 'setDate' && new Date(finalPublishDate.toDate()) > new Date(),
        author: {
          name: displayName,
          image: '',
          designation: 'Professional Services',
          uid: user.uid,
        },
        tags: labels.split(',').map((tag) => tag.trim()).filter(Boolean),
        locations: locations.split(',').map((location) => location.trim()).filter(Boolean),
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      };

      // Update blog post in Firestore
      const blogRef = doc(db, 'blogs', blogId);
      await updateDoc(blogRef, blogData);

      if (action === 'update') {
        if (publishType === 'setDate' && new Date(finalPublishDate.toDate()) > new Date()) {
          toast.success('Blog scheduled for publishing!');
        } else {
          toast.success('Blog updated successfully!');
        }
        router.push('/blog/list');
      } else if (action === 'draft') {
        toast.success('Blog saved as draft!');
        router.push('/blog/list');
      }
    } catch (error) {
      console.error('Error updating blog: ', error);
      toast.error('Error updating blog. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishStatusChange = async (newStatus: string) => {
    try {
      setIsLoading(true);
      
      const blogRef = doc(db, 'blogs', blogId);
      await updateDoc(blogRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      
      toast.success(`Blog ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`);
      router.push('/blog/list');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
    }
  };

  // Loading states
  if (isAuthChecking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
        <p className="text-gray-500">Loading blog post...</p>
      </div>
    );
  }

  // Blog preview component
  if (previewMode) {
    return (
      <div className="p-4 max-w-5xl mx-auto">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={() => setPreviewMode(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Blog Preview</h1>
        </div>

        <Card className="shadow-lg rounded-lg mb-6">
          <CardContent className="p-0">
            {imageUrl && (
              <div className="w-full h-64 relative">
                <Image 
                  src={imageUrl} 
                  alt={title} 
                  className="w-full h-full object-cover rounded-t-lg"
                  fill
                  sizes="100vw"
                />
              </div>
            )}
            <div className="p-6">
              <h1 className="text-3xl font-bold mb-2">{title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <span>{displayName}</span>
                <span>•</span>
                <span>{format(new Date(), 'MMMM d, yyyy')}</span>
                {labels && (
                  <>
                    <span>•</span>
                    <span>{labels.split(',').map(tag => tag.trim()).join(', ')}</span>
                  </>
                )}
              </div>
              <p className="text-lg mb-6 text-gray-700">{description}</p>
              <div 
                className="prose prose-slate max-w-none" 
                dangerouslySetInnerHTML={{ __html: blogContent }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setPreviewMode(false)}>
            Back to Editor
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={isLoading}>
              Save as Draft
            </Button>
            <Button onClick={() => handleSubmit('update')} disabled={isLoading}>
              {publishType === 'setDate' ? 'Schedule Blog' : 'Update Blog'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <PageHeading heading={'Edit Blog Post'} />
      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link href="/blog/list" className="mr-2">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="flex space-x-2">
            {status === 'published' ? (
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(true)}
                disabled={isLoading}
                className="border-amber-500 text-amber-600 hover:bg-amber-50"
              >
                Unpublish
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => handlePublishStatusChange('published')}
                disabled={isLoading}
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                Publish Now
              </Button>
            )}
            <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={isLoading}>
              Save as Draft
            </Button>
            <Button variant="outline" onClick={() => handleSubmit('preview')} disabled={isLoading}>
              Preview
            </Button>
            <Button onClick={() => handleSubmit('update')} disabled={isLoading}>
              {isLoading
                ? 'Saving...'
                : publishType === 'setDate'
                ? 'Schedule Blog'
                : 'Update Blog'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-lg m-6 rounded-lg">
            <CardHeader className="pb-3">
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="title" className="text-base">Blog Title</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Choose a clear, descriptive title</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="title"
                  placeholder="Enter blog title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="description" className="text-base">Short Description</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Write a brief summary of your blog (1-2 sentences)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  id="description"
                  placeholder="Enter a short description (will appear as a preview)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editor" className="text-base">Content</Label>
                <div className="border rounded-md overflow-hidden">
                  <TiptapEditor
                    onChange={setBlogContent}
                    content={blogContent}
                    className="min-h-96"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className='space-y-4 p-3 px-2'>Publishing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="author" className="text-base">Author Name</Label>
                <Input
                  id="author"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base">Publish Options</Label>
                <RadioGroup 
                  value={publishType} 
                  onValueChange={setPublishType}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="automatic" id="automatic" variant="default" color="primary" />
                    <Label htmlFor="automatic">Publish immediately</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="setDate" id="setDate" variant="default" color="primary" />
                    <Label htmlFor="setDate">Schedule for later</Label>
                  </div>
                </RadioGroup>

                {publishType === 'setDate' && (
                  <div className="mt-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {publishDate ? format(publishDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={publishDate}
                          onSelect={setPublishDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label htmlFor="featured-image" className="text-base">Featured Image</Label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-4 hover:bg-gray-50 transition cursor-pointer">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageSelection(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  
                  {imageUrl ? (
                    <div className="relative w-full">
                      <Image
                        src={imageUrl}
                        alt="Featured"
                        className="w-full h-40 object-cover rounded-md"
                        width={400}
                        height={160}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => imageInputRef.current?.click()}
                        >
                          Change Image
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full h-40 flex flex-col items-center justify-center text-gray-500"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <ImageIcon className="h-10 w-10 mb-2" />
                      <p>Click to upload a featured image</p>
                      <p className="text-xs text-gray-400">
                        Recommended size: 1200 x 630px
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label htmlFor="labels" className="text-base">Tags</Label>
                <Input
                  id="labels"
                  placeholder="Enter tags (comma separated)"
                  value={labels}
                  onChange={(e) => setLabels(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Example: technology, innovation, web development
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locations" className="text-base">Locations</Label>
                <Input
                  id="locations"
                  placeholder="Enter locations (comma separated)"
                  value={locations}
                  onChange={(e) => setLocations(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Example: New York, London, Remote
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className='space-y-4 p-3 px-2'>Blog Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${
                  status === 'published' ? 'bg-green-500' : 
                  status === 'scheduled' ? 'bg-blue-500' : 
                  'bg-amber-500'
                }`}></div>
                <span className="capitalize">{status}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish Blog Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the blog post from public view and set its status to draft.
              You can republish it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handlePublishStatusChange('draft')}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Unpublish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditBlogPage;
