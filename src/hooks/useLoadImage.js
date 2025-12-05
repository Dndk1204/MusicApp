"use client";

import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";

// Fallback placeholder image
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23404040' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%23888' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

export const useLoadImage = (song) => {
  const supabaseClient = useSupabaseClient();
  const [imageUrl, setImageUrl] = useState(FALLBACK_IMAGE);

  useEffect(() => {
    if (!song) {
      setImageUrl(FALLBACK_IMAGE);
      return;
    }

    // Determine which field contains the image reference
    const imageField = song.image_path || song.image_url;

    // Debug logging for community songs
    if (song.user_id) {
      console.log('Loading community song image:', {
        title: song.title,
        image_path: song.image_path,
        image_url: song.image_url,
        user_id: song.user_id,
      });
    }

    // Check if image field is a full URL
    if (imageField && imageField.startsWith('http')) {
      console.log('Full URL found:', imageField);
      setImageUrl(imageField);
      return;
    }

    // Get public URL from Supabase storage
    if (imageField) {
      try {
        const { data } = supabaseClient.storage
          .from("images")
          .getPublicUrl(imageField);

        console.log('Supabase image URL:', data?.publicUrl);
        setImageUrl(data?.publicUrl || FALLBACK_IMAGE);
      } catch (err) {
        console.warn('Failed to load image:', imageField, err);
        setImageUrl(FALLBACK_IMAGE);
      }
    } else {
      console.log('No image field found, using fallback');
      setImageUrl(FALLBACK_IMAGE);
    }
  }, [song, supabaseClient]);

  return imageUrl;
};

export default useLoadImage;
