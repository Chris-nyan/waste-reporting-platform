import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, Loader2, CheckCircle, Repeat, UploadCloud, Route, X, CalendarIcon, Info, FileUp, ListPlus, DownloadCloud, File as FileIcon, Warehouse, Factory } from 'lucide-react';
import { wasteDataSchema } from '@/schemas/wasteDataSchemas';
import api from '@/lib/api';
import Papa from 'papaparse';
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Steps and data constants
// MODIFIED: Step 2 title
const STEPS = [{ id: 1, title: 'Waste Details' }, { id: 2, title: 'Logistics' }, { id: 3, title: 'Upload Images' }, { id: 4, title: 'Review & Submit' }];

// ========================== Step Components ==========================
const FormLabelWithInfo = ({ children, description }) => (<div className="flex items-center gap-2"><FormLabel>{children}</FormLabel><Popover><PopoverTrigger asChild><Info className="h-4 w-4 text-gray-400 cursor-pointer" /></PopoverTrigger><PopoverContent className="w-64 text-sm">{description}</PopoverContent></Popover></div>);


const Step1WasteDetails = ({ control, form, masterData }) => {
    const selectedCategoryId = form.watch("wasteCategoryId");
    const wasteTypes = masterData?.wasteCategories?.find(cat => cat.id === selectedCategoryId)?.types || [];

    return (
        <div className="space-y-4">
            {/* Pickup Date */}
            <FormField
                control={control}
                name="pickupDate"
                render={({ field }) => (
                    <FormItem>
                        <FormLabelWithInfo description="The date waste was collected.">
                            Waste Pickup Date
                        </FormLabelWithInfo>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        {field.value ? (
                                            format(field.value, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Waste Category */}
            <FormField
                control={control}
                name="wasteCategoryId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabelWithInfo description="The broad category.">
                            Waste Category
                        </FormLabelWithInfo>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {masterData?.wasteCategories?.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Waste Type */}
            <FormField
                control={control}
                name="wasteTypeId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabelWithInfo description="The specific material type.">
                            Waste Type
                        </FormLabelWithInfo>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedCategoryId}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {wasteTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Quantity */}
            <FormField
                control={control}
                name="quantity"
                render={({ field }) => (
                    <FormItem>
                        <FormLabelWithInfo description="The measured amount of weight">
                            Weight
                        </FormLabelWithInfo>
                        <FormControl>
                            <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Unit */}
            <FormField
                control={control}
                name="unit"
                render={({ field }) => (
                    <FormItem>
                        <FormLabelWithInfo description="The unit of measurement.">
                            Unit
                        </FormLabelWithInfo>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="KG">KG</SelectItem>
                                <SelectItem value="G">G</SelectItem>
                                <SelectItem value="T">T</SelectItem>
                                <SelectItem value="LB">LB</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

// ========================== MODIFIED STEP 2 ==========================
const Step2Logistics = ({ control, form, masterData }) => {
    const [calculating, setCalculating] = useState(false);
    const handleCalculateDistance = async () => {
        const origin = form.getValues("pickupAddress");
        const destination = form.getValues("facilityAddress");
        if (!origin || !destination) {
            toast.error("Please enter both addresses to calculate distance.");
            return;
        }
        setCalculating(true);
        try {
            const response = await api.post('/logistics/calculate-distance', { origin, destination });
            const { distanceKm } = response.data;
            form.setValue("distanceKm", distanceKm, { shouldValidate: true });
            toast.success(`Distance calculated: ${distanceKm} km`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to calculate distance.");
        } finally {
            setCalculating(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* REMOVED: recycledDate Field */}
            {/* REMOVED: recyclingTechnologyId Field */}

            {/* MODIFIED: vehicleType to vehicleTypeId */}
            <FormField
                control={control}
                name="vehicleTypeId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabelWithInfo description="The vehicle used for transport.">
                            Vehicle
                        </FormLabelWithInfo>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a vehicle" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {masterData?.vehicleTypes?.map(vehicle => (
                                    <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* MODIFIED: Distance Calculation Section */}
            <div className="space-y-2 p-4 border rounded-lg bg-gray-50/50">
                <h4 className="font-medium">Logistics & Distance <span className="text-gray-400 text-sm">(Optional)</span></h4>

                {/* MODIFIED: pickupAddress to pickupLocationId */}
                <FormField
                    control={control}
                    name="pickupLocationId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Pickup Location</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <Warehouse className="mr-2 h-4 w-4 opacity-50" />
                                        <SelectValue placeholder="Select pickup location" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {masterData?.pickupLocations?.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* MODIFIED: facilityAddress to facilityId */}
                <FormField
                    control={control}
                    name="facilityId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Facility</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <Factory className="mr-2 h-4 w-4 opacity-50" />
                                        <SelectValue placeholder="Select facility" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {masterData?.facilities?.map(fac => (
                                        <SelectItem key={fac.id} value={fac.id}>{fac.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex items-end gap-4">
                    {/* MODIFIED: distanceKm is now editable */}
                    <FormField
                        control={control}
                        name="distanceKm"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Distance (km)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="Enter manually..."
                                        {...field}
                                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {/* MODIFIED: "Calculate" button to "Fetch Stored Distance" */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCalculateDistance}
                        disabled={calculating}
                        className="mt-2"
                    >
                        {calculating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Route className="mr-2 h-4 w-4" />
                        )}
                        Calculate
                    </Button>
                </div>
            </div>
        </div>
    );
};
// ========================== END MODIFIED STEP 2 ==========================


const ImageUploadField = ({ form, name, label }) => {
    const { control, getValues, setValue } = form;
    const files = getValues(name);

    const handleFileRemove = (indexToRemove) => {
        const currentFiles = Array.from(files || []);
        const updatedFiles = currentFiles.filter((_, index) => index !== indexToRemove);
        const dataTransfer = new DataTransfer();
        updatedFiles.forEach(file => dataTransfer.items.add(file));
        setValue(name, dataTransfer.files, { shouldValidate: true });
    };

    return (<Controller name={name} control={control} render={({ field }) => (<div className="space-y-2"><Label htmlFor={name}>{label}</Label><div className="flex items-center justify-center w-full"><label htmlFor={name} className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"><UploadCloud className="w-8 h-8 mb-2 text-gray-500" /><p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p><Input id={name} type="file" className="hidden" multiple onChange={(e) => field.onChange(e.target.files)} /></label></div>{files?.length > 0 && (<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">{Array.from(files).map((file, index) => (<div key={index} className="relative group aspect-square"><img src={URL.createObjectURL(file)} alt={`preview ${index}`} className="h-full w-full object-cover rounded-md" /><button type="button" onClick={() => handleFileRemove(index)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button></div>))}</div>)}</div>)} />);
};

// MODIFIED: Removed recyclingImages field
const Step3UploadImages = ({ form }) => (
    <div className="space-y-6">
        <ImageUploadField form={form} name="wasteImages" label="Waste Images" />
        {/* <ImageUploadField form={form} name="recyclingImages" label="Recycling Process Images" /> */}
    </div>
);

const ReviewItem = ({ label, value }) => (<div className="flex justify-between py-2 border-b"><dt className="text-sm text-gray-600">{label}</dt><dd className="text-sm font-medium text-gray-800 text-right">{value || 'N/A'}</dd></div>);

// MODIFIED: Step 4 Review
const Step4Review = ({ form, masterData }) => {
    const data = form.watch();

    // Find names for relations
    const categoryName = masterData?.wasteCategories?.find(c => c.id === data.wasteCategoryId)?.name;
    const typeName = masterData?.wasteCategories?.flatMap(c => c.types).find(t => t.id === data.wasteTypeId)?.name;
    // REMOVED: techName
    const vehicleName = masterData?.vehicleTypes?.find(v => v.id === data.vehicleTypeId)?.name;
    const pickupLocationName = masterData?.pickupLocations?.find(p => p.id === data.pickupLocationId)?.name;
    const facilityName = masterData?.facilities?.find(f => f.id === data.facilityId)?.name;

    return (
        <div className="max-h-[400px] overflow-y-auto pr-4 space-y-6">
            <Card><CardHeader><CardTitle>Waste Details</CardTitle></CardHeader><CardContent><dl className="space-y-1">
                <ReviewItem label="Pickup Date" value={data.pickupDate ? format(data.pickupDate, 'PPP') : 'N/A'} />
                <ReviewItem label="Waste Category" value={categoryName} />
                <ReviewItem label="Waste Type" value={typeName} />
                <ReviewItem label="Weight / Quantity" value={`${data.quantity} ${data.unit}`} />
            </dl></CardContent></Card>

            {/* MODIFIED: Card title and content */}
            <Card><CardHeader><CardTitle>Logistics</CardTitle></CardHeader><CardContent><dl className="space-y-1">
                {/* REMOVED: Date Recycled */}
                {/* REMOVED: Recycling Technology */}
                <ReviewItem label="Vehicle" value={vehicleName} />
                <ReviewItem label="Pickup Location" value={pickupLocationName} />
                <ReviewItem label="Facility" value={facilityName} />
                <ReviewItem label="Distance" value={data.distanceKm ? `${data.distanceKm} km` : 'N/Warning'} />
            </dl></CardContent></Card>

            {/* MODIFIED: Conditional and content for images */}
            {(data.wasteImages?.length > 0) && (
                <Card><CardHeader><CardTitle>Uploaded Images</CardTitle></CardHeader><CardContent className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {data.wasteImages && Array.from(data.wasteImages).map((file, i) => <img key={`waste-${i}`} src={URL.createObjectURL(file)} className="h-24 w-full object-cover rounded-md" />)}
                    {/* REMOVED: recyclingImages map */}
                </CardContent></Card>
            )}
        </div>
    );
};

// A self-contained component for handling file drag-and-drop and selection.
const Dropzone = ({ onFileChange, selectedFile, accept }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            onFileChange(files[0]);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFileChange(files[0]);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleButtonClick}
            className={cn(
                "relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                isDragOver ? "border-green-500 bg-green-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100",
                selectedFile && "border-green-500 bg-green-50"
            )}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept={accept}
            />
            {selectedFile ? (
                <>
                    <FileIcon className="w-10 h-10 mb-2 text-green-600" />
                    <p className="text-sm font-medium text-gray-700 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent click from opening file dialog
                            onFileChange(null);
                            fileInputRef.current.value = ""; // Clear the file input's value
                        }}
                        className="absolute top-2 right-2 p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </>
            ) : (
                <>
                    <UploadCloud className="w-10 h-10 mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-400">Excel file (.xlsx or .xls)</p>
                </>
            )}
        </div>
    );
};


// ========================== ENHANCED UPLOAD STEP ==========================
const Step0UploadChoice = ({ setStep, clientId, onUploadSuccess }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleDownloadTemplate = async () => {
        setIsDownloading(true);
        try {
            const response = await api.get('/waste-data/template', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'waste_data_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Failed to download template.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Please select a file to upload.");
            return;
        }
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('clientId', clientId);
        try {
            const response = await api.post('/waste-data/bulk-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(response.data.message || "Upload successful!");
            onUploadSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || "Upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h3 className="text-2xl font-semibold mb-2 text-center text-gray-800">
                How would you like to add data?
            </h3>
            <p className="text-sm text-gray-500 mb-8 text-center">
                Choose to upload a file for multiple entries or add a single entry manually.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Upload Option Card */}
                <Card className="group transition-all border border-gray-200 hover:border-green-500 hover:shadow-md rounded-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-gray-800 group-hover:text-green-600 transition-colors text-base font-semibold">
                            <FileUp className="h-5 w-5" /> Upload From File
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-2">
                        {/* Step 1 */}
                        <div className="flex items-center gap-3">

                            <Button
                                onClick={handleDownloadTemplate}
                                disabled={isDownloading}
                                variant="outline"
                                className="w-full border-gray-300 hover:bg-green-600 hover:text-white transition-all"
                            >
                                {isDownloading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <DownloadCloud className="mr-2 h-4 w-4" />
                                )}
                                Download Template
                            </Button>
                        </div>

                        {/* Step 2 */}
                        <div className="flex items-start gap-3">

                            <div className="w-full">
                                <Dropzone
                                    onFileChange={setSelectedFile}
                                    selectedFile={selectedFile}
                                    accept=".xlsx, .xls"
                                />
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex items-center gap-3">

                            <Button
                                onClick={handleUpload}
                                disabled={isUploading || !selectedFile}
                                className="w-full bg-green-600 hover:bg-green-700 text-white transition-all"
                            >
                                {isUploading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                Confirm & Upload
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Manual Entry Option Card */}
                <Card
                    className="group transition-all border border-gray-200 hover:border-green-500 hover:shadow-md cursor-pointer rounded-xl"
                    onClick={() => setStep(1)}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-gray-800 group-hover:text-green-600 transition-colors text-base font-semibold">
                            <ListPlus className="h-5 w-5" /> Manual Entry
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center items-center text-center pt-2">
                        <p className="text-sm text-gray-600 mb-5">
                            Enter a single waste record using our step-by-step form.
                        </p>
                        <Button
                            variant="secondary"
                            className="w-full border-gray-300 hover:bg-green-600 hover:text-white transition-all"
                        >
                            Start Manual Entry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const AddWasteEntryDialog = ({ clientId, onWasteEntryAdded }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0); // Start at 0 for input choice step
    const [isSubmitted, setIsSubmitted] = useState(false);
    // MODIFIED: Added new arrays to masterData state
    const [masterData, setMasterData] = useState({
        wasteCategories: [],
        recyclingTechnologies: [], // Kept in case other parts of app use it
        pickupLocations: [],
        facilities: [],
        vehicleTypes: []
    });

    const form = useForm({
        resolver: zodResolver(wasteDataSchema),
        defaultValues: { unit: "KG", quantity: 0 },
    });
    const onUploadSuccess = () => {
        onWasteEntryAdded(); // This refreshes the data on the parent page
        setIsOpen(false);    // This closes the dialog
    };

    useEffect(() => {
        // MODIFIED: Condition to check any of the master data arrays
        if (isOpen && masterData.wasteCategories.length === 0) {
            const fetchMasterData = async () => {
                try {
                    const response = await api.get('/master-data');
                    // This will now populate all arrays (categories, locations, facilities, vehicles)
                    // assuming your /master-data endpoint returns them all.
                    setMasterData(response.data);
                } catch (error) {
                    toast.error("Failed to load form options.");
                }
            };
            fetchMasterData();
        }
    }, [isOpen, masterData.wasteCategories.length]);

    const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                // MODIFIED: no longer need to check for recyclingImages
                if (value !== null && value !== undefined && value !== "") {
                    if (key === 'wasteImages') { // Only check for wasteImages
                        if (value.length > 0) Array.from(value).forEach(file => formData.append(key, file));
                    } else {
                        formData.append(key, value instanceof Date ? value.toISOString() : value);
                    }
                }
            });
            formData.append("clientId", clientId);

            await api.post('/waste-data', formData, { headers: { "Content-Type": "multipart/form-data" } });
            toast.success(`Waste entry added successfully!`);
            onWasteEntryAdded();
            setIsSubmitted(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add waste entry.');
        }
    };

    const handleNext = async () => {
        let fieldsToValidate = [];
        if (step === 1) fieldsToValidate = ['pickupDate', 'wasteCategoryId', 'wasteTypeId', 'quantity', 'unit'];
        // MODIFIED: Step 2 fields are optional per schema, so no validation needed.
        // if (step === 2) fieldsToValidate = ['recycledDate'];
        const isValid = await form.trigger(fieldsToValidate);
        if (isValid) setStep(prev => prev + 1);
    };

    const handleBack = () => setStep(prev => prev - 1);
    const resetAndRestart = () => { form.reset(); setIsSubmitted(false); setStep(0); };// Reset to step 0 for input choice
    const handleOpenChange = (open) => { if (!open) resetAndRestart(); setIsOpen(open); };
    const progress = (step / STEPS.length) * 100;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild><Button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"><PlusCircle className="mr-2 h-4 w-4" /> Add Waste Entry</Button></DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                {isSubmitted ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]"><CheckCircle className="w-16 h-16 text-green-500 mb-4" /><h2 className="text-2xl font-bold mb-2">Entry Added!</h2><p className="text-gray-600 mb-6">The waste data has been successfully saved.</p><div className="flex gap-4"><Button onClick={resetAndRestart}><Repeat className="mr-2 h-4 w-4" /> Log Another Entry</Button><DialogClose asChild><Button variant="outline">Finish</Button></DialogClose></div></div>
                ) : (
                    <><DialogHeader><DialogTitle>Log a New Waste Entry</DialogTitle><DialogDescription>Follow the steps to accurately record waste data.</DialogDescription></DialogHeader>
                        {step > 0 && (
                            <div className="py-4">
                                <Progress value={progress} className="w-full [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-600" />
                                <p className="text-center text-sm text-gray-500 mt-2">Step {step} of {STEPS.length}: {STEPS[step - 1].title}</p>
                            </div>
                        )}
                        {/* <div className="py-4"><Progress value={progress} className="w-full [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-600" /><p className="text-center text-sm text-gray-500 mt-2">Step {step} of {STEPS.length}: {STEPS[step - 1].title}</p></div> */}
                        <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="min-h-[420px] py-4">
                                {step === 0 && <Step0UploadChoice setStep={setStep} clientId={clientId} onUploadSuccess={onUploadSuccess} />}
                                {step === 1 && <Step1WasteDetails control={form.control} form={form} masterData={masterData} />}
                                {/* MODIFIED: Use new Step2Logistics component */}
                                {step === 2 && <Step2Logistics control={form.control} form={form} masterData={masterData} />}
                                {step === 3 && <Step3UploadImages form={form} />}
                                {step === 4 && <Step4Review form={form} masterData={masterData} />}
                            </div>
                            <DialogFooter className="pt-4">
                                {step > 1 && <Button type="button" variant="outline" onClick={handleBack}>Back</Button>}
                                {step > 0 && (
                                    <div className="ml-auto flex items-center gap-2">
                                        <Button type="button" onClick={handleBack} variant="ghost">Back</Button>
                                        {step < STEPS.length && (
                                            <Button type="button" onClick={handleNext} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                                                Next
                                            </Button>
                                        )}
                                        {step === STEPS.length && (
                                            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Submit Entry
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </DialogFooter>
                        </form></Form></>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default AddWasteEntryDialog;