'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, File, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

interface AttachmentUploaderProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  disabled?: boolean;
  maxSizeMB?: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB default

export function AttachmentUploader({
  attachments,
  onAttachmentsChange,
  disabled,
  maxSizeMB = 10
}: AttachmentUploaderProps) {
  const t = useTranslations();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSize = maxSizeMB * 1024 * 1024;

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size
    if (file.size > maxSize) {
      toast.error(t('invoices.fileTooLarge', { maxSize: maxSizeMB }));
      return;
    }

    setIsUploading(true);

    try {
      // For now, we'll create a local object URL
      // In production, this would upload to Firebase Storage
      const attachment: Attachment = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        size: file.size,
        uploadedAt: new Date()
      };

      onAttachmentsChange([...attachments, attachment]);
      toast.success(t('invoices.fileUploaded'));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('invoices.uploadFailed'));
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleRemove(attachmentId: string) {
    const attachment = attachments.find(a => a.id === attachmentId);
    if (attachment && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }
    onAttachmentsChange(attachments.filter(a => a.id !== attachmentId));
  }

  return (
    <div className="space-y-3">
      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('common.uploading')}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {t('invoices.uploadAttachment')}
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          {t('invoices.maxFileSize', { size: maxSizeMB })}
        </p>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-2 border rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(attachment.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
