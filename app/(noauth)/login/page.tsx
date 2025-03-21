'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import IconGoogle from '@/components/icons/icon-google'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AtSign } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
// Firebase imports
import { auth, db } from '@/firebaseClient'
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // Helper: Check user's Firestore document for access (admin/developer only)
  const checkUserAccess = async (uid: string) => {
    try {
      const userDocRef = doc(db, 'users', uid)
      const userDocSnap = await getDoc(userDocRef)
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        if (userData.usertype === 'admin' || userData.usertype === 'developer') {
          return true
        }
      }
      return false
    } catch (err) {
      console.error('Error checking user access:', err)
      return false
    }
  }

  // Handle Google Login
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      // Create/update user in Firestore if not exists
      const userDocRef = doc(db, 'users', user.uid)
      const userDocSnap = await getDoc(userDocRef)
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          usertype: 'customer', // default type
          createdAt: new Date().toISOString(),
        })
      }
      // Check access (only allow admin/developer to access dashboard)
      const hasAccess = await checkUserAccess(user.uid)
      if (hasAccess) {
        router.push('/')
      } else {
        setError('Access denied: Only admin and developer can access the admin dashboard.')
        await signOut(auth)
      }
    } catch (error: any) {
      console.error(error)
      setError('Google sign in failed.')
    }
  }

  // Handle Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const user = result.user
      // Check Firestore for user details; if not exists, create a document.
      const userDocRef = doc(db, 'users', user.uid)
      const userDocSnap = await getDoc(userDocRef)
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          usertype: 'customer', // default type
          createdAt: new Date().toISOString(),
        })
      }
      // Check access
      const hasAccess = await checkUserAccess(user.uid)
      if (hasAccess) {
        router.push('/')
      } else {
        setError('Access denied: Only admin and developer can access the admin dashboard.')
        await signOut(auth)
      }
    } catch (error: any) {
      console.error(error)
      setError('Login failed. Please check your credentials.')
      toast.error("Login failed. Please check your credentials.")
    }
  }

  return (
    <div className="grid h-screen w-full gap-5 p-4 md:grid-cols-2">
      <div className="relative hidden overflow-hidden rounded-[20px] bg-[#3B06D2] p-4 md:block md:h-full">
        <Image
          src="/images/logo.svg"
          width={145}
          height={34}
          alt="Logo"
          className="absolute left-4 top-4 z-10 h-auto w-auto"
        />
        <Image
          src="/images/login-cover-step.svg"
          width={240}
          height={240}
          alt="Logo Cover Step"
          className="absolute left-0 top-0.5 size-40 md:h-auto md:w-auto"
        />
        <Image
          src="/images/login-cover-cartoon.svg"
          width={145}
          height={34}
          alt="Logo Cover Cartoon"
          className="absolute bottom-0 left-0 right-0 h-52 w-full md:h-96"
        />
        <div className="absolute left-1/2 top-1/4 w-full max-w-md -translate-x-1/2 space-y-3 px-3 text-center text-white">
          <h2 className="text-lg font-bold sm:text-2xl lg:text-[30px]/9">
            Turn your ideas into reality.
          </h2>
          <p className="text-sm lg:text-xl/[30px]">
            Encourages making dreams tangible through effort and creativity.
          </p>
        </div>
      </div>
      <div className="flex overflow-y-auto py-2">
        <Card className="m-auto w-full max-w-[400px] space-y-[30px] p-5 shadow-sm md:w-[400px]">
          <CardHeader className="space-y-2">
            <h2 className="text-lg font-semibold text-black lg:text-xl/tight">
              Sign In to your account
            </h2>
            <p className="font-medium leading-tight">Enter your details to proceed</p>
          </CardHeader>
          <CardContent className="space-y-[30px]">
            <div className="grid grid-cols-1 gap-4">
              <Button variant={'outline'} size={'lg'} className="w-full" onClick={handleGoogleLogin}>
                <IconGoogle className="!size-[18px]" />
                Google
              </Button>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-px w-full bg-[#E2E4E9]"></span>
              <p className="shrink-0 font-medium leading-tight">or login with email</p>
              <span className="h-px w-full bg-[#E2E4E9]"></span>
            </div>
            <form className="space-y-[30px]" onSubmit={handleEmailLogin}>
              <div className="relative space-y-3">
                <label className="block font-semibold leading-none text-black">Email address</label>
                <Input
                  type="email"
                  variant={'input-form'}
                  placeholder="username@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  iconRight={<AtSign className="size-[18px]" />}
                />
              </div>
              <div className="relative space-y-3">
                <label className="block font-semibold leading-none text-black">Password</label>
                <Input
                  type="password"
                  variant={'input-form'}
                  placeholder="Abc*********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-danger text-sm">{error}</p>}
              <Link href="/forgot" className="!mt-4 block text-right text-xs font-semibold text-black underline underline-offset-[3px] hover:text-[#3C3C3D]">
                Forgot password?
              </Link>
              <Button type="submit" variant={'default'} size={'lg'} className="w-full">
                Login
              </Button>
              <div className="text-center text-xs font-semibold text-black">
                Don’t have an account?
                <Link href="/register" className="pl-1.5 text-sm underline underline-offset-4 hover:text-[#3C3C3D]">
                  Register
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
