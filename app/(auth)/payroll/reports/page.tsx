'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import { Download, Users, DollarSign, Calendar, FileText } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { db } from '@/firebaseClient'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { formatCurrency } from '@/lib/utils'

interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  salary: number
  paymentDate: Date
  status: 'pending' | 'paid' | 'failed'
  deductions: {
    tax: number
    insurance: number
    other: number
  }
  netPay: number
  createdAt: Date
}

interface PayrollSummary {
  totalPayroll: number
  totalDeductions: number
  totalNetPay: number
  pendingPayments: number
  paidPayments: number
  failedPayments: number
}

export default function PayrollReportsPage() {
  const [loading, setLoading] = useState(true)
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [summary, setSummary] = useState<PayrollSummary | null>(null)
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchPayrollRecords = useCallback(async () => {
    try {
      setLoading(true)
      
      let q = query(
        collection(db, 'payroll'),
        where('paymentDate', '>=', Timestamp.fromDate(startDate)),
        where('paymentDate', '<=', Timestamp.fromDate(endDate))
      )

      if (statusFilter !== 'all') {
        q = query(q, where('status', '==', statusFilter))
      }

      const querySnapshot = await getDocs(q)
      const records: PayrollRecord[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        records.push({
          id: doc.id,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          salary: data.salary,
          paymentDate: data.paymentDate.toDate(),
          status: data.status,
          deductions: data.deductions,
          netPay: data.netPay,
          createdAt: data.createdAt.toDate()
        })
      })

      // Calculate summary
      const summary: PayrollSummary = {
        totalPayroll: records.reduce((sum, record) => sum + record.salary, 0),
        totalDeductions: records.reduce((sum, record) => 
          sum + record.deductions.tax + record.deductions.insurance + record.deductions.other, 0),
        totalNetPay: records.reduce((sum, record) => sum + record.netPay, 0),
        pendingPayments: records.filter(record => record.status === 'pending').length,
        paidPayments: records.filter(record => record.status === 'paid').length,
        failedPayments: records.filter(record => record.status === 'failed').length
      }

      setPayrollRecords(records)
      setSummary(summary)
    } catch (error) {
      console.error('Error fetching payroll records:', error)
      toast.error('Failed to load payroll records')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, statusFilter])

  useEffect(() => {
    fetchPayrollRecords()
  }, [fetchPayrollRecords])

  const handleExportReport = () => {
    if (payrollRecords.length === 0) return

    const reportData = [
      ['Payroll Report'],
      [`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`],
      [],
      ['Employee ID', 'Employee Name', 'Salary', 'Payment Date', 'Status', 'Tax', 'Insurance', 'Other Deductions', 'Net Pay']
    ]

    payrollRecords.forEach(record => {
      reportData.push([
        record.employeeId,
        record.employeeName,
        formatCurrency(record.salary),
        record.paymentDate.toLocaleDateString(),
        record.status,
        formatCurrency(record.deductions.tax),
        formatCurrency(record.deductions.insurance),
        formatCurrency(record.deductions.other),
        formatCurrency(record.netPay)
      ])
    })

    const csvContent = reportData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().split('T')[0]
    
    link.setAttribute('href', url)
    link.setAttribute('download', `payroll-report-${timestamp}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusColor = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800"
    }
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Payroll Reports</h1>
            <p className="text-gray-500">View and manage payroll records</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleExportReport}
              disabled={payrollRecords.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Payroll Summary</CardTitle>
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
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <p>Loading payroll records...</p>
              </div>
            ) : !summary ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <FileText className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No payroll records found</p>
                <p className="text-sm text-gray-400">Select a different date range to view data</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total Payroll</p>
                          <p className="text-2xl font-bold">{formatCurrency(summary.totalPayroll)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total Deductions</p>
                          <p className="text-2xl font-bold">{formatCurrency(summary.totalDeductions)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total Net Pay</p>
                          <p className="text-2xl font-bold">{formatCurrency(summary.totalNetPay)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-500" />
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
                        <Users className="h-8 w-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Paid Payments</p>
                          <p className="text-2xl font-bold">{summary.paidPayments}</p>
                        </div>
                        <Users className="h-8 w-8 text-green-500" />
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
                        <Users className="h-8 w-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Employee Name</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Salary</TableHead>
                        <TableHead className="text-right">Tax</TableHead>
                        <TableHead className="text-right">Insurance</TableHead>
                        <TableHead className="text-right">Other</TableHead>
                        <TableHead className="text-right">Net Pay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.employeeId}</TableCell>
                          <TableCell>{record.employeeName}</TableCell>
                          <TableCell>{record.paymentDate.toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(record.salary)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(record.deductions.tax)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(record.deductions.insurance)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(record.deductions.other)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(record.netPay)}</TableCell>
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
