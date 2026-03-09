import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, Check, ChevronDown, Loader2, Mic, MicOff, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DROPDOWN_DEBOUNCE_MS,
  DROPDOWN_MAX_HEIGHT_PX,
  DROPDOWN_MIN_CHARS,
  DROPDOWN_SCROLL_THRESHOLD,
} from '@/components/shared/dropdown/constants';

type Primitive = string | number;

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative;
}

interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResult[];
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}

export interface ComboboxOption<TValue extends Primitive = Primitive> {
  value: TValue;
  label: string;
  description?: string;
  icon?: ReactNode;
  keywords?: string[];
}

interface VoiceSearchComboboxProps<TValue extends Primitive = Primitive> {
  options: ComboboxOption<TValue>[];
  value?: TValue | null;
  onSelect: (value: TValue | null) => void;
  onDebouncedSearchChange?: (value: string) => void;
  onFetchNextPage?: () => void;
  hasNextPage?: boolean;
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  minChars?: number;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

export function VoiceSearchCombobox<TValue extends Primitive = Primitive>({
  options,
  value,
  onSelect,
  onDebouncedSearchChange,
  onFetchNextPage,
  hasNextPage = false,
  isLoading = false,
  isFetchingNextPage = false,
  minChars = DROPDOWN_MIN_CHARS,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled = false,
  className,
}: VoiceSearchComboboxProps<TValue>) {
  const { t, i18n } = useTranslation('common');
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const RecognitionCtor =
      (window as SpeechRecognitionWindow).SpeechRecognition ||
      (window as SpeechRecognitionWindow).webkitSpeechRecognition;

    if (!RecognitionCtor) {
      recognitionRef.current = null;
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;

    const languageMap: Record<string, string> = {
      tr: 'tr-TR',
      en: 'en-US',
    };

    recognition.lang = languageMap[i18n.language] ?? 'tr-TR';
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      setSearchQuery(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [i18n.language]);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setIsListening(false);
      recognitionRef.current?.stop();
    }
  }, [open]);

  useEffect(() => {
    if (!onDebouncedSearchChange) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onDebouncedSearchChange(searchQuery);
    }, DROPDOWN_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onDebouncedSearchChange, searchQuery]);

  const trimmedSearchQuery = searchQuery.trim();
  const isAsyncMode = Boolean(onDebouncedSearchChange);
  const isThresholdMode = isAsyncMode && trimmedSearchQuery.length > 0 && trimmedSearchQuery.length < minChars;

  const filteredOptions = useMemo(() => {
    if (isAsyncMode) {
      return options;
    }

    if (!trimmedSearchQuery) {
      return options;
    }

    const normalizedQuery = trimmedSearchQuery.toLocaleLowerCase(i18n.language);

    return options.filter((option) => {
      const haystack = [
        option.label,
        option.description ?? '',
        ...(option.keywords ?? []),
      ]
        .join(' ')
        .toLocaleLowerCase(i18n.language);

      return haystack.includes(normalizedQuery);
    });
  }, [i18n.language, isAsyncMode, options, trimmedSearchQuery]);

  const selectedOption = options.find((option) => option.value === value);

  const handleVoiceSearch = () => {
    if (!recognitionRef.current) {
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const handleListScroll = () => {
    if (!listRef.current || !onFetchNextPage || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const element = listRef.current;
    const progress = (element.scrollTop + element.clientHeight) / element.scrollHeight;
    if (progress >= DROPDOWN_SCROLL_THRESHOLD) {
      void onFetchNextPage();
    }
  };

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        className={cn(
          'h-12 w-full justify-between rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-medium text-slate-900 ring-0 hover:bg-white',
          !selectedOption && 'text-slate-400',
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">{selectedOption?.label ?? placeholder ?? t('select')}</span>
        <ChevronDown className={cn('size-4 text-slate-400 transition', open && 'rotate-180')} />
      </Button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
          <div className="border-b border-slate-100 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                autoFocus
                className="pr-12 pl-11"
                placeholder={searchPlaceholder ?? t('search')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {recognitionRef.current ? (
                <button
                  type="button"
                  className={cn(
                    'absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-xl transition',
                    isListening ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                  )}
                  onClick={handleVoiceSearch}
                >
                  {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </button>
              ) : null}
            </div>
            {isThresholdMode ? (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                <AlertCircle className="size-3.5" />
                <span>{t('dropdown.minCharsHint', { count: minChars })}</span>
              </div>
            ) : null}
          </div>

          <div
            ref={listRef}
            className="custom-scrollbar overflow-y-auto p-2"
            style={{ maxHeight: `${DROPDOWN_MAX_HEIGHT_PX}px` }}
            onScroll={handleListScroll}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                <span>{t('loading')}</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                {emptyText ?? t('dropdown.noResults')}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((option) => {
                  const selected = option.value === value;

                  return (
                    <button
                      key={`${option.value}`}
                      type="button"
                      className={cn(
                        'flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50',
                        selected && 'bg-indigo-50 text-indigo-700',
                      )}
                      onClick={() => {
                        onSelect(option.value);
                        setOpen(false);
                      }}
                    >
                      <div className="mt-0.5 text-slate-400">{option.icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-current">{option.label}</div>
                        {option.description ? (
                          <div className="mt-1 truncate text-xs text-slate-500">{option.description}</div>
                        ) : null}
                      </div>
                      {selected ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
                    </button>
                  );
                })}
                {isFetchingNextPage ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-3 text-xs text-slate-500">
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>{t('loading')}</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
