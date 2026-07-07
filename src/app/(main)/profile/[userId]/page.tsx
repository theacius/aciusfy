import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { areFriends } from "@/lib/friends";
import { computeProfileIsOnline } from "@/lib/online-presence";
import { ProfileContent } from "./ProfileContent";
import { PROFILE_TITLE_PUBLIC_SELECT } from "@/lib/profile-title-public";

interface PageProps {
  params: Promise<{ userId: string }>;
}

async function resolveUser(slug: string) {
  const user = await db.user.findFirst({
    where: { OR: [{ username: slug }, { id: slug }] },
    select: {
      id: true,
      name: true,
      avatar: true,
      isPrivate: true,
      username: true,
      lastActiveAt: true,
      activeDecoration: {
        select: {
          id: true,
          name: true,
          frameImage: true,
          animationType: true,
          cssConfig: true,
        },
      },
      activeTitle: { select: PROFILE_TITLE_PUBLIC_SELECT },
    },
  });
  return user;
}

async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const block = await db.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });
  return !!block;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { userId: slug } = await params;

  if (!slug) {
    redirect("/profile");
  }

  const user = await resolveUser(slug);
  if (!user) {
    redirect("/profile");
  }

  const userId = user.id;
  const session = await auth();
  const viewerId = session?.user?.id;
  if (viewerId) {
    const profileOwnerBlockedViewer = await isBlocked(userId, viewerId);
    if (profileOwnerBlockedViewer) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-6">
          <p className="text-center text-xl font-medium text-white">Bu profile erişilemiyor</p>
          <p className="mt-2 text-center text-muted">Bu profil sayfasına erişim izniniz bulunmuyor.</p>
          <Link href="/" className="mt-6 rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20">
            Ana sayfaya dön
          </Link>
        </div>
      );
    }
  }
  const isViewerOwner = viewerId === userId;
  const isFriend = viewerId ? await areFriends(userId, viewerId) : false;
  const canSeePrivate = isViewerOwner || isFriend;

  const [followerCountRow, followingCountRow, prefsRow, bioRow] = await Promise.all([
    db.userFollow.count({ where: { followingId: userId } }),
    db.userFollow.count({ where: { followerId: userId } }),
    db.appConfig.findUnique({
      where: { key: `userPrefs:${userId}` },
      select: { value: true },
    }),
    db.appConfig.findUnique({
      where: { key: `userBio:${userId}` },
      select: { value: true },
    }),
  ]);

  const isPrivate = user.isPrivate ?? false;
  const hideCounts = isPrivate && !canSeePrivate;
  let profilePlaylistsVisible = true;
  if (prefsRow?.value) {
    try {
      const prefs = JSON.parse(prefsRow.value) as { profilePlaylistsVisible?: boolean };
      profilePlaylistsVisible = prefs.profilePlaylistsVisible ?? true;
    } catch {}
  }

  const isOnline = computeProfileIsOnline(user.lastActiveAt, prefsRow?.value, viewerId ?? null);

  const profile = {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    bio: bioRow?.value ?? null,
    followerCount: hideCounts ? null : followerCountRow,
    followingCount: hideCounts ? null : followingCountRow,
    isPrivate,
    profilePlaylistsVisible,
    canSeePrivate,
    isOnline,
    decoration: user.activeDecoration ?? null,
    title: user.activeTitle ?? null,
  };

  return <ProfileContent key={userId} userId={userId} initialProfile={profile} />;
}
