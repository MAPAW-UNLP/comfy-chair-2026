import { createFileRoute } from '@tanstack/react-router';
import AuthorConferencesPage from '@/components/author/AuthorConferencesPage';

export const Route = createFileRoute('/_auth/author/conferences')({
  component: AuthorConferencesPage,
});
