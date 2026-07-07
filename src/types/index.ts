export interface SongType {
  id: string;
  title: string;
  artistId: string;
  albumId: string | null;
  genreId: string | null;
  duration: number;
  audioUrl: string;
  coverImage: string | null;
  previewVideoUrl: string | null;
  playCount: number;
  isPublished: boolean;
  isExplicit?: boolean;
  createdAt: Date;
  artist?: ArtistType;
  album?: AlbumType;
  genre?: GenreType;
}

export interface ArtistType {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  profileImage: string | null;
  bannerImage: string | null;
  verified: boolean;
  monthlyListeners: number;
  createdAt: Date;
  songs?: SongType[];
  albums?: AlbumType[];
}

export interface AlbumType {
  id: string;
  artistId: string;
  title: string;
  coverImage: string | null;
  releaseDate: Date;
  albumType: "SINGLE" | "EP" | "ALBUM";
  createdAt: Date;
  artist?: ArtistType;
  songs?: SongType[];
}

export interface PlaylistType {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
  isCollaborative: boolean;
  showOnProfile?: boolean;
  isBuiltIn?: boolean;
  createdAt: Date;
  updatedAt: Date;
  songs?: PlaylistSongType[];
}

export interface PlaylistSongType {
  id: string;
  playlistId: string;
  songId: string;
  position: number;
  addedAt: Date;
  song?: SongType;
}

export interface GenreType {
  id: string;
  name: string;
  slug: string;
  color: string;
  imageUrl: string | null;
}

export interface UserType {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: "USER" | "ARTIST" | "ADMIN";
}
