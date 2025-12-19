'use client';

// DocumentUploader component
// T116 [US2] Create DocumentUploader component

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, FileText, Loader2, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DocumentType } from '@/types/models/customer';

interface DocumentUploaderProps {
  onUpload: (file: File, type: DocumentType) => Promise<string>;
  acceptedTypes?: string;
  maxSize?: number; // in bytes
  documentTypes?: DocumentType[];
}

export function DocumentUploader({
  onUpload,
  acceptedTypes = 'image/*,.pdf',
  maxSize = 10 * 1024 * 1024, // 10MB default
  documentTypes = ['passport', 'visa', 'photo', 'vaccination', 'other'],
}: DocumentUploaderProps) {
  const t = useTranslations('documents');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedType, setSelectedType] = useState<DocumentType>(documentTypes[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    // Validate file size
    if (file.size > maxSize) {
      setError(t('fileTooLarge', { maxSize: `${maxSize / 1024 / 1024}MB` }));
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await onUpload(selectedFile, selectedType);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(true);
      setSelectedFile(null);
      setPreview(null);

      // Reset after showing success
      setTimeout(() => {
        setSuccess(false);
        setUploadProgress(0);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          {t('uploadDocument')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Type Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            {t('documentType')}
          </label>
          <Select
            value={selectedType}
            onValueChange={(value) => setSelectedType(value as DocumentType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`types.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* File Preview or Drop Zone */}
        {selectedFile ? (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded"
                  />
                ) : (
                  <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {uploading && (
              <Progress value={uploadProgress} className="h-2" />
            )}

            {success && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">{t('uploadSuccess')}</span>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('uploading')}
                </>
              ) : (
                <>
                  <Upload className="me-2 h-4 w-4" />
                  {t('upload')}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {t('dragOrClick')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('maxSize', { size: `${maxSize / 1024 / 1024}MB` })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
