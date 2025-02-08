import { Story, User } from '@nokkio/magic';

// Using Nokkio's scheduling feature, create a new public story every day
// at 21:00 UTC.
export default async function () {
  const [user] = await User.find({ filter: { email: 'brad.daily@gmail.com' } });

  if (!user) {
    return;
  }

  const recent = await Story.find({
    filter: {
      isDailyStory: true,
      isPublic: true,
    },
    sort: '-createdAt',
    limit: 5,
  });

  const history = recent.map((r) => r.text).join('\n');

  await user.createStory({
    prompt: `write a unique bedtime story. Here are the last 5 stories you created, the new story should not use the same characters, themes, or storylines: ${history}`,
    isPublic: true,
    isDailyStory: true,
  });
}
