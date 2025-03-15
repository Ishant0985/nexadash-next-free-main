'use client'

import { LottiePlayer2 } from "@/components/LottiePlayer";
import { useEffect, useState } from 'react'
import PageHeading from '@/components/layout/page-heading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LockKeyhole, LockKeyholeOpen, Mail, Phone, User } from 'lucide-react'
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { auth, db } from '@/firebaseClient'
import { onAuthStateChanged, updatePassword, updateProfile } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

export default function Setting() {
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    photoURL: '/images/avatar.svg',
    areasOfInterest: '',
    professions: '',
    skills: '',
    bio: '',
  })

  // States for profile update form
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [areasOfInterest, setAreasOfInterest] = useState('')
  const [professions, setProfessions] = useState('')
  const [skills, setSkills] = useState('')
  const [bio, setBio] = useState('')

  // States for password update with OTP
  const [otpSent, setOtpSent] = useState(false)
  const [generatedOTP, setGeneratedOTP] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  // Load current user data from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid)
          const userDocSnap = await getDoc(userDocRef)
          if (userDocSnap.exists()) {
            const data = userDocSnap.data()
            setUserData(data)
            setFirstName(data.firstName || '')
            setLastName(data.lastName || '')
            setEmail(data.email || '')
            setPhone(data.phone || '')
            setAreasOfInterest(data.areasOfInterest || '')
            setProfessions(data.professions || '')
            setSkills(data.skills || '')
            setBio(data.bio || '')
          }
        } catch (error) {
          console.error('Error loading user data:', error)
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Update profile details in Firestore and update Auth profile simultaneously
  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const user = auth.currentUser
    if (!user) return

    try {
      // In a real implementation, you would handle the file upload here.
      // For now, we use the existing photoURL from userData or the default image.
      const newPhotoURL = userData.photoURL || '/images/avatar.svg'

      // Update Auth profile (displayName and photoURL)
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
        photoURL: newPhotoURL,
      })

      // Update Firestore document with updated profile data.
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, {
        firstName,
        lastName,
        email,
        phone,
        areasOfInterest,
        professions,
        skills,
        bio,
        photoURL: newPhotoURL,
      })
      alert('Profile updated successfully.')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Profile update failed.')
    }
  }

  // Simulate sending an OTP to the user's email.
  // In production, you should call a backend/Cloud Function to send a real OTP email.
  const handleRequestOTP = async () => {
    const user = auth.currentUser
    if (!user) return
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOTP(otp)
    setOtpSent(true)
    // For demo, we simply alert the OTP.
    alert(`OTP sent to ${user.email}: ${otp}`)
  }

  // Update password after OTP verification
  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage('New passwords do not match.')
      return
    }
    if (otpInput !== generatedOTP) {
      setPasswordMessage('Invalid OTP. Please try again.')
      return
    }
    const user = auth.currentUser
    if (!user) return
    try {
      await updatePassword(user, newPassword)
      setPasswordMessage('Password updated successfully.')
      // Reset OTP state
      setOtpSent(false)
      setGeneratedOTP('')
      setOtpInput('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (error: any) {
      console.error('Error updating password:', error)
      setPasswordMessage('Password update failed. Please try again.')
    }
  }

  if (loading) {
    return <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
                <LottiePlayer2 />
            </div>
  }

  return (
    <div className="space-y-4">
      <PageHeading heading={'Settings'} />

      <div className="min-h-[calc(100vh_-_160px)] w-full rounded-lg">
        <Tabs defaultValue="my-profile">
          <TabsList className="mb-5 overflow-x-auto rounded-lg bg-white shadow-sm">
            <div className="inline-flex gap-2.5 px-5 py-[11px] text-sm/[18px] font-semibold">
              <TabsTrigger
                value="my-profile"
                className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white"
              >
                My Profile
              </TabsTrigger>
              <TabsTrigger
                value="password"
                className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white"
              >
                Password
              </TabsTrigger>
            </div>
          </TabsList>
          <TabsContent value="my-profile" className="font-medium text-black">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="space-y-1.5 rounded-t-lg border-b border-gray-300 bg-gray-100 px-5 py-4 text-base/5 font-semibold text-black">
                  <h3>Personal info</h3>
                  <p className="text-sm/tight font-medium text-gray-700">
                    Update your photo and personal details.
                  </p>
                </CardHeader>
                <CardContent>
                  <form className="space-y-5 p-4" onSubmit={handleProfileUpdate}>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="size-[50px] shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={userData.photoURL || '/images/default-profile.png'}
                          alt="Profile"
                          width={50}
                          height={50}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold leading-tight">
                          Update profile image
                        </p>
                        <p className="text-xs/tight text-gray">
                          Min 400*400px, PNG or JPEG
                        </p>
                      </div>
                      <div className="relative ml-3 cursor-pointer">
                        <Input
                          type="file"
                          className="absolute inset-0 h-full w-full cursor-pointer p-0 text-[0] leading-none opacity-0"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setProfileImage(e.target.files[0])
                              // TODO: Upload the file and update userData.photoURL and update Auth profile.
                            }
                          }}
                        />
                        <Button type="button" variant={'outline'} size={'icon'}>
                          Upload
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <label className="font-semibold leading-tight">First name</label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="First name"
                          className="pl-9"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                        <User className="absolute left-3 top-3 size-4" />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <label className="font-semibold leading-tight">Last name</label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Last name"
                          className="pl-9"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                        <User className="absolute left-3 top-3 size-4" />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <label className="font-semibold leading-tight">Email address</label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Email address"
                          className="pl-9"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <Mail className="absolute left-3 top-3 size-4" />
                        <button
                          type="button"
                          className="absolute right-1 top-0 rounded-lg bg-white p-2 font-semibold text-primary transition hover:text-black"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <label className="font-semibold leading-tight">Phone number</label>
                      <div className="relative">
                        <Input
                          type="tel"
                          placeholder="Phone number"
                          className="pl-9"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                        <Phone className="absolute left-3 top-3 size-4" />
                        <button
                          type="button"
                          className="absolute right-1 top-0 rounded-lg bg-white p-2 font-semibold text-primary transition hover:text-black"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                    <div className="!mt-7 flex items-center justify-end gap-4">
                      <Button variant={'outline'} size={'icon'} className="text-danger">
                        Cancel
                      </Button>
                      <Button type="submit" variant={'outline'} size={'icon'}>
                        Save changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="space-y-1.5 rounded-t-lg border-b border-gray-300 bg-gray-100 px-5 py-4 text-base/5 font-semibold text-black">
                  <h3>Profile details</h3>
                  <p className="text-sm/tight font-medium text-gray-700">
                    This will be displayed on your profile.
                  </p>
                </CardHeader>
                <CardContent>
                  <form className="space-y-5 p-4">
                    <div className="space-y-2.5">
                      <label className="font-semibold leading-tight">Areas of interest</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Singing, learning" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dancing">Dancing</SelectItem>
                          <SelectItem value="Riding">Riding</SelectItem>
                          <SelectItem value="Travelling">Travelling</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2.5">
                      <label className="font-semibold leading-tight">Professions</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Ex. software engineer, etc." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Web Developer">Web Developer</SelectItem>
                          <SelectItem value="Marketing Manager">Marketing Manager</SelectItem>
                          <SelectItem value="Graphics Designer">Graphics Designer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2.5">
                      <label className="font-semibold leading-tight">Skills</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Ex. developing, designing, etc." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Creativity">Creativity</SelectItem>
                          <SelectItem value="Data Analytics">Data Analytics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2.5">
                      <label className="font-semibold leading-tight">Bio</label>
                      <Textarea
                        rows={5}
                        placeholder="Write your bio here..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-4">
                      <Button variant={'outline'} size={'icon'}>
                        Cancel
                      </Button>
                      <Button type="submit" variant={'outline'} size={'icon'}>
                        Update
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="password" className="mx-auto w-full max-w-[566px] font-medium text-black">
            <Card>
              <CardHeader className="space-y-1.5 rounded-t-lg border-b border-gray-300 bg-gray-100 px-5 py-4 text-base/5 font-semibold text-black">
                <h3>Update Password</h3>
                <p className="text-sm/tight font-medium text-gray-700">
                  For security, an OTP will be sent to your registered email before you can change your password.
                </p>
              </CardHeader>
              <CardContent>
                <form className="space-y-5 p-4" onSubmit={handlePasswordUpdate}>
                  {!otpSent ? (
                    <div className="flex items-center justify-center">
                      <Button type="button" variant={'outline'} size={'icon'} onClick={handleRequestOTP}>
                        Request OTP
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2.5">
                        <label className="font-semibold leading-tight">Enter OTP</label>
                        <Input
                          type="text"
                          placeholder="Enter OTP"
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <label className="font-semibold leading-tight">New password</label>
                        <Input
                          type="password"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <label className="font-semibold leading-tight">Confirm new password</label>
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                        />
                      </div>
                      {passwordMessage && (
                        <p className="text-sm text-danger">{passwordMessage}</p>
                      )}
                      <div className="flex items-center justify-end gap-4">
                        <Button variant={'outline'} size={'icon'} className="text-danger">
                          Cancel
                        </Button>
                        <Button type="submit" variant={'outline'} size={'icon'}>
                          Update password
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
