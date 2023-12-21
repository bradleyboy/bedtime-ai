import { Link } from '@nokkio/router';

export default function Footer() {
  return (
    <div className="px-6 py-3 lg:px-12 lg:py-4 text-sm bg-gray-900 flex-col lg:flex-row space-y-3 lg:space-y-0 flex justify-between">
      <div>
        Made with <strong>Tonight's Bedtime Story</strong>, an experiment with
        OpenAI's API.{' '}
        <Link to="/stories/create" className="underline">
          Create your own bedtime tale
        </Link>
        .
      </div>
      <div>
        Built with{' '}
        <a href="https://nokk.io" className="underline" target="_blank">
          Nokkio
        </a>
        .
      </div>
    </div>
  );
}
