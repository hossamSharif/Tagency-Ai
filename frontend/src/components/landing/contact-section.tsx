'use client';

/**
 * ContactSection Component
 *
 * Contact form and information section for the landing page.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface ContactSectionProps {
  className?: string;
  showFullPage?: boolean;
}

interface ContactInfo {
  icon: typeof Mail;
  labelKey: string;
  value: string;
  href?: string;
}

const contactInfo: ContactInfo[] = [
  {
    icon: Mail,
    labelKey: 'email',
    value: 'info@travelagency.sa',
    href: 'mailto:info@travelagency.sa',
  },
  {
    icon: Phone,
    labelKey: 'phone',
    value: '+966 50 123 4567',
    href: 'tel:+966501234567',
  },
  {
    icon: MapPin,
    labelKey: 'address',
    value: 'الرياض، المملكة العربية السعودية',
  },
];

export function ContactSection({ className, showFullPage = false }: ContactSectionProps) {
  const t = useTranslations('landing.contact');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Import action dynamically
      const { submitContactFormAction } = await import('@/app/actions/contact');
      const result = await submitContactFormAction(formData);

      if (result.success) {
        toast({
          title: t('successTitle'),
          description: t('successMessage'),
        });
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: t('errorTitle'),
        description: t('errorMessage'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <section
      className={cn(
        'py-20 md:py-28 bg-muted/30',
        showFullPage && 'min-h-[calc(100vh-200px)]',
        className
      )}
      id="contact"
    >
      <div className="container">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-5">
          {/* Contact information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('contactInfo')}</CardTitle>
                <CardDescription>{t('contactInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactInfo.map((info) => (
                  <div key={info.labelKey} className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <info.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t(`info.${info.labelKey}`)}</p>
                      {info.href ? (
                        <a
                          href={info.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">{info.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Working hours */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('workingHours')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('hours.weekdays')}</span>
                  <span>9:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('hours.friday')}</span>
                  <span>14:00 - 20:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('hours.saturday')}</span>
                  <span>10:00 - 16:00</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact form */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>{t('formTitle')}</CardTitle>
              <CardDescription>{t('formDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('form.name')}</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder={t('form.namePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('form.email')}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder={t('form.emailPlaceholder')}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('form.phone')}</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={t('form.phonePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('form.subject')}</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder={t('form.subjectPlaceholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{t('form.message')}</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder={t('form.messagePlaceholder')}
                    rows={5}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      {t('form.sending')}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 me-2" />
                      {t('form.send')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
