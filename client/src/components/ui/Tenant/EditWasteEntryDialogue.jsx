import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { wasteDataSchema } from '@/schemas/wasteDataSchemas';
import api from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const EditWasteEntryDialog = ({ entry, isOpen, onOpenChange, onEntryUpdated }) => {
  const [masterData, setMasterData] = useState({ wasteCategories: [], recyclingTechnologies: [] });

  const defaultValues = useMemo(() => ({
    pickupDate: entry?.pickupDate ? format(new Date(entry.pickupDate), 'yyyy-MM-dd') : "",
    wasteCategoryId: entry?.wasteCategoryId || "",
    wasteTypeId: entry?.wasteTypeId || "",
    quantity: entry?.quantity || 0,
    unit: entry?.unit || "KG",
    recycledDate: entry?.recycledDate ? format(new Date(entry.recycledDate), 'yyyy-MM-dd') : "",
    recyclingTechnologyId: entry?.recyclingTechnologyId || "",
    vehicleType: entry?.vehicleType || "",
    pickupAddress: entry?.pickupAddress || "",
    facilityAddress: entry?.facilityAddress || "",
    distanceKm: entry?.distanceKm || 0,
  }), [entry]);

  const form = useForm({
    resolver: zodResolver(wasteDataSchema),
    defaultValues,
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

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
  }, [isOpen, defaultValues, form]);

  const onSubmit = async (data) => {
    try {
      await api.put(`/waste-data/${entry.id}`, data);
      toast.success(`Waste entry updated successfully!`);
      onEntryUpdated();
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update waste entry.');
    }
  };

  const selectedCategoryId = form.watch("wasteCategoryId");
  const wasteTypes = masterData?.wasteCategories?.find(cat => cat.id === selectedCategoryId)?.types || [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Waste Entry</DialogTitle>
          <DialogDescription>
            Update the details for this waste record. Click save to apply changes.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="max-h-[60vh] overflow-y-auto pr-6 space-y-4">
                <FormField control={form.control} name="pickupDate" render={({ field }) => ( <FormItem><FormLabel>Pickup Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="wasteCategoryId" render={({ field }) => ( <FormItem><FormLabel>Waste Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                        <SelectContent>{masterData.wasteCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem> )}/>
                <FormField control={form.control} name="wasteTypeId" render={({ field }) => ( <FormItem><FormLabel>Waste Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategoryId}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                        <SelectContent>{wasteTypes.map(type => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem> )}/>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="quantity" render={({ field }) => ( <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    <FormField control={form.control} name="unit" render={({ field }) => ( <FormItem><FormLabel>Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="KG">KG</SelectItem><SelectItem value="G">G</SelectItem><SelectItem value="T">T</SelectItem><SelectItem value="LB">LB</SelectItem></SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem> )}/>
                </div>
                <FormField control={form.control} name="recycledDate" render={({ field }) => ( <FormItem><FormLabel>Date Recycled</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="recyclingTechnologyId" render={({ field }) => (
                    <FormItem><FormLabel>Recycling Technology</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a technology" /></SelectTrigger></FormControl>
                            <SelectContent>{masterData.recyclingTechnologies.map(tech => <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="vehicleType" render={({ field }) => ( <FormItem><FormLabel>Vehicle Type</FormLabel><FormControl><Input placeholder="e.g. Truck, Pickup" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            </div>
            <DialogFooter className="pt-4 border-t">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200" type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditWasteEntryDialog;

