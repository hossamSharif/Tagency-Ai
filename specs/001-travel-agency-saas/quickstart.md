# Quickstart Guide: Travel Agency SaaS Platform

**Date**: 2025-12-19
**Prerequisites**: Node.js 18+, npm/pnpm, Firebase CLI, Stripe CLI

## 1. Project Setup

### Create Next.js Application

```bash
# Create new Next.js project with TypeScript and App Router
npx create-next-app@latest travel-agency-saas --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd travel-agency-saas
```

### Install Dependencies

```bash
# Core dependencies
npm install firebase firebase-admin

# UI components (shadcn/ui)
npx shadcn@latest init
npx shadcn@latest add button card input label form dialog dropdown-menu table tabs avatar badge calendar checkbox select separator sheet skeleton toast

# Additional UI
npm install @radix-ui/react-icons lucide-react

# Internationalization
npm install next-intl

# Theme
npm install next-themes

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Stripe
npm install stripe @stripe/stripe-js

# OCR
npm install tesseract.js

# Date handling
npm install date-fns date-fns-tz

# PDF generation (for invoices)
npm install @react-pdf/renderer
```

### Development Dependencies

```bash
npm install -D @types/node prettier prettier-plugin-tailwindcss
```

## 2. Firebase Setup

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: `travel-agency-saas`
3. Enable:
   - **Authentication** → Email/Password provider
   - **Firestore Database** → Start in production mode
   - **Storage** → Start in production mode

### Initialize Firebase CLI

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init

# Select:
# - Firestore
# - Storage
# - Emulators (Firestore, Auth, Storage)
```

### Firebase Configuration

Create `src/lib/firebase/config.ts`:

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

### Environment Variables

Create `.env.local`:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin (for server-side)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Stripe Setup

### Create Stripe Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create Product:
   - Name: "Travel Agency SaaS - Monthly"
   - Pricing: Recurring, Monthly
3. Copy the Price ID to `STRIPE_PRICE_ID`

### Configure Webhooks (Development)

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: scoop install stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 4. Internationalization Setup

### Configure next-intl

Create `src/i18n.ts`:

```typescript
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
}));
```

Create `src/middleware.ts`:

```typescript
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

### Create Message Files

Create `src/messages/ar.json`:

```json
{
  "common": {
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "create": "إنشاء",
    "search": "بحث",
    "loading": "جاري التحميل..."
  },
  "auth": {
    "login": "تسجيل الدخول",
    "signup": "إنشاء حساب",
    "logout": "تسجيل الخروج",
    "email": "البريد الإلكتروني",
    "password": "كلمة المرور"
  },
  "packages": {
    "title": "الباقات",
    "create": "إنشاء باقة جديدة",
    "types": {
      "hajj": "حج",
      "umrah": "عمرة",
      "honeymoon": "شهر العسل",
      "custom": "مخصص"
    }
  }
}
```

Create `src/messages/en.json`:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "loading": "Loading..."
  },
  "auth": {
    "login": "Login",
    "signup": "Sign Up",
    "logout": "Logout",
    "email": "Email",
    "password": "Password"
  },
  "packages": {
    "title": "Packages",
    "create": "Create New Package",
    "types": {
      "hajj": "Hajj",
      "umrah": "Umrah",
      "honeymoon": "Honeymoon",
      "custom": "Custom"
    }
  }
}
```

## 5. Theme & Styling Setup

### Configure Tailwind for RTL

Update `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
      },
      fontFamily: {
        arabic: ['var(--font-arabic)', 'sans-serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### Configure CSS Variables

Update `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Saudi Deep Green */
    --primary: 145 54% 23%;
    --primary-foreground: 0 0% 100%;

    /* Muted Gold */
    --accent: 43 68% 52%;
    --accent-foreground: 0 0% 10%;

    /* Backgrounds */
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --muted: 210 20% 98%;
    --muted-foreground: 215 16% 47%;

    /* Other shadcn variables... */
  }

  .dark {
    --primary: 145 54% 33%;
    --primary-foreground: 0 0% 100%;
    --accent: 43 68% 62%;
    --accent-foreground: 0 0% 10%;
    --background: 222 47% 11%;
    --foreground: 210 20% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 16% 57%;
  }
}

/* RTL Support */
[dir='rtl'] {
  --text-direction: rtl;
}

[dir='ltr'] {
  --text-direction: ltr;
}
```

### Configure Fonts

Update `src/app/[locale]/layout.tsx`:

```typescript
import { Noto_Kufi_Arabic, Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const isRtl = locale === 'ar';
  const fontClass = isRtl ? notoKufiArabic.variable : inter.variable;

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body className={`${fontClass} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## 6. Firestore Security Rules

Create `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/tenants/$(request.auth.token.tenantId)/users/$(request.auth.uid)).data;
    }

    function belongsToTenant(tenantId) {
      return isAuthenticated() && request.auth.token.tenantId == tenantId;
    }

    function hasRole(roles) {
      return isAuthenticated() && request.auth.token.role in roles;
    }

    function isPlatformAdmin() {
      return isAuthenticated() && request.auth.token.platformAdmin == true;
    }

    // Platform-level subscriptions
    match /subscriptions/{tenantId} {
      allow read: if isPlatformAdmin() || belongsToTenant(tenantId);
      allow write: if isPlatformAdmin();
    }

    // Tenant data
    match /tenants/{tenantId} {
      allow read: if belongsToTenant(tenantId);
      allow write: if belongsToTenant(tenantId) && hasRole(['owner', 'admin']);

      // All subcollections
      match /{collection}/{docId} {
        allow read: if belongsToTenant(tenantId);
        allow write: if belongsToTenant(tenantId) && hasRole(['owner', 'admin', 'staff']);
      }

      // Customers - allow customer role to read own record
      match /customers/{customerId} {
        allow read: if belongsToTenant(tenantId) ||
          (isAuthenticated() && resource.data.userId == request.auth.uid);
        allow write: if belongsToTenant(tenantId) && hasRole(['owner', 'admin', 'staff']);
      }
    }

    // Email collection (for Firebase Extension)
    match /mail/{mailId} {
      allow create: if isAuthenticated();
      allow read: if false; // Only backend reads
    }
  }
}
```

## 7. Storage Security Rules

Create `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAuthenticated() {
      return request.auth != null;
    }

    function belongsToTenant(tenantId) {
      return isAuthenticated() && request.auth.token.tenantId == tenantId;
    }

    // Tenant files
    match /tenants/{tenantId}/{allPaths=**} {
      allow read: if belongsToTenant(tenantId);
      allow write: if belongsToTenant(tenantId)
        && request.resource.size < 10 * 1024 * 1024 // 10MB limit
        && request.resource.contentType.matches('image/.*|application/pdf');
    }
  }
}
```

## 8. Running the Development Server

```bash
# Start Firebase emulators (in terminal 1)
firebase emulators:start

# Start Stripe webhook forwarding (in terminal 2)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Start Next.js dev server (in terminal 3)
npm run dev
```

## 9. Project Structure Verification

Ensure the following structure exists:

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── (public)/
│   │   └── layout.tsx
│   ├── api/
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts
│   └── globals.css
├── components/
│   ├── ui/           # shadcn/ui components
│   └── providers/
│       └── theme-provider.tsx
├── lib/
│   └── firebase/
│       └── config.ts
├── messages/
│   ├── ar.json
│   └── en.json
├── i18n.ts
└── middleware.ts
```

## 10. Verification Checklist

- [ ] Next.js app runs without errors
- [ ] Firebase emulators start successfully
- [ ] Firebase Authentication works (signup/login)
- [ ] Firestore connection established
- [ ] Storage upload works
- [ ] Stripe checkout redirects correctly
- [ ] Stripe webhooks received locally
- [ ] Arabic RTL layout displays correctly
- [ ] Language switching works
- [ ] Theme toggle (dark/light) works
- [ ] shadcn/ui components render properly

## Next Steps

1. Implement authentication flows (signup, login, password reset)
2. Create dashboard layout with navigation
3. Implement package management (CRUD)
4. Add customer management
5. Build booking flow
6. Integrate passport OCR
7. Implement invoice generation
8. Set up subscription management
9. Add commission tracking
10. Build notification system
