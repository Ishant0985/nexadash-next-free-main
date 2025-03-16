'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Star } from "lucide-react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseClient';
import { toast } from "react-hot-toast";
import Image from 'next/image';
import { Switch } from "@/components/ui/switch";

// Define interfaces for data types
interface VideoSection {
  id?: string;
  url: string;
  title: string;
  description: string;
  thumbnail: string;
}

interface FeatureTab {
  id?: string;
  title: string;
  description: string;
}

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface Testimonial {
  id: string;
  title: string;
  description: string;
  rating: number;
  icon: string;
}

interface HeroSection {
  id?: string;
  title: string;
  description: string;
  button1Url: string;
  button2Url: string;
  button1Text: string;
  button2Text: string;
}

export default function LandingCustomization() {
  const [activeTab, setActiveTab] = useState('video');
  const [video, setVideo] = useState<VideoSection>({ url: '', title: '', description: '', thumbnail: '' });
  const [features, setFeatures] = useState<Feature[]>([]);
  const [featureTab, setFeatureTab] = useState<FeatureTab>({ title: '', description: '' });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [hero, setHero] = useState<HeroSection>({
    title: '',
    description: '',
    button1Url: '',
    button2Url: '',
    button1Text: '',
    button2Text: ''
  });

  // Fetch data functions
  const fetchData = async () => {
    try {
      // Fetch video
      const videoSnapshot = await getDocs(collection(db, 'landingVideo'));
      if (!videoSnapshot.empty) {
        setVideo({ id: videoSnapshot.docs[0].id, ...videoSnapshot.docs[0].data() as Omit<VideoSection, 'id'> });
      }

      // Fetch features
      const featuresSnapshot = await getDocs(collection(db, 'features'));
      setFeatures(featuresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feature)));

      // Fetch feature tab
      const featureTabSnapshot = await getDocs(collection(db, 'featureTab'));
      if (!featureTabSnapshot.empty) {
        setFeatureTab({ id: featureTabSnapshot.docs[0].id, ...featureTabSnapshot.docs[0].data() as Omit<FeatureTab, 'id'> });
      }

      // Fetch testimonials
      const testimonialsSnapshot = await getDocs(collection(db, 'testimonials'));
      setTestimonials(testimonialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial)));

      // Fetch hero
      const heroSnapshot = await getDocs(collection(db, 'hero'));
      if (!heroSnapshot.empty) {
        setHero({ id: heroSnapshot.docs[0].id, ...heroSnapshot.docs[0].data() as Omit<HeroSection, 'id'> });
      }
    } catch (error) {
      toast.error("Failed to fetch data");
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setState: (callback: (prev: any) => any) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setState((prev: any) => ({ ...prev, icon: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle video thumbnail upload
  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideo(prev => ({ ...prev, thumbnail: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Video section handlers
  const handleVideoSubmit = async () => {
    try {
      if (video.id) {
        const { id, ...videoData } = video;
        await updateDoc(doc(db, 'landingVideo', id), videoData);
      } else {
        await addDoc(collection(db, 'landingVideo'), video);
      }
      toast.success("Video section updated successfully");
    } catch (error) {
      toast.error("Failed to update video section");
    }
  };

  // Feature tab handlers
  const handleFeatureTabSubmit = async () => {
    try {
      if (featureTab.id) {
        const { id, ...featureTabData } = featureTab;
        await updateDoc(doc(db, 'featureTab', id), featureTabData);
      } else {
        await addDoc(collection(db, 'featureTab'), featureTab);
      }
      toast.success("Feature tab updated successfully");
    } catch (error) {
      toast.error("Failed to update feature tab");
    }
  };

  // Feature handlers
  const handleAddFeature = async () => {
    try {
      if (features.length >= 6) {
        toast.error("Maximum 6 features allowed");
        return;
      }
      await addDoc(collection(db, 'features'), {
        title: '',
        description: '',
        icon: ''
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to add feature");
    }
  };

  const handleUpdateFeature = async (id: string, data: Partial<Feature>) => {
    try {
      await updateDoc(doc(db, 'features', id), data);
      fetchData();
      toast.success("Feature updated successfully");
    } catch (error) {
      toast.error("Failed to update feature");
    }
  };

  const handleDeleteFeature = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'features', id));
      fetchData();
      toast.success("Feature deleted successfully");
    } catch (error) {
      toast.error("Failed to delete feature");
    }
  };

  // Testimonial handlers
  const handleAddTestimonial = async () => {
    try {
      await addDoc(collection(db, 'testimonials'), {
        title: '',
        description: '',
        rating: 5,
        icon: ''
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to add testimonial");
    }
  };

  const handleUpdateTestimonial = async (id: string, data: Partial<Testimonial>) => {
    try {
      await updateDoc(doc(db, 'testimonials', id), data);
      fetchData();
      toast.success("Testimonial updated successfully");
    } catch (error) {
      toast.error("Failed to update testimonial");
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'testimonials', id));
      fetchData();
      toast.success("Testimonial deleted successfully");
    } catch (error) {
      toast.error("Failed to delete testimonial");
    }
  };

  // Hero section handlers
  const handleHeroSubmit = async () => {
    try {
      if (hero.id) {
        const { id, ...heroData } = hero;
        await updateDoc(doc(db, 'hero', id), heroData);
      } else {
        await addDoc(collection(db, 'hero'), hero);
      }
      toast.success("Hero section updated successfully");
    } catch (error) {
      toast.error("Failed to update hero section");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="video" className="w-full">
        <TabsList className="flex justify-between items-center mb-5 overflow-x-auto rounded-lg bg-white shadow-sm">
          <div className="inline-flex gap-2.5 px-5 py-[11px] text-sm/[18px] font-semibold">

            <TabsTrigger value="video" className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white">Video Section</TabsTrigger>
            <TabsTrigger value="features" className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white">Features</TabsTrigger>
            <TabsTrigger value="testimonials" className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white">Testimonials</TabsTrigger>
            <TabsTrigger value="hero" className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white">Hero Section</TabsTrigger>
          </div>
        </TabsList>

        {/* Video Section */}
        <TabsContent value="video" className="font-medium text-black">
          <Card className="shadow-none">
            <CardHeader className="p-5">
              <CardTitle>Video Section Customization</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-4">
                <Input
                  placeholder="Video URL"
                  value={video.url}
                  onChange={(e) => setVideo({ ...video, url: e.target.value })}
                />
                <Input
                  placeholder="Video Title"
                  value={video.title}
                  onChange={(e) => setVideo({ ...video, title: e.target.value })}
                />
                <Textarea
                  placeholder="Video Description"
                  value={video.description}
                  onChange={(e) => setVideo({ ...video, description: e.target.value })}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Video Thumbnail</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                  />
                  {video.thumbnail && (
                    <div className="mt-2">
                      <Image
                        src={video.thumbnail}
                        alt="Video thumbnail"
                        width={200}
                        height={112}
                        className="rounded"
                      />
                    </div>
                  )}
                </div>
                <Button onClick={handleVideoSubmit}>Save Video Section</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Section */}
        <TabsContent value="features" className="font-medium text-black">
          <Card className="shadow-none">
            <CardHeader className="p-5">
              <CardTitle>Features Section Customization</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-6">
                {/* Feature Tab */}
                <div className="border p-4 rounded-lg">
                  <h3 className="font-semibold mb-4">Feature Tab</h3>
                  <div className="space-y-4">
                    <Input
                      placeholder="Feature Tab Title"
                      value={featureTab.title}
                      onChange={(e) => setFeatureTab({ ...featureTab, title: e.target.value })}
                    />
                    <Textarea
                      placeholder="Feature Tab Description"
                      value={featureTab.description}
                      onChange={(e) => setFeatureTab({ ...featureTab, description: e.target.value })}
                    />
                    <Button onClick={handleFeatureTabSubmit}>Save Feature Tab</Button>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Features</h3>
                    <Button onClick={handleAddFeature} disabled={features.length >= 6}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Feature
                    </Button>
                  </div>
                  {features.map((feature) => (
                    <div key={feature.id} className="border p-4 rounded-lg">
                      <div className="space-y-4">
                        <Input
                          placeholder="Feature Title"
                          value={feature.title}
                          onChange={(e) => handleUpdateFeature(feature.id, { ...feature, title: e.target.value })}
                        />
                        <Textarea
                          placeholder="Feature Description"
                          value={feature.description}
                          onChange={(e) => handleUpdateFeature(feature.id, { ...feature, description: e.target.value })}
                        />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const icon = reader.result as string;
                                handleUpdateFeature(feature.id, { ...feature, icon });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {feature.icon && (
                          <div className="mt-2">
                            <Image
                              src={feature.icon}
                              alt={feature.title}
                              width={50}
                              height={50}
                              className="rounded"
                            />
                          </div>
                        )}
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteFeature(feature.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Feature
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testimonials Section */}
        <TabsContent value="testimonials" className="font-medium text-black">
          <Card className="shadow-none">
            <CardHeader className="p-5">
              <CardTitle>Testimonials Section Customization</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-4">
                <Button onClick={handleAddTestimonial}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Testimonial
                </Button>
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="border p-4 rounded-lg">
                    <div className="space-y-4">
                      <Input
                        placeholder="Testimonial Title"
                        value={testimonial.title}
                        onChange={(e) => handleUpdateTestimonial(testimonial.id, { ...testimonial, title: e.target.value })}
                      />
                      <Textarea
                        placeholder="Testimonial Description"
                        value={testimonial.description}
                        onChange={(e) => handleUpdateTestimonial(testimonial.id, { ...testimonial, description: e.target.value })}
                      />
                      <div className="flex items-center space-x-2">
                        <span>Rating:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 cursor-pointer ${star <= testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            onClick={() => handleUpdateTestimonial(testimonial.id, { ...testimonial, rating: star })}
                          />
                        ))}
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const icon = reader.result as string;
                              handleUpdateTestimonial(testimonial.id, { ...testimonial, icon });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {testimonial.icon && (
                        <div className="mt-2">
                          <Image
                            src={testimonial.icon}
                            alt={testimonial.title}
                            width={50}
                            height={50}
                            className="rounded"
                          />
                        </div>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteTestimonial(testimonial.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Testimonial
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hero Section */}
        <TabsContent value="hero" className="font-medium text-black" >
          <Card className="shadow-none">
            <CardHeader className="p-5">
              <CardTitle>Hero Section Customization</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-4">
                <Input
                  placeholder="Hero Title"
                  value={hero.title}
                  onChange={(e) => setHero({ ...hero, title: e.target.value })}
                />
                <Textarea
                  placeholder="Hero Description"
                  value={hero.description}
                  onChange={(e) => setHero({ ...hero, description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="Button 1 Text"
                      value={hero.button1Text}
                      onChange={(e) => setHero({ ...hero, button1Text: e.target.value })}
                    />
                    <Input
                      placeholder="Button 1 URL"
                      value={hero.button1Url}
                      onChange={(e) => setHero({ ...hero, button1Url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Button 2 Text"
                      value={hero.button2Text}
                      onChange={(e) => setHero({ ...hero, button2Text: e.target.value })}
                    />
                    <Input
                      placeholder="Button 2 URL"
                      value={hero.button2Url}
                      onChange={(e) => setHero({ ...hero, button2Url: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleHeroSubmit}>Save Hero Section</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
