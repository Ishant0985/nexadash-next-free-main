'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import { PlusCircle, Search, Download, Receipt } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { db } from '@/firebaseClient'
import { collection, addDoc, getDocs, query, orderBy, Timestamp, where } from 'firebase/firestore'
import { formatCurrency } from '@/lib/utils'

interface ExpenseRecord {
  id: string
  amount: number
  payee: string
  category: string
  date: Date
  description: string
  paymentMethod: string
  createdAt: Date
}

export default function ExpenseTrackingPage() {
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [payee, setPayee] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState<Date>(new Date())
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filterPeriod, setFilterPeriod] = useState('all')

  const fetchExpenseRecords = useCallback(async () => {
    try {
      setLoading(true)
      let q = query(collection(db, 'expenses'), orderBy('date', 'desc'))
      
      // Apply date filters
      if (filterPeriod !== 'all') {
        const today = new Date()
        let startDate = new Date()
        
        if (filterPeriod === 'today') {
          startDate.setHours(0, 0, 0, 0)
        } else if (filterPeriod === 'week') {
          startDate.setDate(today.getDate() - 7)
        } else if (filterPeriod === 'month') {
          startDate.setMonth(today.getMonth() - 1)
        } else if (filterPeriod === 'year') {
          startDate.setFullYear(today.getFullYear() - 1)
        }
        
        q = query(
          collection(db, 'expenses'),
          where('date', '>=', Timestamp.fromDate(startDate)),
          orderBy('date', 'desc')
        )
      }
      
      const querySnapshot = await getDocs(q)
      const records: ExpenseRecord[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        records.push({
          id: doc.id,
          amount: data.amount,
          payee: data.payee,
          category: data.category,
          date: data.date.toDate(),
          description: data.description,
          paymentMethod: data.paymentMethod,
          createdAt: data.createdAt.toDate()
        })
      })
      
      setExpenseRecords(records)
    } catch (error) {
      console.error('Error fetching expense records:', error)
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [filterPeriod])

  useEffect(() => {
    fetchExpenseRecords()
  }, [fetchExpenseRecords])

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !payee || !category || !date || !paymentMethod) {
      toast.error('Please fill in all required fields')
      return
    }
    
    try {
      const numericAmount = parseFloat(amount)
      
      if (isNaN(numericAmount) || numericAmount <= 0) {
        toast.error('Please enter a valid amount')
        return
      }
      
      const newRecord = {
        amount: numericAmount,
        payee,
        category,
        date: Timestamp.fromDate(date),
        description,
        paymentMethod,
        createdAt: Timestamp.fromDate(new Date())
      }
      
      await addDoc(collection(db, 'expenses'), newRecord)
      toast.success('Expense record added successfully')
      
      // Reset form
      setAmount('')
      setPayee('')
      setCategory('')
      setDate(new Date())
      setDescription('')
      setPaymentMethod('')
      setShowForm(false)
      
      // Refresh the list
      fetchExpenseRecords()
    } catch (error) {
      console.error('Error adding expense record:', error)
      toast.error('Failed to add expense record')
    }
  }

  const filteredRecords = expenseRecords.filter(record => 
    record.payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalExpense = filteredRecords.reduce((sum, record) => sum + record.amount, 0)

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = ['Date', 'Payee', 'Category', 'Amount', 'Payment Method', 'Description']
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record.date.toLocaleDateString(),
        `"${record.payee.replace(/"/g, '""')}"`,
        `"${record.category.replace(/"/g, '""')}"`,
        record.amount,
        `"${record.paymentMethod.replace(/"/g, '""')}"`,
        `"${record.description?.replace(/"/g, '""') || ''}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().split('T')[0]
    
    link.setAttribute('href', url)
    link.setAttribute('download', `expense-report-${timestamp}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getCategoryColor = (category: string) => {
    const categoryColors = {
      "rent": "bg-purple-100 text-purple-800",
      "utilities": "bg-blue-100 text-blue-800",
      "salaries": "bg-indigo-100 text-indigo-800",
      "supplies": "bg-green-100 text-green-800",
      "marketing": "bg-yellow-100 text-yellow-800",
      "travel": "bg-orange-100 text-orange-800",
      "software": "bg-pink-100 text-pink-800",
      "equipment": "bg-teal-100 text-teal-800",
      "other": "bg-gray-100 text-gray-800"
    }
    return categoryColors[category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Expense Tracking</h1>
            <p className="text-gray-500">Record and manage all expense transactions</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => setShowForm(!showForm)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>
        
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="payee">Payee</Label>
                    <Input
                      id="payee"
                      value={payee}
                      onChange={(e) => setPayee(e.target.value)}
                      placeholder="E.g., Supplier name, Vendor"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="salaries">Salaries</SelectItem>
                        <SelectItem value="supplies">Supplies</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit-card">Credit Card</SelectItem>
                        <SelectItem value="debit-card">Debit Card</SelectItem>
                        <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="mobile-payment">Mobile Payment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <DatePicker
                      date={date}
                      setDate={setDate}
                      className="w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add details about the expense"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Expense</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Expense Records</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <p>Loading expense records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Receipt className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No expense records found</p>
                <p className="text-sm text-gray-400">Add your first expense record to get started</p>
              </div>
            ) : (
              <>
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Expenses</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalExpense)}</p>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Payee</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.date.toLocaleDateString()}</TableCell>
                          <TableCell>{record.payee}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(record.category)}`}>
                              {record.category}
                            </span>
                          </TableCell>
                          <TableCell>{record.paymentMethod}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(record.amount)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {record.description || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}