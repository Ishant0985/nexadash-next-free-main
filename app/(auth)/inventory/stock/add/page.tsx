'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/page-heading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusCircle, Loader2, UploadCloud, X } from 'lucide-react';
import { auth, db } from '@/firebaseClient';
import { collection, getDocs, addDoc, query, orderBy, limit, where, getCountFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import Image from 'next/image';

type Category = {
    id: string;
    name: string;
};

const AddStock = () => {
    const router = useRouter();
    const [stockType, setStockType] = useState<'Product' | 'Service'>('Product');
    const [loading, setLoading] = useState<boolean>(false);
    const [authenticated, setAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<any>(null);

    // Product state
    const [productId, setProductId] = useState<string>('');
    const [productName, setProductName] = useState<string>('');
    const [productDescription, setProductDescription] = useState<string>('');
    const [productCategory, setProductCategory] = useState<string>('');
    const [productQuantity, setProductQuantity] = useState<number>(0);
    const [productPurchasePrice, setProductPurchasePrice] = useState<number>(0);
    const [productSellingPrice, setProductSellingPrice] = useState<number>(0);
    const [productTax, setProductTax] = useState<number>(0);
    const [productImage, setProductImage] = useState<File | null>(null);
    const [productImageUrl, setProductImageUrl] = useState<string>('');

    // Service state
    const [serviceId, setServiceId] = useState<string>('');
    const [serviceName, setServiceName] = useState<string>('');
    const [serviceDescription, setServiceDescription] = useState<string>('');
    const [serviceCategory, setServiceCategory] = useState<string>('');
    const [serviceCost, setServiceCost] = useState<number>(0);
    const [serviceImage, setServiceImage] = useState<File | null>(null);
    const [serviceImageUrl, setServiceImageUrl] = useState<string>('');

    // Categories
    const [productCategories, setProductCategories] = useState<Category[]>([]);
    const [serviceCategories, setServiceCategories] = useState<Category[]>([]);
    const [newProductCategory, setNewProductCategory] = useState<string>('');
    const [newServiceCategory, setNewServiceCategory] = useState<string>('');

    // New category dialogs
    const [addProductCategoryOpen, setAddProductCategoryOpen] = useState<boolean>(false);
    const [addServiceCategoryOpen, setAddServiceCategoryOpen] = useState<boolean>(false);

    // Check authentication
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setAuthenticated(true);
                setUser(currentUser);
            } else {
                setAuthenticated(false);
                setUser(null);
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Fetch categories and generate IDs
    useEffect(() => {
        if (authenticated) {
            fetchCategories();
            generateProductId();
            generateServiceId();
        }
    }, [authenticated]);

    const fetchCategories = async () => {
        try {
            // Fetch product categories
            const productCategoryQuery = query(collection(db, 'productcategory'));
            const productCategorySnapshot = await getDocs(productCategoryQuery);
            const productCategoryList = productCategorySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name
            }));
            setProductCategories(productCategoryList);

            // Fetch service categories
            const serviceCategoryQuery = query(collection(db, 'servicecategory'));
            const serviceCategorySnapshot = await getDocs(serviceCategoryQuery);
            const serviceCategoryList = serviceCategorySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name
            }));
            setServiceCategories(serviceCategoryList);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error("Failed to fetch categories");
        }
    };

    const generateProductId = async () => {
        try {
            const productsRef = collection(db, 'products');
            const countSnapshot = await getCountFromServer(productsRef);
            const count = countSnapshot.data().count;
            setProductId(`P${count + 1}`);
        } catch (error) {
            console.error('Error generating product ID:', error);
            setProductId('P1');
        }
    };

    const generateServiceId = async () => {
        try {
            const servicesRef = collection(db, 'services');
            const countSnapshot = await getCountFromServer(servicesRef);
            const count = countSnapshot.data().count;
            setServiceId(`S${count + 1}`);
        } catch (error) {
            console.error('Error generating service ID:', error);
            setServiceId('S1');
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'service') => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (type === 'product') {
                setProductImage(file);
                setProductImageUrl(URL.createObjectURL(file));
            } else {
                setServiceImage(file);
                setServiceImageUrl(URL.createObjectURL(file));
            }
        }
    };

    const removeImage = (type: 'product' | 'service') => {
        if (type === 'product') {
            setProductImage(null);
            setProductImageUrl('');
        } else {
            setServiceImage(null);
            setServiceImageUrl('');
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                if (event.target?.result) {
                    // Return the data URI directly
                    resolve(event.target.result as string);
                } else {
                    reject(new Error('Failed to convert file to data URI'));
                }
            };
            
            reader.onerror = (error) => {
                reject(error);
            };
            
            // Read the file as a data URL (base64 encoded)
            reader.readAsDataURL(file);
        });
    };

    const addProductCategory = async () => {
        if (!newProductCategory.trim()) {
            toast.error("Category name cannot be empty");
            return;
        }

        try {
            const docRef = await addDoc(collection(db, 'productcategory'), {
                name: newProductCategory,
                createdAt: new Date(),
                createdBy: user.uid
            });

            setProductCategories([...productCategories, { id: docRef.id, name: newProductCategory }]);
            setProductCategory(docRef.id);
            setNewProductCategory('');
            setAddProductCategoryOpen(false);

            toast.success("Product category added successfully");
        } catch (error) {
            console.error('Error adding product category:', error);
            toast.error("Failed to add product category");
        }
    };

    const addServiceCategory = async () => {
        if (!newServiceCategory.trim()) {
            toast.error("Category name cannot be empty");
            return;
        }

        try {
            const docRef = await addDoc(collection(db, 'servicecategory'), {
                name: newServiceCategory,
                createdAt: new Date(),
                createdBy: user.uid
            });

            setServiceCategories([...serviceCategories, { id: docRef.id, name: newServiceCategory }]);
            setServiceCategory(docRef.id);
            setNewServiceCategory('');
            setAddServiceCategoryOpen(false);

            toast.success("Service category added successfully");
        } catch (error) {
            console.error('Error adding service category:', error);
            toast.error("Failed to add service category");
        }
    };

    const handleAddProduct = async () => {
        if (!productName || !productDescription || !productCategory) {
            toast.error("Please fill all required fields");
            return;
        }

        setLoading(true);

        try {
            let imageUrl = '';
            if (productImage) {
                imageUrl = await uploadImage(productImage);
            }

            await addDoc(collection(db, 'products'), {
                productId,
                name: productName,
                description: productDescription,
                category: productCategory,
                quantity: productQuantity,
                purchasePrice: productPurchasePrice,
                sellingPrice: productSellingPrice,
                tax: productTax,
                imageUrl: imageUrl,
                createdAt: new Date(),
                createdBy: user.uid
            });

            toast.success("Product added successfully");

            // Reset form
            setProductName('');
            setProductDescription('');
            setProductCategory('');
            setProductQuantity(0);
            setProductPurchasePrice(0);
            setProductSellingPrice(0);
            setProductTax(0);
            setProductImage(null);
            setProductImageUrl('');

            // Generate new ID for next product
            generateProductId();
        } catch (error) {
            console.error('Error adding product:', error);
            toast.error("Failed to add product");
        } finally {
            setLoading(false);
        }
    };

    const handleAddService = async () => {
        if (!serviceName || !serviceDescription || !serviceCategory) {
            toast.error("Please fill all required fields");
            return;
        }

        setLoading(true);

        try {
            let imageUrl = '';
            if (serviceImage) {
                imageUrl = await uploadImage(serviceImage);
            }

            await addDoc(collection(db, 'services'), {
                serviceId,
                name: serviceName,
                description: serviceDescription,
                category: serviceCategory,
                cost: serviceCost,
                imageUrl: imageUrl,
                createdAt: new Date(),
                createdBy: user.uid
            });

            toast.success("Service added successfully");

            // Reset form
            setServiceName('');
            setServiceDescription('');
            setServiceCategory('');
            setServiceCost(0);
            setServiceImage(null);
            setServiceImageUrl('');

            // Generate new ID for next service
            generateServiceId();
        } catch (error) {
            console.error('Error adding service:', error);
            toast.error("Failed to add service");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative space-y-4">
            <PageHeader heading="Add Stock" />

            <Card className=" mt-6">
                <CardHeader className="text-primary-foreground">
                    <CardTitle className="text-primary-foreground font-bold text-lg py-2">Select Stock Type</CardTitle>
                    <CardDescription className="text-primary-foreground text-sm py-2">Choose whether you want to add a product or service</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <Tabs
                        defaultValue="Product"
                        value={stockType}
                        onValueChange={(value) => setStockType(value as 'Product' | 'Service')}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="Product">Product</TabsTrigger>
                            <TabsTrigger value="Service">Service</TabsTrigger>
                        </TabsList>

                        <TabsContent value="Product">
                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="productId">Product ID</Label>
                                        <Input id="productId" value={productId} disabled />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="productName">Product Name *</Label>
                                        <Input
                                            id="productName"
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                            placeholder="Enter product name"
                                        />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="productDescription">Product Description *</Label>
                                        <Textarea
                                            id="productDescription"
                                            value={productDescription}
                                            onChange={(e) => setProductDescription(e.target.value)}
                                            placeholder="Enter product description"
                                            rows={4}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="productCategory">Product Category *</Label>
                                            <AlertDialog open={addProductCategoryOpen} onOpenChange={setAddProductCategoryOpen}>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        <PlusCircle className="h-4 w-4 mr-2" /> Add Category
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Add Product Category</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Enter the name of the new product category
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <div className="my-4">
                                                        <Input
                                                            value={newProductCategory}
                                                            onChange={(e) => setNewProductCategory(e.target.value)}
                                                            placeholder="Category Name"
                                                        />
                                                    </div>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={addProductCategory}>Add</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                        <Select value={productCategory} onValueChange={setProductCategory}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select product category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {productCategories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="productQuantity">Initial Quantity</Label>
                                        <Input
                                            id="productQuantity"
                                            type="number"
                                            value={productQuantity}
                                            onChange={(e) => setProductQuantity(Number(e.target.value))}
                                            min={0}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="productPurchasePrice">Purchase Price</Label>
                                        <Input
                                            id="productPurchasePrice"
                                            type="number"
                                            value={productPurchasePrice}
                                            onChange={(e) => setProductPurchasePrice(Number(e.target.value))}
                                            min={0}
                                            step={0.01}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="productSellingPrice">Selling Price</Label>
                                        <Input
                                            id="productSellingPrice"
                                            type="number"
                                            value={productSellingPrice}
                                            onChange={(e) => setProductSellingPrice(Number(e.target.value))}
                                            min={0}
                                            step={0.01}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="productTax">Tax Rate (%)</Label>
                                        <Input
                                            id="productTax"
                                            type="number"
                                            value={productTax}
                                            onChange={(e) => setProductTax(Number(e.target.value))}
                                            min={0}
                                            step={0.01}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Product Image</Label>
                                    {productImageUrl ? (
                                        <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                                            <Image
                                                src={productImageUrl}
                                                alt="Product preview"
                                                className="object-cover"
                                                fill
                                                sizes="160px"
                                            />
                                            <Button
                                                size="icon"
                                                variant="destructive"
                                                className="absolute top-2 right-2 h-6 w-6"
                                                onClick={() => removeImage('product')}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                            <label htmlFor="productImageUpload" className="cursor-pointer flex flex-col items-center">
                                                <UploadCloud className="h-12 w-12 text-gray-400" />
                                                <span className="mt-2 text-sm font-medium text-gray-600">Click to upload image</span>
                                            </label>
                                            <input
                                                id="productImageUpload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleImageChange(e, 'product')}
                                            />
                                        </div>
                                    )}
                                </div>

                                <Separator className="my-6" />

                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleAddProduct}
                                        disabled={loading}
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Add Product
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="Service">
                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="serviceId">Service ID</Label>
                                        <Input id="serviceId" value={serviceId} disabled />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="serviceName">Service Name *</Label>
                                        <Input
                                            id="serviceName"
                                            value={serviceName}
                                            onChange={(e) => setServiceName(e.target.value)}
                                            placeholder="Enter service name"
                                        />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="serviceDescription">Service Description *</Label>
                                        <Textarea
                                            id="serviceDescription"
                                            value={serviceDescription}
                                            onChange={(e) => setServiceDescription(e.target.value)}
                                            placeholder="Enter service description"
                                            rows={4}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="serviceCategory">Service Category *</Label>
                                            <AlertDialog open={addServiceCategoryOpen} onOpenChange={setAddServiceCategoryOpen}>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        <PlusCircle className="h-4 w-4 mr-2" /> Add Category
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Add Service Category</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Enter the name of the new service category
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <div className="my-4">
                                                        <Input
                                                            value={newServiceCategory}
                                                            onChange={(e) => setNewServiceCategory(e.target.value)}
                                                            placeholder="Category Name"
                                                        />
                                                    </div>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={addServiceCategory}>Add</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                        <Select value={serviceCategory} onValueChange={setServiceCategory}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select service category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {serviceCategories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="serviceCost">Service Cost</Label>
                                        <Input
                                            id="serviceCost"
                                            type="number"
                                            value={serviceCost}
                                            onChange={(e) => setServiceCost(Number(e.target.value))}
                                            min={0}
                                            step={0.01}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Service Image</Label>
                                    {serviceImageUrl ? (
                                        <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                                            <Image
                                                src={serviceImageUrl}
                                                alt="Service preview"
                                                className="object-cover"
                                                fill
                                                sizes="160px"
                                            />
                                            <Button
                                                size="icon"
                                                variant="destructive"
                                                className="absolute top-2 right-2 h-6 w-6"
                                                onClick={() => removeImage('service')}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                            <label htmlFor="serviceImageUpload" className="cursor-pointer flex flex-col items-center">
                                                <UploadCloud className="h-12 w-12 text-gray-400" />
                                                <span className="mt-2 text-sm font-medium text-gray-600">Click to upload image</span>
                                            </label>
                                            <input
                                                id="serviceImageUpload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleImageChange(e, 'service')}
                                            />
                                        </div>
                                    )}
                                </div>

                                <Separator className="my-6" />

                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleAddService}
                                        disabled={loading}
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Add Service
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default AddStock;