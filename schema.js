/** @type {import('@nokkio/schema').Config} */
module.exports = function ({ defineModel, types }) {
  const User = defineModel('User', {
    sub: types.string().unique(),
    email: types.string().filterable(),
    name: types.string(),
    picture: types.string(),
    isAdmin: types.bool(false),
    isBanned: types.bool(false),
  });

  const Story = defineModel('Story', {
    prompt: types.string(),
    state: types
      .string('created')
      .oneOf([
        'created',
        'generating_story',
        'generating_media',
        'ready',
        'failed',
      ])
      .filterable(),
    imagePrompt: types.text(null),
    title: types.string(null),
    summary: types.text(null),
    text: types.text(null),
    duration: types.number(null),
    image: types.image(null),
    audio: types.text(null),
    attempt: types.number(1),
    completedAt: types.datetime(null),
    isPublic: types.bool(false),
    isDailyStory: types.bool(false),
  });

  // Enforce model event ordering only at the record
  // level to reduce latency / contention.
  Story.orderEventsByRecord();

  Story.belongsTo(Story, { optional: true, name: 'parentStory' });
  User.hasMany(Story);
  User.actAsAuth({ type: 'custom' });

  return { Story, User };
};
