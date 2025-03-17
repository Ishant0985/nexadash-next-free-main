"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeading from '@/components/layout/page-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import AddressSelector from '@/components/custom/address-selector';
import { db, getNextId } from '@/firebaseClient';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function AddCustomers() {
  const router = useRouter();
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
  const [userType, setUserType] = useState('customer'); // Default to customer
  const [redirectTarget, setRedirectTarget] = useState('/customer/manage');
  const [contactType, setContactType] = useState<'email' | 'phone' | 'both'>('both');

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('from') === 'invoice') {
      setRedirectTarget('/invoice/create');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firstName) {
      toast.error('First name is mandatory');
      return;
    }
    
    if (contactType === 'email' && !email) {
      toast.error('Email is required based on your selected contact method');
      return;
    }
    if (contactType === 'phone' && !phone) {
      toast.error('Phone number is required based on your selected contact method');
      return;
    }
    if (contactType === 'both' && (!email || !phone)) {
      toast.error('Both email and phone number are required based on your selected contact method');
      return;
    }
    
    try {
      const customerId = await getNextId('customerCounter');
      const profilePicURL = profilePic ? URL.createObjectURL(profilePic) : "";
      
      const customerData = {
        customerId: `CT${customerId}`,
        firstName,
        lastName,
        email: contactType === 'phone' ? '' : email,
        phone: contactType === 'email' ? '' : phone,
        profilePic: profilePicURL,
        country,
        state,
        district,
        city,
        pincode,
        usertype: userType,
        createdAt: new Date().toISOString(),
        contactType,
        searchTerms: [
          `CT${customerId}`,
          firstName.toLowerCase(),
          lastName.toLowerCase(),
          email.toLowerCase(),
          phone,
          `${firstName} ${lastName}`.toLowerCase()
        ].filter(Boolean)
      };

      await addDoc(collection(db, 'customers'), customerData);
      toast.success('Customer added successfully');
      router.push(redirectTarget);
    } catch (error) {
      console.error(error);
      toast.error("Error saving customer data.");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeading heading={'Add Customer'} />
      <div className="flex min-h-[calc(100vh_-_160px)] w-full items-center justify-center">
        <Card className="w-full max-w-[780px] rounded-lg">
          <CardContent className="p-6">
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

              <div className="space-y-4">
                <div className="space-y-2.5">
                  <label className="block font-semibold leading-tight text-black">
                    Contact Method
                  </label>
                  <RadioGroup 
                    defaultValue="both" 
                    value={contactType}
                    onValueChange={(value) => setContactType(value as 'email' | 'phone' | 'both')}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="email-only" />
                      <label htmlFor="email-only" className="cursor-pointer">Email Only</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="phone" id="phone-only" />
                      <label htmlFor="phone-only" className="cursor-pointer">Phone Only</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="both-contact" />
                      <label htmlFor="both-contact" className="cursor-pointer">Both Email and Phone</label>
                    </div>
                  </RadioGroup>
                </div>

                {(contactType === 'email' || contactType === 'both') && (
                  <div className="space-y-2.5">
                    <label className="block font-semibold leading-tight text-black">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required={contactType === 'email'}
                    />
                  </div>
                )}

                {(contactType === 'phone' || contactType === 'both') && (
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
                )}
              </div>

              <div className="space-y-2.5">
                <label className="block font-semibold leading-tight text-black">
                  User Type
                </label>
                <Select 
                  value={userType} 
                  onValueChange={setUserType}
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
                  onClick={() => router.push('/customer/manage')}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default">
                  Add Customer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
