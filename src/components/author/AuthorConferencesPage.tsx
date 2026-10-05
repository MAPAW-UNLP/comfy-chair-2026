import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAuthorConferences, type AuthorConferenceStatus } from '@/services/conferenceServices';
import AuthorConferenceCard from './AuthorConferenceCard';

function AuthorConferencesPage() {
  const [selectedTab, setSelectedTab] = useState<AuthorConferenceStatus>('active');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const trimmedSearch = searchInput.trim();
  const isDebouncing = trimmedSearch !== debouncedSearch;

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(trimmedSearch), 300);
    return () => window.clearTimeout(timeout);
  }, [trimmedSearch]);

  const { data: conferences, isPending, isFetching, isError, refetch } = useQuery({
    queryKey: ['author-conferences', selectedTab, debouncedSearch],
    queryFn: ({ signal }) => getAuthorConferences(selectedTab, debouncedSearch, signal),
    enabled: !isDebouncing,
    staleTime: 60_000,
    retry: false,
  });

  const renderConferences = () => {
    if (isDebouncing || isPending) {
      return <p role="status" className="py-8 text-center text-muted-foreground">Cargando conferencias...</p>;
    }

    if (isError) {
      return (
        <div role="alert" className="flex flex-col items-center gap-3 py-8 text-center">
          <p>No se pudieron cargar las conferencias. Intentá nuevamente.</p>
          <Button variant="outline" onClick={() => void refetch()}>Reintentar</Button>
        </div>
      );
    }

    if (!conferences?.length) {
      const kind = selectedTab === 'active' ? 'activas' : 'terminadas';
      return (
        <p className="py-8 text-center text-muted-foreground">
          {debouncedSearch
            ? `No se encontraron conferencias ${kind} para “${debouncedSearch}”.`
            : `No hay conferencias ${kind}.`}
        </p>
      );
    }

    return (
      <>
        {isFetching && <p role="status" className="text-sm text-muted-foreground">Actualizando conferencias...</p>}
        <div className="grid w-full gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {conferences.map((conference) => (
            <AuthorConferenceCard key={conference.id} conference={conference} />
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col items-center gap-5 mt-3 px-5 w-full">
      <h1 className="text-3xl font-bold">Conferencias (autor)</h1>

      <div className="relative w-full">
        <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Buscar conferencias"
          placeholder="Buscar por título o descripción..."
          className="pl-9"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>

      <Tabs
        value={selectedTab}
        onValueChange={(value) => setSelectedTab(value as AuthorConferenceStatus)}
        className="w-full items-center gap-5"
      >
        <TabsList className="py-5 shadow">
          <TabsTrigger value="active" className="cursor-pointer p-4 text-lg data-[state=active]:font-bold">
            Activas
          </TabsTrigger>
          <TabsTrigger value="finished" className="cursor-pointer p-4 text-lg data-[state=active]:font-bold">
            Terminadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="w-full">{renderConferences()}</TabsContent>
        <TabsContent value="finished" className="w-full">{renderConferences()}</TabsContent>
      </Tabs>
    </div>
  );
}

export default AuthorConferencesPage;
