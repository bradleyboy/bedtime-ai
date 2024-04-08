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
import { makeRequest } from '@nokkio/endpoints';

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
    meta: {
      description: `Tonight's Bedtime Story: ${
        pageData.summary ?? pageData.title
      }`,
    },
    openGraph: {
      image: createImageURL(pageData.image!),
      audio: pageData.audio!,
    },
  };
};

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
      />
    </svg>
  );
}

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

const AudioPlayer = forwardRef<
  HTMLAudioElement,
  {
    story: Story;
    onTimeUpdate?: (currentTime: number, totalTime: number) => void;
  }
>(function AudioPlayer({ story, onTimeUpdate }, forwardedRef) {
  const src = story.audio;
  const ref = useRef<HTMLAudioElement>(null);
  const duration = story.duration;

  useImperativeHandle(forwardedRef, () => ref.current as HTMLAudioElement);

  const [currentTime, setCurrentTime] = useState<number>(0);

  const p = duration === null ? 0 : (currentTime / duration) * 100;

  useEffect(() => {
    const handleTimeUpdate = () => {
      setCurrentTime(ref.current?.currentTime!);

      if (onTimeUpdate) {
        onTimeUpdate(Math.round(ref.current?.currentTime!), story.duration!);
      }
    };

    ref.current?.addEventListener('timeupdate', handleTimeUpdate);

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

    return () => {
      window.removeEventListener('keydown', spaceHandler);
      ref.current?.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  useEffect(() => {
    if (story.duration !== null) {
      return;
    }

    const handleMetadata = () => {
      const duration = ref.current?.duration;

      if (!duration) {
        return;
      }

      const roundedDuration = Math.round(duration);
      if (!isNaN(roundedDuration)) {
        story.update({ duration: roundedDuration });
      }
    };

    ref.current?.addEventListener('loadedmetadata', handleMetadata);

    return () => {
      ref.current?.removeEventListener('loadedmetadata', handleMetadata);
    };
  }, [story.duration]);

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
        {duration && duration > 0 && (
          <div className="font-mono text-sm">
            {secondsToHumanReadable(currentTime)} /{' '}
            {duration && secondsToHumanReadable(duration)}
          </div>
        )}
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
});

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

function ShowRelatedStories({ story }: { story: Story }) {
  const [relatedStories, setRelatedStories] = useState<Array<Story>>([]);

  useEffect(() => {
    let unmounted = false;

    makeRequest(`/stories/${story.id}/related`)
      .then((r) => {
        if (r.ok) {
          return r.json();
        }
      })
      .then((r) => {
        if (unmounted) {
          return;
        }

        setRelatedStories(
          r.relatedStories.map(
            (r: Parameters<(typeof Story)['fromOutput']>[0]) =>
              Story.fromOutput(r),
          ),
        );
      });

    return () => {
      unmounted = true;
    };
  }, []);

  if (relatedStories.length === 0) {
    return (
      <div className="absolute top-0 bottom-0 left-0 right-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-0 bottom-0 left-0 right-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center">
      <div className="hidden md:block">More stories like this</div>
      <div className="grid grid-cols-2 gap-6 p-6">
        {relatedStories.map((story) => (
          <Link
            key={story.id}
            to={`/stories/${story.id}`}
            className={`relative flex flex-col w-full md:w-[250px] text-sm md:text-base rounded overflow-hidden border border-transparent hover:border-gray-600 transition-colors`}
          >
            <Img
              image={story.image}
              crop
              className="saturate-50 hover:saturate-100 transition"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-90 px-2 py-3 md:px-3 md:py-4">
              {story.title}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function () {
  const story = usePageData<typeof getPageData>();
  const ref = useRef<HTMLAudioElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState<{
    currentTime: number;
    totalTime: number;
  }>({ currentTime: 0, totalTime: 0 });

  useEffect(() => {
    const handler = () => {
      setIsPlaying(!ref.current?.paused);
    };

    ref.current?.addEventListener('play', handler);
    ref.current?.addEventListener('pause', handler);

    return () => {
      ref.current?.removeEventListener('play', handler);
      ref.current?.removeEventListener('pause', handler);
    };
  }, []);

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
          {imageLoaded && !isPlaying && (
            <div
              onClick={() => handleTogglePlayback(ref.current)}
              className="bg-gray-900 cursor-pointer p-6 rounded-full bg-opacity-50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <PlayIcon />
            </div>
          )}
          <Img
            onLoad={() => setImageLoaded(true)}
            onClick={() => handleTogglePlayback(ref.current)}
            image={story.image}
            className="h-0 min-h-full object-contain"
          />
          <AdminToolbar story={story} />
          {time.totalTime > 0 && time.currentTime >= time.totalTime && (
            <ShowRelatedStories story={story} />
          )}
          {time.currentTime < time.totalTime &&
            time.currentTime > time.totalTime * 0.3 && (
              <div className="absolute bottom-3">
                <Link
                  to={`/stories/create?from=${story.id}`}
                  className="flex items-center space-x-1 text-sm p-3 text-gray-300 hover:text-gray-50 bg-gray-900 rounded-md"
                >
                  <CopyIcon /> <span>Create new story based on this one</span>
                </Link>
              </div>
            )}
        </div>
        <div>
          <AudioPlayer
            ref={ref}
            story={story}
            onTimeUpdate={(currentTime, totalTime) => {
              setTime({ currentTime, totalTime });
            }}
          />
        </div>
        <Footer />
      </div>
    </>
  );
}
