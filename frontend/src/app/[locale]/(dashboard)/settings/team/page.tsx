import { getTranslations } from 'next-intl/server';
import { requireRoles } from '@/lib/auth/require-role';
import { InviteUserForm } from '@/components/forms/invite-user-form';
import { TeamMembersList } from '@/components/features/settings/team-members-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface TeamPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TeamPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings' });

  return {
    title: t('team'),
  };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings' });

  // Require owner or admin role
  const user = await requireRoles(['owner', 'admin'], locale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('team')}</h1>
        <p className="text-muted-foreground">
          {locale === 'ar'
            ? 'إدارة أعضاء فريقك والدعوات'
            : 'Manage your team members and invitations'}
        </p>
      </div>

      <Separator />

      <div className="grid gap-6">
        {/* Invite User */}
        <Card>
          <CardHeader>
            <CardTitle>{t('inviteUser')}</CardTitle>
            <CardDescription>
              {locale === 'ar'
                ? 'أرسل دعوة لعضو جديد في الفريق'
                : 'Send an invitation to a new team member'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteUserForm locale={locale} />
          </CardContent>
        </Card>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'ar' ? 'أعضاء الفريق' : 'Team Members'}
            </CardTitle>
            <CardDescription>
              {locale === 'ar'
                ? 'عرض وإدارة أعضاء الفريق الحاليين'
                : 'View and manage current team members'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamMembersList locale={locale} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
