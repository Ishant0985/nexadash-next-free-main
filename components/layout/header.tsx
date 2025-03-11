'use client'
import { useState, useEffect, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePathname } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebaseClient'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

// Custom button component for notification trigger
const NotificationButton = forwardRef<HTMLButtonElement, { hasNotifications: boolean }>(
  ({ hasNotifications }, ref) => (
    <button
      type="button"
      className="relative duration-300 hover:opacity-80 cursor-pointer"
      ref={ref}
    >
      <Bell className="h-5 w-5" />
      {hasNotifications && (
        <Badge
          variant={'primary'}
          size={'number'}
          className="absolute -right-0.5 -top-0.5 grid h-3 min-w-3 place-content-center px-1 text-[9px]"
        >
          {hasNotifications ? '!' : '0'}
        </Badge>
      )}
    </button>
  )
)
NotificationButton.displayName = 'NotificationButton'

// Custom component for user dropdown trigger
const UserDropdownTrigger = forwardRef<HTMLButtonElement, { 
  photoURL: string, 
  displayName: string 
}>(({ photoURL, displayName }, ref) => (
  <button 
    type="button"
    className="group flex cursor-pointer items-center gap-2.5 rounded-lg [&[data-state=open]>button>svg]:rotate-180"
    ref={ref}
  >
    <div className="size-8 shrink-0 overflow-hidden rounded-full">
      <Image
        src={photoURL}
        width={32}
        height={32}
        className="h-full w-full object-cover"
        alt="Profile Img"
      />
    </div>
    <div className="hidden space-y-1 lg:block">
      <h5 className="line-clamp-1 text-[10px]/3 font-semibold">
        Welcome back 👋
      </h5>
      <h2 className="line-clamp-1 text-xs font-bold text-black">
        {displayName}
      </h2>
    </div>
    <span
      className="-ml-1 mt-auto text-black transition group-hover:opacity-70"
    >
      <ChevronDown className="h-4 w-4 shrink-0 duration-300" />
    </span>
  </button>
))
UserDropdownTrigger.displayName = 'UserDropdownTrigger'

const Header = () => {
  const [date, setDate] = useState<Date | undefined>()
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      profile: 'avatar.svg',
      user: 'Brooklyn Simmons',
      message:
        'recommended this online shop to byu electronics, <strong class="text-black">Advantage Electric</strong>',
      time: '5 minutes ago',
      shop: 'Advantage Electric',
    },
    {
      id: 2,
      profile: 'avatar-two.svg',
      user: 'Sophia Williams',
      message:
        'invites you ABC.fig file with you, <strong class="text-black">check item now</strong>',
      time: '10 minutes ago',
      shop: 'New item',
    },
    {
      id: 3,
      profile: 'avatar-three.svg',
      user: 'Ava Davis',
      message:
        'changed <strong class="text-black">the cosmetic payment</strong> due date to Sunday 05 March 2023',
      time: '15 minutes ago',
      shop: 'New item',
    },
  ])
  const [currentUser, setCurrentUser] = useState<{
    displayName: string
    photoURL: string
  }>({
    displayName: 'User',
    photoURL: '/images/avatar.svg',
  })

  const pathName = usePathname()

  // Subscribe to auth state changes and load user profile from Firestore.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid)
          const userDocSnap = await getDoc(userDocRef)
          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as {
              displayName?: string
              photoURL?: string
            }
            setCurrentUser({
              displayName: data.displayName || user.displayName || 'User',
              photoURL:
                data.photoURL ||
                user.photoURL ||
                '/images/avatar.svg',
            })
          } else {
            // Fallback to auth user details if no Firestore document found.
            setCurrentUser({
              displayName: user.displayName || 'User',
              photoURL: user.photoURL || '/images/default-profile.png',
            })
          }
        } catch (error) {
          console.error('Error loading user profile:', error)
          setCurrentUser({
            displayName: user.displayName || 'User',
            photoURL: user.photoURL || '/images/avatar.svg',
          })
        }
      }
    })

    return () => unsubscribe()
  }, [])

  const toggleSidebar = () => {
    document.getElementById('sidebar')?.classList.toggle('open')
    document.getElementById('overlay')?.classList.toggle('open')
  }

  const removeNotification = (id: number) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    )
  }

  return (
    <header className="fixed inset-x-0 top-0 z-30 bg-white px-4 py-[15px] shadow-sm lg:px-5">
      <div className="flex items-center justify-between gap-5">
        <Link href="/" className="inline-block shrink-0 lg:ml-2.5">
          <Image
            src="/images/logo.svg"
            width={145}
            height={45}
            alt="Logo"
            className="h-auto w-32 lg:w-[145px]"
          />
        </Link>

        <div className="inline-flex items-center gap-3 sm:gap-5">
          <Link
            href="/"
            target="_blank"
            className="hidden duration-300 hover:opacity-80 lg:block"
          >
            <MessageSquareText className="h-5 w-5" />
          </Link>
          <div className="order-2 lg:order-none">
            <Popover>
              <PopoverTrigger asChild={true}>
                <NotificationButton hasNotifications={!!notifications?.length} />
              </PopoverTrigger>
              <PopoverContent
                sideOffset={12}
                className="mr-4 w-full max-w-80 divide-y divide-gray-300 p-0"
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
                      No data available.
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
                            className="h-full object-cover"
                            src={`/images/${notification.profile}`}
                          />
                        </Link>
                        <div className="grow space-y-2.5">
                          <p className="text-xs/5 font-medium text-gray">
                            <span className="font-bold text-black">
                              {notification.user}
                            </span>{' '}
                            <span
                              dangerouslySetInnerHTML={{
                                __html: notification.message,
                              }}
                            ></span>
                          </p>
                          <div className="flex flex-wrap items-center gap-2.5 text-xs/4 font-medium text-gray">
                            <span>
                              {notification.time}
                            </span>
                            <span className="size-1 shrink-0 rounded-full bg-primary"></span>
                            <span>
                              {notification.shop}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 text-gray-500 transition hover:text-danger"
                          onClick={() =>
                            removeNotification(
                              notification.id
                            )
                          }
                        >
                          <CircleX className="size-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                {!!notifications?.length && (
                  <div className="px-5 py-2.5">
                    <Button className="w-full">
                      Show All Notifications
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
          <div className="order-1 lg:order-none">
            <Popover>
              <PopoverTrigger asChild={true}>
                <div
                  className={cn(
                    buttonVariants({ variant: 'outline-general' }),
                    "text-wrap p-0 shadow-none ring-0 lg:px-2.5 lg:py-2 lg:shadow-sm lg:ring-1"
                  )}
                >
                  <CalendarCheck className="!size-5 lg:!size-4" />
                  {date ? (
                    format(date, 'PPP')
                  ) : (
                    <span className="hidden lg:block">
                      Schedule
                    </span>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="!w-auto p-0">
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
              <DropdownMenuTrigger asChild={true}>
                <UserDropdownTrigger 
                  photoURL={currentUser.photoURL} 
                  displayName={currentUser.displayName} 
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={12}
                className="min-w-[200px] space-y-1 rounded-lg p-1.5 text-sm font-medium"
              >
                <DropdownMenuItem className="p-0">
                  <Link
                    href="/setting"
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 ${pathName === '/setting' && '!bg-gray-400 !text-black'}`}
                  >
                    <UserCog className="size-[18px] shrink-0" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-0">
                  <Link
                    href="/contact-us"
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 ${pathName === '/contact-us' && '!bg-gray-400 !text-black'}`}
                  >
                    <Headphones className="size-[18px] shrink-0" />
                    Help Center
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-0">
                  <Link
                    href="/login"
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 ${pathName === '/login' && '!bg-gray-400 !text-black'}`}
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
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
