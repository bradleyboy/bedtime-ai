import { User } from '@nokkio/magic';

// Using Nokkio's scheduling feature, create a new public story every day
// at 21:00 UTC.
export default async function () {
  const [user] = await User.find({ filter: { email: 'brad.daily@gmail.com' } });

  if (!user) {
    return;
  }

  await user.createStory({
    prompt: 'tell me a bedtime story',
    isPublic: true,
  });
}
