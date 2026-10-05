import type { Conference } from '@/components/conference/ConferenceApp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function formatDate(value?: string) {
  if (!value) return 'Sin fecha';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

type AuthorConferenceCardProps = {
  conference: Conference;
};

function AuthorConferenceCard({ conference }: AuthorConferenceCardProps) {
  return (
    <Card className="h-full gap-4">
      <CardHeader>
        <CardTitle>
          <h2 className="break-words text-lg">{conference.title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p className="break-words text-muted-foreground">{conference.description}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
          <dt className="font-medium">Inicio:</dt>
          <dd>{formatDate(conference.start_date)}</dd>
          <dt className="font-medium">Fin:</dt>
          <dd>{formatDate(conference.end_date)}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}

export default AuthorConferenceCard;
