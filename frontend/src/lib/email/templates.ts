/**
 * Email templates for Firebase Trigger Email extension
 *
 * These templates are stored in Firestore at the `email_templates` collection
 * and referenced by the Firebase Trigger Email extension.
 *
 * To set up:
 * 1. Install Firebase Trigger Email extension in Firebase Console
 * 2. Configure with SendGrid, Mailgun, or SMTP
 * 3. Create templates in Firestore `email_templates` collection
 */

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Arabic email templates
 */
export const arabicTemplates: Record<string, EmailTemplate> = {
  welcome_ar: {
    name: 'welcome_ar',
    subject: 'مرحباً بك في {{officeName}}',
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Noto Kufi Arabic', Arial, sans-serif; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1E5631; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .button { background: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>مرحباً بك!</h1>
    </div>
    <div class="content">
      <p>مرحباً {{recipientName}}،</p>
      <p>نحن سعداء بانضمامك إلى {{officeName}}. حسابك جاهز الآن للاستخدام.</p>
      <p>يمكنك الآن:</p>
      <ul>
        <li>إنشاء وإدارة باقات السفر</li>
        <li>إدارة العملاء والحجوزات</li>
        <li>تتبع الفواتير والمدفوعات</li>
      </ul>
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{actionUrl}}" class="button">ابدأ الآن</a>
      </p>
    </div>
    <div class="footer">
      <p>© {{year}} {{officeName}}. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: 'مرحباً {{recipientName}}، نحن سعداء بانضمامك إلى {{officeName}}.',
  },

  booking_confirmation_ar: {
    name: 'booking_confirmation_ar',
    subject: 'تأكيد الحجز - {{bookingNumber}}',
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Noto Kufi Arabic', Arial, sans-serif; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1E5631; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { background: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>تم تأكيد حجزك!</h1>
    </div>
    <div class="content">
      <p>مرحباً {{recipientName}}،</p>
      <p>يسعدنا إبلاغك بأن حجزك قد تم تأكيده.</p>
      <div class="details">
        <h3>تفاصيل الحجز</h3>
        <p><strong>رقم الحجز:</strong> {{bookingNumber}}</p>
        <p><strong>الباقة:</strong> {{packageNameAr}}</p>
        <p><strong>المبلغ الإجمالي:</strong> {{amount}} {{currency}}</p>
      </div>
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{actionUrl}}" class="button">عرض تفاصيل الحجز</a>
      </p>
    </div>
    <div class="footer">
      <p>شكراً لاختيارك {{officeName}}</p>
    </div>
  </div>
</body>
</html>
    `,
  },

  payment_received_ar: {
    name: 'payment_received_ar',
    subject: 'تم استلام الدفعة - {{invoiceNumber}}',
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Noto Kufi Arabic', Arial, sans-serif; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1E5631; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .amount { font-size: 32px; color: #1E5631; text-align: center; margin: 20px 0; }
    .button { background: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>تم استلام الدفعة</h1>
    </div>
    <div class="content">
      <p>مرحباً {{recipientName}}،</p>
      <p>تم استلام دفعتك بنجاح.</p>
      <div class="amount">{{amount}} {{currency}}</div>
      <p><strong>رقم الفاتورة:</strong> {{invoiceNumber}}</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{actionUrl}}" class="button">عرض الإيصال</a>
      </p>
    </div>
    <div class="footer">
      <p>شكراً لك!</p>
    </div>
  </div>
</body>
</html>
    `,
  },

  trial_ending_ar: {
    name: 'trial_ending_ar',
    subject: 'فترة التجربة ستنتهي قريباً',
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Noto Kufi Arabic', Arial, sans-serif; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #D4AF37; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .button { background: #1E5631; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ فترة التجربة قاربت على الانتهاء</h1>
    </div>
    <div class="content">
      <p>مرحباً {{recipientName}}،</p>
      <div class="warning">
        <p><strong>تنبيه:</strong> فترة التجربة المجانية ستنتهي خلال {{trialDaysRemaining}} أيام ({{expiryDate}}).</p>
      </div>
      <p>لضمان استمرار الوصول إلى جميع الميزات، يرجى الترقية إلى الاشتراك المدفوع.</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{actionUrl}}" class="button">الترقية الآن</a>
      </p>
    </div>
    <div class="footer">
      <p>إذا كان لديك أي استفسار، لا تتردد في التواصل معنا.</p>
    </div>
  </div>
</body>
</html>
    `,
  },

  user_invitation_ar: {
    name: 'user_invitation_ar',
    subject: 'دعوة للانضمام إلى {{officeName}}',
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Noto Kufi Arabic', Arial, sans-serif; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1E5631; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .button { background: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>دعوة للانضمام</h1>
    </div>
    <div class="content">
      <p>مرحباً،</p>
      <p>تمت دعوتك من قبل <strong>{{inviterName}}</strong> للانضمام إلى فريق <strong>{{officeName}}</strong> بصفة <strong>{{role}}</strong>.</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{invitationLink}}" class="button">قبول الدعوة</a>
      </p>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">هذه الدعوة صالحة لمدة 7 أيام.</p>
    </div>
    <div class="footer">
      <p>إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد.</p>
    </div>
  </div>
</body>
</html>
    `,
  },

  document_requested_ar: {
    name: 'document_requested_ar',
    subject: 'مطلوب: رفع مستند - {{documentType}}',
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Noto Kufi Arabic', Arial, sans-serif; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #D4AF37; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .button { background: #1E5631; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>مطلوب رفع مستند</h1>
    </div>
    <div class="content">
      <p>مرحباً {{recipientName}}،</p>
      <p>نحتاج منك رفع المستند التالي لإكمال حجزك:</p>
      <p style="font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0;">{{documentType}}</p>
      <p><strong>رقم الحجز:</strong> {{bookingNumber}}</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{actionUrl}}" class="button">رفع المستند</a>
      </p>
    </div>
    <div class="footer">
      <p>شكراً لتعاونك</p>
    </div>
  </div>
</body>
</html>
    `,
  },

  commission_settled_ar: {
    name: 'commission_settled_ar',
    subject: 'تمت تسوية العمولة - {{settlementAmount}}',
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Noto Kufi Arabic', Arial, sans-serif; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1E5631; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .amount { font-size: 32px; color: #1E5631; text-align: center; margin: 20px 0; }
    .button { background: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>تمت تسوية العمولة</h1>
    </div>
    <div class="content">
      <p>مرحباً {{recipientName}}،</p>
      <p>تم تسوية عمولتك عن الفترة {{settlementPeriod}}.</p>
      <div class="amount">{{settlementAmount}} {{currency}}</div>
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{actionUrl}}" class="button">عرض التفاصيل</a>
      </p>
    </div>
    <div class="footer">
      <p>شكراً لشراكتك معنا</p>
    </div>
  </div>
</body>
</html>
    `,
  },
};

/**
 * English email templates
 */
export const englishTemplates: Record<string, EmailTemplate> = {
  welcome_en: {
    name: 'welcome_en',
    subject: 'Welcome to {{officeName}}',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Inter', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1E5631; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .button { background: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome!</h1>
    </div>
    <div class="content">
      <p>Hello {{recipientName}},</p>
      <p>We're excited to have you join {{officeName}}. Your account is now ready to use.</p>
      <p>You can now:</p>
      <ul>
        <li>Create and manage travel packages</li>
        <li>Manage customers and bookings</li>
        <li>Track invoices and payments</li>
      </ul>
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{actionUrl}}" class="button">Get Started</a>
      </p>
    </div>
    <div class="footer">
      <p>© {{year}} {{officeName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: 'Hello {{recipientName}}, We\'re excited to have you join {{officeName}}.',
  },

  booking_confirmation_en: {
    name: 'booking_confirmation_en',
    subject: 'Booking Confirmed - {{bookingNumber}}',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Inter', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1E5631; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { background: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Confirmed!</h1>
    </div>
    <div class="content">
      <p>Hello {{recipientName}},</p>
      <p>We're pleased to confirm your booking.</p>
      <div class="details">
        <h3>Booking Details</h3>
        <p><strong>Booking Number:</strong> {{bookingNumber}}</p>
        <p><strong>Package:</strong> {{packageName}}</p>
        <p><strong>Total Amount:</strong> {{amount}} {{currency}}</p>
      </div>
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{actionUrl}}" class="button">View Booking Details</a>
      </p>
    </div>
    <div class="footer">
      <p>Thank you for choosing {{officeName}}</p>
    </div>
  </div>
</body>
</html>
    `,
  },

  payment_received_en: {
    name: 'payment_received_en',
    subject: 'Payment Received - {{invoiceNumber}}',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Inter', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1E5631; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .amount { font-size: 32px; color: #1E5631; text-align: center; margin: 20px 0; }
    .button { background: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Received</h1>
    </div>
    <div class="content">
      <p>Hello {{recipientName}},</p>
      <p>Your payment has been successfully received.</p>
      <div class="amount">{{amount}} {{currency}}</div>
      <p><strong>Invoice Number:</strong> {{invoiceNumber}}</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{actionUrl}}" class="button">View Receipt</a>
      </p>
    </div>
    <div class="footer">
      <p>Thank you!</p>
    </div>
  </div>
</body>
</html>
    `,
  },

  trial_ending_en: {
    name: 'trial_ending_en',
    subject: 'Your Trial is Ending Soon',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Inter', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #D4AF37; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .button { background: #1E5631; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Trial Ending Soon</h1>
    </div>
    <div class="content">
      <p>Hello {{recipientName}},</p>
      <div class="warning">
        <p><strong>Notice:</strong> Your free trial will end in {{trialDaysRemaining}} days ({{expiryDate}}).</p>
      </div>
      <p>To ensure continued access to all features, please upgrade to a paid subscription.</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{actionUrl}}" class="button">Upgrade Now</a>
      </p>
    </div>
    <div class="footer">
      <p>If you have any questions, feel free to contact us.</p>
    </div>
  </div>
</body>
</html>
    `,
  },

  user_invitation_en: {
    name: 'user_invitation_en',
    subject: 'Invitation to Join {{officeName}}',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Inter', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1E5631; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .button { background: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You're Invited</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You have been invited by <strong>{{inviterName}}</strong> to join the team at <strong>{{officeName}}</strong> as a <strong>{{role}}</strong>.</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{invitationLink}}" class="button">Accept Invitation</a>
      </p>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">This invitation is valid for 7 days.</p>
    </div>
    <div class="footer">
      <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
    `,
  },
};

/**
 * Get all templates (both Arabic and English)
 */
export function getAllTemplates(): EmailTemplate[] {
  return [...Object.values(arabicTemplates), ...Object.values(englishTemplates)];
}

/**
 * Get templates by language
 */
export function getTemplatesByLanguage(language: 'ar' | 'en'): Record<string, EmailTemplate> {
  return language === 'ar' ? arabicTemplates : englishTemplates;
}
