/** @type {import('@nokkio/schema').Config} */
module.exports = function ({ defineModel, types }) {
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
      ]),
    imagePrompt: types.text(null),
    title: types.string(null),
    text: types.text(null),
    duration: types.number(null),
    image: types.image(null),
    audio: types.text(null),
    attempt: types.number(1),
    completedAt: types.datetime(null),
  });

  return { Story };
};
