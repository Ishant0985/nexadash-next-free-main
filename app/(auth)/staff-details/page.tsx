"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/firebaseClient';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import PageHeading from '@/components/layout/page-heading';

export default function StaffDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const staffId = searchParams.get('id');
  const [isEditing, setIsEditing] = useState(false);
  const [staff, setStaff] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    address: '',
    status: '',
    salary: '',
  });

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        if (staffId) {
          const staffDoc = await getDoc(doc(db, "staff", staffId));
          if (staffDoc.exists()) {
            const data = { id: staffDoc.id, ...staffDoc.data() };
            setStaff(data);
            setEditForm({
              name: data.name || '',
              role: data.role || '',
              email: data.email || '',
              phone: data.phone || '',
              address: data.address || '',
              status: data.status || '',
              salary: data.salary || '',
            });
          } else {
            toast.error("Staff not found.");
            router.push('/manage-staff');
          }
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
        toast.error("Error fetching staff details.");
      }
    };
    fetchStaff();
  }, [staffId, router]);

  const handleSave = async () => {
    try {
      if (!staffId) return;
      
      await updateDoc(doc(db, 'staff', staffId), {
        ...editForm,
        updatedAt: new Date().toISOString(),
      });
      
      setStaff({ ...staff, ...editForm });
      setIsEditing(false);
      toast.success("Staff details updated successfully!");
    } catch (error) {
      console.error("Error updating staff:", error);
      toast.error("Failed to update staff details.");
    }
  };

  if (!staff) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <p className="text-gray-600">Loading staff details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeading heading="Staff Details" />
      <div className="min-h-[calc(100vh_-_160px)] w-full">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Staff Information</h2>
              <div>
                {isEditing ? (
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button variant="black" onClick={handleSave}>Save Changes</Button>
                  </div>
                ) : (
                  <Button variant="black" onClick={() => setIsEditing(true)}>Edit Details</Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Staff ID</label>
                  <p className="mt-1 text-gray-900">{staff.staffId}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  {isEditing ? (
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{staff.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  {isEditing ? (
                    <Input
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{staff.role}</p>
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
                    <p className="mt-1 text-gray-900">{staff.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  {isEditing ? (
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{staff.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  {isEditing ? (
                    <Input
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{staff.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  {isEditing ? (
                    <Input
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{staff.status}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Salary</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editForm.salary}
                      onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{staff.salary}</p>
                  )}
                </div>
              </div>
            </div>

            {staff.profilePic && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                <div className="mt-2">
                  <Image 
                    src={staff.profilePic} 
                    alt="Profile" 
                    width={100} 
                    height={100} 
                    className="rounded-full object-cover"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
