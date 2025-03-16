'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseClient';
import { useToast } from "@/components/ui/use-toast";
import Image from 'next/image';

interface AboutSection {
  id: string;
  title: string;
  description: string;
  text?: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  image: string;
}

export default function OtherCustomization() {
  const [activeTab, setActiveTab] = useState('about');
  const [aboutSections, setAboutSections] = useState<AboutSection[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState<Omit<Service, 'id'>>({ title: '', description: '', image: '' });
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { toast } = useToast();

  // Fetch about sections
  const fetchAboutSections = async () => {
    try {
      const aboutOneSnapshot = await getDocs(collection(db, 'aboutSectionOne'));
      const aboutTwoSnapshot = await getDocs(collection(db, 'aboutSectionTwo'));
      
      const aboutOneData = aboutOneSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AboutSection));
      const aboutTwoData = aboutTwoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AboutSection));
      
      setAboutSections([...aboutOneData, ...aboutTwoData]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch about sections",
        variant: "destructive",
      });
    }
  };

  // Fetch services
  const fetchServices = async () => {
    try {
      const servicesSnapshot = await getDocs(collection(db, 'services'));
      const servicesData = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      setServices(servicesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch services",
        variant: "destructive",
      });
    }
  };

  // Handle service image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewService({ ...newService, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Add new service
  const handleAddService = async () => {
    try {
      await addDoc(collection(db, 'services'), newService);
      setNewService({ title: '', description: '', image: '' });
      fetchServices();
      toast({
        title: "Success",
        description: "Service added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add service",
        variant: "destructive",
      });
    }
  };

  // Delete service
  const handleDeleteService = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'services', id));
      fetchServices();
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  // Update service
  const handleUpdateService = async (id: string) => {
    try {
      if (editingService) {
        const { id: _, ...serviceData } = editingService;
        await updateDoc(doc(db, 'services', id), serviceData);
      }
      setEditingService(null);
      fetchServices();
      toast({
        title: "Success",
        description: "Service updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="about">About Section</TabsTrigger>
          <TabsTrigger value="services">Services Section</TabsTrigger>
        </TabsList>
        
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About Section Customization</CardTitle>
            </CardHeader>
            <CardContent>
              {/* About section forms will go here */}
              <div className="space-y-4">
                {aboutSections.map((section) => (
                  <div key={section.id} className="border p-4 rounded-lg">
                    <h3 className="font-semibold">{section.title}</h3>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Services Section Customization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add new service form */}
                <div className="border p-4 rounded-lg">
                  <h3 className="font-semibold mb-4">Add New Service</h3>
                  <div className="space-y-4">
                    <Input
                      placeholder="Service Title"
                      value={newService.title}
                      onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                    />
                    <Textarea
                      placeholder="Service Description"
                      value={newService.description}
                      onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    />
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <Button onClick={handleAddService}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Service
                    </Button>
                  </div>
                </div>

                {/* Services list */}
                <div className="space-y-4">
                  {services.map((service: any) => (
                    <div key={service.id} className="border p-4 rounded-lg">
                      {editingService && editingService.id === service.id ? (
                        <div className="space-y-4">
                          <Input
                            value={editingService?.title || ''}
                            onChange={(e) => setEditingService(prev => prev ? { ...prev, title: e.target.value } : null)}
                          />
                          <Textarea
                            value={editingService?.description || ''}
                            onChange={(e) => setEditingService(prev => prev ? { ...prev, description: e.target.value } : null)}
                          />
                          <div className="flex gap-2">
                            <Button onClick={() => handleUpdateService(service.id)}>Save</Button>
                            <Button variant="outline" onClick={() => setEditingService(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{service.title}</h3>
                            <p className="text-sm text-gray-600">{service.description}</p>
                            {service.image && (
                              <div className="mt-2">
                                <Image
                                  src={service.image}
                                  alt={service.title || 'Service image'}
                                  width={100}
                                  height={100}
                                  className="rounded"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setEditingService(service)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
