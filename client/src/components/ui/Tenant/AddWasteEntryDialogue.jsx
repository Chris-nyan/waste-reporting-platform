import React, { useState, useEffect } from 'react';
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
import { PlusCircle, Loader2, CheckCircle, Repeat, UploadCloud, Route, X, CalendarIcon, Info } from 'lucide-react';
import { wasteDataSchema } from '@/schemas/wasteDataSchemas';
import api from '@/lib/api';
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Steps and data constants
const STEPS = [ { id: 1, title: 'Waste Details' }, { id: 2, title: 'Recycling & Logistics' }, { id: 3, title: 'Upload Images' }, { id: 4, title: 'Review & Submit' } ];

// ========================== Step Components ==========================
const FormLabelWithInfo = ({ children, description }) => ( <div className="flex items-center gap-2"><FormLabel>{children}</FormLabel><Popover><PopoverTrigger asChild><Info className="h-4 w-4 text-gray-400 cursor-pointer" /></PopoverTrigger><PopoverContent className="w-64 text-sm">{description}</PopoverContent></Popover></div> );

const Step1WasteDetails = ({ control, form, masterData }) => {
  const selectedCategoryId = form.watch("wasteCategoryId");
  const wasteTypes = masterData?.wasteCategories?.find(cat => cat.id === selectedCategoryId)?.types || [];

  return (
    <div className="space-y-4">
      <FormField control={control} name="pickupDate" render={({ field }) => (
        <FormItem className="flex flex-col"><FormLabelWithInfo description="The date waste was collected.">Pickup Date</FormLabelWithInfo><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
      )}/>
      <div className="grid grid-cols-2 gap-4">
        <FormField control={control} name="wasteCategoryId" render={({ field }) => ( <FormItem><FormLabelWithInfo description="The broad category.">Waste Category</FormLabelWithInfo><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl><SelectContent>{masterData?.wasteCategories?.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
        <FormField control={control} name="wasteTypeId" render={({ field }) => ( <FormItem><FormLabelWithInfo description="The specific material type.">Waste Type</FormLabelWithInfo><Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategoryId}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>{wasteTypes.map(type => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField control={control} name="quantity" render={({ field }) => ( <FormItem><FormLabelWithInfo description="The measured amount.">Quantity</FormLabelWithInfo><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem> )}/>
        <FormField control={control} name="unit" render={({ field }) => ( <FormItem><FormLabelWithInfo description="The unit of measurement.">Unit</FormLabelWithInfo><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger></FormControl><SelectContent><SelectItem value="KG">KG</SelectItem><SelectItem value="G">G</SelectItem><SelectItem value="T">T</SelectItem><SelectItem value="LB">LB</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
      </div>
    </div>
  );
};

const Step2RecyclingLogistics = ({ control, form, masterData }) => {
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
            <FormField control={control} name="recycledDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabelWithInfo description="The date material was processed.">Date Recycled</FormLabelWithInfo><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem> )}/>
            <FormField control={control} name="recyclingTechnologyId" render={({ field }) => (
                <FormItem><FormLabelWithInfo description="The method used to recycle.">Recycling Technology</FormLabelWithInfo><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a technology" /></SelectTrigger></FormControl><SelectContent>{masterData?.recyclingTechnologies?.map(tech => <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={control} name="vehicleType" render={({ field }) => ( <FormItem><FormLabelWithInfo description="The vehicle for transport.">Vehicle Type</FormLabelWithInfo><FormControl><Input placeholder="e.g. Truck, Pickup" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <div className="space-y-2 p-4 border rounded-lg bg-gray-50/50">
                <h4 className="font-medium">Distance Calculation <span className="text-gray-400 text-sm">(Optional)</span></h4>
                <FormField control={control} name="pickupAddress" render={({ field }) => ( <FormItem><FormLabel>Pickup Address</FormLabel><FormControl><Input placeholder="Enter start address" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={control} name="facilityAddress" render={({ field }) => ( <FormItem><FormLabel>Recycling Facility Address</FormLabel><FormControl><Input placeholder="Enter end address" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <div className="flex items-end gap-4">
                    <Button type="button" variant="outline" onClick={handleCalculateDistance} disabled={calculating} className="mt-2">{calculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Route className="mr-2 h-4 w-4" />} Calculate</Button>
                    <FormField control={control} name="distanceKm" render={({ field }) => ( <FormItem className="flex-1"><FormLabel>Distance (km)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} readOnly className="bg-gray-100" /></FormControl><FormMessage /></FormItem> )}/>
                </div>
            </div>
        </div>
    );
};

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

    return ( <Controller name={name} control={control} render={({ field }) => ( <div className="space-y-2"><Label htmlFor={name}>{label}</Label><div className="flex items-center justify-center w-full"><label htmlFor={name} className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"><UploadCloud className="w-8 h-8 mb-2 text-gray-500" /><p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p><Input id={name} type="file" className="hidden" multiple onChange={(e) => field.onChange(e.target.files)} /></label></div>{files?.length > 0 && (<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">{Array.from(files).map((file, index) => (<div key={index} className="relative group aspect-square"><img src={URL.createObjectURL(file)} alt={`preview ${index}`} className="h-full w-full object-cover rounded-md"/><button type="button" onClick={() => handleFileRemove(index)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button></div>))}</div>)}</div> )}/> );
};
const Step3UploadImages = ({ form }) => ( <div className="space-y-6"><ImageUploadField form={form} name="wasteImages" label="Waste Images" /><ImageUploadField form={form} name="recyclingImages" label="Recycling Process Images" /></div> );

const ReviewItem = ({ label, value }) => ( <div className="flex justify-between py-2 border-b"><dt className="text-sm text-gray-600">{label}</dt><dd className="text-sm font-medium text-gray-800 text-right">{value || 'N/A'}</dd></div> );
const Step4Review = ({ form, masterData }) => {
  const data = form.watch();
  const categoryName = masterData?.wasteCategories?.find(c => c.id === data.wasteCategoryId)?.name;
  const typeName = masterData?.wasteCategories?.flatMap(c => c.types).find(t => t.id === data.wasteTypeId)?.name;
  const techName = masterData?.recyclingTechnologies?.find(t => t.id === data.recyclingTechnologyId)?.name;
  return (
    <div className="max-h-[400px] overflow-y-auto pr-4 space-y-6">
      <Card><CardHeader><CardTitle>Waste Details</CardTitle></CardHeader><CardContent><dl className="space-y-1">
        <ReviewItem label="Pickup Date" value={data.pickupDate ? format(data.pickupDate, 'PPP') : 'N/A'} />
        <ReviewItem label="Waste Category" value={categoryName} />
        <ReviewItem label="Waste Type" value={typeName} />
        <ReviewItem label="Weight / Quantity" value={`${data.quantity} ${data.unit}`} />
      </dl></CardContent></Card>
      <Card><CardHeader><CardTitle>Recycling & Logistics</CardTitle></CardHeader><CardContent><dl className="space-y-1">
        <ReviewItem label="Date Recycled" value={data.recycledDate ? format(data.recycledDate, 'PPP') : 'N/A'} />
        <ReviewItem label="Recycling Technology" value={techName} />
        <ReviewItem label="Vehicle Type" value={data.vehicleType} />
        <ReviewItem label="Calculated Distance" value={data.distanceKm ? `${data.distanceKm} km` : 'N/A'} />
      </dl></CardContent></Card>
      {(data.wasteImages?.length > 0 || data.recyclingImages?.length > 0) && (
        <Card><CardHeader><CardTitle>Uploaded Images</CardTitle></CardHeader><CardContent className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {data.wasteImages && Array.from(data.wasteImages).map((file, i) => <img key={`waste-${i}`} src={URL.createObjectURL(file)} className="h-24 w-full object-cover rounded-md"/>)}
            {data.recyclingImages && Array.from(data.recyclingImages).map((file, i) => <img key={`recycle-${i}`} src={URL.createObjectURL(file)} className="h-24 w-full object-cover rounded-md"/>)}
        </CardContent></Card>
      )}
    </div>
  );
};

const AddWasteEntryDialog = ({ clientId, onWasteEntryAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [masterData, setMasterData] = useState({ wasteCategories: [], recyclingTechnologies: [] });

  const form = useForm({
    resolver: zodResolver(wasteDataSchema),
    defaultValues: { unit: "KG", quantity: 0 },
  });

  useEffect(() => {
    if (isOpen && masterData.wasteCategories.length === 0) {
      const fetchMasterData = async () => {
        try {
          const response = await api.get('/master-data');
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
        if (value !== null && value !== undefined && value !== "") {
            if (key === 'wasteImages' || key === 'recyclingImages') {
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
    if (step === 2) fieldsToValidate = ['recycledDate'];
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(prev => prev + 1);
  };
  
  const handleBack = () => setStep(prev => prev - 1);
  const resetAndRestart = () => { form.reset(); setIsSubmitted(false); setStep(1); };
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
          <div className="py-4"><Progress value={progress} className="w-full [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-600" /><p className="text-center text-sm text-gray-500 mt-2">Step {step} of {STEPS.length}: {STEPS[step - 1].title}</p></div>
          <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="min-h-[420px] py-4">
              {step === 1 && <Step1WasteDetails control={form.control} form={form} masterData={masterData} />}
              {step === 2 && <Step2RecyclingLogistics control={form.control} form={form} masterData={masterData} />}
              {step === 3 && <Step3UploadImages form={form} />}
              {step === 4 && <Step4Review form={form} masterData={masterData} />}
            </div>
            <DialogFooter className="pt-4">{step > 1 && <Button type="button" variant="outline" onClick={handleBack}>Back</Button>}
            <div className="ml-auto flex items-center gap-2"><DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
              {step < STEPS.length && <Button type="button" onClick={handleNext} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">Next</Button>}
              {step === STEPS.length && <Button type="submit" disabled={form.formState.isSubmitting} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">{form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Entry</Button>}
            </div></DialogFooter>
          </form></Form></>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddWasteEntryDialog;

