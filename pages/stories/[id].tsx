import type { PageDataArgs, PageMetadataFunction } from '@nokkio/router';
import { usePageData } from '@nokkio/router';
import { Story } from '@nokkio/magic';
import { useEffect, useRef, useState } from 'react';
import { Img } from '@nokkio/image';

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
  return { title: `Tonight's Bedtime Story: ${pageData.title}` };
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

  useEffect(() => {
    setDuration(ref.current?.duration);

    ref.current?.addEventListener('timeupdate', () => {
      setCurrentTime(ref.current?.currentTime!);
    });

    ref.current?.addEventListener('loadedmetadata', () => {
      setDuration(ref.current?.duration);
    });
  }, []);

  function handleTogglePlayback() {
    if (ref.current?.paused) {
      ref.current?.play();
    } else {
      ref.current?.pause();
    }
  }

  return (
    <div className="text-gray-50 flex items-center justify-between">
      <div onClick={handleTogglePlayback}>
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
  );
}

export default function () {
  const story = usePageData<typeof getPageData>();

  if (!story) {
    return <p>Not found</p>;
  }

  return (
    <div className="bg-gray-800 p-6 max-w-xl flex flex-col space-y-6 rounded-md">
      <h1 className="text-2xl font-bold text-gray-50">{story.title}</h1>
      {story.image !== null && (
        <div className="flex-1">
          <Img image={story.image} />
        </div>
      )}
      {story.audio !== null && (
        <div>
          <AudioPlayer src={story.audio} />
        </div>
      )}
    </div>
  );
}
