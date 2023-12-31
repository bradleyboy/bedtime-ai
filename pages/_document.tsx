import { NOKKIO_CSP_NONCE, Html, Head, Body, DocumentProps } from '@nokkio/doc';

export default function Document({ children }: DocumentProps): JSX.Element {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&display=swap"
          rel="stylesheet"
        />

        <script
          nonce={NOKKIO_CSP_NONCE}
          src="https://accounts.google.com/gsi/client"
          async
        ></script>
      </Head>
      <Body className="bg-gray-800">
        <div id="main">{children}</div>
      </Body>
    </Html>
  );
}
