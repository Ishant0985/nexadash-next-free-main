'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2, Search, FileDown, MoreVertical, ChevronDown, MoreHorizontal, Filter, Plus } from 'lucide-react';
import PageHeading from '@/components/layout/page-heading';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// Firebase imports
import { db } from '@/firebaseClient';
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  deleteDoc,
  limit,
  startAfter,
  getDoc
} from 'firebase/firestore';

interface Product {
  id: string;
  productId: string;
  name: string;
  description: string;
  category: string;
  categoryName?: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  tax: number;
  imageUrl: string;
  createdAt: any;
}

interface Service {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  category: string;
  categoryName?: string;
  cost: number;
  imageUrl: string;
  createdAt: any;
}

interface Category {
  id: string;
  name: string;
}

// Helper functions
const formatDate = (date: any) => {
  if (!date) return 'N/A';
  try {
    const d = date instanceof Date
      ? date
      : new Date(date.seconds ? date.seconds * 1000 : date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

// CSV Export function
const exportToCSV = (data: (Product | Service)[], type: 'products' | 'services', filename = 'stock.csv') => {
  const headers = type === 'products' 
    ? ['ID', 'Name', 'Category', 'Quantity', 'Purchase Price', 'Selling Price', 'Tax Rate', 'Created At']
    : ['ID', 'Name', 'Category', 'Cost', 'Created At'];

  const csvContent = data.map(item => {
    if (type === 'products' && 'quantity' in item) {
      const product = item as Product;
      return [
        product.productId,
        product.name,
        product.categoryName || 'Unknown',
        product.quantity,
        product.purchasePrice,
        product.sellingPrice,
        `${product.tax}%`,
        formatDate(product.createdAt)
      ];
    } else {
      const service = item as Service;
      return [
        service.serviceId,
        service.name,
        service.categoryName || 'Unknown',
        service.cost,
        formatDate(service.createdAt)
      ];
    }
  });

  const csv = [
    headers.join(','),
    ...csvContent.map(row => row.map(cell =>
      `"${String(cell).replace(/"/g, '""')}"`
    ).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Custom Pagination Ellipsis component
const PaginationEllipsis = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex h-9 w-9 items-center justify-center", className)}>
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </div>
  );
};

export default function StockManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<{ products: Category[], services: Category[] }>({
    products: [],
    services: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Product | Service | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: { min: '', max: '' },
    categories: [] as string[],
    dateRange: { from: '', to: '' }
  });
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch categories
        const productCategoryQuery = query(collection(db, 'productcategory'));
        const serviceCategoryQuery = query(collection(db, 'servicecategory'));
        const [productCategorySnapshot, serviceCategorySnapshot] = await Promise.all([
          getDocs(productCategoryQuery),
          getDocs(serviceCategoryQuery)
        ]);

        const productCategories = productCategorySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        const serviceCategories = serviceCategorySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));

        setCategories({ products: productCategories, services: serviceCategories });

        // Fetch products
        const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => {
          const data = doc.data() as Product;
          const category = productCategories.find(cat => cat.id === data.category);
          return {
            ...data,
            id: doc.id,
            categoryName: category?.name
          };
        });
        setProducts(productsData);
        setFilteredProducts(productsData);

        // Fetch services
        const servicesQuery = query(collection(db, 'services'), orderBy('createdAt', 'desc'));
        const servicesSnapshot = await getDocs(servicesQuery);
        const servicesData = servicesSnapshot.docs.map(doc => {
          const data = doc.data() as Service;
          const category = serviceCategories.find(cat => cat.id === data.category);
          return {
            ...data,
            id: doc.id,
            categoryName: category?.name
          };
        });
        setServices(servicesData);
        setFilteredServices(servicesData);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch stock data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle filtering
  useEffect(() => {
    const applyFilters = () => {
      const items = activeTab === 'products' ? products : services;
      let filtered = [...items];

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(item =>
          item.name.toLowerCase().includes(term) ||
          (item.categoryName && item.categoryName.toLowerCase().includes(term))
        );
      }

      // Apply price range filter
      if (activeTab === 'products') {
        const products = filtered as Product[];
        if (filters.priceRange.min) {
          filtered = products.filter(p => p.sellingPrice >= Number(filters.priceRange.min));
        }
        if (filters.priceRange.max) {
          filtered = products.filter(p => p.sellingPrice <= Number(filters.priceRange.max));
        }
      }

      // Apply category filter
      if (filters.categories.length > 0) {
        filtered = filtered.filter(item => filters.categories.includes(item.category));
      }

      // Apply date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        filtered = filtered.filter(item => {
          const itemDate = item.createdAt.seconds ? new Date(item.createdAt.seconds * 1000) : new Date(item.createdAt);
          if (filters.dateRange.from && itemDate < new Date(filters.dateRange.from)) return false;
          if (filters.dateRange.to && itemDate > new Date(filters.dateRange.to)) return false;
          return true;
        });
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let valueA, valueB;

        if (sortField === 'price' && activeTab === 'products') {
          valueA = (a as Product).sellingPrice;
          valueB = (b as Product).sellingPrice;
        } else if (sortField === 'cost' && activeTab === 'services') {
          valueA = (a as Service).cost;
          valueB = (b as Service).cost;
        } else if (sortField === 'date') {
          valueA = a.createdAt.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
          valueB = b.createdAt.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
        } else {
          valueA = a[sortField as keyof (Product | Service)] || '';
          valueB = b[sortField as keyof (Product | Service)] || '';
        }

        if (sortDirection === 'asc') {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      });

      if (activeTab === 'products') {
        setFilteredProducts(filtered as Product[]);
      } else {
        setFilteredServices(filtered as Service[]);
      }

      setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
      setCurrentPage(1);
      setSelectedRows([]);
      setSelectAll(false);
    };

    applyFilters();
  }, [activeTab, searchTerm, filters, sortField, sortDirection, products, services]);

  // Handle pagination
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    setSelectedRows([]);
    setSelectAll(false);
  };

  // Get current items
  const getCurrentItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const items = activeTab === 'products' ? filteredProducts : filteredServices;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(getCurrentItems().map(item => item.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle row selection
  const handleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Delete item
  const handleDeleteItem = async () => {
    if (!currentItem) return;

    try {
      const collection = activeTab === 'products' ? 'products' : 'services';
      await deleteDoc(doc(db, collection, currentItem.id));

      // Update the items list
      if (activeTab === 'products') {
        setProducts(products.filter(p => p.id !== currentItem.id));
      } else {
        setServices(services.filter(s => s.id !== currentItem.id));
      }

      toast.success(`${activeTab === 'products' ? 'Product' : 'Service'} deleted successfully`);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(`Failed to delete ${activeTab === 'products' ? 'product' : 'service'}`);
    } finally {
      setDeleteDialogOpen(false);
      setCurrentItem(null);
    }
  };

  // Export items
  const handleExport = (exportAll: boolean) => {
    let dataToExport = exportAll
      ? (activeTab === 'products' ? filteredProducts : filteredServices)
      : getCurrentItems();

    // If rows are selected, only export those
    if (selectedRows.length > 0 && !exportAll) {
      // Type assertion to handle the union type
      dataToExport = dataToExport.filter(item => selectedRows.includes(item.id)) as typeof dataToExport;
    }

    const currentDate = new Date().toISOString().slice(0, 10);
    const filename = `${activeTab}_export_${currentDate}.csv`;

    exportToCSV(dataToExport, activeTab === 'products' ? 'products' : 'services', filename);
    setExportDialogOpen(false);
    toast.success(`${activeTab === 'products' ? 'Products' : 'Services'} exported successfully!`);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      priceRange: { min: '', max: '' },
      categories: [],
      dateRange: { from: '', to: '' }
    });
    setFilterPopoverOpen(false);
    setMobileFilterOpen(false);
  };

  return (
    <div className="relative space-y-4">
      <PageHeading heading="Stock Management" button1={
        <Button
          variant="outline"
          onClick={() => setExportDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <FileDown size={16} />
          Export
        </Button>
      }
        button2={
          <Button
            onClick={() => router.push('/inventory/stock/add')}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add Stock
          </Button>
        }
      />

      <div className="p-4 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'products' | 'services')} className="mb-6">
          <TabsList className="flex justify-between items-center mb-5 overflow-x-auto rounded-lg bg-white shadow-sm">
            <div className="inline-flex gap-2.5 px-5 py-[11px] text-sm/[18px] font-semibold">
              <TabsTrigger
                value="products"
                className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white"
              >
                Products
              </TabsTrigger>
              <TabsTrigger value="services" className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white">
                Services
              </TabsTrigger>
            </div>
            <div className="inline-flex text-sm/[18px] font-semibold">
              <div className="relative mr-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search items"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-8"
                />
              </div>
              <div className="hidden md:block">
                <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter size={16} />
                      Filters
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <Accordion type="single" collapsible>
                        {activeTab === 'products' && (
                          <AccordionItem value="price">
                            <AccordionTrigger>Price Range</AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label>Min</Label>
                                    <Input
                                      type="number"
                                      value={filters.priceRange.min}
                                      onChange={(e) => setFilters({
                                        ...filters,
                                        priceRange: { ...filters.priceRange, min: e.target.value }
                                      })}
                                      placeholder="0"
                                    />
                                  </div>
                                  <div>
                                    <Label>Max</Label>
                                    <Input
                                      type="number"
                                      value={filters.priceRange.max}
                                      onChange={(e) => setFilters({
                                        ...filters,
                                        priceRange: { ...filters.priceRange, max: e.target.value }
                                      })}
                                      placeholder="1000"
                                    />
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                        <AccordionItem value="categories">
                          <AccordionTrigger>Categories</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              {(activeTab === 'products' ? categories.products : categories.services).map((category) => (
                                <div key={category.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={category.id}
                                    checked={filters.categories.includes(category.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFilters({
                                          ...filters,
                                          categories: [...filters.categories, category.id]
                                        });
                                      } else {
                                        setFilters({
                                          ...filters,
                                          categories: filters.categories.filter(id => id !== category.id)
                                        });
                                      }
                                    }}
                                  />
                                  <Label htmlFor={category.id}>{category.name}</Label>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="date">
                          <AccordionTrigger>Date Range</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              <div>
                                <Label>From</Label>
                                <Input
                                  type="date"
                                  value={filters.dateRange.from}
                                  onChange={(e) => setFilters({
                                    ...filters,
                                    dateRange: { ...filters.dateRange, from: e.target.value }
                                  })}
                                />
                              </div>
                              <div>
                                <Label>To</Label>
                                <Input
                                  type="date"
                                  value={filters.dateRange.to}
                                  onChange={(e) => setFilters({
                                    ...filters,
                                    dateRange: { ...filters.dateRange, to: e.target.value }
                                  })}
                                />
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                        <Button onClick={() => setFilterPopoverOpen(false)}>
                          Apply Filters
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="md:hidden">
                <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter size={16} />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <Accordion type="single" collapsible>
                        {activeTab === 'products' && (
                          <AccordionItem value="price">
                            <AccordionTrigger>Price Range</AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label>Min</Label>
                                    <Input
                                      type="number"
                                      value={filters.priceRange.min}
                                      onChange={(e) => setFilters({
                                        ...filters,
                                        priceRange: { ...filters.priceRange, min: e.target.value }
                                      })}
                                      placeholder="0"
                                    />
                                  </div>
                                  <div>
                                    <Label>Max</Label>
                                    <Input
                                      type="number"
                                      value={filters.priceRange.max}
                                      onChange={(e) => setFilters({
                                        ...filters,
                                        priceRange: { ...filters.priceRange, max: e.target.value }
                                      })}
                                      placeholder="1000"
                                    />
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                        <AccordionItem value="categories">
                          <AccordionTrigger>Categories</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              {(activeTab === 'products' ? categories.products : categories.services).map((category) => (
                                <div key={category.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={category.id}
                                    checked={filters.categories.includes(category.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFilters({
                                          ...filters,
                                          categories: [...filters.categories, category.id]
                                        });
                                      } else {
                                        setFilters({
                                          ...filters,
                                          categories: filters.categories.filter(id => id !== category.id)
                                        });
                                      }
                                    }}
                                  />
                                  <Label htmlFor={category.id}>{category.name}</Label>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="date">
                          <AccordionTrigger>Date Range</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              <div>
                                <Label>From</Label>
                                <Input
                                  type="date"
                                  value={filters.dateRange.from}
                                  onChange={(e) => setFilters({
                                    ...filters,
                                    dateRange: { ...filters.dateRange, from: e.target.value }
                                  })}
                                />
                              </div>
                              <div>
                                <Label>To</Label>
                                <Input
                                  type="date"
                                  value={filters.dateRange.to}
                                  onChange={(e) => setFilters({
                                    ...filters,
                                    dateRange: { ...filters.dateRange, to: e.target.value }
                                  })}
                                />
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      <div className="flex justify-between mt-4">
                        <Button variant="outline" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                        <Button onClick={() => setMobileFilterOpen(false)}>
                          Apply Filters
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </TabsList>
        </Tabs>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="w-12">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Name
                    {sortField === 'name' && (
                      <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('category')}
                  >
                    Category
                    {sortField === 'category' && (
                      <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableCell>
                  {activeTab === 'products' ? (
                    <>
                      <TableCell
                        className="cursor-pointer"
                        onClick={() => handleSort('quantity')}
                      >
                        Quantity
                        {sortField === 'quantity' && (
                          <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                        )}
                      </TableCell>
                      <TableCell
                        className="cursor-pointer"
                        onClick={() => handleSort('price')}
                      >
                        Price
                        {sortField === 'price' && (
                          <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                        )}
                      </TableCell>
                    </>
                  ) : (
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => handleSort('cost')}
                    >
                      Cost
                      {sortField === 'cost' && (
                        <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                      )}
                    </TableCell>
                  )}
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('date')}
                  >
                    Created At
                    {sortField === 'date' && (
                      <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={activeTab === 'products' ? 9 : 7} className="text-center py-8">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : getCurrentItems().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activeTab === 'products' ? 9 : 7} className="text-center py-8">
                      No {activeTab} found
                    </TableCell>
                  </TableRow>
                ) : (
                  getCurrentItems().map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(item.id)}
                          onCheckedChange={() => handleSelectRow(item.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="h-10 w-10 rounded-md overflow-hidden relative">
                          <Image
                            src={item.imageUrl || '/placeholder.png'}
                            alt={item.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.categoryName || 'Unknown'}</TableCell>
                      {activeTab === 'products' ? (
                        <>
                          <TableCell>
                            <Badge variant={((item as Product).quantity > 10 ? 'default' : (item as Product).quantity > 5 ? 'primary' : 'danger')}>
                              {(item as Product).quantity}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatINR((item as Product).sellingPrice)}</TableCell>
                        </>
                      ) : (
                        <TableCell>{formatINR((item as Service).cost)}</TableCell>
                      )}
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push(`/inventory/stock/edit/${item.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setCurrentItem(item);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/inventory/stock/view/${item.id}`)}
                              >
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {!isLoading && (activeTab === 'products' ? filteredProducts : filteredServices).length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Showing {Math.min(currentPage * ITEMS_PER_PAGE, (activeTab === 'products' ? filteredProducts : filteredServices).length)} of {(activeTab === 'products' ? filteredProducts : filteredServices).length} entries
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>

                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;

                  // Display current page, first, last, and nearby pages
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink
                          isActive={currentPage === pageNum}
                          onClick={() => paginate(pageNum)}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }

                  // Add ellipsis
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <PaginationEllipsis key={i} />;
                  }

                  return null;
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the {activeTab === 'products' ? 'product' : 'service'} and remove it from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export {activeTab === 'products' ? 'Products' : 'Services'}</DialogTitle>
              <DialogDescription>
                Choose which {activeTab === 'products' ? 'products' : 'services'} you would like to export.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button
                onClick={() => handleExport(false)}
                className="w-full"
                variant="outline"
              >
                Export this page only
              </Button>
              <Button
                onClick={() => handleExport(true)}
                className="w-full"
              >
                Export all {activeTab === 'products' ? 'products' : 'services'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
