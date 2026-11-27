import axios from 'axios';
import { redirect } from '@tanstack/react-router';
import api from '@/services/api';
import type { User } from '@/services/auth';

export interface ConferenceAccess {
  chair_conference_ids: number[];
  chair_session_ids: number[];
  reviewer_conference_ids: number[];
  author_conference_ids: number[];
  author_article_ids: number[];
  reviewer_article_ids: number[];
  invitation_ids: number[];
}

// Local storage selects a resource; only the API determines its permissions.
function selectedConferenceId(): number | undefined {
  try {
    const selected = JSON.parse(localStorage.getItem('comfychair:selectedRole') ?? 'null');
    return selected?.conferenceId == null ? undefined : Number(selected.conferenceId);
  } catch {
    return undefined;
  }
}

export async function requireRouteAccess(user: User, href: string): Promise<void> {
  const url = new URL(href, window.location.origin);
  const path = decodeURIComponent(url.pathname).replace(/\/+$/, '');
  const chair = path.startsWith('/chairs/') || path.startsWith('/review/chair/') || path.startsWith('/article/assign/');
  const reviewer = path === '/reviewer' || path.startsWith('/reviewer/');
  const authorConference = path.match(/^\/articles\/([^/]+)$/);
  const authorArticle = path.match(/^\/article\/(?:edit|history)\/([^/]+)$/);
  const articleDetail = path.match(/^\/article\/detail\/([^/]+)$/);
  const sessionPage = path.match(/^\/conference\/session\/([^/]+)$/);
  if (user.role === 'admin' || (!chair && !reviewer && !authorConference && !authorArticle && !articleDetail && !sessionPage)) return;

  const deny = () => { throw redirect({ to: '/dashboard', replace: true }); };
  try {
    // Refresh on every navigation so role removal and account changes take effect.
    const { data: access } = await api.get<ConferenceAccess>('/user/access/');
    if (authorConference) {
      if (!access.author_conference_ids.includes(Number(authorConference[1]))) deny();
    } else if (authorArticle) {
      if (!access.author_article_ids.includes(Number(authorArticle[1]))) deny();
    } else if (articleDetail) {
      await api.get(`/api/article/${articleDetail[1]}/`);
    } else if (sessionPage) {
      if (!access.chair_session_ids.includes(Number(sessionPage[1]))) deny();
    } else if (chair) {
      const conference = path.match(/^\/chairs\/conference\/([^/]+)\/sessions$/);
      const article = path.match(/^\/(?:article\/assign|review\/chair)\/([^/]+)$/);
      if (conference || path === '/chairs/configuration') {
        const id = conference?.[1] ?? url.searchParams.get('conferenceId');
        if (!id || !access.chair_conference_ids.includes(Number(id))) deny();
      } else if (article) {
        const { data } = await api.get(`/api/article/${article[1]}/`);
        if (!access.chair_conference_ids.includes(Number(data.session?.conference?.id))) deny();
      } else if (path === '/chairs/select-session') {
        if (!access.chair_conference_ids.length) deny();
      } else {
        const id = Number(localStorage.getItem('selectedSession'));
        if (!access.chair_session_ids.includes(id)) deny();
      }
    } else if (reviewer) {
      const invitation = path.match(/^\/reviewer\/invitations\/([^/]+)$/);
      const article = path.match(/^\/reviewer\/review\/([^/]+)$/);
      if (invitation) {
        if (!access.invitation_ids.includes(Number(invitation[1]))) deny();
      } else if (path === '/reviewer/invitations') {
        if (!access.invitation_ids.length && !access.reviewer_conference_ids.length) deny();
      } else if (article) {
        if (!access.reviewer_article_ids.includes(Number(article[1]))) deny();
        // Includes existing conflict-of-interest checks.
        await api.get(`/api/reviewer/articles/${article[1]}/assignment/`);
      } else {
        const conference = url.searchParams.has('conferenceId')
          ? Number(url.searchParams.get('conferenceId')) : selectedConferenceId();
        if (conference !== undefined) {
          if (!access.reviewer_conference_ids.includes(conference)) deny();
        } else if (!access.reviewer_conference_ids.length) deny();
        const session = url.searchParams.get('sessionId');
        if (session) {
          const { data } = await api.get(`/api/session/${session}/`);
          const sessionConference = Number(data.conference?.id);
          if (!access.reviewer_conference_ids.includes(sessionConference) ||
              (conference !== undefined && sessionConference !== conference)) deny();
        }
      }
    }
  } catch (error) {
    if (axios.isAxiosError(error) && [403, 404].includes(error.response?.status ?? 0)) deny();
    throw error;
  }
}
