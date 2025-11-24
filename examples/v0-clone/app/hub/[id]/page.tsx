import { notFound } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { Toolbar } from "@/components/shared/toolbar";
import { VideoPreviewClient } from "@/components/hub/video-preview-client";
import { getHubVideoById } from "@/lib/db/hub-queries";
import { AppFooter } from "@/components/shared/app-footer";

export default async function VideoPreviewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const video = await getHubVideoById({ videoId: id });

  if (!video) {
    notFound();
  }

  return (
    <>
      <Toolbar />
      <VideoPreviewClient video={video} userId={session?.user?.id} />
      <AppFooter />
    </>
  );
}
