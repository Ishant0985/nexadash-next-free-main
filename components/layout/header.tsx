'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Bell,
    CalendarCheck,
    ChevronDown,
    CircleX,
    Headphones,
    Info,
    LogOut,
    Menu,
    MessageSquareText,
    UserCog,
} from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Firebase imports for auth and Firestore profile loading
import { User, onAuthStateChanged } from 'firebase/auth'
import { DocumentData, doc, getDoc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore'
import { getToken, onMessage } from 'firebase/messaging'
import { auth, db, messaging } from '@/firebaseClient' // Update path as needed

// Define types for better type safety
type NotificationType = {
    id: string | number;
    profile: string;
    user: string;
    message: string;
    time: string;
    shop: string;
    read?: boolean;
}

type UserProfileType = {
    displayName: string;
    photoURL: string;
    email?: string;
}

const Header = () => {
    const [date, setDate] = useState<Date>()
    const pathName = usePathname()
    const [loading, setLoading] = useState(true)
    const [notifications, setNotifications] = useState<NotificationType[]>([])
    const [currentUser, setCurrentUser] = useState<UserProfileType>({
        displayName: 'User',
        photoURL: '/images/default-profile.png',
    })

    // Toggle sidebar function
    const toggleSidebar = () => {
        document.getElementById('sidebar')?.classList.toggle('open')
        document.getElementById('overlay')?.classList.toggle('open')
    }

    // Remove a notification by id
    const removeNotification = (id: string | number) => {
        setNotifications((prev) =>
            prev.filter((notification) => notification.id !== id)
        )
    }

    // Mark all notifications as read
    const showAllNotifications = () => {
        // Here you would typically make an API call to mark notifications as read
        console.log('Showing all notifications')
    }

    // Load user profile from Firestore
    const loadUserProfile = async (user: User) => {
        try {
            const userDocRef = doc(db, 'users', user.uid)
            const userDocSnap = await getDoc(userDocRef)
            
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as DocumentData
                setCurrentUser({
                    displayName: userData.displayName || user.displayName || 'User',
                    photoURL: userData.photoURL || user.photoURL || '/images/default-profile.png',
                    email: userData.email || user.email || '',
                })
            } else {
                // Fallback to auth user details if no Firestore document
                setCurrentUser({
                    displayName: user.displayName || 'User',
                    photoURL: user.photoURL || '/images/default-profile.png',
                    email: user.email || '',
                })
            }
        } catch (error) {
            console.error('Error loading user profile:', error)
            // Fallback to basic info on error
            setCurrentUser({
                displayName: user.displayName || 'User',
                photoURL: user.photoURL || '/images/default-profile.png',
                email: user.email || '',
            })
        }
    }

    // Register device for FCM
    const registerForPushNotifications = async (user: User) => {
        try {
            if (!messaging) {
                console.log('Firebase messaging not available in this environment')
                return
            }

            // Request permission and get token
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
                const token = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                })
                
                // Store the token in Firestore for this user
                // This would typically be done via an API endpoint for security
                console.log('FCM Token obtained:', token)
            }
        } catch (error) {
            console.error('Failed to register for push notifications:', error)
        }
    }

    // Subscribe to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true)
            if (user) {
                await loadUserProfile(user)
                await registerForPushNotifications(user)
            } else {
                // Handle logged out state
                setCurrentUser({
                    displayName: 'Guest',
                    photoURL: '/images/default-profile.png',
                })
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    // Subscribe to notifications from Firestore
    useEffect(() => {
        // Only listen for notifications if we have an authenticated user
        if (auth.currentUser) {
            const userId = auth.currentUser.uid
            const notificationsRef = collection(db, 'users', userId, 'notifications')
            const notificationsQuery = query(
                notificationsRef,
                orderBy('createdAt', 'desc'),
                limit(10)
            )

            // If user is logged in, fetch notifications
            if (auth.currentUser) {
                // Listen for new notifications
                const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
                    try {
                        const newNotifications: NotificationType[] = []
                        snapshot.docs.forEach((doc) => {
                            newNotifications.push({ id: doc.id, ...doc.data() } as NotificationType)
                        })
                        setNotifications(newNotifications)
                    } catch (error) {
                        console.error('Error fetching notifications:', error)
                    }
                })

                return () => unsubscribe()
            }
        }
    }, [])

    // Setup Firebase Cloud Messaging listener for foreground notifications
    useEffect(() => {
        if (!messaging) return;
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('FCM Message received:', payload);
          // Add the incoming notification to the state.
          setNotifications((prev) => [
            {
              id: Date.now(),
              profile: '/images/avatar.svg',
              user: payload.notification?.title || 'New Notification',
              message: payload.notification?.body || '',
              time: 'Just now',
              shop: '',
            },
            ...prev,
          ]);
        });
        return () => unsubscribe();
      }, []);      

    // Helper function to format notification time
    const formatNotificationTime = (date?: Date): string => {
        if (!date) return 'Unknown time'
        
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        
        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
        
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
        
        const diffDays = Math.floor(diffHours / 24)
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
        
        return format(date, 'MMM d, yyyy')
    }

    // Display a loading state while fetching user data
    if (loading) {
        return (
            <header className="fixed inset-x-0 top-0 z-30 bg-white px-4 py-[15px] shadow-sm lg:px-5">
                <div className="flex items-center justify-between gap-5">
                    <div className="animate-pulse h-8 w-32 bg-gray-200 rounded-md"></div>
                    <div className="animate-pulse h-8 w-24 bg-gray-200 rounded-md"></div>
                </div>
            </header>
        )
    }

    return (
        <header className="fixed inset-x-0 top-0 z-30 bg-white px-4 py-[15px] shadow-sm lg:px-5">
            <div className="flex items-center justify-between gap-5">
                <Link href="/" className="inline-block shrink-0 lg:ml-2.5">
                    <Image
                        src="/images/logo.svg"
                        width={145}
                        height={34}
                        alt="Logo"
                        className="h-auto w-32 lg:w-[145px]"
                        priority
                    />
                </Link>

                <div className="inline-flex items-center gap-3 sm:gap-5">
                    <Link
                        href="/"
                        className="hidden duration-300 hover:opacity-80 lg:block"
                    >
                        <MessageSquareText className="h-5 w-5" />
                    </Link>
                    <div className="order-2 lg:order-none">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="relative duration-300 hover:opacity-80"
                                    aria-label="Notifications"
                                >
                                    <Bell className="h-5 w-5" />
                                    {!!notifications?.length && (
                                        <Badge
                                            variant="primary"
                                            className="absolute -right-0.5 -top-0.5 grid h-3 min-w-3 place-content-center px-1 text-[9px]"
                                        >
                                            {notifications.length}
                                        </Badge>
                                    )}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                sideOffset={12}
                                className="mr-4 w-full max-w-80 divide-y divide-gray-300 p-0"
                                align="end"
                            >
                                <div className="rounded-t-lg bg-gray-100 p-3 text-black">
                                    <h2 className="font-semibold leading-5">
                                        Notifications
                                    </h2>
                                </div>
                                <div className="max-h-64 divide-y divide-gray-300 overflow-y-auto">
                                    {!notifications?.length ? (
                                        <div className="!grid min-h-[255px] w-full min-w-72 place-content-center p-10 text-lg hover:!bg-transparent sm:min-w-80">
                                            <div className="mx-auto mb-4 rounded-full text-primary">
                                                <Info className="h-10 w-10" />
                                            </div>
                                            No notifications available.
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className="flex items-start gap-3 px-3 py-5 hover:bg-gray-100"
                                            >
                                                <Link
                                                    href="#"
                                                    className="size-9 shrink-0 overflow-hidden rounded-lg"
                                                >
                                                    <Image
                                                        alt="Profile"
                                                        width={36}
                                                        height={36}
                                                        className="h-full w-full object-cover"
                                                        src={notification.profile.startsWith('/') 
                                                            ? notification.profile 
                                                            : `/images/${notification.profile}`}
                                                    />
                                                </Link>
                                                <div className="grow space-y-2.5">
                                                    <p className="text-xs/5 font-medium text-gray-500">
                                                        <span className="font-bold text-black">
                                                            {notification.user}
                                                        </span>{' '}
                                                        <span
                                                            dangerouslySetInnerHTML={{
                                                                __html: notification.message,
                                                            }}
                                                        ></span>
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2.5 text-xs/4 font-medium text-gray-500">
                                                        <span>
                                                            {notification.time}
                                                        </span>
                                                        {notification.shop && (
                                                            <>
                                                                <span className="size-1 shrink-0 rounded-full bg-primary"></span>
                                                                <span>
                                                                    {notification.shop}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="shrink-0 text-gray-500 transition hover:text-red-500"
                                                    onClick={() =>
                                                        removeNotification(
                                                            notification.id,
                                                        )
                                                    }
                                                    aria-label="Dismiss notification"
                                                >
                                                    <CircleX className="size-5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {!!notifications?.length && (
                                    <div className="px-5 py-2.5">
                                        <Button 
                                            className="w-full"
                                            onClick={showAllNotifications}
                                        >
                                            Show All Notifications
                                        </Button>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="order-1 lg:order-none">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="text-wrap p-0 shadow-none ring-0 lg:px-2.5 lg:py-2 lg:shadow-sm lg:ring-1"
                                >
                                    <CalendarCheck className="!size-5 lg:!size-4" />
                                    {date ? (
                                        format(date, 'PPP')
                                    ) : (
                                        <span className="hidden lg:block">
                                            Schedule
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="!w-auto p-0" align="end">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="hidden lg:block">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="group flex cursor-pointer items-center gap-2.5 rounded-lg">
                                    <div className="size-8 shrink-0 overflow-hidden rounded-full">
                                        <Image
                                            src={currentUser.photoURL}
                                            width={32}
                                            height={32}
                                            className="h-full w-full object-cover"
                                            alt="Profile"
                                        />
                                    </div>
                                    <div className="hidden space-y-1 lg:block">
                                        <h5 className="line-clamp-1 text-[10px]/3 font-semibold">
                                            Welcome back 👋
                                        </h5>
                                        <h2 className="line-clamp-1 text-xs font-bold text-black">
                                            {currentUser.displayName}
                                        </h2>
                                    </div>
                                    <ChevronDown className="h-4 w-4 shrink-0 duration-300" />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                sideOffset={12}
                                className="min-w-[200px] space-y-1 rounded-lg p-1.5 text-sm font-medium"
                            >
                                <DropdownMenuItem className="p-0">
                                    <Link
                                        href="/setting"
                                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 ${pathName === '/setting' ? 'bg-gray-400 text-black' : ''}`}
                                    >
                                        <UserCog className="size-[18px] shrink-0" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="p-0">
                                    <Link
                                        href="/contact-us"
                                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 ${pathName === '/contact-us' ? 'bg-gray-400 text-black' : ''}`}
                                    >
                                        <Headphones className="size-[18px] shrink-0" />
                                        Help Center
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="p-0">
                                    <Link
                                        href="/login"
                                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 ${pathName === '/login' ? 'bg-gray-400 text-black' : ''}`}
                                    >
                                        <LogOut className="size-[18px] shrink-0" />
                                        Sign out
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <button
                        type="button"
                        className="order-3 duration-300 hover:opacity-80 lg:hidden"
                        onClick={toggleSidebar}
                        aria-label="Toggle sidebar"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    )
}

export default Header