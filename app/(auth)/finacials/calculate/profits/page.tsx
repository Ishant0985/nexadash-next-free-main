'use client'
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import { Download, Calculator, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import { db } from '@/firebaseClient'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { formatCurrency } from '@/lib/utils'

interface ProfitAnalysis {
  grossProfit: number
  operatingExpenses: number
  netProfit: number
  profitMargin: number
  periodStart: Date
  periodEnd: Date
  expensesByCategory: Record<string, number>
}

export default function ProfitCalculationsPage() {
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<ProfitAnalysis | null>(null)
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [analysisType, setAnalysisType] = useState('monthly')

  useEffect(() => {
    fetchProfitAnalysis()
  }, [startDate, endDate])

  const fetchProfitAnalysis = async () => {
    try {
      setLoading(true)
      
      // Fetch income
      const incomeQuery = query(
        collection(db, 'income'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      )
      const incomeSnapshot = await getDocs(incomeQuery)
      const totalIncome = incomeSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0)

      // Fetch expenses
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      )
      const expensesSnapshot = await getDocs(expensesQuery)
      
      // Calculate expenses by category
      const expensesByCategory: Record<string, number> = {}
      let totalExpenses = 0
      let operatingExpenses = 0

      expensesSnapshot.docs.forEach(doc => {
        const data = doc.data()
        const amount = data.amount
        const category = data.category
        
        // Sum up expenses by category
        expensesByCategory[category] = (expensesByCategory[category] || 0) + amount
        
        // Calculate operating expenses (excluding non-operating categories)
        if (!['taxes', 'interest', 'depreciation'].includes(category)) {
          operatingExpenses += amount
        }
        
        totalExpenses += amount
      })

      const grossProfit = totalIncome - totalExpenses
      const netProfit = grossProfit - operatingExpenses
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

      setAnalysis({
        grossProfit,
        operatingExpenses,
        netProfit,
        profitMargin,
        periodStart: startDate,
        periodEnd: endDate,
        expensesByCategory
      })
    } catch (error) {
      console.error('Error fetching profit analysis:', error)
      toast.error('Failed to load profit analysis')
    } finally {
      setLoading(false)
    }
  }

  const handleExportAnalysis = () => {
    if (!analysis) return

    const reportData = [
      ['Profit Analysis Report'],
      [`Period: ${analysis.periodStart.toLocaleDateString()} - ${analysis.periodEnd.toLocaleDateString()}`],
      [],
      ['Metric', 'Amount'],
      ['Gross Profit', formatCurrency(analysis.grossProfit)],
      ['Operating Expenses', formatCurrency(analysis.operatingExpenses)],
      ['Net Profit', formatCurrency(analysis.netProfit)],
      ['Profit Margin', `${analysis.profitMargin.toFixed(2)}%`],
      [],
      ['Expenses by Category'],
      ['Category', 'Amount']
    ]

    // Add expenses by category
    Object.entries(analysis.expensesByCategory).forEach(([category, amount]) => {
      reportData.push([category, formatCurrency(amount)])
    })

    const csvContent = reportData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().split('T')[0]
    
    link.setAttribute('href', url)
    link.setAttribute('download', `profit-analysis-${timestamp}.csv`)
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
            <h1 className="text-2xl font-bold">Profit Calculations</h1>
            <p className="text-gray-500">Analyze and calculate your business profits</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleExportAnalysis}
              disabled={!analysis}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Analysis
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Profit Analysis</CardTitle>
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
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Analysis type" />
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
                <p>Loading profit analysis...</p>
              </div>
            ) : !analysis ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Calculator className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No profit data available</p>
                <p className="text-sm text-gray-400">Select a different date range to view data</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Gross Profit</p>
                          <p className="text-2xl font-bold">{formatCurrency(analysis.grossProfit)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Operating Expenses</p>
                          <p className="text-2xl font-bold">{formatCurrency(analysis.operatingExpenses)}</p>
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
                          <p className={`text-2xl font-bold ${analysis.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(analysis.netProfit)}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Profit Margin</p>
                          <p className={`text-2xl font-bold ${analysis.profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {analysis.profitMargin.toFixed(2)}%
                          </p>
                        </div>
                        <Calculator className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(analysis.expensesByCategory).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="capitalize">{category}</span>
                          <span className="font-medium">{formatCurrency(amount)}</span>
                        </div>
                      ))}
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