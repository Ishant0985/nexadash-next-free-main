 "use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeading from '@/components/layout/page-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { db, getNextId } from '@/firebaseClient';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import AddressSelector from '@/components/custom/address-selector';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const AddStaff = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91");
  const [salary, setSalary] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  
  // Address fields
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const staffId = await getNextId('staffCounter');
      const profilePicURL = profilePic ? URL.createObjectURL(profilePic) : "";
      
      const newStaff = {
        staffId: `STAFF${String(staffId).padStart(4, '0')}`,
        name,
        role,
        email,
        phone,
        profilePic: profilePicURL,
        salary,
        usertype: "staff",
        status: "Active",
        joiningDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        country,
        state,
        district,
        city,
        pincode
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
      <div className="flex min-h-[calc(100vh_-_160px)] w-full items-center justify-center">
        <Card className="w-full max-w-[780px] rounded-lg">
          <CardContent className="p-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <label className="block font-semibold leading-tight text-black">
                    Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter staff name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="block font-semibold leading-tight text-black">
                    Role
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter staff role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="block font-semibold leading-tight text-black">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter staff email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2.5">
                <label className="block font-semibold leading-tight text-black">
                  Phone Number
                </label>
                <PhoneInput
                  country={'in'}
                  value={phone}
                  onChange={setPhone}
                  inputStyle={{ width: '100%' }}
                />
              </div>

              <div className="space-y-2.5">
                <label className="block font-semibold leading-tight text-black">
                  Profile Picture
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setProfilePic(e.target.files[0]);
                    }
                  }}
                />
              </div>

              <div className="space-y-2.5">
                <label className="block font-semibold leading-tight text-black">
                  Salary
                </label>
                <Input
                  type="number"
                  placeholder="Enter initial salary"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  required
                />
              </div>

              <AddressSelector
                country={country}
                setCountry={setCountry}
                state={state}
                setState={setState}
                district={district}
                setDistrict={setDistrict}
                city={city}
                setCity={setCity}
                pincode={pincode}
                setPincode={setPincode}
              />

              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.push('/manage-staff')}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="outline">
                  Add Staff
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddStaff;
