import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ArticleForm from './ArticleForm';
import type { Conference } from '@/components/conference/ConferenceApp';
import { useAuth } from '@/contexts/AuthContext';
import { useFetchUsers } from '@/hooks/Grupo1/useFetchUsers';

type ArticleCreateFromConferenceProps = {
  conference: Conference;
  onFinished?: () => void;
  trigger: React.ReactNode;
};

export default function ArticleCreateFromConference({
  conference,
  onFinished,
  trigger,
}: ArticleCreateFromConferenceProps) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const finish = () => {
    close();
    onFinished?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo submission</DialogTitle>
        </DialogHeader>
        <ArticleCreateContent
          conference={conference}
          onSuccess={finish}
          onCancel={close}
          onNotFound={finish}
        />
      </DialogContent>
    </Dialog>
  );
}

type ArticleCreateContentProps = {
  conference: Conference;
  onSuccess: () => void;
  onCancel: () => void;
  onNotFound: () => void;
};

// Se monta solo con el modal abierto, así los usuarios se cargan recién al abrirlo
function ArticleCreateContent({ conference, onSuccess, onCancel, onNotFound }: ArticleCreateContentProps) {
  const { user } = useAuth();
  const { userList, loadingUsers } = useFetchUsers();

  if (loadingUsers) {
    return (
      <div className="grid place-items-center py-10">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ArticleForm
      conferences={[conference]}
      users={userList}
      userId={Number(user!.id)}
      fixedConferenceId={conference.id}
      onSuccess={onSuccess}
      onCancel={onCancel}
      onNotFound={onNotFound}
    />
  );
}
