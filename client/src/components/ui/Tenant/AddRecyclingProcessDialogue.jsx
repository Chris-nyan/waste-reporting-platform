import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, CalendarIcon } from 'lucide-react';
import { recyclingProcessSchema } from '@/schemas/recyclingProcessSchemas';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const AddRecyclingProcessDialog = ({ wasteEntry, isOpen, onOpenChange, onProcessAdded }) => {
    const form = useForm({
        resolver: zodResolver(recyclingProcessSchema),
        defaultValues: {
            quantityRecycled: 0,
            recycledDate: new Date(),
        },
    });

    const availableToRecycle = (wasteEntry?.quantity || 0) - (wasteEntry?.recycledQuantity || 0);

    const onSubmit = async (data) => {
        if (data.quantityRecycled > availableToRecycle) {
            toast.error(`Cannot recycle more than the available ${availableToRecycle.toLocaleString()} ${wasteEntry.unit}.`);
            return;
        }

        try {
            await api.post('/recycling-processes', {
                ...data,
                wasteDataId: wasteEntry.id,
            });
            toast.success('Recycling process logged successfully!');
            onProcessAdded();
            onOpenChange(false);
            form.reset();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to log process.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Process Recycling for {wasteEntry?.wasteType.name}</DialogTitle>
                    <DialogDescription>
                        Log how much of this waste entry was recycled.
                        <span className="font-bold text-emerald-600"> {availableToRecycle.toLocaleString()} {wasteEntry?.unit}</span> available.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="quantityRecycled"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quantity Recycled ({wasteEntry?.unit})</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="recycledDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date Recycled</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="pt-4">
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                            >
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Process
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default AddRecyclingProcessDialog;
