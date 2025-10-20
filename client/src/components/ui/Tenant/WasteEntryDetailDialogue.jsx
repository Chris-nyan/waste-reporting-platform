import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Helper to determine the color and style for the status
const getStatusAppearance = (status) => {
    switch (status) {
        case 'FULLY_RECYCLED':
            return {
                badge: 'bg-green-100 text-green-800',
                progressBar: '[&>div]:bg-green-500',
                text: 'Fully Recycled'
            };
        case 'PARTIALLY_RECYCLED':
            return {
                badge: 'bg-yellow-100 text-yellow-800',
                progressBar: '[&>div]:bg-yellow-500',
                text: 'Partially Recycled'
            };
        default:
            return {
                badge: 'bg-gray-100 text-gray-800',
                progressBar: '[&>div]:bg-gray-400',
                text: 'Pending'
            };
    }
};

const DetailItem = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-100 last:border-none">
    <dt className="text-sm text-gray-600">{label}</dt>
    <dd className="text-sm font-medium text-gray-800 text-right text-wrap">{value || 'N/A'}</dd>
  </div>
);

const WasteEntryDetailDialog = ({ entry, isOpen, onOpenChange }) => {
  if (!entry) return null;

  const progress = entry.quantity > 0 ? (entry.recycledQuantity / entry.quantity) * 100 : 0;
  const appearance = getStatusAppearance(entry.status);

  // Helper to construct full URLs for locally stored images
  const getImageFullUrl = (relativePath) => {
    return `http://localhost:3002${relativePath}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Details for {entry.wasteType.name} Entry</DialogTitle>
          <DialogDescription>
            Collected on {entry.pickupDate ? format(new Date(entry.pickupDate), 'PPP') : 'N/A'}.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6 py-4">
          
          <Card>
            <CardHeader><CardTitle>Recycling Progress</CardTitle></CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Progress value={progress} className={cn("h-2", appearance.progressBar)} />
                    <span className="text-sm font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-500">{entry.recycledQuantity.toLocaleString()} of {entry.quantity.toLocaleString()} {entry.unit} processed</p>
                    <span className={cn("px-2.5 py-0.5 text-xs font-semibold rounded-full", appearance.badge)}>
                        {appearance.text}
                    </span>
                </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Collection & Logistics Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-1">
                <DetailItem label="Waste Type" value={entry.wasteType.name} />
                <DetailItem label="Waste Category" value={entry.wasteType.category.name} />
                <DetailItem label="Initial Quantity" value={`${entry.quantity.toLocaleString()} ${entry.unit}`} />
                <DetailItem label="Pickup Date" value={entry.pickupDate ? format(new Date(entry.pickupDate), 'PPP') : 'N/A'} />
                <DetailItem label="Pickup Location" value={entry.pickupLocation?.name || 'N/A'} />
                <DetailItem label="Pickup Address" value={entry.pickupLocation?.fullAddress || 'N/A'} />
                <DetailItem label="Facility" value={entry.facility?.name || 'N/A'} />
                <DetailItem label="Facility Address" value={entry.facility?.fullAddress || 'N/A'} />
                <DetailItem label="Vehicle" value={entry.vehicleType?.name || 'N/A'} />
                <DetailItem label="Transport Distance" value={entry.distanceKm ? `${entry.distanceKm} km` : 'N/A'} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recycling Process History</CardTitle></CardHeader>
            <CardContent>
                {entry.recyclingProcesses && entry.recyclingProcesses.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date Processed</TableHead>
                                <TableHead className="text-right">Quantity Recycled</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entry.recyclingProcesses.map(process => (
                                <TableRow key={process.id}>
                                    <TableCell>{format(new Date(process.recycledDate), 'PPP')}</TableCell>
                                    <TableCell className="text-right font-medium">{`${process.quantityRecycled.toLocaleString()} ${entry.unit}`}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No recycling processes have been logged for this entry yet.</p>
                )}
            </CardContent>
          </Card>

          {entry.imageUrls?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Uploaded Images</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {entry.imageUrls.map((url, index) => (
                  <a href={getImageFullUrl(url)} target="_blank" rel="noopener noreferrer" key={index} className="aspect-square group relative">
                    <img src={getImageFullUrl(url)} alt={`Waste entry evidence ${index + 1}`} className="h-full w-full object-cover rounded-md border transition-transform group-hover:scale-105" />
                  </a>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WasteEntryDetailDialog;

