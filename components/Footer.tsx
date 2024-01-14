import { Link } from '@nokkio/router';

export default function Footer() {
  return (
    <div className="px-6 py-3 lg:px-12 lg:py-4 text-sm bg-gray-900 flex-col lg:flex-row space-y-3 lg:space-y-0 flex justify-between">
      <div>
        Tonight's Bedtime Story:{' '}
        <Link to="/" className="underline">
          View other stories
        </Link>{' '}
        or{' '}
        <Link to="/stories/create" className="underline">
          create your own
        </Link>
        .
      </div>
      <div>
        Built by{' '}
        <a
          href="https://twitter.com/bradleyboy"
          className="underline"
          target="_blank"
        >
          @bradleyboy
        </a>{' '}
        with{' '}
        <a href="https://nokk.io" className="underline" target="_blank">
          Nokkio
        </a>{' '}
        and the OpenAI API.
      </div>
    </div>
  );
}
