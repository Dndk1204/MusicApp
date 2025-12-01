import React from "react";
import PlaylistDetailClient from "./PlaylistDetailClient";

export default function PlaylistDetailPage({ params }) {
  const { id } = React.use(params);

  return <PlaylistDetailClient playlistId={id} />;
}
