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

// Updated type definitions
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  address?: string;
  [key: string]: any;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string;
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

// Update tax rate validation to accept 1-100
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
    // Now taxRate is a percentage between 1 and 100
    taxRate: z.number().min(1, { message: 'Tax rate must be at least 1%' }).max(100, { message: 'Tax rate cannot exceed 100%' }),
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

// Generate invoice id
const generateInvoiceId = () => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${timestamp}-${randomStr}`;
};

// Format number as INR
const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);

export default function AddInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [openAddCustomer, setOpenAddCustomer] = useState(false);
  const [openAddProduct, setOpenAddProduct] = useState(false);
  const [openAddService, setOpenAddService] = useState(false);

  // New customer with extra fields
  const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id'>>({
    name: '',
    email: '',
    phone: '',
    country: '',
    state: '',
    district: '',
    city: '',
    pincode: '',
    address: '',
  });

  // New product with extra fields
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
  });

  // New service with extra fields
  const [newService, setNewService] = useState<Omit<Service, 'id'>>({
    name: '',
    description: '',
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
      // Default taxRate now 18 (%), not 0.18.
      taxRate: 18,
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

  // Fetch customers, products, and services
  useEffect(() => {
    const fetchData = async () => {
      try {
        const customersSnapshot = await getDocs(collection(db, 'customers'));
        const customersData: Customer[] = [];
        customersSnapshot.forEach((doc) => {
          customersData.push({ id: doc.id, ...doc.data() } as Customer);
        });
        setCustomers(customersData);

        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData: Product[] = [];
        productsSnapshot.forEach((doc) => {
          productsData.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(productsData);

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

  // Calculate item totals
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

  // Item handlers
  const handleAddItem = () => {
    setValue('items', [
      ...watchItems,
      { id: crypto.randomUUID(), type: 'product', description: '', quantity: 1, price: 0, total: 0 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...watchItems];
    updatedItems.splice(index, 1);
    setValue('items', updatedItems);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = watchItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    if (field === 'quantity' || field === 'price') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].price;
    }
    setValue('items', updatedItems);
  };

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

  // When a product is selected, load its name, description (if available) and price
  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updatedItems = [...watchItems];
      updatedItems[index] = {
        ...updatedItems[index],
        productId,
        // Load product description if available; fallback to product name.
        description: product.description || product.name,
        price: product.price,
        total: updatedItems[index].quantity * product.price
      };
      setValue('items', updatedItems);
    }
  };

  // When a service is selected, load its name, description and price automatically
  const handleServiceSelect = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      const updatedItems = [...watchItems];
      updatedItems[index] = {
        ...updatedItems[index],
        serviceId,
        description: service.description || service.name,
        price: service.cost,
        total: updatedItems[index].quantity * service.cost
      };
      setValue('items', updatedItems);
    }
  };

  // Calculation functions (use INR format for display)
  const calculateSubtotal = () => watchItems.reduce((sum, item) => sum + item.total, 0);
  const calculateTaxAmount = () => calculateSubtotal() * (watchTaxRate / 100);
  const calculateTotalAmount = () => calculateSubtotal() + calculateTaxAmount();

  // New Customer Creation with custom id: [C1], [C2], etc.
  const handleCreateNewCustomer = async () => {
    try {
      if (!newCustomer.name || (!newCustomer.email && !newCustomer.phone)) {
        toast.error('Customer name and either email or phone are required.');
        return;
      }
      const customId = `[C${customers.length + 1}]`;
      const customerData = { ...newCustomer, customerId: customId };
      await addDoc(collection(db, 'customers'), customerData);
      const newCustomerWithId: Customer = { id: customId, ...newCustomer };
      setCustomers([...customers, newCustomerWithId]);
      setNewCustomer({ name: '', email: '', phone: '', country: '', state: '', district: '', city: '', pincode: '', address: '' });
      toast.success('Customer added successfully!');
      setValue('customer', customId);
      setOpenAddCustomer(false);
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer.');
    }
  };

  // New Product Creation with custom id: [P1], [P2], etc.
  const handleCreateNewProduct = async () => {
    try {
      if (!newProduct.name || newProduct.price <= 0) {
        toast.error('Product name and a valid price are required.');
        return;
      }
      const customId = `[P${products.length + 1}]`;
      const productData = { ...newProduct, productId: customId };
      await addDoc(collection(db, 'products'), productData);
      const newProductWithId: Product = { id: customId, ...newProduct };
      setProducts([...products, newProductWithId]);
      setNewProduct({ name: '', description: '', price: 0, category: '', image: '' });
      toast.success('Product added successfully!');
      setOpenAddProduct(false);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product.');
    }
  };

  // New Service Creation with custom id: [S1], [S2], etc.
  const handleCreateNewService = async () => {
    try {
      if (!newService.name || newService.cost <= 0) {
        toast.error('Service name and a valid cost are required.');
        return;
      }
      const customId = `[S${services.length + 1}]`;
      const serviceData = { ...newService, serviceId: customId };
      await addDoc(collection(db, 'services'), serviceData);
      const newServiceWithId: Service = { id: customId, ...newService };
      setServices([...services, newServiceWithId]);
      setNewService({ name: '', description: '', cost: 0 });
      toast.success('Service added successfully!');
      setOpenAddService(false);
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service.');
    }
  };

  // Invoice submission
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
  const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];

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
                  min={1}
                  max={100}
                  {...register('taxRate', { valueAsNumber: true })}
                  onChange={(e) => setValue('taxRate', parseFloat(e.target.value))}
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
                        <SelectItem key={customer.id} value={customer.id}>
                          {(customer.email || customer.phone) + ' - ' + customer.name}
                        </SelectItem>
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
                        <AlertDialogDescription>
                          Enter the customer details: Name, (Phone or Email), Country, State, District, City, Pincode.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newCustomerName" className="text-right">Name</Label>
                          <Input
                            id="newCustomerName"
                            className="col-span-3"
                            value={newCustomer.name}
                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newCustomerContact" className="text-right">Phone/Email</Label>
                          <Input
                            id="newCustomerContact"
                            className="col-span-3"
                            value={newCustomer.email || newCustomer.phone}
                            onChange={(e) =>
                              setNewCustomer({ ...newCustomer, email: e.target.value, phone: e.target.value })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newCustomerCountry" className="text-right">Country</Label>
                          <Input
                            id="newCustomerCountry"
                            className="col-span-3"
                            value={newCustomer.country}
                            onChange={(e) => setNewCustomer({ ...newCustomer, country: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newCustomerState" className="text-right">State</Label>
                          <Input
                            id="newCustomerState"
                            className="col-span-3"
                            value={newCustomer.state}
                            onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newCustomerDistrict" className="text-right">District</Label>
                          <Input
                            id="newCustomerDistrict"
                            className="col-span-3"
                            value={newCustomer.district}
                            onChange={(e) => setNewCustomer({ ...newCustomer, district: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newCustomerCity" className="text-right">City</Label>
                          <Input
                            id="newCustomerCity"
                            className="col-span-3"
                            value={newCustomer.city}
                            onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newCustomerPincode" className="text-right">Pincode</Label>
                          <Input
                            id="newCustomerPincode"
                            className="col-span-3"
                            value={newCustomer.pincode}
                            onChange={(e) => setNewCustomer({ ...newCustomer, pincode: e.target.value })}
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
                {paymentMethod === 'Upi' && (
                  <div className="mt-2">
                    <Label htmlFor="upiId">UPI ID / Number</Label>
                    <Input id="upiId" {...register('upiId')} placeholder="Enter UPI ID or Number" />
                    {errors.upiId && <p className="text-red-500 text-sm">{errors.upiId.message}</p>}
                  </div>
                )}
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
                      <TableHead>Price (INR)</TableHead>
                      <TableHead className="text-right">Total (INR)</TableHead>
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
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <AlertDialog open={openAddProduct} onOpenChange={setOpenAddProduct}>
                                <AlertDialogTrigger asChild>
                                  <Button type="button" variant="outline" size="sm">Add New</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Add New Product</AlertDialogTitle>
                                    <AlertDialogDescription>Enter product details.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="newProductName" className="text-right">Name</Label>
                                      <Input id="newProductName" className="col-span-3" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="newProductDescription" className="text-right">Description</Label>
                                      <Textarea id="newProductDescription" className="col-span-3" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="newProductPrice" className="text-right">Price (INR)</Label>
                                      <Input id="newProductPrice" className="col-span-3" type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="newProductCategory" className="text-right">Category</Label>
                                      <Input id="newProductCategory" className="col-span-3" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="newProductImage" className="text-right">Image (optional)</Label>
                                      <Input id="newProductImage" className="col-span-3" placeholder="Image URL" value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} />
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
                                    <SelectItem key={service.id} value={service.id}>
                                      {service.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <AlertDialog open={openAddService} onOpenChange={setOpenAddService}>
                                <AlertDialogTrigger asChild>
                                  <Button type="button" variant="outline" size="sm">Add New</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Add New Service</AlertDialogTitle>
                                    <AlertDialogDescription>Enter service details.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="newServiceName" className="text-right">Name</Label>
                                      <Input id="newServiceName" className="col-span-3" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="newServiceDescription" className="text-right">Description</Label>
                                      <Textarea id="newServiceDescription" className="col-span-3" value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="newServiceCost" className="text-right">Price (INR)</Label>
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
                            <Input type="text" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                          )}
                          {errors.items?.[index]?.description && (
                            <p className="text-red-500 text-xs">{errors.items[index].description?.message}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))} />
                          {errors.items?.[index]?.quantity && (
                            <p className="text-red-500 text-xs">{errors.items[index].quantity?.message}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={item.price} onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))} />
                          {errors.items?.[index]?.price && (
                            <p className="text-red-500 text-xs">{errors.items[index].price?.message}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-right"> {formatINR(item.total)} </TableCell>
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
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Invoice"}
            </Button>
          </div>
        </form>
        <Separator className="my-6" />
        <div>
          <h3 className="text-lg font-semibold mb-2">Invoice Summary</h3>
          <p>Subtotal: {formatINR(calculateSubtotal())}</p>
          <p>Tax ({watchTaxRate}%): {formatINR(calculateTaxAmount())}</p>
          <p className="font-semibold">Total: {formatINR(calculateTotalAmount())}</p>
        </div>
      </div>
    </div>
  );
}
