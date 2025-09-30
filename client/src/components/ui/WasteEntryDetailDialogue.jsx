import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

// A reusable component to display a single piece of information
const DetailItem = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 last:border-none">
    <dt className="text-sm text-gray-600">{label}</dt>
    <dd className="text-sm font-medium text-gray-800 text-left sm:text-right">{value || 'N/A'}</dd>
  </div>
);

const WasteEntryDetailDialog = ({ entry, isOpen, onOpenChange }) => {
  if (!entry) return null;

  // Construct full URLs for locally stored images
  const getImageFullUrl = (relativePath) => {
    // Make sure your server port is correct (e.g., 3002)
    return `http://localhost:3002${relativePath}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Waste Entry Details</DialogTitle>
          <DialogDescription>
            Complete record for waste type: {entry.wasteType} on {format(new Date(entry.pickupDate), 'PPP')}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6 py-4">
          <Card>
            <CardHeader><CardTitle>Core Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-1">
                <DetailItem label="Pickup Date" value={format(new Date(entry.pickupDate), 'PPP')} />
                <DetailItem label="Waste Category" value={entry.wasteCategory} />
                <DetailItem label="Waste Type" value={entry.wasteType} />
                <DetailItem label="Quantity (as entered)" value={`${parseFloat(entry.quantity).toLocaleString()} ${entry.unit}`} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recycling & Logistics</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-1">
                <DetailItem label="Date Recycled" value={format(new Date(entry.recycledDate), 'PPP')} />
                <DetailItem label="Recycling Technology" value={entry.recyclingTechnology} />
                <DetailItem label="Vehicle Type" value={entry.vehicleType} />
                <DetailItem label="Pickup Address" value={entry.pickupAddress} />
                <DetailItem label="Facility Address" value={entry.facilityAddress} />
                <DetailItem label="Calculated Distance" value={entry.distanceKm ? `${entry.distanceKm} km` : 'N/A'} />
              </dl>
            </CardContent>
          </Card>

          {entry.imageUrls?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Uploaded Images</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {entry.imageUrls.map((url, index) => (
                  <a href={getImageFullUrl(url)} target="_blank" rel="noopener noreferrer" key={index} className="aspect-square group relative">
                    <img 
                      src={getImageFullUrl(url)} 
                      alt={`Waste entry evidence ${index + 1}`} 
                      className="h-full w-full object-cover rounded-md border transition-transform group-hover:scale-105"
                    />
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

