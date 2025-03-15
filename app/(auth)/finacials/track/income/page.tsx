'use client'
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import { PlusCircle, Search, Download, BarChart3 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { db } from '@/firebaseClient'
import { collection, addDoc, getDocs, query, orderBy, Timestamp, where } from 'firebase/firestore'
import { formatCurrency } from '@/lib/utils'

interface IncomeRecord {
  id: string
  amount: number
  source: string
  category: string
  date: Date
  description: string
  createdAt: Date
}

export default function IncomeTrackingPage() {
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState<Date>(new Date())
  const [description, setDescription] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filterPeriod, setFilterPeriod] = useState('all')

  useEffect(() => {
    fetchIncomeRecords()
  }, [filterPeriod])

  const fetchIncomeRecords = async () => {
    try {
      setLoading(true)
      let q = query(collection(db, 'income'), orderBy('date', 'desc'))
      
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
          collection(db, 'income'),
          where('date', '>=', Timestamp.fromDate(startDate)),
          orderBy('date', 'desc')
        )
      }
      
      const querySnapshot = await getDocs(q)
      const records: IncomeRecord[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        records.push({
          id: doc.id,
          amount: data.amount,
          source: data.source,
          category: data.category,
          date: data.date.toDate(),
          description: data.description,
          createdAt: data.createdAt.toDate()
        })
      })
      
      setIncomeRecords(records)
    } catch (error) {
      console.error('Error fetching income records:', error)
      toast.error('Failed to load income records')
    } finally {
      setLoading(false)
    }
  }

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !source || !category || !date) {
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
        source,
        category,
        date: Timestamp.fromDate(date),
        description,
        createdAt: Timestamp.fromDate(new Date())
      }
      
      await addDoc(collection(db, 'income'), newRecord)
      toast.success('Income record added successfully')
      
      // Reset form
      setAmount('')
      setSource('')
      setCategory('')
      setDate(new Date())
      setDescription('')
      setShowForm(false)
      
      // Refresh the list
      fetchIncomeRecords()
    } catch (error) {
      console.error('Error adding income record:', error)
      toast.error('Failed to add income record')
    }
  }

  const filteredRecords = incomeRecords.filter(record => 
    record.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalIncome = filteredRecords.reduce((sum, record) => sum + record.amount, 0)

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = ['Date', 'Source', 'Category', 'Amount', 'Description']
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record.date.toLocaleDateString(),
        `"${record.source.replace(/"/g, '""')}"`,
        `"${record.category.replace(/"/g, '""')}"`,
        record.amount,
        `"${record.description?.replace(/"/g, '""') || ''}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().split('T')[0]
    
    link.setAttribute('href', url)
    link.setAttribute('download', `income-report-${timestamp}.csv`)
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
            <h1 className="text-2xl font-bold">Income Tracking</h1>
            <p className="text-gray-500">Record and manage all income transactions</p>
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
              Add Income
            </Button>
          </div>
        </div>
        
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Income</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddIncome} className="space-y-4">
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
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="E.g., Client Payment, Sales"
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
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="refund">Refund</SelectItem>
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
                      placeholder="Add details about the income"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Income</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Income Records</CardTitle>
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
                <p>Loading income records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <BarChart3 className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No income records found</p>
                <p className="text-sm text-gray-400">Add your first income record to get started</p>
              </div>
            ) : (
              <>
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Income</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.date.toLocaleDateString()}</TableCell>
                          <TableCell>{record.source}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {record.category}
                            </span>
                          </TableCell>
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