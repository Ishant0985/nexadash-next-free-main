'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import PageHeading from '@/components/layout/page-heading'
import { format } from 'date-fns';
import { CalendarIcon, ArrowLeft, ImageIcon, InfoIcon } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
const AddBlogPage = () => {
  const router = useRouter();
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
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // Check if user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
      if (currentUser?.displayName) {
        setDisplayName(currentUser.displayName);
      }
      if (!currentUser) {
        router.push('/login'); // Redirect if not authenticated
      }
    });
    return () => unsubscribe();
  }, [router]);

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

  const handleSubmit = async (action: 'preview' | 'publish' | 'draft') => {
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

      // For publish or draft, do full validation
      if (!validateForm()) {
        setIsLoading(false);
        return;
      }

      if (!user) {
        toast.error('You must be logged in to publish a blog');
        router.push('/login');
        return;
      }

      // Determine publish date and time
      let finalPublishDate;
      if (publishType === 'automatic') {
        finalPublishDate = Timestamp.now();
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
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        views: 0, // Views counter field to be incremented on user click
      };

      // Add blog post to Firestore
      const docRef = await addDoc(collection(db, 'blogs'), blogData);
      console.log('Blog added with ID: ', docRef.id);

      if (action === 'publish') {
        if (publishType === 'setDate' && new Date(finalPublishDate.toDate()) > new Date()) {
          toast.success('Blog scheduled for publishing!');
        } else {
          toast.success('Blog published successfully!');
        }
        router.push('/blog/list');
      } else if (action === 'draft') {
        toast.success('Blog saved as draft!');
        router.push('/blog/list');
      }
    } catch (error) {
      console.error('Error adding blog: ', error);
      toast.error('Error adding blog. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

        <Card className="mb-6">
          <CardContent className="p-0">
            {imageUrl && (
              <div className="w-full h-64 relative">
                <img 
                  src={imageUrl} 
                  alt={title} 
                  className="w-full h-full object-cover rounded-t-lg" 
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
            <Button onClick={() => handleSubmit('publish')} disabled={isLoading}>
              {publishType === 'setDate' ? 'Schedule Blog' : 'Publish Blog'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
         <PageHeading heading={'Add New Blog'} />
      <div className="p-4 max-w-7xl mx-auto">
        
        <div className="flex items-center justify-end gap-2 mb-4">
          <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={isLoading}>
            Save as Draft
          </Button>
          <Button variant="outline" onClick={() => handleSubmit('preview')} disabled={isLoading}>
            Preview
          </Button>
          <Button onClick={() => handleSubmit('publish')} disabled={isLoading}>
            {isLoading
              ? 'Saving...'
              : publishType === 'setDate'
              ? 'Schedule Blog'
              : 'Publish Blog'}
          </Button>
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
            <Label htmlFor="title" className="text-base">
              Blog Title
            </Label>
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
            <Label htmlFor="description" className="text-base">
              Short Description
            </Label>
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
          <Label htmlFor="editor" className="text-base">
            Content
          </Label>
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
                    <RadioGroupItem value="automatic" id="automatic" />
                    <Label htmlFor="automatic">Publish immediately</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="setDate" id="setDate" />
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
                      <img
                        src={imageUrl}
                        alt="Featured"
                        className="w-full h-40 object-cover rounded-md"
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
        </div>
      </div>
    </div>
  );
};

export default AddBlogPage;