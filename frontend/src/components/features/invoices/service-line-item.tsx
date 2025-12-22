'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { BeneficiaryForm } from './beneficiary-form';
import { AttachmentUploader, Attachment } from './attachment-uploader';
import { useTranslations, useLocale } from 'next-intl';
import { ServiceCatalogItem } from '@/types/models/service-catalog';
import { PartnerOffice } from '@/types/models/partner-office';
import { Trash2, ChevronDown, User, Paperclip } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ServiceLineItemProps {
  index: number;
  services: ServiceCatalogItem[];
  partners: PartnerOffice[];
  onRemove: () => void;
  disabled?: boolean;
}

export function ServiceLineItem({
  index,
  services,
  partners,
  onRemove,
  disabled
}: ServiceLineItemProps) {
  const t = useTranslations();
  const locale = useLocale();
  const form = useFormContext();
  const [showBeneficiary, setShowBeneficiary] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  const fieldPrefix = `lineItems.${index}`;

  // Watch fields for auto-calculation
  const serviceCatalogId = useWatch({
    control: form.control,
    name: `${fieldPrefix}.serviceCatalogId`
  });
  const quantity = useWatch({
    control: form.control,
    name: `${fieldPrefix}.quantity`
  });
  const unitPrice = useWatch({
    control: form.control,
    name: `${fieldPrefix}.unitPrice`
  });
  const discount = useWatch({
    control: form.control,
    name: `${fieldPrefix}.discount`
  });
  const isOutsourced = useWatch({
    control: form.control,
    name: `${fieldPrefix}.isOutsourced`
  });
  const commissionPercentage = useWatch({
    control: form.control,
    name: `${fieldPrefix}.commissionPercentage`
  });

  // Auto-fill service details when service is selected
  useEffect(() => {
    if (serviceCatalogId) {
      const service = services.find(s => s.id === serviceCatalogId);
      if (service) {
        form.setValue(`${fieldPrefix}.serviceName`, service.name);
        form.setValue(`${fieldPrefix}.serviceNameAr`, service.nameAr);
        form.setValue(`${fieldPrefix}.serviceType`, service.type);
        form.setValue(`${fieldPrefix}.unitPrice`, service.price);

        // If service is partner-provided, pre-fill partner and commission
        if (service.providerType === 'partner' && service.defaultPartnerId) {
          form.setValue(`${fieldPrefix}.isOutsourced`, true);
          form.setValue(`${fieldPrefix}.partnerId`, service.defaultPartnerId);
          form.setValue(`${fieldPrefix}.partnerName`, service.defaultPartnerName);
          form.setValue(`${fieldPrefix}.commissionPercentage`, service.commissionPercentage || 0);
        }
      }
    }
  }, [serviceCatalogId, services, form, fieldPrefix]);

  // Calculate line total
  useEffect(() => {
    const total = (quantity * unitPrice) - (discount || 0);
    form.setValue(`${fieldPrefix}.total`, Math.max(0, total));

    // Calculate commission amount if outsourced
    if (isOutsourced && commissionPercentage) {
      const commissionAmount = total * (commissionPercentage / 100);
      form.setValue(`${fieldPrefix}.commissionAmount`, commissionAmount);
    } else {
      form.setValue(`${fieldPrefix}.commissionAmount`, 0);
    }
  }, [quantity, unitPrice, discount, isOutsourced, commissionPercentage, form, fieldPrefix]);

  const lineTotal = (quantity * unitPrice) - (discount || 0);

  return (
    <div className="p-4 border rounded-lg space-y-4 bg-card">
      {/* Header with Remove Button */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          {t('invoices.service')} #{index + 1}
        </h4>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Service Selection */}
      <FormField
        control={form.control}
        name={`${fieldPrefix}.serviceCatalogId`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('invoices.selectService')}</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('invoices.selectServicePlaceholder')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {locale === 'ar' ? service.nameAr : service.name} - {service.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Quantity, Unit Price, Discount */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FormField
          control={form.control}
          name={`${fieldPrefix}.quantity`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('invoices.quantity')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${fieldPrefix}.unitPrice`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('invoices.unitPrice')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${fieldPrefix}.discount`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('invoices.discount')} ({t('common.optional')})</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Line Total (calculated) */}
        <FormItem>
          <FormLabel>{t('invoices.lineTotal')}</FormLabel>
          <FormControl>
            <Input
              value={lineTotal.toFixed(2)}
              disabled
              className="bg-muted font-medium"
            />
          </FormControl>
        </FormItem>
      </div>

      {/* Partner/Outsourcing Section */}
      <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
        <FormField
          control={form.control}
          name={`${fieldPrefix}.isOutsourced`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between">
              <FormLabel>{t('invoices.partnerProvided')}</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {isOutsourced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name={`${fieldPrefix}.partnerId`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoices.selectPartner')}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const partner = partners.find(p => p.id === value);
                      if (partner) {
                        form.setValue(`${fieldPrefix}.partnerName`, partner.name);
                        form.setValue(`${fieldPrefix}.commissionPercentage`, partner.defaultCommissionPercentage);
                      }
                    }}
                    defaultValue={field.value}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('invoices.selectPartnerPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {partners.map((partner) => (
                        <SelectItem key={partner.id} value={partner.id}>
                          {partner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`${fieldPrefix}.commissionPercentage`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoices.commissionPercentage')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>

      {/* Comments */}
      <FormField
        control={form.control}
        name={`${fieldPrefix}.comments`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('invoices.comments')} ({t('common.optional')})</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder={t('invoices.commentsPlaceholder')}
                disabled={disabled}
                rows={2}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Beneficiary Section (Collapsible) */}
      <Collapsible open={showBeneficiary} onOpenChange={setShowBeneficiary}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="w-full">
            <User className="mr-2 h-4 w-4" />
            {showBeneficiary ? t('invoices.hideBeneficiary') : t('invoices.addBeneficiary')}
            <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${showBeneficiary ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <BeneficiaryForm
            fieldPrefix={`${fieldPrefix}.beneficiary`}
            disabled={disabled}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Attachments Section (Collapsible) */}
      <Collapsible open={showAttachments} onOpenChange={setShowAttachments}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="w-full">
            <Paperclip className="mr-2 h-4 w-4" />
            {showAttachments ? t('invoices.hideAttachments') : t('invoices.addAttachments')}
            <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${showAttachments ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <FormField
            control={form.control}
            name={`${fieldPrefix}.attachments`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <AttachmentUploader
                    attachments={field.value || []}
                    onAttachmentsChange={field.onChange}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
