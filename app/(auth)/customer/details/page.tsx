"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/firebaseClient';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft, UserCircle, MapPin, Mail, Phone, Calendar, Edit, Save, X, Upload, Camera, UploadCloud } from 'lucide-react';
import PageHeading from '@/components/layout/page-heading';
import AddressSelector from '@/components/custom/address-selector';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface Customer {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  usertype: string;
  country: string;
  state: string;
  district: string;
  city: string;
  pincode: string;
  profilePic?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function CustomerDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const customerId = searchParams.get('id');
  const [isEditing, setIsEditing] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    usertype: '',
    country: '',
    state: '',
    district: '',
    city: '',
    pincode: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      setIsLoading(true);
      try {
        if (customerId) {
          const customerDoc = await getDoc(doc(db, 'customers', customerId));
          if (customerDoc.exists()) {
            const data = { id: customerDoc.id, ...customerDoc.data() } as Customer;
            setCustomer(data);
            setEditForm({
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: data.email || '',
              phone: data.phone || '',
              usertype: data.usertype || 'customer',
              country: data.country || '',
              state: data.state || '',
              district: data.district || '',
              city: data.city || '',
              pincode: data.pincode || '',
            });
            if (data.profilePic) {
              setProfileImagePreview(data.profilePic);
            }
            toast.success("Customer details loaded successfully");
          } else {
            toast.error("Customer not found.");
            router.push('/customer/manage');
          }
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
        toast.error("Error fetching customer details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomer();
  }, [customerId, router]);

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    setProfileImagePreview(customer?.profilePic || null);
  };

  const uploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          // Return the data URI directly
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to convert file to data URI'));
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      // Read the file as a data URL (base64 encoded)
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    try {
      if (!customerId || !customer) return;

      // Form validation
      if (!editForm.firstName.trim()) {
        toast.error("First name is required");
        return;
      }
      
      if (!editForm.email.trim()) {
        toast.error("Email is required");
        return;
      }
      
      if (!editForm.phone.trim()) {
        toast.error("Phone number is required");
        return;
      }
      
      const updatedCustomer: Partial<Customer> = {
        ...customer,
        ...editForm,
        updatedAt: new Date().toISOString(),
      };

      // Upload new profile image if selected
      if (profileImage) {
        try {
          const imageUrl = await uploadImage(profileImage);
          updatedCustomer.profilePic = imageUrl;
        } catch (error) {
          console.error("Error uploading profile image:", error);
          toast.error("Failed to upload profile image");
          return;
        }
      }
      
      await updateDoc(doc(db, 'customers', customerId), updatedCustomer);
      setCustomer({ ...customer, ...updatedCustomer } as Customer);
      setIsEditing(false);
      toast.success("Customer details updated successfully!");
    } catch (error) {
      console.error("Error updating customer:", error);
      toast.error("Failed to update customer details.");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-4">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Customer Not Found</CardTitle>
            <CardDescription>We couldn't find this customer in our records.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/customer/manage')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeading heading="Customer Details" />

      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push('/customer/manage')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Button>
        
        {isEditing ? (
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Details
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center p-4">
            <div className="mx-auto mb-4 relative">
              {isEditing ? (
                <div className="relative w-32 h-32 mx-auto">
                  {profileImagePreview ? (
                    <div className="relative w-32 h-32 rounded-full overflow-hidden">
                      <Image 
                        src={profileImagePreview} 
                        alt="Profile Preview" 
                        fill
                        className="object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-0 right-0 h-6 w-6 rounded-full"
                        onClick={removeProfileImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="w-32 h-32 rounded-full bg-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud className="h-10 w-10 text-gray-500 mb-1" />
                      <span className="text-xs text-gray-500">Upload Image</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileImageChange}
                      />
                    </div>
                  )}
                  {profileImagePreview && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Change Photo
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileImageChange}
                      />
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {customer.profilePic ? (
                    <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden">
                      <Image 
                        src={customer.profilePic} 
                        alt="Profile" 
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 mx-auto rounded-full bg-gray-200 flex items-center justify-center">
                      <UserCircle className="h-16 w-16 text-gray-500" />
                    </div>
                  )}
                </>
              )}
            </div>
            <CardTitle className="text-xl">
              {`${customer.firstName} ${customer.lastName || ''}`}
            </CardTitle>
            <CardDescription>
              <Badge variant="outline" className="mt-2">
                {customer.usertype.toUpperCase()}
              </Badge>
              <div className="mt-2 text-sm">
                Customer ID: <span className="font-semibold">{customer.customerId}</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className='p-4'>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {[customer.city, customer.state, customer.country].filter(Boolean).join(', ') || 'No address provided'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div className="text-sm">
                  <div>Created: {formatDate(customer.createdAt)}</div>
                  {customer.updatedAt && <div>Updated: {formatDate(customer.updatedAt)}</div>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader className='p-4'>
            <CardTitle className='text-xl'>Customer Information</CardTitle>
            <CardDescription>
              {isEditing ? 'Edit customer information below' : 'View and manage customer details'}
            </CardDescription>
          </CardHeader>
          <CardContent className='p-4'>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="mb-4 justify-start items-center">
                <TabsTrigger value="personal" className='text-sm px-4 justify-start'>Personal Info</TabsTrigger>
                <TabsTrigger value="address" className='text-sm px-4 justify-end'>Address</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        placeholder="First Name"
                      />
                    ) : (
                      <div className="p-2 border rounded-md bg-gray-50">{customer.firstName}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        placeholder="Last Name"
                      />
                    ) : (
                      <div className="p-2 border rounded-md bg-gray-50">{customer.lastName || '—'}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="Email Address"
                      />
                    ) : (
                      <div className="p-2 border rounded-md bg-gray-50">{customer.email}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <div className="phone-input-container">
                        <PhoneInput
                          country={'in'}
                          value={editForm.phone}
                          onChange={(phone) => setEditForm({ ...editForm, phone })}
                          inputClass="!w-full"
                        />
                      </div>
                    ) : (
                      <div className="p-2 border rounded-md bg-gray-50">{customer.phone}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usertype">User Type</Label>
                    {isEditing ? (
                      <Select 
                        value={editForm.usertype} 
                        onValueChange={(value) => setEditForm({ ...editForm, usertype: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select User Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-2 border rounded-md bg-gray-50">
                        {customer.usertype.charAt(0).toUpperCase() + customer.usertype.slice(1)}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="address" className="space-y-4 p-4">
                {isEditing ? (
                  <AddressSelector
                    country={editForm.country}
                    setCountry={(value: string) => setEditForm({ ...editForm, country: value })}
                    state={editForm.state}
                    setState={(value: string) => setEditForm({ ...editForm, state: value })}
                    district={editForm.district}
                    setDistrict={(value: string) => setEditForm({ ...editForm, district: value })}
                    city={editForm.city}
                    setCity={(value: string) => setEditForm({ ...editForm, city: value })}
                    pincode={editForm.pincode}
                    setPincode={(value: string) => setEditForm({ ...editForm, pincode: value })}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <div className="p-2 border rounded-md bg-gray-50">{customer.country || '—'}</div>
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <div className="p-2 border rounded-md bg-gray-50">{customer.state || '—'}</div>
                    </div>
                    <div className="space-y-2">
                      <Label>District</Label>
                      <div className="p-2 border rounded-md bg-gray-50">{customer.district || '—'}</div>
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <div className="p-2 border rounded-md bg-gray-50">{customer.city || '—'}</div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  {isEditing ? (
                    <Input
                      id="pincode"
                      value={editForm.pincode}
                      onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                      placeholder="Pincode"
                    />
                  ) : (
                    <div className="p-2 border rounded-md bg-gray-50">{customer.pincode || '—'}</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
