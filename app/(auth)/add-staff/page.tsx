"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeading from '@/components/layout/page-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { db, getNextId } from '@/firebaseClient';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const AddStaff = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [salary, setSalary] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProfilePic(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const staffId = await getNextId('staffCounter');
      const profilePicURL = profilePic ? URL.createObjectURL(profilePic) : "";
      
      const newStaff = {
        staffId: `STAFF${String(staffId).padStart(4, '0')}`,
        name,
        role,
        address,
        email,
        phone,
        profilePic: profilePicURL,
        salary,
        usertype: "staff",
        status: "Active",
        joiningDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "staff"), newStaff);
      toast.success("Staff added successfully!");
      router.push('/manage-staff');
    } catch (error) {
      console.error("Error adding staff:", error);
      toast.error("Error adding staff.");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeading heading={"Add Staff"} />
      <Card className="max-w-lg mx-auto">
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              type="text"
              placeholder="Enter staff name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Enter staff role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Enter address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Enter staff email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="tel"
              placeholder="Enter staff phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input type="file" onChange={handleFileChange} />
            <Input
              type="number"
              placeholder="Enter initial salary"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
            />
            <Button type="submit" className="w-full">
              Add Staff
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddStaff;
