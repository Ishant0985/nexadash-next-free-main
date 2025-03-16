'use client'

import { useEffect, useState } from 'react'
import PageHeading from '@/components/layout/page-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    ArrowRight,
    CalendarCheck,
    ChevronDown,
    Download,
    Ellipsis,
    TrendingDown,
    TrendingUp,
    Users,
    PieChart,
    DollarSign,
    TrendingDown as Expense,
    BarChart2,
} from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import IconChart from '@/components/icons/icon-chart'
import IconGoalFlag from '@/components/icons/icon-goal-flag'
import IconTrophy from '@/components/icons/icon-trophy'
import IconFile from '@/components/icons/icon-file'
import Link from 'next/link'
import { OnlineSalesAreaChart } from '@/components/custom/charts/online-sales-area-chart'
import { DailySalesBarChart } from '@/components/custom/charts/daily-sales-bar-chart'
import { RadarAreaChart } from '@/components/custom/charts/radar-area-chart'
import { DistributionRadialStackedChart } from '@/components/custom/charts/distribution-radial-stacked-chart'
import { DataTable } from '@/components/custom/table/data-table'
import {
    dashboardcolumns,
    ITable,
} from '@/components/custom/table/dashboard-columns'

// Firebase imports
import { db } from '@/firebaseClient'
import { admin } from '@/firebaseAdmin'
import {
    collection,
    getDocs,
    query,
    orderBy,
    where,
    limit,
    Timestamp,
} from 'firebase/firestore'

// Dashboard analytics types
interface AnalyticsData {
    totalUsers: number
    totalCustomers: number
    totalRevenue: number
    totalProfit: number
    totalExpenses: number
    totalProducts: number
    totalServices: number
    userGrowthRate: number
    revenueGrowthRate: number
    profitGrowthRate: number
    salesByMonth: { month: string; value: number }[]
    dailySales: { day: string; value: number }[]
    topSellingProducts: { name: string; value: number }[]
    categoryDistribution: { category: string; value: number }[]
    recentTransactions: ITable[]
}

const Home = () => {
    const [date, setDate] = useState<Date>()
    const [mainDate, setMainDate] = useState<Date>()
    const [isLoading, setIsLoading] = useState(true)
    const [analytics, setAnalytics] = useState<AnalyticsData>({
        totalUsers: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        totalProfit: 0,
        totalExpenses: 0,
        totalProducts: 0,
        totalServices: 0,
        userGrowthRate: 0,
        revenueGrowthRate: 0,
        profitGrowthRate: 0,
        salesByMonth: [],
        dailySales: [],
        topSellingProducts: [],
        categoryDistribution: [],
        recentTransactions: []
    })

    // Fetch analytics data
    useEffect(() => {
        const fetchAnalyticsData = async () => {
            setIsLoading(true)
            try {
                // Get total users count
                const usersQuery = query(collection(db, 'users'))
                const usersSnapshot = await getDocs(usersQuery)
                const totalUsers = usersSnapshot.size

                // Get customers data
                const customersQuery = query(collection(db, 'customers'))
                const customersSnapshot = await getDocs(customersQuery)
                const totalCustomers = customersSnapshot.size

                // Get products data
                const productsQuery = query(collection(db, 'products'))
                const productsSnapshot = await getDocs(productsQuery)
                const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                const totalProducts = products.length

                // Get services data
                const servicesQuery = query(collection(db, 'services'))
                const servicesSnapshot = await getDocs(servicesQuery)
                const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                const totalServices = services.length

                // Get invoices for revenue calculation
                const invoicesQuery = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'))
                const invoicesSnapshot = await getDocs(invoicesQuery)
                const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                
                // Calculate total revenue
                const totalRevenue = invoices.reduce((sum, invoice) => {
                    const total = (invoice as any).totalAmount || 0
                    return sum + total
                }, 0)

                // Calculate profit (assuming 30% profit margin if not specified in data)
                const totalProfit = invoices.reduce((sum, invoice) => {
                    const total = (invoice as any).totalAmount || 0
                    const profit = (invoice as any).profit || (total * 0.3) // Assuming 30% profit if not specified
                    return sum + profit
                }, 0)

                // Calculate expenses (revenue - profit)
                const totalExpenses = totalRevenue - totalProfit

                // Get recent transactions
                const recentTransactionsQuery = query(
                    collection(db, 'invoices'), 
                    orderBy('createdAt', 'desc'),
                    limit(5)
                )
                const recentTransactionsSnapshot = await getDocs(recentTransactionsQuery)
                
                // Create recent transactions list for table
                const recentTransactions: ITable[] = []
                
                // Need to get customer data for each transaction
                const customersMap = new Map()
                customersSnapshot.docs.forEach(doc => {
                    customersMap.set(doc.id, { id: doc.id, ...doc.data() })
                })
                
                // Format recent transactions data for table
                for (const doc of recentTransactionsSnapshot.docs) {
                    const invoice = doc.data()
                    
                    // Get customer
                    const customer = customersMap.get(invoice.customer) || { name: 'Unknown', email: '' }
                    
                    recentTransactions.push({
                        id: doc.id,
            receptionist: {
                            image: customer.photoURL || '/images/avatar.svg',
                            name: customer.name || 'Unknown',
                        },
                        sales_id: `#₹{invoice.invoiceNumber || doc.id.substring(0, 6)}`,
                        amount: `₹₹{invoice.totalAmount?.toFixed(2) || '0.00'}`,
                        due_date: invoice.dueDate ? new Date(invoice.dueDate.seconds * 1000).toLocaleDateString() : 'N/A',
                        status: invoice.status === 'paid' ? 'done' : invoice.status === 'pending' ? 'pending' : 'cancelled',
                    })
                }

                // Calculate monthly sales for chart
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                const salesByMonth = Array(12).fill(0).map((_, i) => ({ month: monthNames[i], value: 0 }))
                invoices.forEach(invoice => {
                    const invoiceData = invoice as any;
                    if (invoiceData?.createdAt?.seconds && invoiceData?.totalAmount) {
                        const date = new Date(invoiceData.createdAt.seconds * 1000)
                        const month = date.getMonth()
                        salesByMonth[month].value += invoiceData.totalAmount
                    }
                })

                // Calculate daily sales for the last 7 days
                const today = new Date()
                const dailySales: { day: string; value: number }[] = []
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(today)
                    date.setDate(today.getDate() - i)
                    const dayName = format(date, 'EEE')
                    
                    // Initialize with zero
                    dailySales.push({ day: dayName, value: 0 })
                }
                
                // Calculate sales for each day
                invoices.forEach(invoice => {
                    if ((invoice as any).createdAt && (invoice as any).totalAmount) {
                        const invoiceDate = new Date((invoice as any).createdAt.seconds * 1000)
                        const diffTime = Math.abs(today.getTime() - invoiceDate.getTime())
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                        if (diffDays <= 7) {
                            const dayIndex = 7 - diffDays
                            if (dayIndex >= 0 && dayIndex < 7) {
                                dailySales[dayIndex].value += (invoice as any).totalAmount
                            }
                        }
                    }
                })

                // Calculate top selling products
                const productSales = new Map()
                
                invoices.forEach(invoice => {
                    if ((invoice as any).items && Array.isArray((invoice as any).items)) {
                        (invoice as any).items.forEach((item: any) => {
                            if (item.productId) {
                                const currentValue = productSales.get(item.productId) || 0
                                productSales.set(item.productId, currentValue + (item.quantity || 1))
                            }
                        })
                    }
                })
                
                // Create top selling products list
                const topSellingProducts = []
                for (const [productId, quantity] of productSales.entries()) {
                    const product = products.find(p => p.id === productId)
                    if (product) {
                        topSellingProducts.push({
                            name: (product as any).name || 'Unknown Product',
                            value: quantity
                        })
                    }
                }
                
                // Sort and limit to top 5
                topSellingProducts.sort((a, b) => b.value - a.value)
                const top5Products = topSellingProducts.slice(0, 5)

                // Calculate category distribution
                const categoryMap = new Map()
                
                products.forEach(product => {
                    if ((product as any).category) {
                        const currentValue = categoryMap.get((product as any).category) || 0
                        categoryMap.set((product as any).category, currentValue + 1)
                    }
                })
                
                const categoryDistribution = []
                for (const [categoryId, count] of categoryMap.entries()) {
                    categoryDistribution.push({
                        category: categoryId,
                        value: count
                    })
                }

                // Calculate growth rates (comparing to previous month)
                // For this example, we'll use random growth rates
                const userGrowthRate = 12.5
                const revenueGrowthRate = 15.15
                const profitGrowthRate = 10.8

                // Set analytics data
                setAnalytics({
                    totalUsers,
                    totalCustomers,
                    totalRevenue,
                    totalProfit,
                    totalExpenses,
                    totalProducts,
                    totalServices,
                    userGrowthRate,
                    revenueGrowthRate,
                    profitGrowthRate,
                    salesByMonth,
                    dailySales,
                    topSellingProducts: top5Products,
                    categoryDistribution,
                    recentTransactions
                })
            } catch (error) {
                console.error('Error fetching analytics data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAnalyticsData()
    }, [])

    return (
        <div className="relative space-y-4">
            <PageHeading heading={'Shop Analytics Dashboard'} />

            <span className="absolute -left-4 -right-4 -top-8 -z-[1]">
                <Image
                    src="/images/home-bg.png"
                    width={1180}
                    height={200}
                    alt="home-bg"
                    className="h-52 w-full xl:h-auto"
                />
            </span>

            <div className="min-h-[calc(100vh_-_160px)] w-full">
                <div className="flex flex-col gap-4 font-semibold xl:flex-row">
                    <Card className="col-span-3 w-full grow shadow-none">
                        <CardContent className="flex h-full grow flex-col">
                            <div className="flex grow flex-col gap-5 p-5 sm:flex-row sm:justify-between">
                                <div className="shrink-0 space-y-5 sm:space-y-12">
                                    <div className="space-y-5">
                                        <h2 className="text-base/5 text-black">
                                            Revenue Overview
                                        </h2>
                                        <p className="!mt-1.5 text-xs/tight font-medium">
                                            10 March 2024 - 10 April 2024
                                        </p>
                                        <div className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-2 text-xs/tight text-black transition hover:bg-gray-200">
                                            <CalendarCheck className="size-4 shrink-0" />
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <div>
                                                        {date ? (
                                                            format(date, 'PP')
                                                        ) : (
                                                            <span>
                                                                10 Mar, 2024
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
                                            <span>-</span>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <div>
                                                        {mainDate ? (
                                                            format(mainDate, 'PPP')
                                                        ) : (
                                                            <span>
                                                                10 Apr, 2024
                                                            </span>
                                                        )}
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="!w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={mainDate}
                                                        onSelect={setMainDate}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                    <div className="space-y-4 rounded-lg bg-gray-200 p-5">
                                        <h3 className="text-[26px]/8 text-black">
                                            ₹{isLoading ? '0.00' : analytics.totalRevenue.toFixed(2)}
                                        </h3>
                                        <div className="flex items-center gap-2.5">
                                            <Badge
                                                variant={'green'}
                                                size={'small'}
                                                className="rounded-lg font-semibold"
                                            >
                                                <TrendingUp />
                                                {analytics.revenueGrowthRate}%
                                            </Badge>
                                            <span className="text-xs/tight">
                                                + ₹{(analytics.totalRevenue * analytics.revenueGrowthRate / 100).toFixed(2)} Increased
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="m-auto grow">
                                    <RadarAreaChart
                                        cardContentClassName="max-h-[354px]"
                                        isShowTitle={false}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-y divide-gray-300 border-t border-gray-300 sm:grid-cols-4 sm:divide-y-0">
                                <div className="space-y-5 bg-gradient-to-b from-success/[2%] to-success/0 px-4 py-6 sm:px-[18px] sm:py-8">
                                    <Users className="h-10 w-10 text-success" />
                                    <p className="leading-tight">
                                        Total Users
                                    </p>
                                    <p className="!mt-3 text-xl/6 text-black">
                                        {analytics.totalUsers}
                                    </p>
                                </div>
                                <div className="space-y-5 !border-t-0 bg-gradient-to-b from-danger/[2%] to-danger/0 px-4 py-6 sm:px-[18px] sm:py-8">
                                    <DollarSign className="h-10 w-10 text-danger" />
                                    <p className="leading-tight">
                                        Total Profit
                                    </p>
                                    <p className="!mt-3 text-xl/6 text-black">
                                        ₹{isLoading ? '0.00' : analytics.totalProfit.toFixed(2)}
                                    </p>
                                </div>
                                <div className="space-y-5 bg-gradient-to-b from-warning/[2%] to-warning/0 px-4 py-6 sm:px-[18px] sm:py-8">
                                    <Expense className="h-10 w-10 text-warning" />
                                    <p className="leading-tight">
                                        Total Expenses
                                    </p>
                                    <p className="!mt-3 text-xl/6 text-black">
                                        ₹{isLoading ? '0.00' : analytics.totalExpenses.toFixed(2)}
                                    </p>
                                </div>
                                <div className="space-y-5 bg-gradient-to-b from-primary/[2%] to-primary/0 px-4 py-6 sm:px-[18px] sm:py-8">
                                    <BarChart2 className="h-10 w-10 text-primary" />
                                    <p className="leading-tight">
                                        Inventory Items
                                    </p>
                                    <p className="!mt-3 text-xl/6 text-black">
                                        {analytics.totalProducts + analytics.totalServices}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="grid shrink-0 gap-4 sm:grid-cols-2 xl:w-[372px] xl:grid-cols-1">
                        <OnlineSalesAreaChart 
                            isShowTitle={false} 
                            customData={analytics.salesByMonth}
                            customTitle="Monthly Sales"
                            customAmount={analytics.totalRevenue}
                            customGrowth={analytics.revenueGrowthRate}
                        />

                        <DailySalesBarChart 
                            isShowTitle={true}
                            customData={analytics.dailySales}
                        />
                    </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <Card className="xl:col-span-2">
                        <CardHeader className="px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base/5 font-semibold text-black">
                                    Recent Transactions
                                </h3>
                                <Button
                                    className="group rounded-3xl px-3 py-1 text-xs text-gray-600 transition hover:border-primary hover:text-primary"
                                    size="sm"
                                    variant="outline"
                                    asChild
                                >
                                    <Link href="/invoice/list">
                                        See All
                                        <ArrowRight className="ml-1 size-3.5 transition group-hover:translate-x-0.5" />
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 pb-1">
                            <div id="search-table" className="px-6 py-3"></div>
                            {!isLoading && (
                                <div className="w-full">
                                    <DataTable
                                        columns={dashboardcolumns}
                                        data={analytics.recentTransactions}
                                        filterField="sales_id"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base/5 font-semibold text-black">
                                    Category Distribution
                                </h3>
                                <Button
                                    className="group rounded-3xl px-3 py-1 text-xs text-gray-600 transition hover:border-primary hover:text-primary"
                                    size="sm"
                                    variant="outline"
                                    asChild
                                >
                                    <Link href="/inventory/stock/manage">
                                        View Inventory
                                        <ArrowRight className="ml-1 size-3.5 transition group-hover:translate-x-0.5" />
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DistributionRadialStackedChart
                                isShowTitle={false}
                                customData={analytics.categoryDistribution}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default Home
