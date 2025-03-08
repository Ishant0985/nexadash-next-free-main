"use client";
import { useState } from 'react';
import PageHeading from '@/components/layout/page-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import AddressSelector from '@/components/custom/address-selector';
import { db } from '@/firebaseClient';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function AddCustomers() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firstName) {
      toast.error('First name is mandatory');
      return;
    }
    if (!email && !phone) {
      toast.error('Either email or phone number is mandatory');
      return;
    }
    const profilePicURL = profilePic ? URL.createObjectURL(profilePic) : "";
    const customerData = {
      firstName,
      lastName,
      email,
      phone,
      profilePic: profilePicURL,
      country,
      state,
      district,
      city,
      pincode,
      usertype: "customer", // default for customers
      createdAt: new Date().toISOString(),
    };
    try {
      await addDoc(collection(db, 'customers'), customerData);
      toast.success('Customer data saved successfully');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('+91');
      setProfilePic(null);
      setCountry('India');
      setState('');
      setDistrict('');
      setCity('');
      setPincode('');
    } catch (error) {
      console.error(error);
      toast.error("Error saving customer data.");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeading heading={'Add Customers'} />
      <div className="flex min-h-[calc(100vh_-_160px)] w-full items-center justify-center">
        <Card className="w-full max-w-[780px] rounded-lg p-4">
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <label className="block font-semibold leading-tight text-black">
                    First Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="block font-semibold leading-tight text-black">
                    Last Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <label className="block font-semibold leading-tight text-black">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setProfilePic(e.target.files[0]);
                    }
                  }}
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
              <Button type="submit" className="w-full">
                Add Customer
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
