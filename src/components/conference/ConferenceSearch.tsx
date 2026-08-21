import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

type SearchProps<T> = {
  datos: T[];
  setResultados: React.Dispatch<React.SetStateAction<T[]>>;
  campos: (keyof T)[]; // campos a buscar, ej: ["title", "description"]
};

export function SearchBar<T extends Record<string, any>>({
  datos,
  setResultados,
  campos,
}: SearchProps<T>) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (query.trim() === '') {
      setResultados(datos);
      return;
    }

    const valor = query.toLowerCase();
    const filtrados = datos.filter((item) =>
      campos.some((campo) => String(item[campo]).toLowerCase().includes(valor))
    );
    setResultados(filtrados);
  }, [query, datos]);

  return (
    <div className="flex flex-auto border border-gray-300 rounded-lg bg-white min-w-20 overflow-hidden shadow">
      <div className="flex items-center pl-2">
        <Search className="w-4 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Buscar..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="p-2 outline-none w-full"
      />
    </div>
  );
}
