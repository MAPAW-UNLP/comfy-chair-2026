import Breadcrumb from '@/components/ui/breadcrumb';
import type { Conference } from './ConferenceApp';
import type { Session } from '@/services/sessionServices';

type BreadcrumbProps = {
  conference: Conference;
  session?: Session;
};

export default function ConferenceBreadcrumb({ conference, session }: BreadcrumbProps) {
  return (
    <Breadcrumb items={[
      { label: 'Home', to: '/conference/view' },
      { label: 'Conferencia', to: session ? '/conference/' + conference.id : undefined },
      ...(session ? [{ label: 'Sesión' }] : []),
    ]} />
  );
}
