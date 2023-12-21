import { useEffect, useRef, useState } from 'react';

import { makeRequest } from '@nokkio/endpoints';

function initializeGoogleAuth() {
  const nonce = Math.random().toString(36).slice(2);

  google.accounts.id.initialize({
    client_id:
      '752773946224-6at0hiisl0754fb7ar02crint6rrsj2p.apps.googleusercontent.com',
    nonce,
    callback: function ({ credential }) {
      handleCredential(credential, nonce);
    },
  });
}

function renderButton(element: HTMLElement) {
  google.accounts.id.renderButton(element, {
    type: 'standard',
    size: 'medium',
    theme: 'filled_black',
  });
}

async function handleCredential(credential: string, nonce: string) {
  const form = new FormData();
  form.set('credential', credential);
  form.set('nonce', nonce);

  await makeRequest('/auth', {
    method: 'POST',
    body: form,
  });
}

function GoogleAuth({ children }: { children: JSX.Element }) {
  const [isInitialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    if (window.google) {
      initializeGoogleAuth();
      setInitialized(true);
    } else {
      window.onload = () => {
        initializeGoogleAuth();
        setInitialized(true);
      };
    }
  }, []);

  if (!isInitialized) {
    return null;
  }

  return children;
}

function SignInButton() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    renderButton(ref.current as HTMLElement);
  }, []);

  return <div ref={ref} />;
}

export default function SignInWithGoogleButton() {
  return (
    <GoogleAuth>
      <SignInButton />
    </GoogleAuth>
  );
}
