import { NokkioRequest, ok } from '@nokkio/endpoints';
import { User } from '@nokkio/magic';
import { login } from '@nokkio/auth';

import {
  jwtVerify,
  createRemoteJWKSet,
} from 'https://deno.land/x/jose@v4.5.0/index.ts';

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
);

const CLIENT_ID =
  '752773946224-6at0hiisl0754fb7ar02crint6rrsj2p.apps.googleusercontent.com';

export async function post(req: NokkioRequest) {
  const fd = await req.formData();
  const credential = fd.get('credential');
  const nonce = fd.get('nonce');

  if (credential === null || typeof credential !== 'string') {
    return new Response('Invalid request', { status: 400 });
  }

  try {
    const result = await jwtVerify(credential, JWKS, {
      issuer: 'https://accounts.google.com',
      audience: CLIENT_ID,
    });

    const payload = result.payload as {
      aud: string;
      iss: string;
      sub: string;
      email: string;
      picture: string;
      name: string;
      exp: number;
      nonce: string;
    };

    if (payload.nonce !== nonce) {
      return new Response('Validation Error: nonce does not match', {
        status: 400,
      });
    }

    if (payload.aud !== CLIENT_ID) {
      return new Response('Validation Error: iad does not match client ID', {
        status: 400,
      });
    }

    if (!/^(https:\/\/)?accounts.google.com$/.test(payload.iss)) {
      return new Response('Validation Error: invalid iss', {
        status: 400,
      });
    }

    if (new Date() > new Date(payload.exp * 1000)) {
      return new Response('Validation Error: expired', {
        status: 400,
      });
    }

    const { sub, email, name, picture } = payload;

    let [user] = await User.find({ filter: { sub } });

    if (user) {
      await user.update({ email, name, picture });
    } else {
      user = await User.create({
        sub,
        email,
        name,
        picture,
      });
    }

    login(user);

    return ok();
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }
}
