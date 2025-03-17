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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft, UserCircle, MapPin, Mail, Phone, Calendar, Edit, Save, X, Upload, Camera, UploadCloud, Briefcase, AlertCircle } from 'lucide-react';
import PageHeading from '@/components/layout/page-heading';
import AddressSelector from '@/components/custom/address-selector';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface Staff {
  id: string;
  staffId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  salary: string;
  country: string;
  state: string;
  district: string;
  city: string;
  pincode: string;
  profilePic?: string;
  usertype: string;
  joiningDate: string;
  createdAt: string;
  updatedAt?: string;
}

export default function StaffDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const staffId = searchParams.get('id');
  const [isEditing, setIsEditing] = useState(false);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    status: '',
    salary: '',
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
    const fetchStaff = async () => {
      setIsLoading(true);
      try {
        if (staffId) {
          const staffDoc = await getDoc(doc(db, "staff", staffId));
          if (staffDoc.exists()) {
            const data = { id: staffId, ...staffDoc.data() } as Staff;
            setStaff(data);
            setEditForm({
              name: data.name || '',
              role: data.role || '',
              email: data.email || '',
              phone: data.phone || '',
              status: data.status || '',
              salary: data.salary || '',
              country: data.country || '',
              state: data.state || '',
              district: data.district || '',
              city: data.city || '',
              pincode: data.pincode || '',
            });
            if (data.profilePic) {
              setProfileImagePreview(data.profilePic);
            }
            toast.success("Staff details loaded successfully");
          } else {
            toast.error("Staff not found.");
            router.push('/staff/manage');
          }
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
        toast.error("Error fetching staff details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaff();
  }, [staffId, router]);

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    setProfileImagePreview(staff?.profilePic || null);
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
      if (!staffId || !staff) return;

      // Form validation
      if (!editForm.name.trim()) {
        toast.error("Name is required");
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
      
      const updatedStaff: Partial<Staff> = {
        ...staff,
        ...editForm,
        updatedAt: new Date().toISOString(),
      };

      // Upload new profile image if selected
      if (profileImage) {
        try {
          const imageUrl = await uploadImage(profileImage);
          updatedStaff.profilePic = imageUrl;
        } catch (error) {
          console.error("Error uploading profile image:", error);
          toast.error("Failed to upload profile image");
          return;
        }
      }
      
      await updateDoc(doc(db, 'staff', staffId), updatedStaff);
      setStaff({ ...staff, ...updatedStaff } as Staff);
      setIsEditing(false);
      toast.success("Staff details updated successfully!");
    } catch (error) {
      console.error("Error updating staff:", error);
      toast.error("Failed to update staff details.");
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
          <p className="mt-4">Loading staff details...</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Staff Not Found</CardTitle>
            <CardDescription>We couldn't find this staff member in our records.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/staff/manage')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Staff
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeading heading="Staff Details" />

      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push('/staff/manage')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Staff
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
        {/* Staff Profile Card */}
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
                  {staff.profilePic ? (
                    <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden">
                      <Image 
                        src={staff.profilePic} 
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
              {staff.name}
            </CardTitle>
            <CardDescription>
              <Badge variant="outline" className="mt-2">
                {staff.role.toUpperCase()}
              </Badge>
              <div className="mt-2 text-sm">
                Staff ID: <span className="font-semibold">{staff.staffId}</span>
              </div>
              <div className="mt-1">
                <Badge variant={staff.status.toLowerCase() === 'active' ? 'success' : 'danger'}>
                  {staff.status.toUpperCase()}
                </Badge>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className='p-4'>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{staff.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{staff.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {[staff.city, staff.state, staff.country].filter(Boolean).join(', ') || 'No address provided'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Salary: ₹{staff.salary}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div className="text-sm">
                  <div>Joined: {formatDate(staff.joiningDate || staff.createdAt)}</div>
                  {staff.updatedAt && <div>Updated: {formatDate(staff.updatedAt)}</div>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader className='p-4'>
            <CardTitle className='text-xl'>Staff Information</CardTitle>
            <CardDescription>
              {isEditing ? 'Edit staff information below' : 'View and manage staff details'}
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
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Full Name"
                      />
                    ) : (
                      <div className="p-2 border rounded-md bg-gray-50">{staff.name}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    {isEditing ? (
                      <Input
                        id="role"
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        placeholder="Role"
                      />
                    ) : (
                      <div className="p-2 border rounded-md bg-gray-50">{staff.role}</div>
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
                      <div className="p-2 border rounded-md bg-gray-50">{staff.email}</div>
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
                      <div className="p-2 border rounded-md bg-gray-50">{staff.phone}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    {isEditing ? (
                      <Select 
                        value={editForm.status} 
                        onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="onleave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-2 border rounded-md bg-gray-50">
                        {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary (₹)</Label>
                    {isEditing ? (
                      <Input
                        id="salary"
                        type="number"
                        value={editForm.salary}
                        onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                        placeholder="Salary"
                      />
                    ) : (
                      <div className="p-2 border rounded-md bg-gray-50">₹{staff.salary}</div>
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
                      <div className="p-2 border rounded-md bg-gray-50">{staff.country || '—'}</div>
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <div className="p-2 border rounded-md bg-gray-50">{staff.state || '—'}</div>
                    </div>
                    <div className="space-y-2">
                      <Label>District</Label>
                      <div className="p-2 border rounded-md bg-gray-50">{staff.district || '—'}</div>
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <div className="p-2 border rounded-md bg-gray-50">{staff.city || '—'}</div>
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
                    <div className="p-2 border rounded-md bg-gray-50">{staff.pincode || '—'}</div>
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
