export type MessageSharePayload = | {
    type: "playlist";
    playlistId: string;
    title: string;
    coverImage: string | null;
  }
| {
    type: "song_now";
    songId: string;
    title: string;
    coverImage: string | null;
    artistName: string | null;
  }
| {
    type: "song";
    songId: string;
    title: string;
    coverImage: string | null;
    artistName: string | null;
  };
