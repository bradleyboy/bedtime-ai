import { usePageData, Link } from '@nokkio/router';
import type { PageMetadataFunction, PageDataArgs } from '@nokkio/router';
import { Story, User } from '@nokkio/magic';

export async function getPageData({ auth }: PageDataArgs) {
  if (auth === null || !auth.isAdmin) {
    return null;
  }

  return Story.find({
    sort: '-createdAt',
    with: ['user'],
  });
}

export const getPageMetadata: PageMetadataFunction<typeof getPageData> = ({
  pageData,
}) => {
  if (pageData === null) {
    return { http: { status: 404 } };
  }

  return { title: "Tonight's Bedtime Story: Admin" };
};

function createDeleteHandler(story: Story) {
  return () => {
    if (confirm(`Are you sure you want to delete ${story.title}?`)) {
      story.delete();
    }
  };
}

function createBanHandler(user: User) {
  return () => {
    if (confirm(`Are you sure you want to ban ${user.email}?`)) {
      user.update({ isBanned: true });
    }
  };
}

function createUnbanHandler(user: User) {
  return () => {
    if (confirm(`Are you sure you want to unban ${user.email}?`)) {
      user.update({ isBanned: false });
    }
  };
}

export default function AdminPage() {
  const pageData = usePageData<typeof getPageData>();

  if (pageData === null) {
    return null;
  }

  return (
    <table className="table-auto border-collapse border border-slate-500">
      <thead>
        <tr>
          <th className="border border-gray-400 p-4">User</th>
          <th className="border border-gray-400 p-4">Prompt</th>
          <th className="border border-gray-400 p-4">Actions</th>
        </tr>
      </thead>
      <tbody>
        {pageData.map((story) => (
          <tr key={story.id} className="even:bg-gray-700">
            <td className="border border-gray-700 p-4">{story.user.email}</td>
            <td className="border border-gray-700 p-4">{story.prompt}</td>
            <td className="space-x-2 border border-gray-700 p-4">
              <Link to={`/stories/${story.id}`} target="_blank">
                View
              </Link>
              <button onClick={createDeleteHandler(story)}>Delete</button>
              {story.user.isBanned ? (
                <button onClick={createUnbanHandler(story.user)}>
                  Unban user
                </button>
              ) : (
                <button onClick={createBanHandler(story.user)}>Ban user</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
