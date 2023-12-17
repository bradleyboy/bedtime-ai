import React, { Suspense } from 'react';

import './index.css';

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <main className="flex items-center justify-center h-screen bg-gray-900 w-full">
      <div className="text-gray-50 md:pt-12 pt-6 w-full flex flex-col space-y-6 md:space-y-12 rounded-md h-screen">
        <Suspense fallback={null}>{children}</Suspense>
      </div>
    </main>
  );
}
