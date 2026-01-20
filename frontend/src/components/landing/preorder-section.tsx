'use client';

/**
 * PreorderSection Component
 *
 * Contact section for preorder and reservations with email, phone, and WhatsApp.
 */

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Mail, Phone, MessageCircle, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PreorderSectionProps {
  className?: string;
}

const contactInfo = {
  email: 'hossamsharif1990@gmail.com',
  phone: '+249123149788',
  whatsapp: '+966543620486',
};

export function PreorderSection({ className }: PreorderSectionProps) {
  const t = useTranslations('landing.preorder');
  const params = useParams();
  const locale = params.locale as string;
  const isRTL = locale === 'ar';

  const handleEmailClick = () => {
    window.location.href = `mailto:${contactInfo.email}?subject=${encodeURIComponent(t('emailSubject'))}`;
  };

  const handlePhoneClick = () => {
    window.location.href = `tel:${contactInfo.phone}`;
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(t('whatsappMessage'));
    window.open(`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  return (
    <section className={cn('py-20 md:py-28', className)} id="preorder">
      <div className="container">
        {/* Section header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm font-medium border-primary/30 bg-primary/5">
            <Sparkles className="h-3.5 w-3.5 me-2 text-primary" />
            {t('badge')}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {t('title')}
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Contact cards */}
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Email Card */}
            <Card className="group relative overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="relative p-8 text-center">
                <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
                  <Mail className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('email')}</h3>
                <p className="text-sm text-muted-foreground mb-5">{t('emailDesc')}</p>
                <Button
                  onClick={handleEmailClick}
                  variant="outline"
                  className="w-full group/btn hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  <span className="truncate text-sm font-medium">{contactInfo.email}</span>
                  <ArrowRight className={cn("h-4 w-4 ms-2 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300", isRTL && "rotate-180")} />
                </Button>
              </CardContent>
            </Card>

            {/* Phone Card */}
            <Card className="group relative overflow-hidden border-2 border-primary shadow-xl shadow-primary/10 scale-105 z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5" />
              <div className="absolute top-3 end-3">
                <Badge className="bg-accent text-accent-foreground font-semibold px-3 py-1 shadow-md">
                  <Phone className="h-3 w-3 me-1" />
                  {t('callNow')}
                </Badge>
              </div>
              <CardContent className="relative p-8 text-center">
                <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/80 p-4 text-accent-foreground shadow-lg shadow-accent/25 group-hover:scale-110 transition-transform duration-300">
                  <Phone className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('phone')}</h3>
                <p className="text-sm text-muted-foreground mb-5">{t('phoneDesc')}</p>
                <Button
                  onClick={handlePhoneClick}
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                  size="lg"
                >
                  <span className="font-bold text-base tracking-wide" dir="ltr">{contactInfo.phone}</span>
                </Button>
              </CardContent>
            </Card>

            {/* WhatsApp Card */}
            <Card className="group relative overflow-hidden border-2 border-transparent hover:border-green-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/5">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="relative p-8 text-center">
                <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-4 text-white shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('whatsapp')}</h3>
                <p className="text-sm text-muted-foreground mb-5">{t('whatsappDesc')}</p>
                <Button
                  onClick={handleWhatsAppClick}
                  variant="outline"
                  className="w-full border-green-500/30 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-300"
                >
                  <span className="font-bold tracking-wide" dir="ltr">{contactInfo.whatsapp}</span>
                  <MessageCircle className="h-4 w-4 ms-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Instant Response Promise */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 px-6 py-3 border border-primary/20 shadow-lg shadow-primary/5">
              <div className="flex items-center justify-center rounded-full bg-primary p-2 shadow-md shadow-primary/30">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-base font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t('instantResponse')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
