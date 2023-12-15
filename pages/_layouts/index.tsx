import React, { Suspense } from 'react';

import './index.css';

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <main className="flex items-center justify-center h-screen bg-gray-900 w-full p-6">
      <Suspense fallback={null}>{children}</Suspense>
    </main>
  );
}
