import type { PageMetadataFunction } from '@nokkio/router';

import type { JSX } from "react";

export const getPageMetadata: PageMetadataFunction = () => {
  return { http: { status: 404 }, title: 'Not found' };
};

export default function NotFound(): JSX.Element {
  return <h1>404 / Not Found</h1>;
}
