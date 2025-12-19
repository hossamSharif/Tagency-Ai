'use client';

// DocumentList component
// T117 [US2] Create DocumentList component

import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  FileText,
  Download,
  Trash,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CustomerDocument, DocumentType } from '@/types/models/customer';
import { RequiredDocument, RequiredDocumentStatus } from '@/types/models/booking';
import { Timestamp } from 'firebase/firestore';

interface DocumentListProps {
  documents: CustomerDocument[];
  requiredDocuments?: RequiredDocument[];
  locale?: 'ar' | 'en';
  onDownload?: (doc: CustomerDocument) => void;
  onDelete?: (doc: CustomerDocument) => void;
  onView?: (doc: CustomerDocument) => void;
  onVerify?: (docType: DocumentType, verified: boolean) => void;
}

export function DocumentList({
  documents,
  requiredDocuments,
  locale = 'ar',
  onDownload,
  onDelete,
  onView,
  onVerify,
}: DocumentListProps) {
  const t = useTranslations('documents');
  const dateLocale = locale === 'ar' ? ar : enUS;

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return format(date, 'dd MMM yyyy', { locale: dateLocale });
  };

  const getDocumentTypeIcon = (type: DocumentType) => {
    return <FileText className="h-4 w-4" />;
  };

  const getStatusBadge = (status: RequiredDocumentStatus) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="me-1 h-3 w-3" />
            {t('status.pending')}
          </Badge>
        );
      case 'uploaded':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <FileText className="me-1 h-3 w-3" />
            {t('status.uploaded')}
          </Badge>
        );
      case 'verified':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="me-1 h-3 w-3" />
            {t('status.verified')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="me-1 h-3 w-3" />
            {t('status.rejected')}
          </Badge>
        );
    }
  };

  // If we have required documents, show them with their status
  if (requiredDocuments && requiredDocuments.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            {t('requiredDocuments')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requiredDocuments.map((reqDoc) => {
                const uploadedDoc = documents.find((d) => d.type === reqDoc.type);

                return (
                  <TableRow key={reqDoc.type}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDocumentTypeIcon(reqDoc.type)}
                        <span>{t(`types.${reqDoc.type}`)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(reqDoc.status)}
                      {reqDoc.rejectionReason && (
                        <p className="text-xs text-destructive mt-1">
                          {reqDoc.rejectionReason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {uploadedDoc && onView && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(uploadedDoc)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {uploadedDoc && onDownload && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownload(uploadedDoc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {onVerify && reqDoc.status === 'uploaded' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onVerify(reqDoc.type, true)}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onVerify(reqDoc.type, false)}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  // Regular document list
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">{t('noDocuments')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          {t('documents')} ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('type')}</TableHead>
              <TableHead>{t('uploadedAt')}</TableHead>
              <TableHead>{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getDocumentTypeIcon(doc.type)}
                    <span className="font-medium">{doc.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{t(`types.${doc.type}`)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(doc.uploadedAt)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onDownload && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload(doc)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(doc)}
                        className="text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
