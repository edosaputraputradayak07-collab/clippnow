type TikTokUserResponse = {
  data?: {
    user?: {
      open_id?: string;
      display_name?: string;
      avatar_url?: string;
    };
  };
};

export function toSupabaseUserInfo(payload: TikTokUserResponse) {
  const user = payload.data?.user;

  if (!user) {
    throw new Error('TikTok user id missing');
  }

  const sub = user.open_id?.trim();

  if (!sub) {
    throw new Error('TikTok user id missing');
  }

  return {
    sub,
    ...(user.display_name ? { name: user.display_name } : {}),
    ...(user.avatar_url ? { picture: user.avatar_url } : {}),
  };
}
