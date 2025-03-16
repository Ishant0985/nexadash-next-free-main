"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/firebaseClient';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
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

  useEffect(() => {
    const fetchCustomer = async () => {
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
          } else {
            toast.error("Customer not found.");
            router.push('/manage-customers');
          }
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
        toast.error("Error fetching customer details.");
      }
    };
    fetchCustomer();
  }, [customerId, router]);

  const handleSave = async () => {
    try {
      if (!customerId || !customer) return;
      
      const updatedCustomer: Partial<Customer> = {
        ...customer,
        ...editForm,
        updatedAt: new Date().toISOString(),
      };
      
      await updateDoc(doc(db, 'customers', customerId), updatedCustomer);
      setCustomer({ ...customer, ...editForm } as Customer);
      setIsEditing(false);
      toast.success("Customer details updated successfully!");
    } catch (error) {
      console.error("Error updating customer:", error);
      toast.error("Failed to update customer details.");
    }
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <p className="text-gray-600">Loading customer details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeading heading="Customer Details" />
      <div className="min-h-[calc(100vh_-_160px)] w-full">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Customer Information</h2>
              <div>
                {isEditing ? (
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button variant="outline" onClick={handleSave}>Save Changes</Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Details</Button>
                )}
              </div>
            </div>

            {customer.profilePic && (
              <div className="mb-6 flex justify-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden">
                  <Image 
                    src={customer.profilePic} 
                    alt="Profile" 
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer ID</label>
                  <p className="mt-1 text-gray-900">{customer.customerId}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  {isEditing ? (
                    <Input
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{customer.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  {isEditing ? (
                    <Input
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{customer.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{customer.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  {isEditing ? (
                    <PhoneInput
                      country={'in'}
                      value={editForm.phone}
                      onChange={(phone) => setEditForm({ ...editForm, phone })}
                      inputStyle={{ width: '100%' }}
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{customer.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User Type</label>
                  {isEditing ? (
                    <Select 
                      value={editForm.usertype} 
                      onValueChange={(value) => setEditForm({ ...editForm, usertype: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="vip">VIP Customer</SelectItem>
                        <SelectItem value="wholesale">Wholesale</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 text-gray-900 capitalize">{customer.usertype}</p>
                  )}
                </div>

                {isEditing && (
                  <AddressSelector
                    country={editForm.country}
                    setCountry={(value) => setEditForm({ ...editForm, country: value })}
                    state={editForm.state}
                    setState={(value) => setEditForm({ ...editForm, state: value })}
                    district={editForm.district}
                    setDistrict={(value) => setEditForm({ ...editForm, district: value })}
                    city={editForm.city}
                    setCity={(value) => setEditForm({ ...editForm, city: value })}
                    pincode={editForm.pincode}
                    setPincode={(value) => setEditForm({ ...editForm, pincode: value })}
                  />
                )}
                {!isEditing && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="mt-1 text-gray-900">
                        {[customer.city, customer.district, customer.state, customer.country, customer.pincode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
