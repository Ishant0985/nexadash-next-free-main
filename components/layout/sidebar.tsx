'use client'
import React, { useEffect, useState } from 'react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import {
    UserRound,
    Users,
    HeartHandshake,
    ChevronDown,
    ClipboardType,
    Component,
    Store,
    Fingerprint,
    Gauge,
    Gem,
    MessageSquareText,
    Minus,
    PanelLeftDashed,
    Phone,
    PieChart,
    RectangleEllipsis,
    Rocket,
    ScrollText,
    Settings,
    Sheet,
    SquareKanban,
    TableProperties,
    X,
    Wallet,
    BarChart3,
    DollarSign,
    Receipt,
    CreditCard,
    ShieldCheck,
    Grid2x2Check,
    DiamondPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import NavLink from '@/components/layout/nav-link'

const Sidebar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const pathName = usePathname()

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
        const mainContent = document.getElementById('main-content')
        if (mainContent) {
            mainContent.style.marginLeft = isSidebarOpen ? '260px' : '60px'
        }
    }

    const toggleSidebarResponsive = () => {
        document.getElementById('sidebar')?.classList.remove('open')
        document.getElementById('overlay')?.classList.toggle('open')
    }

    const isOpen = () => {
        if (['/blog-list', '/blog-details', '/add-blog'].includes(pathName)) {
            return 'item-2'
        } else if (
            [
                '/',
                '/crypto-dashboard',
                '/product-card',
                '/add-product',
                '/product-details',
                '/product-checkout',
            ].includes(pathName)
        ) {
            return 'item-1'
        } else if (
            ['/invoice', '/invoice-details', '/create-invoice'].includes(
                pathName,
            )
        ) {
            return 'item-3'
        } else if (
            [
                '/financial-management',
                '/income-tracking',
                '/expense-tracking',
                '/profit-calculations',
                '/financial-reports',
            ].includes(pathName)
        ) {
            return 'item-finance'
        } else if (
            [
                '/payroll-management',
                '/staff-salaries',
                '/payment-status',
                '/payroll-reports',
            ].includes(pathName)
        ) {
            return 'item-payroll'
        } else if (
            [
                '/accordion-page',
                '/alert',
                '/alert-dialog',
                '/avatar',
                '/breadcrumbs',
                '/buttons',
                '/card-page',
                '/carousel',
                '/dropdown',
                '/empty-stats',
                '/hover-card',
                '/modal',
                '/popover',
                '/scroll-area',
                '/sonner',
                '/tabs',
                '/tag',
                '/toasts',
                '/toggle-group',
                '/tooltip',
            ].includes(pathName)
        ) {
            return 'item-4'
        } else if (
            [
                '/checkbox',
                '/combobox',
                '/command',
                '/form',
                '/inputs',
                '/input-otp',
            ].includes(pathName)
        ) {
            return 'item-5'
        } else {
            return ''
        }
    }

    // Next.js 15 requires cleanup of event listeners to prevent memory leaks
    useEffect(() => {
        const handleRouteChange = () => {
            if (document?.getElementById('overlay')?.classList?.contains('open')) {
                toggleSidebarResponsive()
            }
        }

        // Clean up the side effect when component unmounts
        return () => {
            const mainContent = document.getElementById('main-content')
            if (mainContent) {
                mainContent.style.marginLeft = ''
            }
        }
    }, [])

    // Handle pathname changes
    useEffect(() => {
        if (document?.getElementById('overlay')?.classList?.contains('open')) {
            toggleSidebarResponsive()
        }
    }, [pathName])

    return (
        <>
            <div
                id="overlay"
                className="fixed inset-0 z-30 hidden bg-black/50"
                onClick={toggleSidebarResponsive}
            ></div>
            <Card
                id="sidebar"
                className={`sidebar fixed -left-[260px] top-0 z-40 flex h-screen w-[260px] flex-col rounded-none transition-all duration-300 lg:left-0 lg:top-16 lg:h-[calc(100vh_-_64px)] ${isSidebarOpen ? 'closed' : ''}`}
            >
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="absolute -right-2.5 -top-3.5 hidden size-6 place-content-center rounded-full border border-gray-300 bg-white text-black lg:grid"
                >
                    <ChevronDown
                        className={`h-4 w-4 rotate-90 ${isSidebarOpen ? 'hidden' : ''}`}
                    />
                    <ChevronDown
                        className={`hidden h-4 w-4 -rotate-90 ${isSidebarOpen ? '!block' : ''}`}
                    />
                </button>
                <div className="flex items-start justify-between border-b border-gray-300 px-4 py-5 lg:hidden">
                    <Link href="/" className="inline-block">
                        <Image
                            src="/images/logo.svg"
                            width={145}
                            height={34}
                            alt="Logo"
                            className="h-auto w-auto"
                            priority
                        />
                    </Link>
                    <button type="button" onClick={toggleSidebarResponsive}>
                        <X className="-mr-2 -mt-2 ml-auto size-4 hover:text-black" />
                    </button>
                </div>
                <Accordion
                    type="single"
                    defaultValue={isOpen()}
                    collapsible
                    className="sidemenu grow overflow-y-auto overflow-x-hidden px-2.5 pb-10 pt-2.5 transition-all"
                    key={pathName}
                >
                    <AccordionItem value="item-1" className="p-0 shadow-none">
                        <AccordionTrigger className="nav-link">
                            <Gauge className="size-[18px] shrink-0" />
                            <span>Dashboard</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="submenu space-y-2 pl-12 pr-0">
                                <li>
                                    <NavLink
                                        href="/"
                                        className="mr-5"
                                        isAccordion={true}
                                    >
                                        Sales
                                    </NavLink>
                                </li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <h3 className="mt-2.5 whitespace-nowrap rounded-lg bg-gray-400 px-5 py-2.5 text-xs/tight font-semibold uppercase text-black">
                        <span>Shop</span>
                        <Minus className="hidden h-4 w-5 text-gray" />
                    </h3>
                    <AccordionItem value="item-9" className="p-0 shadow-none">
                        <AccordionTrigger className="nav-link">
                            <Store className="size-[18px] shrink-0" />
                            <span>Inventory</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="submenu space-y-2 pl-12 pr-5">
                                <li>
                                    <NavLink
                                        href="/add-product"
                                        isAccordion={true}
                                    >
                                        Add Product
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        href="/manage-product"
                                        isAccordion={true}
                                    >
                                        Manage Product
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        href="/add-category"
                                        isAccordion={true}
                                    >
                                        Add Category
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        href="/manage-category"
                                        isAccordion={true}
                                    >
                                        Manage Category
                                    </NavLink>
                                </li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-10" className="p-0 shadow-none">
                        <AccordionTrigger className="nav-link">
                            <HeartHandshake className="size-[18px] shrink-0" />
                            <span>Services</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="submenu space-y-2 pl-12 pr-5">
                                <li>
                                    <NavLink
                                        href="/add-services"
                                        isAccordion={true}
                                    >
                                        Add Services
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        href="/manage-services"
                                        isAccordion={true}
                                    >
                                        Manage Services
                                    </NavLink>
                                </li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-finance" className="p-0 shadow-none">
                        <AccordionTrigger className="nav-link">
                            <BarChart3 className="size-[18px] shrink-0" />
                            <span>Financials</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="submenu space-y-2 pl-12 pr-5">
                                <li>
                                    <NavLink
                                        href="/finacials/track/income"
                                        isAccordion={true}
                                    >
                                        Income Tracking
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        href="/finacials/track/expense"
                                        isAccordion={true}
                                    >
                                        Expense Tracking
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        href="/finacials/calculate/profits"
                                        isAccordion={true}
                                    >
                                        Profit Calculations
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        href="/finacials/reports/visuals"
                                        isAccordion={true}
                                    >
                                        Visual Reports
                                    </NavLink>
                                </li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-payroll" className="p-0 shadow-none">
                        <AccordionTrigger className="nav-link">
                            <DollarSign className="size-[18px] shrink-0" />
                            <span>Payrolls</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="submenu space-y-2 pl-12 pr-5">
                                <li>
                                    <NavLink
                                        href="/payroll/salaries"
                                        isAccordion={true}
                                    >
                                        Staff Salaries
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        href="/payroll/payments/status"
                                        isAccordion={true}
                                    >
                                        Payment Status
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        href="/payroll/reports"
                                        isAccordion={true}
                                    >
                                        Payroll Reports
                                    </NavLink>
                                </li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <h3 className="mt-2.5 whitespace-nowrap rounded-lg bg-gray-400 px-5 py-2.5 text-xs/tight font-semibold uppercase text-black">
                        <span>Apps</span>
                        <Minus className="hidden h-4 w-5 text-gray" />
                    </h3>

                    <NavLink
                        href="/chat"
                        className={`nav-link ${pathName === '/chat' ? '!text-black' : ''}`}
                        isProfessionalPlanRoute={false}
                    >
                        <MessageSquareText className="size-[18px] shrink-0" />
                        <span>Chat</span>
                    </NavLink>

                    <NavLink
                        href="/scrumboard"
                        isProfessionalPlanRoute={false}
                        className={`nav-link ${pathName === '/scrumboard' ? '!text-black' : ''}`}
                    >
                        <SquareKanban className="size-[18px] shrink-0" />
                        <span>Scrumboard</span>
                    </NavLink>
                    <AccordionItem value="item-2" className="p-0 shadow-none">
                        <AccordionTrigger
                            className="nav-link"
                        >
                            <SquareKanban className="size-[18px] shrink-0 -rotate-90" />
                            <span>Blog</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="submenu space-y-2 pl-12 pr-5">
                                <li>
                                    <NavLink
                                        href="/blog/list"
                                        isAccordion={true}
                                        isProfessionalPlanRoute={false}
                                    >
                                        Blog-list
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        href="/blog/add"
                                        isAccordion={true}
                                        isProfessionalPlanRoute={false}
                                    >
                                        Add New Blog
                                    </NavLink>
                                </li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3" className="p-0 shadow-none">
                        <AccordionTrigger className="nav-link">
                            <ScrollText className="size-[18px] shrink-0" />
                            <span>Invoice</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="submenu space-y-2 pl-12 pr-5">
                                <li>
                                    <NavLink
                                        href="/invoice/list"
                                        isAccordion={true}
                                        isProfessionalPlanRoute={false}
                                    >
                                        Invoice
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        href="/invoice/create"
                                        isAccordion={true}
                                        isProfessionalPlanRoute={false}
                                    >
                                        Create Invoice
                                    </NavLink>
                                </li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <h3 className="mt-2.5 whitespace-nowrap rounded-lg bg-gray-400 px-5 py-2.5 text-xs/tight font-semibold uppercase text-black">
                        <span>Users</span>
                        <Minus className="hidden h-4 w-5 text-gray" />
                    </h3>

                    <AccordionItem value="item-7" className="p-0 shadow-none">
                        <AccordionTrigger className="nav-link">
                            <UserRound className="size-[18px] shrink-0" />
                            <span>Customers</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="submenu space-y-2 pl-12 pr-5">
                                <li>
                                    <NavLink
                                        href="/customer/add"
                                        isAccordion={true}
                                    >
                                        Add Customers
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        href="/customer/manage"
                                        isAccordion={true}
                                    >
                                        Manage Customers
                                    </NavLink>
                                </li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-8" className="p-0 shadow-none">
                        <AccordionTrigger className="nav-link">
                            <Users className="size-[18px] shrink-0" />
                            <span>Staff</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="submenu space-y-2 pl-12 pr-5">
                                <li>
                                    <NavLink
                                        href="/staff/add"
                                        isAccordion={true}
                                    >
                                        Add Staff
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        href="/staff/manage"
                                        isAccordion={true}
                                    >
                                        Manage Staff
                                    </NavLink>
                                </li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                    {/* ui customization start */}
                    <h3 className="mt-2.5 whitespace-nowrap rounded-lg bg-gray-400 px-5 py-2.5 text-xs/tight font-semibold uppercase text-black">
                        <span>UI Customization</span>
                    </h3>
                    <Accordion type="single" collapsible>
                        {/* 1st Accordion: Landing Page */}
                        <AccordionItem value="landing-page" className="p-0 shadow-none">
                            <AccordionTrigger className="nav-link">
                            <Grid2x2Check   className="size-[18px] shrink-0" />
                                <span>Landing Page</span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ul className="submenu space-y-2 pl-12 pr-5">
                                    <li>
                                        <NavLink href="/customize/landing/hero" isAccordion={true}>
                                            Hero Section
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink href="/customize/landing/features" isAccordion={true}>
                                            Features
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink href="/customize/landing/video" isAccordion={true}>
                                            Video
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink href="/customize/landing/testimonials" isAccordion={true}>
                                            Testimonials
                                        </NavLink>
                                    </li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        {/* 2nd Accordion: Policies */}
                        <AccordionItem value="policies" className="p-0 shadow-none">
                            <AccordionTrigger className="nav-link">
                                <ShieldCheck  className="size-[18px] shrink-0" />
                                <span>Policies</span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ul className="submenu space-y-2 pl-12 pr-5">
                                    <li>
                                        <NavLink href="/customize/tos" isAccordion={true}>
                                            Terms &amp; Condition's
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink href="/customize/privacy" isAccordion={true}>
                                            Privacy &amp; Policy
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink href="/customize/cookies" isAccordion={true}>
                                            Cookies Policy
                                        </NavLink>
                                    </li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        {/* 3rd Accordion: Other */}
                        <AccordionItem value="other" className="p-0 shadow-none">
                            <AccordionTrigger className="nav-link">
                                <DiamondPlus  className="size-[18px] shrink-0" />
                                <span>Other</span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ul className="submenu space-y-2 pl-12 pr-5">
                                    <li>
                                        <NavLink href="/customize/services" isAccordion={true}>
                                            Service page
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink href="/customize/about" isAccordion={true}>
                                            About Us page
                                        </NavLink>
                                    </li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                    {/* ui customization end */}    

                    <h3 className="mt-2.5 whitespace-nowrap rounded-lg bg-gray-400 px-5 py-2.5 text-xs/tight font-semibold uppercase text-black">
                        <span>Pages</span>
                        <Minus className="hidden h-4 w-5 text-gray" />
                    </h3>

                    <NavLink
                        href="/setting"
                        className={`nav-link ${pathName === '/setting' ? '!text-black' : ''}`}
                    >
                        <Settings className="size-[18px] shrink-0" />
                        <span>Settings</span>
                    </NavLink>

                    <AccordionItem value="item-6" className="p-0 shadow-none">
                        <AccordionTrigger className="nav-link">
                            <Fingerprint className="size-[18px] shrink-0" />
                            <span>Authentication</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="submenu space-y-2 pl-12 pr-5">
                                <li>
                                    <NavLink
                                        href="/login"
                                        target="_blank"
                                        isAccordion={true}
                                    >
                                        Login
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        href="/register"
                                        target="_blank"
                                        isAccordion={true}
                                    >
                                        Register
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        href="/forgot"
                                        target="_blank"
                                        isAccordion={true}
                                    >
                                        Forgot
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        href="/password"
                                        target="_blank"
                                        isAccordion={true}
                                    >
                                        Password
                                    </NavLink>
                                </li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <NavLink
                        href="/contact-us"
                        className={`nav-link ${pathName === '/contact-us' ? '!text-black' : ''}`}
                    >
                        <Phone className="size-[18px] shrink-0" />
                        <span>Contact Us</span>
                    </NavLink>
                </Accordion>
            </Card>
        </>
    )
}

export default Sidebar