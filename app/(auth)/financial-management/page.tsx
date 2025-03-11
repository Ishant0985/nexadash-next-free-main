"use client";
import { useState } from 'react';
import PageHeading from '@/components/layout/page-heading';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinancialRecord {
    id: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
}

const FinancialManagementPage = () => {
    const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([
        { id: '1', date: '2023-06-01', category: 'Sales', description: 'Product Sales', amount: 5000, type: 'income' },
        { id: '2', date: '2023-06-05', category: 'Rent', description: 'Office Rent', amount: 1200, type: 'expense' },
        { id: '3', date: '2023-06-10', category: 'Services', description: 'Consulting Services', amount: 3000, type: 'income' },
        { id: '4', date: '2023-06-15', category: 'Utilities', description: 'Electricity Bill', amount: 300, type: 'expense' },
        { id: '5', date: '2023-06-20', category: 'Sales', description: 'Product Sales', amount: 4500, type: 'income' },
        { id: '6', date: '2023-06-25', category: 'Supplies', description: 'Office Supplies', amount: 500, type: 'expense' },
    ]);

    const [newRecord, setNewRecord] = useState<Omit<FinancialRecord, 'id'>>({
        date: '',
        category: '',
        description: '',
        amount: 0,
        type: 'income',
    });

    const totalIncome = financialRecords
        .filter(record => record.type === 'income')
        .reduce((sum, record) => sum + record.amount, 0);

    const totalExpenses = financialRecords
        .filter(record => record.type === 'expense')
        .reduce((sum, record) => sum + record.amount, 0);

    const profit = totalIncome - totalExpenses;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewRecord(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) : value,
        }));
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewRecord(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAddRecord = () => {
        const newId = (financialRecords.length + 1).toString();
        setFinancialRecords(prev => [
            ...prev,
            { ...newRecord, id: newId },
        ]);
        setNewRecord({
            date: '',
            category: '',
            description: '',
            amount: 0,
            type: 'income',
        });
    };

    // Data for charts
    const pieChartData = [
        { name: 'Income', value: totalIncome },
        { name: 'Expenses', value: totalExpenses },
    ];

    const categoryData = financialRecords.reduce((acc, record) => {
        const existingCategory = acc.find(item => item.category === record.category);
        if (existingCategory) {
            if (record.type === 'income') {
                existingCategory.income += record.amount;
            } else {
                existingCategory.expense += record.amount;
            }
        } else {
            acc.push({
                category: record.category,
                income: record.type === 'income' ? record.amount : 0,
                expense: record.type === 'expense' ? record.amount : 0,
            });
        }
        return acc;
    }, [] as { category: string; income: number; expense: number }[]);

    return (
        <div className="space-y-4">
            <PageHeading heading={"Financial Management"} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-2">Total Income</h3>
                        <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
                        <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-2">Profit</h3>
                        <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${profit.toFixed(2)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="records">
                <TabsList className="mb-4">
                    <TabsTrigger value="records">Financial Records</TabsTrigger>
                    <TabsTrigger value="reports">Reports & Charts</TabsTrigger>
                </TabsList>
                
                <TabsContent value="records">
                    <Card>
                        <CardContent className="p-4">
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Date</label>
                                    <Input 
                                        type="date" 
                                        name="date" 
                                        value={newRecord.date} 
                                        onChange={handleInputChange} 
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Category</label>
                                    <Input 
                                        type="text" 
                                        name="category" 
                                        value={newRecord.category} 
                                        onChange={handleInputChange} 
                                        placeholder="Category" 
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Description</label>
                                    <Input 
                                        type="text" 
                                        name="description" 
                                        value={newRecord.description} 
                                        onChange={handleInputChange} 
                                        placeholder="Description" 
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Amount</label>
                                    <Input 
                                        type="number" 
                                        name="amount" 
                                        value={newRecord.amount.toString()} 
                                        onChange={handleInputChange} 
                                        placeholder="Amount" 
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Type</label>
                                    <select 
                                        name="type" 
                                        value={newRecord.type} 
                                        onChange={handleSelectChange}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="income">Income</option>
                                        <option value="expense">Expense</option>
                                    </select>
                                </div>
                            </div>
                            <Button onClick={handleAddRecord} className="mb-4">Add Record</Button>
                            
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="border px-4 py-2">Date</th>
                                        <th className="border px-4 py-2">Category</th>
                                        <th className="border px-4 py-2">Description</th>
                                        <th className="border px-4 py-2">Amount</th>
                                        <th className="border px-4 py-2">Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {financialRecords.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-100">
                                            <td className="border px-4 py-2">{record.date}</td>
                                            <td className="border px-4 py-2">{record.category}</td>
                                            <td className="border px-4 py-2">{record.description}</td>
                                            <td className="border px-4 py-2">${record.amount.toFixed(2)}</td>
                                            <td className={`border px-4 py-2 ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {record.type === 'income' ? 'Income' : 'Expense'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="reports">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <h3 className="text-lg font-semibold mb-4">Income vs Expenses</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                nameKey="name"
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            />
                                            <Tooltip formatter={(value) => `$${value}`} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="p-4">
                                <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={categoryData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="category" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `$${value}`} />
                                            <Legend />
                                            <Bar dataKey="income" fill="#4ade80" name="Income" />
                                            <Bar dataKey="expense" fill="#f87171" name="Expense" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default FinancialManagementPage; 