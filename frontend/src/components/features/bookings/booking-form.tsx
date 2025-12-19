'use client';

// BookingForm component
// T112 [US2] Create BookingForm component

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2, Save, Plus, Trash, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { createBookingSchema, CreateBookingInput } from '@/lib/validations/bookings';
import { Customer } from '@/types/models/customer';
import { Package } from '@/types/models/package';

interface BookingFormProps {
  customers: Customer[];
  packages: Package[];
  onSubmit: (data: CreateBookingInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  preselectedCustomerId?: string;
  preselectedPackageId?: string;
}

export function BookingForm({
  customers,
  packages,
  onSubmit,
  onCancel,
  isLoading,
  preselectedCustomerId,
  preselectedPackageId,
}: BookingFormProps) {
  const t = useTranslations('bookings');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(
    packages.find((p) => p.id === preselectedPackageId) || null
  );

  const form = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      customerId: preselectedCustomerId || '',
      packageId: preselectedPackageId || '',
      travelers: [{ firstName: '', lastName: '', isPrimary: true }],
      travelDate: '',
      notes: '',
      source: 'web',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'travelers',
  });

  const handlePackageChange = (packageId: string) => {
    const pkg = packages.find((p) => p.id === packageId);
    setSelectedPackage(pkg || null);
    form.setValue('packageId', packageId);
  };

  const handleSubmit = async (data: CreateBookingInput) => {
    await onSubmit(data);
  };

  const addTraveler = () => {
    append({ firstName: '', lastName: '', isPrimary: false });
  };

  const removeTraveler = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      // Ensure at least one is primary
      const travelers = form.getValues('travelers');
      if (!travelers.some((t) => t.isPrimary)) {
        form.setValue('travelers.0.isPrimary', true);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: selectedPackage?.currency || 'SAR',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t('createBooking')}
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            {/* Customer Selection */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('customer')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectCustomer')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.firstName} {customer.lastName} - {customer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Package Selection */}
            <FormField
              control={form.control}
              name="packageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('package')}</FormLabel>
                  <Select
                    onValueChange={handlePackageChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectPackage')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {packages
                        .filter((pkg) => pkg.status === 'active')
                        .map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name} - {formatCurrency(pkg.totalPrice)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Package Summary */}
            {selectedPackage && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">{t('packageSummary')}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedPackage.description?.substring(0, 150)}...
                </p>
                <div className="flex justify-between mt-2">
                  <span className="text-sm">{t('pricePerPerson')}</span>
                  <span className="font-medium">
                    {formatCurrency(selectedPackage.totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-primary">
                  <span className="text-sm">{t('totalForTravelers', { count: fields.length })}</span>
                  <span className="font-bold">
                    {formatCurrency(selectedPackage.totalPrice * fields.length)}
                  </span>
                </div>
              </div>
            )}

            {/* Travel Date */}
            <FormField
              control={form.control}
              name="travelDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('travelDate')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Travelers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{t('travelers')}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTraveler}
                >
                  <Plus className="me-2 h-4 w-4" />
                  {t('addTraveler')}
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium">
                      {t('traveler')} {index + 1}
                    </h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTraveler(index)}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`travelers.${index}.firstName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('firstName')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`travelers.${index}.lastName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('lastName')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`travelers.${index}.isPrimary`}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 mt-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              // Uncheck all others when checking this one
                              if (checked) {
                                fields.forEach((_, i) => {
                                  if (i !== index) {
                                    form.setValue(`travelers.${i}.isPrimary`, false);
                                  }
                                });
                              }
                              field.onChange(checked);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">{t('primaryContact')}</FormLabel>
                      </FormItem>
                    )}
                  />
                </Card>
              ))}
            </div>

            <Separator />

            {/* Source */}
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bookingSource')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="web">{t('web')}</SelectItem>
                      <SelectItem value="walk-in">{t('walkIn')}</SelectItem>
                      <SelectItem value="phone">{t('phone')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('notesPlaceholder')}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('cancel')}
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="me-2 h-4 w-4" />
              )}
              {t('createBooking')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
