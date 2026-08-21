import { Calendar } from '../ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import type { Conference } from './ConferenceApp';
import { useEffect } from 'react';

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

type CustomCalendarProps = {
  date?: Date;
  setDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  conference?: Conference;
};

function CustomCalendar({ date, setDate, conference }: CustomCalendarProps) {

  useEffect(() =>{
    console.log(conference)
  },[])
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="border rounded px-2 py-1 text-left bg-white flex items-center justify-between hover:bg-gray-50"
        >
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              format(date, 'dd/MM/yyyy', { locale: es })
            ) : (
              <span className="text-gray-500">dd/mm/aaaa</span>
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {conference ? (
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => setDate(d)}
            locale={es}
            disabled={{ before: parseLocalDate(conference.start_date!), after: parseLocalDate(conference.end_date!)}}
          />
        ) : (
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => setDate(d)}
            locale={es}
            disabled={{ before: new Date() }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

export default CustomCalendar;
