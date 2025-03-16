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
import { useToast } from "@/components/ui/use-toast";
import Image from 'next/image';
import { Switch } from "@/components/ui/switch";

export default function LandingCustomization() {
  const [activeTab, setActiveTab] = useState('video');
  const [video, setVideo] = useState({ url: '', title: '', description: '' });
  const [features, setFeatures] = useState([]);
  const [featureTab, setFeatureTab] = useState({ title: '', description: '' });
  const [testimonials, setTestimonials] = useState([]);
  const [hero, setHero] = useState({
    title: '',
    description: '',
    button1Url: '',
    button2Url: '',
    button1Text: '',
    button2Text: ''
  });
  const { toast } = useToast();

  // Fetch data functions
  const fetchData = async () => {
    try {
      // Fetch video
      const videoSnapshot = await getDocs(collection(db, 'landingVideo'));
      if (!videoSnapshot.empty) {
        const videoData = videoSnapshot.docs[0].data();
        setVideo({ 
          url: videoData.url || '', 
          title: videoData.title || '', 
          description: videoData.description || '' 
        });
      }

      // Fetch features
      const featuresSnapshot = await getDocs(collection(db, 'features'));
      setFeatures(featuresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Record<string, any> })) as any);

      // Fetch feature tab
      const featureTabSnapshot = await getDocs(collection(db, 'featureTab'));
      if (!featureTabSnapshot.empty) {
        const featureTabData = featureTabSnapshot.docs[0].data();
        setFeatureTab({
          title: featureTabData.title || '',
          description: featureTabData.description || ''
        });
      }

      // Fetch testimonials
      const testimonialsSnapshot = await getDocs(collection(db, 'testimonials'));
      setTestimonials(testimonialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Record<string, any> })) as any);

      // Fetch hero
      const heroSnapshot = await getDocs(collection(db, 'hero'));
      if (!heroSnapshot.empty) {
        const heroData = heroSnapshot.docs[0].data();
        setHero({
          title: heroData.title || '',
          description: heroData.description || '',
          button1Url: heroData.button1Url || '',
          button2Url: heroData.button2Url || '',
          button1Text: heroData.button1Text || '',
          button2Text: heroData.button2Text || ''
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setState: React.Dispatch<React.SetStateAction<any>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState((prev: any) => ({ ...prev, icon: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Video section handlers
  const handleVideoSubmit = async () => {
    try {
      // Check if id exists in video object before destructuring
      if ('id' in video) {
        const { id, ...videoData } = video as { id: string; url: string; title: string; description: string };
        await updateDoc(doc(db, 'landingVideo', id), videoData);
      } else {
        await addDoc(collection(db, 'landingVideo'), video);
      }
      toast({
        title: "Success",
        description: "Video section updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update video section",
        variant: "destructive",
      });
    }
  };

  // Feature tab handlers
  const handleFeatureTabSubmit = async () => {
    try {
      // Check if id exists in featureTab object before using it
      if ('id' in featureTab) {
        const { id, ...featureTabData } = featureTab as { id: string; title: string; description: string };
        await updateDoc(doc(db, 'featureTab', id), featureTabData);
      } else {
        await addDoc(collection(db, 'featureTab'), featureTab);
      }
      toast({
        title: "Success",
        description: "Feature tab updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update feature tab",
        variant: "destructive",
      });
    }
  };

  // Feature handlers
  const handleAddFeature = async () => {
    try {
      if (features.length >= 6) {
        toast({
          title: "Warning",
          description: "Maximum 6 features allowed",
          variant: "destructive",
        });
        return;
      }
      await addDoc(collection(db, 'features'), {
        title: '',
        description: '',
        icon: ''
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add feature",
        variant: "destructive",
      });
    }
  };

  const handleUpdateFeature = async (id: string, data: { title?: string; description?: string; icon?: string }) => {
    try {
      await updateDoc(doc(db, 'features', id), data);
      fetchData();
      toast({
        title: "Success",
        description: "Feature updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update feature",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFeature = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'features', id));
      fetchData();
      toast({
        title: "Success",
        description: "Feature deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feature",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: "Failed to add testimonial",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTestimonial = async (id: string, data: Record<string, any>) => {
    try {
      await updateDoc(doc(db, 'testimonials', id), data);
      fetchData();
      toast({
        title: "Success",
        description: "Testimonial updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update testimonial",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'testimonials', id));
      fetchData();
      toast({
        title: "Success",
        description: "Testimonial deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete testimonial",
        variant: "destructive",
      });
    }
  };

  // Hero section handlers
  const handleHeroSubmit = async () => {
    try {
      const heroData = {
        title: hero.title,
        description: hero.description,
        button1Text: hero.button1Text,
        button2Text: hero.button2Text,
        button1Url: hero.button1Url,
        button2Url: hero.button2Url
      };
      
      const heroRef = await getDocs(collection(db, 'hero'));
      if (!heroRef.empty) {
        const docId = heroRef.docs[0].id;
        await updateDoc(doc(db, 'hero', docId), heroData);
      } else {
        await addDoc(collection(db, 'hero'), heroData);
      }
      toast({
        title: "Success",
        description: "Hero section updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update hero section",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="video" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="video">Video Section</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
        </TabsList>

        {/* Video Section */}
        <TabsContent value="video">
          <Card>
            <CardHeader>
              <CardTitle>Video Section Customization</CardTitle>
            </CardHeader>
            <CardContent>
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
                <Button onClick={handleVideoSubmit}>Save Video Section</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Section */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Features Section Customization</CardTitle>
            </CardHeader>
            <CardContent>
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
                  {features.map((feature: any) => (
                    <div key={feature.id} className="border p-4 rounded-lg">
                      <div className="space-y-4">
                        <Input
                          placeholder="Feature Title"
                          value={feature.title}
                          onChange={(e) => handleUpdateFeature(feature.id, { title: e.target.value, description: feature.description, icon: feature.icon })}
                        />
                        <Textarea
                          placeholder="Feature Description"
                          value={feature.description}
                          onChange={(e) => handleUpdateFeature(feature.id, { title: feature.title, description: e.target.value, icon: feature.icon })}
                        />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, (data) => handleUpdateFeature(feature.id, { title: feature.title, description: feature.description, icon: data.icon }))}
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
        <TabsContent value="testimonials">
          <Card>
            <CardHeader>
              <CardTitle>Testimonials Section Customization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={handleAddTestimonial}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Testimonial
                </Button>
                {testimonials.map((testimonial: { 
                  id: string; 
                  title: string; 
                  description: string; 
                  rating: number;
                  icon?: string;
                }) => (
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
                            className={`h-5 w-5 cursor-pointer ${
                              star <= testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                            onClick={() => handleUpdateTestimonial(testimonial.id, { ...testimonial, rating: star })}
                          />
                        ))}
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, (data) => handleUpdateTestimonial(testimonial.id, { ...testimonial, icon: data.icon }))}
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
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section Customization</CardTitle>
            </CardHeader>
            <CardContent>
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
