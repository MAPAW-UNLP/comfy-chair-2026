import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Loader2, Presentation } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { getAllConferences, type Conference } from '@/services/conferenceServices';
import { useAuth } from '@/contexts/AuthContext';

export function SelectSessionChair() {
    const [conferences, setConferences] = useState<Conference[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const loadConferences = async () => {
            try {
                const data = await getAllConferences();
                const userId = String(user?.id);
                setConferences(
                    data.filter((conference) =>
                        conference.chairs?.some((chairId) => String(chairId) === userId),
                    ),
                );
            } catch {
                setError('No se pudieron cargar tus conferencias.');
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) loadConferences();
    }, [user?.id]);

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="min-h-full bg-background p-4 py-8">
            <main className="mx-auto max-w-6xl">
                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-3xl font-bold">Tus conferencias</h1>
                </div>

                {error ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
                        {error}
                    </p>
                ) : conferences.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                        <Presentation className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                        <h2 className="text-xl font-semibold text-slate-900">
                            No tenés conferencias asignadas
                        </h2>
                        <p className="mt-2 text-slate-500">
                            Cuando seas chair de una conferencia, aparecerá en esta vista.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {conferences.map((conference) => (
                            <article
                                key={conference.id}
                                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                            >
                                <div className="flex flex-1 flex-col p-6">
                                    <div className="mb-5 flex items-start justify-between gap-4">
                                        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                                            <Presentation className="h-6 w-6" />
                                        </div>
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                            Chair
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        {conference.title}
                                    </h2>
                                    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-500">
                                        {conference.description || 'Sin descripción disponible.'}
                                    </p>
                                    <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                                        <CalendarDays className="h-4 w-4 text-indigo-500" />
                                        {conference.start_date} — {conference.end_date}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate({
                                                to: '/chairs/conference/$conferenceId/sessions',
                                                params: { conferenceId: String(conference.id) },
                                            })
                                        }
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-indigo-600"
                                    >
                                        Ver sesiones
                                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}