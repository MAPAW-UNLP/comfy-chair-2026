import { Link } from '@tanstack/react-router';
import type { Conference } from '@/components/conference/ConferenceApp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
    <Link
      to="/conference/$id"
      params={{ id: String(conference.id) }}
      className="block h-full min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="h-full w-full min-w-0 cursor-pointer gap-3 py-4 transition-colors hover:border-primary/50 hover:bg-card/60">
        <CardHeader className="gap-2">
          <CardTitle>
            <h2 className="break-words text-lg leading-snug uppercase">{conference.title}</h2>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatDate(conference.start_date)} - {formatDate(conference.end_date)}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <Separator />
          <p className="break-words text-muted-foreground">{conference.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default AuthorConferenceCard;
