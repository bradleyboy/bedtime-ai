import type { PageDataArgs, PageMetadataFunction } from '@nokkio/router';
import { usePageData, Link } from '@nokkio/router';
import { Story } from '@nokkio/magic';
import {
  Ref,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Img, createImageURL } from '@nokkio/image';

type PageParams = { id: string };

export async function getPageData({ params }: PageDataArgs<PageParams>) {
  return Story.findById(params.id);
}

export const getPageMetadata: PageMetadataFunction<typeof getPageData> = ({
  pageData,
}) => {
  if (!pageData) {
    return { title: 'Not found', http: { status: 404 } };
  }

  return {
    title: `Tonight's Bedtime Story: ${pageData.title}`,
    openGraph: {
      image: createImageURL(pageData.image!),
      audio: pageData.audio!,
    },
  };
};

function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
    >
      <path
        fillRule="evenodd"
        d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
    >
      <path
        fillRule="evenodd"
        d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function secondsToHumanReadable(input: number) {
  const n = Math.round(input);
  const m = Math.floor(n / 60);
  const s = n % 60;

  return `${m}:${s < 10 ? `0${s}` : s}`;
}

function handleTogglePlayback(audio: HTMLAudioElement | null) {
  if (audio === null) {
    return;
  }

  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
}

const AudioPlayer = forwardRef<HTMLAudioElement, { src: string }>(
  function AudioPlayer({ src }, forwardedRef) {
    const ref = useRef<HTMLAudioElement>(null);

    useImperativeHandle(forwardedRef, () => ref.current as HTMLAudioElement);

    const [duration, setDuration] = useState<number | undefined>(
      ref.current?.duration,
    );
    const [currentTime, setCurrentTime] = useState<number>(0);

    const p = duration === undefined ? 0 : (currentTime / duration) * 100;

    useEffect(() => {
      setDuration(ref.current?.duration);

      ref.current?.addEventListener('timeupdate', () => {
        setCurrentTime(ref.current?.currentTime!);
      });

      ref.current?.addEventListener('loadedmetadata', () => {
        setDuration(ref.current?.duration);
      });

      const spaceHandler = (e: KeyboardEvent) => {
        if (ref.current) {
          if (e.key === ' ') {
            handleTogglePlayback(ref.current);
          }

          if (e.key === 'ArrowLeft') {
            ref.current.currentTime -= 10;
          }

          if (e.key === 'ArrowRight') {
            ref.current.currentTime += 10;
          }
        }
      };

      window.addEventListener('keydown', spaceHandler);

      return () => window.removeEventListener('keydown', spaceHandler);
    }, []);

    return (
      <div>
        <div className="px-6 md:px-12 pt-6 text-gray-50 flex items-center justify-between">
          <div
            onClick={() => handleTogglePlayback(ref.current)}
            className="cursor-pointer"
          >
            {ref.current?.paused && <PlayIcon />}
            {!ref.current?.paused && <PauseIcon />}
          </div>
          <div className="font-mono text-sm">
            {secondsToHumanReadable(currentTime)} /{' '}
            {duration && secondsToHumanReadable(duration)}
          </div>
          <audio ref={ref}>
            <source src={src} type="audio/mpeg" />
          </audio>
        </div>

        <div className={`mt-5 w-full bg-gray-700 h-2`}>
          <div
            style={{ width: `${p}%` }}
            className="transition-all bg-gray-400 h-full"
          ></div>
        </div>
      </div>
    );
  },
);

export default function () {
  const story = usePageData<typeof getPageData>();
  const ref = useRef<HTMLAudioElement>(null);

  if (!story) {
    return <p>Not found</p>;
  }

  if (!story.audio) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-6xl font-bold px-6 md:px-12">
          {story.title}
        </h1>

        <Link
          to="/"
          className="text-gray-300 mr-6 md:mr-12 px-3 py-1 md:px-6 md:py-3 border border-gray-500 rounded-lg hover:border-gray-300 hover:text-gray-200 transition-colors"
        >
          <span className="hidden md:inline">Create your own story</span>
          <span className="md:hidden">+</span>
        </Link>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex-1 flex justify-center bg-gray-900">
          <Img
            onClick={() => handleTogglePlayback(ref.current)}
            image={story.image}
            className="h-0 min-h-full object-contain"
          />
        </div>
        <div>
          <AudioPlayer ref={ref} src={story.audio} />
        </div>
      </div>
    </>
  );
}
