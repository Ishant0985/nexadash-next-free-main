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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import PageHeading from '@/components/layout/page-heading';

// Firebase imports
import { db, auth } from '@/firebaseClient';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';

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

// New Biller interface
interface Biller {
  id: string;
  name: string;
  email: string; // Should match logged-in user's email
  phone: string;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  gstin?: string; // Optional GSTIN number
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

// Update invoice form schema to include biller and payment details
const invoiceFormSchema = z
  .object({
    customer: z.string().min(1, { message: 'Please select a customer.' }),
    biller: z.string().min(1, { message: 'Please select a biller.' }), // New biller field
    invoiceNumber: z.string().min(1, { message: 'Invoice number is required.' }),
    invoiceDate: z.date(),
    dueDate: z.date(),
    paymentMethod: z.string().min(1, { message: 'Please select a payment method.' }),
    paymentStatus: z.enum(['Paid', 'Due'], { message: 'Please select payment status.' }),
    paymentType: z.enum(['all', 'custom']).optional(), // New field for payment type
    amountPaid: z.number().min(0).optional(), // New field for amount paid
    upiId: z.string().optional(),
    notes: z.string().optional(),
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
    
    // Validate payment amount when status is Paid and type is custom
    if (data.paymentStatus === 'Paid' && data.paymentType === 'custom') {
      const totalAmount = data.items.reduce((sum, item) => sum + item.total, 0) * (1 + data.taxRate / 100);
      
      if (!data.amountPaid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Amount paid is required when payment type is custom.',
          path: ['amountPaid'],
        });
      } else if (data.amountPaid > totalAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Amount paid cannot exceed the total invoice amount.',
          path: ['amountPaid'],
        });
      }
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
  const [billers, setBillers] = useState<Biller[]>([]); // New state for billers
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [openAddCustomer, setOpenAddCustomer] = useState(false);
  const [openAddBiller, setOpenAddBiller] = useState(false); // New state for biller modal
  const [openAddProduct, setOpenAddProduct] = useState(false);
  const [openAddService, setOpenAddService] = useState(false);
  
  // Payment details state
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

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
  
  // New biller state
  const [newBiller, setNewBiller] = useState<Omit<Biller, 'id'>>({
    name: '',
    email: '',  // Will be set to logged-in user's email
    phone: '',
    country: '',
    state: '',
    district: '',
    city: '',
    pincode: '',
    gstin: '',
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
      paymentType: 'all',
      amountPaid: 0,
      upiId: '',
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
  const paymentStatus = watch('paymentStatus');
  const paymentType = watch('paymentType');

  // Get logged-in user's email
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        setNewBiller(prev => ({ ...prev, email: user.email || '' }));
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch customers, products, services, and billers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const customersSnapshot = await getDocs(collection(db, 'customers'));
        const customersData: Customer[] = [];
        customersSnapshot.forEach((doc) => {
          customersData.push({ id: doc.id, ...doc.data() } as Customer);
        });
        setCustomers(customersData);

        // Fetch billers that match the logged-in user's email
        if (userEmail) {
          const billersQuery = query(
            collection(db, 'billers'), 
            where('email', '==', userEmail)
          );
          const billersSnapshot = await getDocs(billersQuery);
          const billersData: Biller[] = [];
          billersSnapshot.forEach((doc) => {
            billersData.push({ id: doc.id, ...doc.data() } as Biller);
          });
          setBillers(billersData);
        }

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
  }, [userEmail]);

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
    const updatedItems = watchItems.map((item, i) => {
      if (i !== index) return item;
      
      // Ensure numeric values are valid numbers, not NaN
    if (field === 'quantity' || field === 'price') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        const safeValue = isNaN(numValue) ? 0 : numValue;
        
        // Calculate total with safe values
        const quantity = field === 'quantity' ? safeValue : (isNaN(item.quantity) ? 0 : item.quantity);
        const price = field === 'price' ? safeValue : (isNaN(item.price) ? 0 : item.price);
        
        return { 
          ...item, 
          [field]: safeValue,
          total: quantity * price
        };
      }
      
      return { ...item, [field]: value };
    });
    
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
      const item = updatedItems[index];
      const price = isNaN(product.price) ? 0 : product.price;
      const quantity = isNaN(item.quantity) ? 1 : item.quantity;
      
      updatedItems[index] = {
        ...updatedItems[index],
        productId,
        // Load product description if available; fallback to product name.
        description: product.description || product.name,
        price: price,
        total: quantity * price
      };
      setValue('items', updatedItems);
    }
  };

  // When a service is selected, load its name, description and price automatically
  const handleServiceSelect = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      const updatedItems = [...watchItems];
      const item = updatedItems[index];
      const price = isNaN(service.cost) ? 0 : service.cost;
      const quantity = isNaN(item.quantity) ? 1 : item.quantity;
      
      updatedItems[index] = {
        ...updatedItems[index],
        serviceId,
        description: service.description || service.name,
        price: price,
        total: quantity * price
      };
      setValue('items', updatedItems);
    }
  };

  // Calculation functions (use INR format for display)
  const calculateSubtotal = () => {
    const subtotal = watchItems.reduce((sum, item) => {
      const itemTotal = isNaN(item.total) ? 0 : item.total;
      return sum + itemTotal;
    }, 0);
    return subtotal;
  };
  
  const calculateTaxAmount = () => {
    const subtotal = calculateSubtotal();
    const taxRate = isNaN(watchTaxRate) ? 0 : watchTaxRate;
    return subtotal * (taxRate / 100);
  };
  
  const calculateTotalAmount = () => calculateSubtotal() + calculateTaxAmount();

  // New Biller Creation
  const handleCreateNewBiller = async () => {
    try {
      if (!newBiller.name || !newBiller.phone) {
        toast.error('Biller name and phone are required.');
        return;
      }
      
      // Ensure the email is set to the logged-in user's email
      if (userEmail && newBiller.email !== userEmail) {
        setNewBiller(prev => ({ ...prev, email: userEmail }));
      }
      
      if (!newBiller.email) {
        toast.error('You must be logged in to add a biller.');
        return;
      }
      
      const customId = `[B${billers.length + 1}]`;
      const billerData = { ...newBiller, billerId: customId };
      const docRef = await addDoc(collection(db, 'billers'), billerData);
      const newBillerWithId = { 
        id: docRef.id, 
        name: newBiller.name,
        email: newBiller.email,
        phone: newBiller.phone,
        country: newBiller.country,
        state: newBiller.state,
        district: newBiller.district,
        city: newBiller.city,
        pincode: newBiller.pincode,
        gstin: newBiller.gstin
      };
      setBillers([...billers, newBillerWithId]);
      setNewBiller({
        name: '', 
        email: userEmail || '', 
        phone: '',
        country: '',
        state: '',
        district: '',
        city: '',
        pincode: '',
        gstin: '',
      });
      toast.success('Biller added successfully!');
      setValue('biller', docRef.id);
      setOpenAddBiller(false);
    } catch (error) {
      console.error('Error adding biller:', error);
      toast.error('Failed to add biller.');
    }
  };

  // New Customer Creation with custom id: [C1], [C2], etc.
  const handleCreateNewCustomer = async () => {
    try {
      if (!newCustomer.name || (!newCustomer.email && !newCustomer.phone)) {
        toast.error('Customer name and either email or phone are required.');
        return;
      }
      const customerData = { ...newCustomer };
      const docRef = await addDoc(collection(db, 'customers'), customerData);
      const newCustomerWithId = { 
        id: docRef.id, 
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        country: newCustomer.country,
        state: newCustomer.state,
        district: newCustomer.district,
        city: newCustomer.city,
        pincode: newCustomer.pincode,
        address: newCustomer.address
      };
      setCustomers([...customers, newCustomerWithId]);
      setNewCustomer({ name: '', email: '', phone: '', country: '', state: '', district: '', city: '', pincode: '', address: '' });
      toast.success('Customer added successfully!');
      setValue('customer', docRef.id);
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
      const newProductWithId = { 
        id: customId, 
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        category: newProduct.category,
        image: newProduct.image
      };
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
      const newServiceWithId = {
        id: customId,
        name: newService.name,
        description: newService.description,
        cost: newService.cost
      };
      setServices([...services, newServiceWithId]);
      setNewService({ name: '', description: '', cost: 0 });
      toast.success('Service added successfully!');
      setOpenAddService(false);
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service.');
    }
  };

  // Calculate due amount based on payment status and amount paid
  const calculateDueAmount = () => {
    const totalAmount = calculateTotalAmount();
    if (paymentStatus === 'Due') {
      return totalAmount;
    } else if (paymentStatus === 'Paid') {
      if (paymentType === 'all') {
        return 0;
      } else if (paymentType === 'custom') {
        // Get amount paid value and ensure it's a valid number
        const amountPaidValue = watch('amountPaid');
        // Explicitly check for undefined and NaN
        const amountPaid = (amountPaidValue === undefined || isNaN(amountPaidValue)) ? 
          0 : 
          Number(amountPaidValue);
        
        return Math.max(0, totalAmount - amountPaid);
      }
    }
    return totalAmount;
  };

  const onSubmit = async (data: InvoiceFormValues) => {
    try {
      setIsSubmitting(true);

      // Validate customer and biller
      if (!data.customer) {
        toast.error('Please select a customer');
        setIsSubmitting(false);
        return;
      }

      if (!data.biller) {
        toast.error('Please select a biller');
        setIsSubmitting(false);
        return;
      }

      if (!data.invoiceDate) {
        toast.error('Please select an invoice date');
        setIsSubmitting(false);
        return;
      }

      if (!data.dueDate) {
        toast.error('Please select a due date');
        setIsSubmitting(false);
        return;
      }

      // Validate items
      if (!data.items || data.items.length === 0) {
        toast.error('Please add at least one item to the invoice');
        setIsSubmitting(false);
        return;
      }

      // Check for invalid items
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        if (!item.description || item.description.trim() === '') {
          toast.error(`Item #${i+1} is missing a description`);
          setIsSubmitting(false);
          return;
        }
        
        if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity <= 0) {
          toast.error(`Item #${i+1} has an invalid quantity`);
          // Fix the quantity automatically
          const updatedItems = [...data.items];
          updatedItems[i] = { ...updatedItems[i], quantity: 1 };
          setValue('items', updatedItems);
          setIsSubmitting(false);
          return;
        }
        
        if (typeof item.price !== 'number' || isNaN(item.price)) {
          toast.error(`Item #${i+1} has an invalid price`);
          // Fix the price automatically
          const updatedItems = [...data.items];
          updatedItems[i] = { ...updatedItems[i], price: 0 };
          setValue('items', updatedItems);
          setIsSubmitting(false);
          return;
        }
      }

      // Get customer and biller details
      const selectedCustomer = customers.find(c => c.id === data.customer) || null;
      const selectedBiller = billers.find(b => b.id === data.biller) || null;
      
      if (!selectedCustomer) {
        toast.error('Please select a valid customer');
        setIsSubmitting(false);
        return;
      }
      
      if (!selectedBiller) {
        toast.error('Please select a valid biller');
        setIsSubmitting(false);
        return;
      }
      
      const totalAmount = calculateTotalAmount();
      let amountPaid = 0;
      let dueAmount = totalAmount;
      
      if (data.paymentStatus === 'Paid') {
        if (data.paymentType === 'all') {
          amountPaid = totalAmount;
          dueAmount = 0;
        } else if (data.paymentType === 'custom') {
          // Handle potential undefined or NaN values
          const rawAmount = data.amountPaid;
          // Ensure amountPaid is a valid number
          if (rawAmount !== undefined && !isNaN(rawAmount)) {
            amountPaid = rawAmount;
          } else {
            amountPaid = 0;
          }
          dueAmount = Math.max(0, totalAmount - amountPaid);
        }
      }
      
      // Create safe versions of data to avoid undefined values
      const safeItems = data.items.map(item => ({
        id: item.id || crypto.randomUUID(),
        type: item.type,
        productId: item.productId || null,
        serviceId: item.serviceId || null,
        description: item.description,
        quantity: isNaN(item.quantity) ? 1 : item.quantity,
        price: isNaN(item.price) ? 0 : item.price,
        total: isNaN(item.total) ? (isNaN(item.quantity) ? 1 : item.quantity) * (isNaN(item.price) ? 0 : item.price) : item.total
      }));
      
      // Create a date string in ISO format
      const createdAtStr = new Date().toISOString();
      const invoiceDateStr = data.invoiceDate ? data.invoiceDate.toISOString() : new Date().toISOString();
      const dueDateStr = data.dueDate ? data.dueDate.toISOString() : new Date().toISOString();
      
      // Create safe customerDetails and billerDetails
      const customerDetails = {
        id: selectedCustomer.id,
        name: selectedCustomer.name || '',
        email: selectedCustomer.email || '',
        phone: selectedCustomer.phone || '',
        country: selectedCustomer.country || '',
        state: selectedCustomer.state || '',
        district: selectedCustomer.district || '',
        city: selectedCustomer.city || '',
        pincode: selectedCustomer.pincode || '',
        address: selectedCustomer.address || '',
      };
      
      const billerDetails = {
        id: selectedBiller.id,
        name: selectedBiller.name || '',
        email: selectedBiller.email || '',
        phone: selectedBiller.phone || '',
        country: selectedBiller.country || '',
        state: selectedBiller.state || '',
        district: selectedBiller.district || '',
        city: selectedBiller.city || '',
        pincode: selectedBiller.pincode || '',
        gstin: selectedBiller.gstin || '',
      };
      
      const finalInvoice = {
        invoiceNumber: data.invoiceNumber || `INV-${Date.now()}`,
        customer: data.customer,
        biller: data.biller,
        invoiceDate: invoiceDateStr,
        dueDate: dueDateStr,
        paymentMethod: data.paymentMethod || 'Cash',
        paymentStatus: data.paymentStatus || 'Unpaid',
        paymentType: data.paymentType || 'all',
        amountPaid,
        dueAmount,
        upiId: data.upiId || '',
        notes: data.notes || '',
        taxRate: isNaN(data.taxRate) ? 0 : data.taxRate,
        items: safeItems,
        totalAmount,
        subTotal: calculateSubtotal(),
        taxAmount: calculateTaxAmount(),
        createdAt: createdAtStr,
        customerDetails,
        billerDetails,
      };

      const docRef = await addDoc(collection(db, 'invoices'), finalInvoice);
      toast.success(`Invoice created successfully! Invoice ID: ${docRef.id}`);
      router.push('/invoice/list');
    } catch (error) {
      console.error("Error adding document: ", error);
      let errorMessage = "Failed to create invoice. Please try again.";
      
      if (error instanceof Error) {
        // Check for Firebase specific errors
        if (error.message.includes("undefined")) {
          errorMessage = "Some fields have invalid values. Please check all entries and try again.";
        } else if (error.message.includes("permission-denied")) {
          errorMessage = "You don't have permission to create invoices.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection and try again.";
        }
      }
      
      toast.error(errorMessage);
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
                  defaultValue="18"
                  {...register('taxRate', { 
                    valueAsNumber: true,
                    onChange: (e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value)) {
                        setValue('taxRate', 0);
                        e.target.value = "0";
                      } else {
                        setValue('taxRate', value);
                      }
                    } 
                  })}
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
                          {(customer.phone || 'No Phone') + ' - ' + customer.name}
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
                          <Label htmlFor="newCustomerEmail" className="text-right">Email</Label>
                          <Input
                            id="newCustomerEmail"
                            className="col-span-3"
                            value={newCustomer.email}
                            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newCustomerPhone" className="text-right">Phone</Label>
                          <Input
                            id="newCustomerPhone"
                            className="col-span-3"
                            value={newCustomer.phone}
                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
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
                <Label htmlFor="biller">Biller Information</Label>
                <div className="flex items-center space-x-2">
                  <Select onValueChange={(value) => setValue('biller', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Biller" />
                    </SelectTrigger>
                    <SelectContent>
                      {billers.map((biller) => (
                        <SelectItem key={biller.id} value={biller.id}>
                          {biller.phone + ' - ' + biller.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={openAddBiller} onOpenChange={setOpenAddBiller}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        Add New
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                      <DialogHeader>
                        <DialogTitle>Add New Biller</DialogTitle>
                        <DialogDescription>
                          Add your biller information. The email will be automatically set to your logged-in email.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newBillerName" className="text-right">Name*</Label>
                          <Input
                            id="newBillerName"
                            className="col-span-3"
                            value={newBiller.name}
                            onChange={(e) => setNewBiller({ ...newBiller, name: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newBillerEmail" className="text-right">Email</Label>
                          <Input
                            id="newBillerEmail"
                            className="col-span-3"
                            value={newBiller.email}
                            disabled
                            title="Email is set to your account email"
                          />
                          <p className="text-xs text-gray-500 col-start-2 col-span-3">Email is set to your account email</p>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newBillerPhone" className="text-right">Phone*</Label>
                          <Input
                            id="newBillerPhone"
                            className="col-span-3"
                            value={newBiller.phone}
                            onChange={(e) => setNewBiller({ ...newBiller, phone: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newBillerGstin" className="text-right">GSTIN</Label>
                          <Input
                            id="newBillerGstin"
                            className="col-span-3"
                            value={newBiller.gstin}
                            onChange={(e) => setNewBiller({ ...newBiller, gstin: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newBillerCountry" className="text-right">Country</Label>
                          <Input
                            id="newBillerCountry"
                            className="col-span-3"
                            value={newBiller.country}
                            onChange={(e) => setNewBiller({ ...newBiller, country: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newBillerState" className="text-right">State</Label>
                          <Input
                            id="newBillerState"
                            className="col-span-3"
                            value={newBiller.state}
                            onChange={(e) => setNewBiller({ ...newBiller, state: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newBillerDistrict" className="text-right">District</Label>
                          <Input
                            id="newBillerDistrict"
                            className="col-span-3"
                            value={newBiller.district}
                            onChange={(e) => setNewBiller({ ...newBiller, district: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newBillerCity" className="text-right">City</Label>
                          <Input
                            id="newBillerCity"
                            className="col-span-3"
                            value={newBiller.city}
                            onChange={(e) => setNewBiller({ ...newBiller, city: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newBillerPincode" className="text-right">Pincode</Label>
                          <Input
                            id="newBillerPincode"
                            className="col-span-3"
                            value={newBiller.pincode}
                            onChange={(e) => setNewBiller({ ...newBiller, pincode: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpenAddBiller(false)}>Cancel</Button>
                        <Button type="button" onClick={handleCreateNewBiller}>Create Biller</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {errors.biller && <p className="text-red-500 text-sm">{errors.biller.message}</p>}
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
              </div>
              
              <div>
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select 
                  onValueChange={(value) => {
                    setValue('paymentStatus', value as "Paid" | "Due");
                    setShowPaymentDetails(value === 'Paid');
                    if (value === 'Paid') {
                      setValue('paymentType', 'all');
                    }
                  }} 
                  defaultValue="Due"
                >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Due">Due</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.paymentStatus && <p className="text-red-500 text-sm">{errors.paymentStatus.message}</p>}
                
                {showPaymentDetails && (
                  <div className="mt-4 space-y-4 border rounded-md p-4">
                    <Label>Payment Type</Label>
                    <RadioGroup 
                      defaultValue="all"
                      onValueChange={(value) => setValue('paymentType', value as "all" | "custom")}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="payment-all" />
                        <Label htmlFor="payment-all">Pay Full Amount</Label>
                </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="payment-custom" />
                        <Label htmlFor="payment-custom">Custom Amount</Label>
                      </div>
                    </RadioGroup>
                    
                    {paymentType === 'custom' && (
                      <div className="mt-2">
                        <Label htmlFor="amountPaid">Amount Paid (INR)</Label>
                        <Input 
                          id="amountPaid" 
                          type="number" 
                          min={0} 
                          max={calculateTotalAmount()}
                          step={0.01}
                          {...register('amountPaid', { 
                            valueAsNumber: true,
                            onBlur: (e) => {
                              // Ensure we have a valid number when user leaves the field
                              const val = e.target.value.trim();
                              if (val === '' || isNaN(parseFloat(val))) {
                                e.target.value = "0";
                                setValue('amountPaid', 0);
                              }
                            },
                            onChange: (e) => {
                              // Ensure we're handling the value properly
                              try {
                                const strValue = e.target.value.trim();
                                if (strValue === '') {
                                  // Empty input case
                                  e.target.value = "0";
                                  setValue('amountPaid', 0);
                                  return;
                                }
                                
                                const numValue = parseFloat(strValue);
                                if (isNaN(numValue)) {
                                  e.target.value = "0";
                                  setValue('amountPaid', 0);
                                } else {
                                  // Ensure the value doesn't exceed the total
                                  const maxValue = calculateTotalAmount();
                                  if (numValue > maxValue) {
                                    e.target.value = maxValue.toString();
                                    setValue('amountPaid', maxValue);
                                  } else {
                                    setValue('amountPaid', numValue);
                                  }
                                }
                              } catch (error) {
                                e.target.value = "0";
                                setValue('amountPaid', 0);
                              }
                            }
                          })}
                          placeholder="Enter amount paid"
                          defaultValue="0"
                        />
                        {errors.amountPaid && <p className="text-red-500 text-sm">{errors.amountPaid.message}</p>}
                        <p className="text-sm text-gray-500 mt-1">
                          Due Amount: {formatINR(calculateDueAmount())}
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
                                      <Input 
                                        id="newProductPrice" 
                                        className="col-span-3" 
                                        type="number" 
                                        min="0"
                                        step="0.01"
                                        value={newProduct.price} 
                                        onChange={(e) => {
                                          const value = parseFloat(e.target.value);
                                          setNewProduct({ 
                                            ...newProduct, 
                                            price: isNaN(value) ? 0 : value 
                                          });
                                        }} 
                                      />
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
                                      <Input 
                                        id="newServiceCost" 
                                        className="col-span-3" 
                                        type="number" 
                                        min="0"
                                        step="0.01"
                                        value={newService.cost} 
                                        onChange={(e) => {
                                          const value = parseFloat(e.target.value);
                                          setNewService({ 
                                            ...newService, 
                                            cost: isNaN(value) ? 0 : value 
                                          });
                                        }} 
                                      />
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
                          <Input 
                            type="number" 
                            min="1"
                            defaultValue="1"
                            value={item.quantity === undefined || isNaN(item.quantity) ? 1 : item.quantity} 
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              handleItemChange(index, 'quantity', isNaN(val) || val < 1 ? 1 : val);
                            }}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (isNaN(val) || val < 1 || e.target.value.trim() === '') {
                                handleItemChange(index, 'quantity', 1);
                              }
                            }}
                          />
                          {errors.items?.[index]?.quantity && (
                            <p className="text-red-500 text-xs">{errors.items[index].quantity?.message}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            min="0"
                            step="0.01"
                            defaultValue="0"
                            value={item.price === undefined || isNaN(item.price) ? 0 : item.price} 
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              handleItemChange(index, 'price', isNaN(val) || val < 0 ? 0 : val);
                            }}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (isNaN(val) || val < 0 || e.target.value.trim() === '') {
                                handleItemChange(index, 'price', 0);
                              }
                            }}
                          />
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
