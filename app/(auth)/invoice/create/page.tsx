'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import PageHeading from '@/components/layout/page-heading';

// Firebase imports
import { db } from '@/firebaseClient';
import { collection, getDocs, addDoc } from 'firebase/firestore';

// Define types
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  [key: string]: any;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  availableQuantity?: number;
  [key: string]: any;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  cost: number;
  [key: string]: any;
}

interface InvoiceItem {
  id: string;
  type: 'product' | 'service' | 'custom';
  productId?: string;
  serviceId?: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

// Updated schema: added upiId and paymentStatus with conditional check.
const invoiceFormSchema = z
  .object({
    customer: z.string().min(1, { message: 'Please select a customer.' }),
    invoiceNumber: z.string().min(1, { message: 'Invoice number is required.' }),
    invoiceDate: z.date(),
    dueDate: z.date(),
    paymentMethod: z.string().min(1, { message: 'Please select a payment method.' }),
    paymentStatus: z.enum(['Paid', 'Due'], { message: 'Please select payment status.' }),
    upiId: z.string().optional(),
    notes: z.string().optional(),
    taxRate: z.number().min(0).max(1),
    items: z.array(
      z.object({
        id: z.string(),
        type: z.enum(['product', 'service', 'custom']),
        productId: z.string().optional(),
        serviceId: z.string().optional(),
        description: z.string().min(1, { message: 'Description is required.' }),
        quantity: z.number().min(1, { message: 'Quantity must be at least 1.' }),
        price: z.number().min(0, { message: 'Price cannot be negative.' }),
        total: z.number(),
      })
    ).min(1, { message: 'Please add at least one item.' }),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === 'Upi' && !data.upiId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'UPI ID is required when payment method is Upi.',
        path: ['upiId'],
      });
    }
  });

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

// Generate a unique invoice ID with timestamp and random string
const generateInvoiceId = () => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${timestamp}-${randomStr}`;
};

export default function AddInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for controlling the "Add New" modals
  const [openAddCustomer, setOpenAddCustomer] = useState(false);
  const [openAddProduct, setOpenAddProduct] = useState(false);
  const [openAddService, setOpenAddService] = useState(false);

  const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id'>>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    price: 0,
  });
  const [newService, setNewService] = useState<Omit<Service, 'id'>>({
    name: '',
    cost: 0,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: generateInvoiceId(),
      invoiceDate: new Date(),
      dueDate: new Date(),
      paymentMethod: 'Cash',
      paymentStatus: 'Due',
      upiId: '',
      taxRate: 0.18,
      items: [{
        id: crypto.randomUUID(),
        type: 'product',
        description: '',
        quantity: 1,
        price: 0,
        total: 0,
      }],
    },
  });

  const watchTaxRate = watch('taxRate');
  const watchItems = watch('items');
  const paymentMethod = watch('paymentMethod');

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customers
        const customersSnapshot = await getDocs(collection(db, 'customers'));
        const customersData: Customer[] = [];
        customersSnapshot.forEach((doc) => {
          customersData.push({ id: doc.id, ...doc.data() } as Customer);
        });
        setCustomers(customersData);

        // Fetch products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData: Product[] = [];
        productsSnapshot.forEach((doc) => {
          productsData.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(productsData);

        // Fetch services
        const servicesSnapshot = await getDocs(collection(db, 'services'));
        const servicesData: Service[] = [];
        servicesSnapshot.forEach((doc) => {
          servicesData.push({ id: doc.id, ...doc.data() } as Service);
        });
        setServices(servicesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data. Please refresh the page.');
      }
    };

    fetchData();
  }, []);

  // Calculate item totals when quantity or price changes
  useEffect(() => {
    const updatedItems = watchItems.map(item => ({
      ...item,
      total: item.quantity * item.price,
    }));

    const totalsDiffer = updatedItems.some((item, idx) => item.total !== watchItems[idx].total);
    if (totalsDiffer) {
      setValue('items', updatedItems, { shouldValidate: false });
    }
  }, [watchItems, setValue]);

  // Add a new invoice item
  const handleAddItem = () => {
    setValue('items', [
      ...watchItems,
      { id: crypto.randomUUID(), type: 'product', description: '', quantity: 1, price: 0, total: 0 }
    ]);
  };

  // Remove an invoice item by index
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...watchItems];
    updatedItems.splice(index, 1);
    setValue('items', updatedItems);
  };

  // Update an invoice item field
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = watchItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    if (field === 'quantity' || field === 'price') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].price;
    }
    setValue('items', updatedItems);
  };

  // Change the type of invoice item
  const handleItemTypeChange = (index: number, type: 'product' | 'service' | 'custom') => {
    const updatedItems = watchItems.map((item, i) =>
      i === index ? {
        ...item,
        type,
        description: '',
        quantity: 1,
        price: 0,
        total: 0,
        productId: undefined,
        serviceId: undefined
      } : item
    );
    setValue('items', updatedItems);
  };

  // Select a product for an invoice item
  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updatedItems = [...watchItems];
      updatedItems[index] = {
        ...updatedItems[index],
        productId,
        description: product.name,
        price: product.price,
        total: updatedItems[index].quantity * product.price
      };
      setValue('items', updatedItems);
    }
  };

  // Select a service for an invoice item
  const handleServiceSelect = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      const updatedItems = [...watchItems];
      updatedItems[index] = {
        ...updatedItems[index],
        serviceId,
        description: service.name,
        price: service.cost,
        total: updatedItems[index].quantity * service.cost
      };
      setValue('items', updatedItems);
    }
  };

  // Calculate invoice subtotal
  const calculateSubtotal = () => {
    return watchItems.reduce((sum, item) => sum + item.total, 0);
  };

  // Calculate tax amount
  const calculateTaxAmount = () => {
    return calculateSubtotal() * watchTaxRate;
  };

  // Calculate total invoice amount
  const calculateTotalAmount = () => {
    return calculateSubtotal() + calculateTaxAmount();
  };

  // Create a new customer
  const handleCreateNewCustomer = async () => {
    try {
      if (!newCustomer.name || !newCustomer.email) {
        toast.error('Customer name and email are required.');
        return;
      }
      const docRef = await addDoc(collection(db, 'customers'), newCustomer);
      const newCustomerWithId: Customer = {
        id: docRef.id, ...newCustomer,
        name: '',
        email: ''
      };
      setCustomers([...customers, newCustomerWithId]);
      setNewCustomer({ name: '', email: '', phone: '', address: '' });
      toast.success('Customer added successfully!');
      // Auto-select the new customer
      setValue('customer', docRef.id);
      setOpenAddCustomer(false);
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer.');
    }
  };

  // Create a new product
  const handleCreateNewProduct = async () => {
    try {
      if (!newProduct.name || newProduct.price <= 0) {
        toast.error('Product name and a valid price are required.');
        return;
      }
      const docRef = await addDoc(collection(db, 'products'), newProduct);
      const newProductWithId: Product = {
        id: docRef.id, ...newProduct, description: '',
        name: '',
        price: 0
      };
      setProducts([...products, newProductWithId]);
      setNewProduct({ name: '', price: 0 });
      toast.success('Product added successfully!');
      setOpenAddProduct(false);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product.');
    }
  };

  // Create a new service
  const handleCreateNewService = async () => {
    try {
      if (!newService.name || newService.cost <= 0) {
        toast.error('Service name and a valid cost are required.');
        return;
      }
      const docRef = await addDoc(collection(db, 'services'), newService);
      const newServiceWithId: Service = {
        id: docRef.id, ...newService, description: '',
        name: '',
        cost: 0
      };
      setServices([...services, newServiceWithId]);
      setNewService({ name: '', cost: 0 });
      toast.success('Service added successfully!');
      setOpenAddService(false);
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service.');
    }
  };

  // Submit the invoice form
  const onSubmit = async (data: InvoiceFormValues) => {
    setIsSubmitting(true);
    try {
      const finalInvoice = {
        ...data,
        totalAmount: calculateTotalAmount(),
        subTotal: calculateSubtotal(),
        taxAmount: calculateTaxAmount(),
        createdAt: new Date().toISOString(),
        status: 'Unpaid',
      };
      const docRef = await addDoc(collection(db, 'invoices'), finalInvoice);
      toast.success(`Invoice created successfully! Invoice ID: ${docRef.id}`);
      router.push('/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Utility: format date for input type="date"
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="relative space-y-4">
      <PageHeading heading={'Add New Invoice'} />
      <div className="p-4 max-w-7xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold py-4 px-6">Invoice Details</CardTitle>
              <CardDescription className="px-6">Enter the basic details of the invoice.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input id="invoiceNumber" {...register('invoiceNumber')} readOnly />
                {errors.invoiceNumber && <p className="text-red-500 text-sm">{errors.invoiceNumber.message}</p>}
              </div>
              <div>
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  defaultValue={formatDateForInput(new Date())}
                  {...register('invoiceDate', { valueAsDate: true })}
                />
                {errors.invoiceDate && <p className="text-red-500 text-sm">{errors.invoiceDate.message}</p>}
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  defaultValue={formatDateForInput(new Date())}
                  {...register('dueDate', { valueAsDate: true })}
                />
                {errors.dueDate && <p className="text-red-500 text-sm">{errors.dueDate.message}</p>}
              </div>
              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  {...register('taxRate', { valueAsNumber: true })}
                  onChange={(e) => setValue('taxRate', parseFloat(e.target.value) / 100)}
                />
                {errors.taxRate && <p className="text-red-500 text-sm">{errors.taxRate.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold py-4 px-6">Customer Information</CardTitle>
              <CardDescription className="px-6">Select an existing customer or add a new one.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              <div>
                <Label htmlFor="customer">Customer</Label>
                <div className="flex items-center space-x-2">
                  <Select onValueChange={(value) => setValue('customer', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AlertDialog open={openAddCustomer} onOpenChange={setOpenAddCustomer}>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        Add New
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Add New Customer</AlertDialogTitle>
                        <AlertDialogDescription>Enter the details of the new customer.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newCustomerName" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="newCustomerName"
                            className="col-span-3"
                            value={newCustomer.name}
                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newCustomerEmail" className="text-right">
                            Email
                          </Label>
                          <Input
                            id="newCustomerEmail"
                            className="col-span-3"
                            type="email"
                            value={newCustomer.email}
                            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newCustomerPhone" className="text-right">
                            Phone
                          </Label>
                          <Input
                            id="newCustomerPhone"
                            className="col-span-3"
                            value={newCustomer.phone}
                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newCustomerAddress" className="text-right">
                            Address
                          </Label>
                          <Textarea
                            id="newCustomerAddress"
                            className="col-span-3"
                            value={newCustomer.address}
                            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                          />
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setOpenAddCustomer(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCreateNewCustomer}>Create</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                {errors.customer && <p className="text-red-500 text-sm">{errors.customer.message}</p>}
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select onValueChange={(value) => setValue('paymentMethod', value)} defaultValue="Cash">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Upi">Upi</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentMethod && <p className="text-red-500 text-sm">{errors.paymentMethod.message}</p>}

                {/* If Upi is selected, ask for UPI id */}
                {paymentMethod === 'Upi' && (
                  <div className="mt-2">
                    <Label htmlFor="upiId">UPI ID / Number</Label>
                    <Input id="upiId" {...register('upiId')} placeholder="Enter UPI ID or Number" />
                    {errors.upiId && <p className="text-red-500 text-sm">{errors.upiId.message}</p>}
                  </div>
                )}

                {/* Payment status selection */}
                <div className="mt-4">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select onValueChange={(value) => setValue('paymentStatus', value as "Paid" | "Due")} defaultValue="Due">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Due">Due</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.paymentStatus && <p className="text-red-500 text-sm">{errors.paymentStatus.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold py-4 px-6">Items</CardTitle>
              <CardDescription className="px-6">Add products or services to the invoice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {watchItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Select value={item.type} onValueChange={(value) => handleItemTypeChange(index, value as 'product' | 'service' | 'custom')}>
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="product">Product</SelectItem>
                              <SelectItem value="service">Service</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {item.type === 'product' && (
                            <div className="flex items-center space-x-2">
                              <Select onValueChange={(value) => handleProductSelect(index, value)}>
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Select Product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <AlertDialog open={openAddProduct} onOpenChange={setOpenAddProduct}>
                                <AlertDialogTrigger asChild>
                                  <Button type="button" variant="outline" size="sm">
                                    Add New
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Add New Product</AlertDialogTitle>
                                    <AlertDialogDescription>Enter the details of the new product.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="newProductName" className="text-right">
                                        Name
                                      </Label>
                                      <Input id="newProductName" className="col-span-3" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="newProductPrice" className="text-right">
                                        Price
                                      </Label>
                                      <Input id="newProductPrice" className="col-span-3" type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })} />
                                    </div>
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setOpenAddProduct(false)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleCreateNewProduct}>Create</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                          {item.type === 'service' && (
                            <div className="flex items-center space-x-2">
                              <Select onValueChange={(value) => handleServiceSelect(index, value)}>
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Select Service" />
                                </SelectTrigger>
                                <SelectContent>
                                  {services.map((service) => (
                                    <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <AlertDialog open={openAddService} onOpenChange={setOpenAddService}>
                                <AlertDialogTrigger asChild>
                                  <Button type="button" variant="outline" size="sm">
                                    Add New
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Add New Service</AlertDialogTitle>
                                    <AlertDialogDescription>Enter the details of the new service.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="newServiceName" className="text-right">
                                        Name
                                      </Label>
                                      <Input id="newServiceName" className="col-span-3" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="newServiceCost" className="text-right">
                                        Cost
                                      </Label>
                                      <Input id="newServiceCost" className="col-span-3" type="number" value={newService.cost} onChange={(e) => setNewService({ ...newService, cost: parseFloat(e.target.value) })} />
                                    </div>
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setOpenAddService(false)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleCreateNewService}>Create</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                          {item.type === 'custom' && (
                            <Input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            />
                          )}
                          {errors.items?.[index]?.description && (
                            <p className="text-red-500 text-xs">{errors.items[index].description?.message}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                          />
                          {errors.items?.[index]?.quantity && (
                            <p className="text-red-500 text-xs">{errors.items[index].quantity?.message}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
                          />
                          {errors.items?.[index]?.price && (
                            <p className="text-red-500 text-xs">{errors.items[index].price?.message}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <Button type="button" size="sm" onClick={handleAddItem}>
                Add Item
              </Button>
              {errors.items && <p className="text-red-500 text-sm">{errors.items.message}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <Label htmlFor="notes" className="text-lg font-semibold">Additional Notes</Label>
              <Textarea id="notes" placeholder="Invoice notes..." {...register('notes')} />
              {errors.notes && <p className="text-red-500 text-sm">{errors.notes.message}</p>}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Invoice"}
            </Button>
          </div>
        </form>
        <Separator className="my-6" />
        <div>
          <h3 className="text-lg font-semibold mb-2">Invoice Summary</h3>
          <p>Subtotal: ${calculateSubtotal().toFixed(2)}</p>
          <p>Tax ({watchTaxRate * 100}%): ${calculateTaxAmount().toFixed(2)}</p>
          <p className="font-semibold">Total: ${calculateTotalAmount().toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
