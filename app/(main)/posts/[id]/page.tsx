import { redirect } from "next/navigation";

export default function PostRedirectPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/blog?postId=${params.id}`);
}
