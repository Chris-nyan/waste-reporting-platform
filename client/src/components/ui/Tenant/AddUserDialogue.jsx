import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle } from 'lucide-react';
import { userFormSchema } from '@/schemas/userSchemas';
import api from '@/lib/api';

const AddUserDialog = ({ onUserAdded }) => {
    const [isOpen, setIsOpen] = useState(false);
    const form = useForm({
        resolver: zodResolver(userFormSchema),
        defaultValues: { name: '', email: '', password: '', confirmPassword: '', role: 'MEMBER' },
    });

    const onSubmit = async (data) => {
        try {
            await api.post('/users', data);
            toast.success("User created successfully!");
            onUserAdded();
            form.reset();
            setIsOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create user.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    className={cn(
                        "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm hover:shadow-lg",
                        users.length >= 5 && "opacity-50 cursor-not-allowed hover:shadow-sm"
                    )}
                    disabled={users.length >= 5} // disable if 5 or more users
                    title={users.length >= 5 ? "User limit reached (5 users max)" : ""}
                >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to add a new user to your tenant.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="password" render={({ field }) => (
                            <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="Min. 8 characters" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                            <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" placeholder="Re-type password" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="role" render={({ field }) => (
                            <FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="MEMBER">User (Member)</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                            </Select><FormMessage /></FormItem>
                        )} />
                        <DialogFooter className="pt-4">
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200">
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create User
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default AddUserDialog;
