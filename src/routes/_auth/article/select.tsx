import { createFileRoute } from '@tanstack/react-router';
import { ArticlesApp } from '@/components/article/ArticlesApp';

export const Route = createFileRoute('/_auth/article/select')({
    component: () => <ArticlesApp />,
});
