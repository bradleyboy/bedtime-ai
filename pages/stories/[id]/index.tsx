import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
  MouseEventHandler,
} from 'react';

import type { PageDataArgs, PageMetadataFunction } from '@nokkio/router';
import { usePageData, Link } from '@nokkio/router';
import { Story } from '@nokkio/magic';
import { Img, createImageURL } from '@nokkio/image';
import { useAuth } from '@nokkio/auth';

import Spinner from 'components/Spinner';
import Footer from 'components/Footer';
import { secondsToHumanReadable } from 'utils/media';

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
    title: `${pageData.title} - Tonight's Bedtime Story`,
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

const AudioPlayer = forwardRef<HTMLAudioElement, { story: Story }>(
  function AudioPlayer({ story }, forwardedRef) {
    const src = story.audio;
    const ref = useRef<HTMLAudioElement>(null);

    useImperativeHandle(forwardedRef, () => ref.current as HTMLAudioElement);

    const [duration, setDuration] = useState<number | undefined>(
      typeof ref.current?.duration === 'number'
        ? ref.current.duration
        : undefined,
    );
    const [currentTime, setCurrentTime] = useState<number>(0);

    const p = duration === undefined ? 0 : (currentTime / duration) * 100;

    useEffect(() => {
      if (typeof ref.current?.duration === 'number') {
        setDuration(ref.current?.duration);
      }

      ref.current?.addEventListener('timeupdate', () => {
        setCurrentTime(ref.current?.currentTime!);
      });

      ref.current?.addEventListener('loadedmetadata', () => {
        if (typeof ref.current?.duration === 'number') {
          setDuration(ref.current?.duration);
        }
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

    useEffect(() => {
      if (typeof duration !== 'number') {
        return;
      }

      // In an ideal world, we would parse the duration on the backend
      // and store this at creation time, b
      const roundedDuration = Math.round(duration);
      if (!isNaN(roundedDuration) && roundedDuration !== story.duration) {
        story.update({ duration: roundedDuration });
      }
    }, [duration]);

    if (src === null) {
      return null;
    }

    return (
      <div>
        <div className="px-6 lg:px-12 pt-6 text-gray-50 flex items-center justify-between">
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
            className="transition-all ease-linear bg-gray-400 h-full"
          ></div>
        </div>
      </div>
    );
  },
);

function AdminToolbar({ story }: { story: Story }) {
  const { isAuthenticated, user } = useAuth();

  const toggleVisibility = useCallback(
    (e) => {
      e.preventDefault();
      story.update({ isPublic: !story.isPublic });
    },
    [story.isPublic],
  ) as MouseEventHandler<HTMLButtonElement>;

  if (!isAuthenticated || !user.isAdmin) {
    return null;
  }

  return (
    <div className="absolute top-6 right-6 lg:right-12">
      <button
        onClick={toggleVisibility}
        className="px-3 py-2 border border-gray-600 rounded text-sm"
      >
        {story.isPublic ? 'Make private' : 'Make public'}
      </button>
    </div>
  );
}

export default function () {
  const story = usePageData<typeof getPageData>();
  const ref = useRef<HTMLAudioElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!story) {
    return <p>Not found</p>;
  }

  if (!story.audio) {
    return null;
  }

  return (
    <>
      <div className="px-6 lg:px-12 space-y-3 lg:space-y-6">
        <h1 className="text-2xl lg:text-6xl font-bold">{story.title}</h1>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="relative flex-1 flex justify-center bg-gray-900">
          {!imageLoaded && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Spinner />
            </div>
          )}
          <Img
            onLoad={() => setImageLoaded(true)}
            onClick={() => handleTogglePlayback(ref.current)}
            image={story.image}
            className="h-0 min-h-full object-contain"
          />
          <AdminToolbar story={story} />
        </div>
        <div>
          <AudioPlayer ref={ref} story={story} />
        </div>
        <Footer />
      </div>
    </>
  );
}
