'use client'
import {LottiePlayer} from "@/components/LottiePlayer";
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/firebaseClient'
import { doc, getDoc } from 'firebase/firestore'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Define public routes that do not require authentication.
    const publicPaths = ['/login', '/register', '/forgot', '/password']
    if (pathname && publicPaths.includes(pathname)) {
      setAuthorized(true)
      setLoading(false)
      return
    }

    // Listen for Firebase auth changes.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch the user's document from Firestore.
        const userDocSnap = await getDoc(doc(db, 'users', user.uid))
        if (userDocSnap.exists()) {
          const data = userDocSnap.data()
          // Allow access only if the user is an admin or staff.
          if (data.usertype === 'admin' || data.usertype === 'staff') {
            setAuthorized(true)
          } else {
            setAuthorized(false)
          }
        } else {
          setAuthorized(false)
        }
      } else {
        setAuthorized(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [pathname])

  if (loading) {
    return <div className="flex flex-col items-center justify-center max-h-screen space-y-6"><LottiePlayer /></div>
  }

  if (!authorized) {
    return <div>Permission Denied</div>
  }

  return <>{children}</>
}
