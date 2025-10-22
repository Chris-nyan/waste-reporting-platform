import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, User, Building, MapPin, Truck, Save, PlusCircle, Trash2, Pencil, Lock } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { profileSchema, settingItemSchema, passwordSchema } from '@/schemas/settingSchemas';
import ConfirmationDialog from '@/components/ui/ConfirmDialogue';
import { cn } from '@/lib/utils';
import useAuth from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


// ========================== Profile Tab Component ==========================
const ProfileTab = () => {
    const { user } = useAuth();
    const profileForm = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: user?.name || '', email: user?.email || '' },
    });
    const passwordForm = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    });

    useEffect(() => {
        if (user) {
            profileForm.reset({ name: user.name, email: user.email });
        }
    }, [user, profileForm]);

    const onProfileSubmit = async (data) => {
        try {
            await api.put('/settings/profile', data);
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error("Failed to update profile.");
        }
    };

    const onPasswordSubmit = async (data) => {
        try {
            await api.put('/settings/change-password', data);
            toast.success("Password changed successfully!");
            passwordForm.reset();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to change password.");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/70 backdrop-blur-xl border border-gray-200/50 shadow-sm rounded-xl">
                <CardHeader><CardTitle>Personal Information</CardTitle><CardDescription>Update your name and email address.</CardDescription></CardHeader>
                <CardContent>
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                            <FormField control={profileForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <Button type="submit" disabled={profileForm.formState.isSubmitting} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm hover:shadow-lg">
                                {profileForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            <Card className="bg-white/70 backdrop-blur-xl border border-gray-200/50 shadow-sm rounded-xl">
                <CardHeader><CardTitle>Security</CardTitle><CardDescription>Update your account password.</CardDescription></CardHeader>
                <CardContent>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (<FormItem><FormLabel>Current Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (<FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (<FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <Button type="submit" disabled={passwordForm.formState.isSubmitting} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm hover:shadow-lg">
                                {passwordForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                                Update Password
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

// ========================== Generic CRUD Section Component ==========================
const CrudSection = ({ title, endpoint, fields, icon }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchData = useCallback(async () => {
        try { setLoading(true); const response = await api.get(endpoint); setItems(response.data); } catch (error) { toast.error(`Failed to load ${title.toLowerCase()}.`); } finally { setLoading(false); }
    }, [endpoint, title]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try { await api.delete(`${endpoint}/${itemToDelete.id}`); toast.success(`${title.slice(0, -1)} deleted.`); setItemToDelete(null); fetchData(); } catch (error) { toast.error(`Failed to delete item.`); }
    };

    return (
        <Card className="bg-white/70 backdrop-blur-xl border border-gray-200/50 shadow-sm rounded-xl h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1.5">
                    <CardTitle className="flex items-center">{React.cloneElement(icon, { className: "mr-2 h-5 w-5 text-gray-600" })} {title}</CardTitle>
                    <CardDescription>Add, edit, or remove {title.toLowerCase()}.</CardDescription>
                </div>
                <AddItemDialog fields={fields} endpoint={endpoint} title={title} onAdded={fetchData} />
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div> : (
                    <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead>{fields.length > 1 && <TableHead>Address</TableHead>}<TableHead className="text-right w-[100px]">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {items.length > 0 ? items.map(item => (
                                <TableRow key={item.id} className="hover:bg-gray-50/50">
                                    <TableCell className="font-medium text-gray-800">{item.name}</TableCell>
                                    {fields.length > 1 && <TableCell className="text-sm text-gray-600">{item.fullAddress}</TableCell>}
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setEditingItem(item)}><Pencil className="h-4 w-4 text-blue-500" /></Button>
                                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setItemToDelete(item)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                    </TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={fields.length > 1 ? 3 : 2} className="h-24 text-center text-gray-500">No items added yet.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
            {editingItem && <EditItemDialog item={editingItem} isOpen={!!editingItem} onOpenChange={() => setEditingItem(null)} onUpdated={fetchData} fields={fields} title={title} endpoint={endpoint} />}
            <ConfirmationDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)} onConfirm={handleDelete} title={`Delete ${title.slice(0, -1)}?`} description="This action cannot be undone. Are you sure you want to permanently delete this item?" />
        </Card>
    );
};

const AddItemDialog = ({ fields, endpoint, title, onAdded }) => {
    const [isOpen, setIsOpen] = useState(false);
    const form = useForm({ resolver: zodResolver(settingItemSchema), defaultValues: Object.fromEntries(fields.map(f => [f.name, ''])) });
    const onSubmit = async (data) => {
        try { await api.post(endpoint, data); toast.success(`${title.slice(0, -1)} added!`); onAdded(); form.reset(); setIsOpen(false); } catch (error) { toast.error(`Failed to add item.`); }
    };
    return (<Dialog open={isOpen} onOpenChange={setIsOpen}><DialogTrigger asChild><Button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm hover:shadow-lg"><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Add New {title.slice(0, -1)}</DialogTitle></DialogHeader><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">{fields.map(field => (<FormField key={field.name} control={form.control} name={field.name} render={({ field: formField }) => (<FormItem><FormLabel>{field.label}</FormLabel><FormControl><Input placeholder={field.placeholder} {...formField} /></FormControl><FormMessage /></FormItem>)} />))}<DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
        type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button></DialogFooter></form></Form></DialogContent></Dialog>);
};

const EditItemDialog = ({ item, isOpen, onOpenChange, onUpdated, fields, title, endpoint }) => {
    const form = useForm({ resolver: zodResolver(settingItemSchema) });
    useEffect(() => { if (item) form.reset(item) }, [item, form]);
    const onSubmit = async (data) => {
        try { await api.put(`${endpoint}/${item.id}`, data); toast.success(`${title.slice(0, -1)} updated.`); onUpdated(); onOpenChange(false); } catch (error) { toast.error(`Failed to update item.`); }
    };
    return (<Dialog open={isOpen} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Edit {title.slice(0, -1)}</DialogTitle></DialogHeader><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">{fields.map(field => (<FormField key={field.name} control={form.control} name={field.name} render={({ field: formField }) => (<FormItem><FormLabel>{field.label}</FormLabel><FormControl><Input placeholder={field.placeholder} {...formField} /></FormControl><FormMessage /></FormItem>)} />))}<DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
        type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button></DialogFooter></form></Form></DialogContent></Dialog>);
}

const SettingsPage = () => {
    const { user } = useAuth();
    return (
        <div className="flex-1 space-y-6 p-4 lg:p-8">
            <h2 className="text-3xl font-bold tracking-tight text-gray-800 [text-shadow:1px_1px_1px_rgba(0,0,0,0.05)]">Settings</h2>
            {/* ===== Avatar Section ===== */}
            <div className="flex flex-col items-center space-y-3 text-center backdrop-blur-xl border border-gray-300/50 shadow-sm rounded-xl pb-6 pt-6">
                <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-3xl font-semibold shadow-inner ring-4 ring-white/50">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="absolute bottom-1 right-2 block h-4 w-4 rounded-full bg-green-500 ring-2 ring-white" />
                </div>
                <div>
                    <p className="text-sm text-gray-500">{user?.email || 'user@example.com'}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    {user?.role || 'Member'}
                </span>
            </div>
            <Tabs defaultValue="profile" className="space-y-6 center">
                <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex bg-white/60 backdrop-blur-xl border border-gray-200/50 shadow-sm p-1 h-auto rounded-xl">
                    <TabsTrigger value="profile" className="px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
                    <TabsTrigger value="locations" className="px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg"><MapPin className="mr-2 h-4 w-4" />Locations</TabsTrigger>
                    <TabsTrigger value="vehicles" className="px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg"><Truck className="mr-2 h-4 w-4" />Vehicles</TabsTrigger>
                </TabsList>

                <TabsContent value="profile"><ProfileTab /></TabsContent>
                <TabsContent value="locations" className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <CrudSection title="Facilities" endpoint="/settings/facilities" fields={[{ name: 'name', label: 'Facility Name', placeholder: 'e.g., Main Recycling Plant' }, { name: 'fullAddress', label: 'Full Address', placeholder: 'e.g., 123 Industrial Way, City' }]} icon={<Building />} />
                    <CrudSection title="Pickup Locations" endpoint="/settings/pickup-locations" fields={[{ name: 'name', label: 'Location Name', placeholder: 'e.g., Downtown Office Warehouse' }, { name: 'fullAddress', label: 'Full Address', placeholder: 'e.g., 456 Commercial Rd, City' }]} icon={<MapPin />} />
                </TabsContent>
                <TabsContent value="vehicles">
                    <CrudSection title="Vehicle Types" endpoint="/settings/vehicle-types" fields={[{ name: 'name', label: 'Vehicle Name / Model', placeholder: 'e.g., 10-Ton Scania Truck' }]} icon={<Truck />} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SettingsPage;

