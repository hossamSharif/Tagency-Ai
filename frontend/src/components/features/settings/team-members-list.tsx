'use client';

/**
 * Team Members List Component
 *
 * Displays a list of team members with role badges
 */

import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Users } from 'lucide-react';

interface TeamMembersListProps {
  locale: string;
}

// Placeholder - in production this would fetch from the server
const PLACEHOLDER_MEMBERS = [
  {
    id: '1',
    displayName: 'Ahmed Mohammed',
    email: 'ahmed@example.com',
    role: 'owner',
    avatar: null,
  },
];

export function TeamMembersList({ locale }: TeamMembersListProps) {
  const t = useTranslations('settings');
  const isArabic = locale === 'ar';

  const members = PLACEHOLDER_MEMBERS;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={isArabic ? 'لا يوجد أعضاء' : 'No team members'}
        description={
          isArabic
            ? 'قم بدعوة أعضاء جدد للانضمام إلى فريقك'
            : 'Invite new members to join your team'
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={member.avatar || undefined} />
              <AvatarFallback>
                {member.displayName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{member.displayName}</p>
              <p className="text-sm text-muted-foreground">{member.email}</p>
            </div>
          </div>
          <Badge variant={getRoleBadgeVariant(member.role)}>
            {t(`roles.${member.role}`)}
          </Badge>
        </div>
      ))}
    </div>
  );
}
