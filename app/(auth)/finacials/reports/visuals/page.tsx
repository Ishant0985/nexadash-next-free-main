'use client'
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import { Download, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import { db } from '@/firebaseClient'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { formatCurrency } from '@/lib/utils'

interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  periodStart: Date
  periodEnd: Date
}

export default function FinancialReportsPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [reportType, setReportType] = useState('monthly')

  useEffect(() => {
    fetchFinancialSummary()
  }, [startDate, endDate])

  const fetchFinancialSummary = async () => {
    try {
      setLoading(true)
      
      // Fetch income
      const incomeQuery = query(
        collection(db, 'finances/income'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      )
      const incomeSnapshot = await getDocs(incomeQuery)
      const totalIncome = incomeSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0)

      // Fetch expenses
      const expensesQuery = query(
        collection(db, 'finances/expenses'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      )
      const expensesSnapshot = await getDocs(expensesQuery)
      const totalExpenses = expensesSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0)

      setSummary({
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        periodStart: startDate,
        periodEnd: endDate
      })
    } catch (error) {
      console.error('Error fetching financial summary:', error)
      toast.error('Failed to load financial summary')
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = () => {
    if (!summary) return

    const reportData = [
      ['Financial Report'],
      [`Period: ${summary.periodStart.toLocaleDateString()} - ${summary.periodEnd.toLocaleDateString()}`],
      [],
      ['Metric', 'Amount'],
      ['Total Income', formatCurrency(summary.totalIncome)],
      ['Total Expenses', formatCurrency(summary.totalExpenses)],
      ['Net Profit', formatCurrency(summary.netProfit)]
    ]

    const csvContent = reportData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().split('T')[0]
    
    link.setAttribute('href', url)
    link.setAttribute('download', `financial-report-${timestamp}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Financial Reports</h1>
            <p className="text-gray-500">View and analyze your financial performance</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleExportReport}
              disabled={!summary}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Financial Summary</CardTitle>
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
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <p>Loading financial summary...</p>
              </div>
            ) : !summary ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No financial data available</p>
                <p className="text-sm text-gray-400">Select a different date range to view data</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Income</p>
                        <p className="text-2xl font-bold">{formatCurrency(summary.totalIncome)}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Expenses</p>
                        <p className="text-2xl font-bold">{formatCurrency(summary.totalExpenses)}</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Net Profit</p>
                        <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(summary.netProfit)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
