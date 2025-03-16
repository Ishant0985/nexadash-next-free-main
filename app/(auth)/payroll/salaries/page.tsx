'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import PageHeading from '@/components/layout/page-heading'
import { toast } from 'sonner'
import { PlusCircle, Search, Download, Users, Calendar } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { db } from '@/firebaseClient'
import { collection, addDoc, getDocs, query, orderBy, Timestamp, where } from 'firebase/firestore'
import { formatCurrency } from '@/lib/utils'

interface StaffSalary {
  id: string
  employeeId: string
  employeeName: string
  position: string
  department: string
  baseSalary: number
  allowances: {
    housing: number
    transport: number
    medical: number
    other: number
  }
  deductions: {
    tax: number
    insurance: number
    pension: number
    other: number
  }
  netSalary: number
  effectiveDate: Date
  createdAt: Date
}

export default function StaffSalariesPage() {
  const [loading, setLoading] = useState(true)
  const [salaries, setSalaries] = useState<StaffSalary[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [employeeId, setEmployeeId] = useState('')
  const [employeeName, setEmployeeName] = useState('')
  const [position, setPosition] = useState('')
  const [department, setDepartment] = useState('')
  const [baseSalary, setBaseSalary] = useState('')
  const [housingAllowance, setHousingAllowance] = useState('')
  const [transportAllowance, setTransportAllowance] = useState('')
  const [medicalAllowance, setMedicalAllowance] = useState('')
  const [otherAllowance, setOtherAllowance] = useState('')
  const [taxDeduction, setTaxDeduction] = useState('')
  const [insuranceDeduction, setInsuranceDeduction] = useState('')
  const [pensionDeduction, setPensionDeduction] = useState('')
  const [otherDeduction, setOtherDeduction] = useState('')
  const [effectiveDate, setEffectiveDate] = useState<Date>(new Date())

  const fetchStaffSalaries = useCallback(async () => {
    try {
      setLoading(true)
      let q = query(collection(db, 'staff-salaries'), orderBy('createdAt', 'desc'))

      if (departmentFilter !== 'all') {
        q = query(q, where('department', '==', departmentFilter))
      }

      const querySnapshot = await getDocs(q)
      const records: StaffSalary[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        records.push({
          id: doc.id,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          position: data.position,
          department: data.department,
          baseSalary: data.baseSalary,
          allowances: data.allowances,
          deductions: data.deductions,
          netSalary: data.netSalary,
          effectiveDate: data.effectiveDate.toDate(),
          createdAt: data.createdAt.toDate()
        })
      })

      setSalaries(records)
    } catch (error) {
      console.error('Error fetching staff salaries:', error)
      toast.error('Failed to load staff salaries')
    } finally {
      setLoading(false)
    }
  }, [departmentFilter])

  useEffect(() => {
    fetchStaffSalaries()
  }, [fetchStaffSalaries])

  const handleAddSalary = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!employeeId || !employeeName || !position || !department || !baseSalary) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const numericBaseSalary = parseFloat(baseSalary)
      const numericHousingAllowance = parseFloat(housingAllowance) || 0
      const numericTransportAllowance = parseFloat(transportAllowance) || 0
      const numericMedicalAllowance = parseFloat(medicalAllowance) || 0
      const numericOtherAllowance = parseFloat(otherAllowance) || 0
      const numericTaxDeduction = parseFloat(taxDeduction) || 0
      const numericInsuranceDeduction = parseFloat(insuranceDeduction) || 0
      const numericPensionDeduction = parseFloat(pensionDeduction) || 0
      const numericOtherDeduction = parseFloat(otherDeduction) || 0

      if (isNaN(numericBaseSalary) || numericBaseSalary <= 0) {
        toast.error('Please enter a valid base salary')
        return
      }

      const totalAllowances = numericHousingAllowance + numericTransportAllowance +
        numericMedicalAllowance + numericOtherAllowance
      const totalDeductions = numericTaxDeduction + numericInsuranceDeduction +
        numericPensionDeduction + numericOtherDeduction
      const netSalary = numericBaseSalary + totalAllowances - totalDeductions

      const newRecord = {
        employeeId,
        employeeName,
        position,
        department,
        baseSalary: numericBaseSalary,
        allowances: {
          housing: numericHousingAllowance,
          transport: numericTransportAllowance,
          medical: numericMedicalAllowance,
          other: numericOtherAllowance
        },
        deductions: {
          tax: numericTaxDeduction,
          insurance: numericInsuranceDeduction,
          pension: numericPensionDeduction,
          other: numericOtherDeduction
        },
        netSalary,
        effectiveDate: Timestamp.fromDate(effectiveDate),
        createdAt: Timestamp.fromDate(new Date())
      }

      await addDoc(collection(db, 'staff-salaries'), newRecord)
      toast.success('Staff salary record added successfully')

      // Reset form
      setEmployeeId('')
      setEmployeeName('')
      setPosition('')
      setDepartment('')
      setBaseSalary('')
      setHousingAllowance('')
      setTransportAllowance('')
      setMedicalAllowance('')
      setOtherAllowance('')
      setTaxDeduction('')
      setInsuranceDeduction('')
      setPensionDeduction('')
      setOtherDeduction('')
      setEffectiveDate(new Date())
      setShowForm(false)

      // Refresh the list
      fetchStaffSalaries()
    } catch (error) {
      console.error('Error adding staff salary record:', error)
      toast.error('Failed to add staff salary record')
    }
  }

  const filteredSalaries = salaries.filter(salary =>
    salary.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salary.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salary.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salary.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleExportCSV = () => {
    if (filteredSalaries.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = [
      'Employee ID',
      'Employee Name',
      'Position',
      'Department',
      'Base Salary',
      'Housing Allowance',
      'Transport Allowance',
      'Medical Allowance',
      'Other Allowance',
      'Tax Deduction',
      'Insurance Deduction',
      'Pension Deduction',
      'Other Deduction',
      'Net Salary',
      'Effective Date'
    ]

    const csvContent = [
      headers.join(','),
      ...filteredSalaries.map(salary => [
        salary.employeeId,
        `"${salary.employeeName.replace(/"/g, '""')}"`,
        `"${salary.position.replace(/"/g, '""')}"`,
        `"${salary.department.replace(/"/g, '""')}"`,
        salary.baseSalary,
        salary.allowances.housing,
        salary.allowances.transport,
        salary.allowances.medical,
        salary.allowances.other,
        salary.deductions.tax,
        salary.deductions.insurance,
        salary.deductions.pension,
        salary.deductions.other,
        salary.netSalary,
        salary.effectiveDate.toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().split('T')[0]

    link.setAttribute('href', url)
    link.setAttribute('download', `staff-salaries-${timestamp}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="relative space-y-4">
      <PageHeading heading="Invoice" button1={
        <Button
          variant="outline"
          onClick={handleExportCSV}
          disabled={filteredSalaries.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      }
        button2={
          <Button onClick={() => setShowForm(!showForm)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Salary
          </Button>
        }
      />

      <div className="flex flex-col gap-6">
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className='py-4 px-6 text-lg font-semibold'>Add New Salary Record</CardTitle>
            </CardHeader>
            <CardContent className='p-6'>
              <form onSubmit={handleAddSalary} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="Enter employee ID"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="employeeName">Employee Name</Label>
                    <Input
                      id="employeeName"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      placeholder="Enter employee name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="Enter position"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select value={department} onValueChange={setDepartment} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hr">Human Resources</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="it">Information Technology</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="baseSalary">Base Salary</Label>
                    <Input
                      id="baseSalary"
                      type="number"
                      step="0.01"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(e.target.value)}
                      placeholder="Enter base salary"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="effectiveDate">Effective Date</Label>
                    <DatePicker
                      date={effectiveDate}
                      setDate={setEffectiveDate}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label>Allowances</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="housingAllowance">Housing</Label>
                        <Input
                          id="housingAllowance"
                          type="number"
                          step="0.01"
                          value={housingAllowance}
                          onChange={(e) => setHousingAllowance(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="transportAllowance">Transport</Label>
                        <Input
                          id="transportAllowance"
                          type="number"
                          step="0.01"
                          value={transportAllowance}
                          onChange={(e) => setTransportAllowance(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="medicalAllowance">Medical</Label>
                        <Input
                          id="medicalAllowance"
                          type="number"
                          step="0.01"
                          value={medicalAllowance}
                          onChange={(e) => setMedicalAllowance(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="otherAllowance">Other</Label>
                        <Input
                          id="otherAllowance"
                          type="number"
                          step="0.01"
                          value={otherAllowance}
                          onChange={(e) => setOtherAllowance(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Deductions</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="taxDeduction">Tax</Label>
                        <Input
                          id="taxDeduction"
                          type="number"
                          step="0.01"
                          value={taxDeduction}
                          onChange={(e) => setTaxDeduction(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="insuranceDeduction">Insurance</Label>
                        <Input
                          id="insuranceDeduction"
                          type="number"
                          step="0.01"
                          value={insuranceDeduction}
                          onChange={(e) => setInsuranceDeduction(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pensionDeduction">Pension</Label>
                        <Input
                          id="pensionDeduction"
                          type="number"
                          step="0.01"
                          value={pensionDeduction}
                          onChange={(e) => setPensionDeduction(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="otherDeduction">Other</Label>
                        <Input
                          id="otherDeduction"
                          type="number"
                          step="0.01"
                          value={otherDeduction}
                          onChange={(e) => setOtherDeduction(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Salary Record</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className='py-4 px-6 text-lg font-semibold'>Salary Records</CardTitle>
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
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="it">Information Technology</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-6'>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <p>Loading salary records...</p>
              </div>
            ) : filteredSalaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Users className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No salary records found</p>
                <p className="text-sm text-gray-400">Add your first salary record to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Base Salary</TableHead>
                      <TableHead className="text-right">Allowances</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Salary</TableHead>
                      <TableHead>Effective Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSalaries.map((salary) => (
                      <TableRow key={salary.id}>
                        <TableCell>{salary.employeeId}</TableCell>
                        <TableCell>{salary.employeeName}</TableCell>
                        <TableCell>{salary.position}</TableCell>
                        <TableCell className="capitalize">{salary.department}</TableCell>
                        <TableCell className="text-right">{formatCurrency(salary.baseSalary)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            salary.allowances.housing +
                            salary.allowances.transport +
                            salary.allowances.medical +
                            salary.allowances.other
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            salary.deductions.tax +
                            salary.deductions.insurance +
                            salary.deductions.pension +
                            salary.deductions.other
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(salary.netSalary)}
                        </TableCell>
                        <TableCell>{salary.effectiveDate.toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
