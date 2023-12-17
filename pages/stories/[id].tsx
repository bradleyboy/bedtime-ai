import type { PageDataArgs, PageMetadataFunction } from '@nokkio/router';
import { usePageData } from '@nokkio/router';
import { Story } from '@nokkio/magic';
import { useEffect, useRef, useState } from 'react';
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

function AudioPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement>(null);
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
      if (e.key === ' ') {
        handleTogglePlayback();
      }
    };

    window.addEventListener('keydown', spaceHandler);

    return () => window.removeEventListener('keydown', spaceHandler);
  }, []);

  function handleTogglePlayback() {
    if (ref.current?.paused) {
      ref.current?.play();
    } else {
      ref.current?.pause();
    }
  }

  return (
    <div>
      <div className="px-6 pt-6 text-gray-50 flex items-center justify-between">
        <div onClick={handleTogglePlayback} className="cursor-pointer">
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
}

export default function () {
  const story = usePageData<typeof getPageData>();

  if (!story) {
    return <p>Not found</p>;
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-gray-800 max-w-xl md:max-w-2xl flex flex-col rounded-md overflow-hidden mx-3">
        <div className="pt-6 px-6 space-y-6">
          <h1 className="text-2xl font-bold text-gray-50">{story.title}</h1>
          {story.image !== null && (
            <div className="flex-1">
              <Img image={story.image} className="rounded-md" />
            </div>
          )}
        </div>
        {story.audio !== null && (
          <div>
            <AudioPlayer src={story.audio} />
          </div>
        )}
      </div>
    </div>
  );
}
