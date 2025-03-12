'use client'
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import { Download, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { db } from '@/firebaseClient'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { formatCurrency } from '@/lib/utils'

interface PaymentRecord {
  id: string
  type: 'income' | 'expense' | 'payroll'
  amount: number
  description: string
  date: Date
  status: 'pending' | 'completed' | 'failed'
  reference: string
  paymentMethod: string
  createdAt: Date
}

interface PaymentSummary {
  totalPayments: number
  pendingPayments: number
  completedPayments: number
  failedPayments: number
  totalAmount: number
}

export default function PaymentStatusPage() {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchPaymentRecords()
  }, [startDate, endDate, statusFilter, typeFilter])

  const fetchPaymentRecords = async () => {
    try {
      setLoading(true)
      
      let q = query(
        collection(db, 'payments'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      )

      if (statusFilter !== 'all') {
        q = query(q, where('status', '==', statusFilter))
      }

      if (typeFilter !== 'all') {
        q = query(q, where('type', '==', typeFilter))
      }

      const querySnapshot = await getDocs(q)
      const records: PaymentRecord[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        records.push({
          id: doc.id,
          type: data.type,
          amount: data.amount,
          description: data.description,
          date: data.date.toDate(),
          status: data.status,
          reference: data.reference,
          paymentMethod: data.paymentMethod,
          createdAt: data.createdAt.toDate()
        })
      })

      // Calculate summary
      const summary: PaymentSummary = {
        totalPayments: records.length,
        pendingPayments: records.filter(record => record.status === 'pending').length,
        completedPayments: records.filter(record => record.status === 'completed').length,
        failedPayments: records.filter(record => record.status === 'failed').length,
        totalAmount: records.reduce((sum, record) => sum + record.amount, 0)
      }

      setPayments(records)
      setSummary(summary)
    } catch (error) {
      console.error('Error fetching payment records:', error)
      toast.error('Failed to load payment records')
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = () => {
    if (payments.length === 0) return

    const reportData = [
      ['Payment Status Report'],
      [`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`],
      [],
      ['Type', 'Amount', 'Description', 'Date', 'Status', 'Reference', 'Payment Method']
    ]

    payments.forEach(payment => {
      reportData.push([
        payment.type,
        formatCurrency(payment.amount),
        payment.description,
        payment.date.toLocaleDateString(),
        payment.status,
        payment.reference,
        payment.paymentMethod
      ])
    })

    const csvContent = reportData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().split('T')[0]
    
    link.setAttribute('href', url)
    link.setAttribute('download', `payment-status-report-${timestamp}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusColor = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800"
    }
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Payment Status</h1>
            <p className="text-gray-500">Track and monitor payment transactions</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleExportReport}
              disabled={payments.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Payment Summary</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="flex gap-2">
                  <DatePicker
                    date={startDate}
                    setDate={setStartDate}
                    className="w-[180px]"
                  />
                  <DatePicker
                    date={endDate}
                    setDate={setEndDate}
                    className="w-[180px]"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="payroll">Payroll</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <p>Loading payment records...</p>
              </div>
            ) : !summary ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <CreditCard className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No payment records found</p>
                <p className="text-sm text-gray-400">Select a different date range to view data</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total Payments</p>
                          <p className="text-2xl font-bold">{summary.totalPayments}</p>
                        </div>
                        <CreditCard className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Pending Payments</p>
                          <p className="text-2xl font-bold">{summary.pendingPayments}</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Completed Payments</p>
                          <p className="text-2xl font-bold">{summary.completedPayments}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Failed Payments</p>
                          <p className="text-2xl font-bold">{summary.failedPayments}</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="capitalize">{payment.type}</TableCell>
                          <TableCell>{payment.description}</TableCell>
                          <TableCell>{payment.date.toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(payment.status)}
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                {payment.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{payment.reference}</TableCell>
                          <TableCell>{payment.paymentMethod}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
