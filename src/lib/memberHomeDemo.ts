/**
 * Sample member Home feed aligned to the Prizelet Home mock
 * (social posts with picks tables / text / video).
 */

const hour = 3_600_000;

export type MemberHomeDemoPickRow = {
  sport: string;
  event: string;
  pick: string;
  odds: string;
  units: string;
};

export type MemberHomeDemoPost = {
  id: string;
  createdAtMs: number;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    verified: boolean;
    /** Optional initials override when avatar is missing */
    initials?: string;
  };
  title: string;
  body: string;
  footerNote?: string;
  picks?: MemberHomeDemoPickRow[];
  video?: {
    thumbnailUrl: string;
    duration: string;
  };
  likes: number;
  comments: number;
};

/** @deprecated Prefer MemberHomeDemoPost — kept for call-site alias clarity */
export type MemberHomeDemoPick = MemberHomeDemoPost;

export const MEMBER_HOME_DEMO_PICKS: MemberHomeDemoPost[] = [
  {
    id: 'demo-member-pick-1',
    createdAtMs: Date.now() - 2 * hour,
    creator: {
      id: 'demo-creator-alex',
      username: 'alexpicks',
      displayName: 'AlexPicks',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face',
      verified: true,
    },
    title: 'NBA Picks Tonight 🔥',
    body: "Here are my top 3 picks for tonight's games. Let's make it a green night! 💚",
    footerNote: "Good luck everyone! Let's cash! 🚀",
    picks: [
      {
        sport: 'NBA',
        event: 'Lakers vs Warriors',
        pick: 'Lakers ML',
        odds: '-120',
        units: '1u',
      },
      {
        sport: 'NBA',
        event: 'Celtics vs Heat',
        pick: 'Celtics -5.5',
        odds: '-110',
        units: '1u',
      },
      {
        sport: 'NBA',
        event: 'Nuggets vs Suns',
        pick: 'Over 224.5',
        odds: '-115',
        units: '1u',
      },
    ],
    likes: 124,
    comments: 34,
  },
  {
    id: 'demo-member-pick-2',
    createdAtMs: Date.now() - 4 * hour,
    creator: {
      id: 'demo-creator-shark',
      username: 'sharkpicks',
      displayName: 'Shark Picks',
      avatarUrl: null,
      initials: 'SP',
      verified: true,
    },
    title: 'Market Update',
    body: "Quick update on current trends. I'm seeing value on a few unders this weekend. Full breakdown coming later today.",
    likes: 86,
    comments: 12,
  },
  {
    id: 'demo-member-pick-3',
    createdAtMs: Date.now() - 6 * hour,
    creator: {
      id: 'demo-creator-profit',
      username: 'theprofitclub',
      displayName: 'The Profit Club',
      avatarUrl: null,
      initials: '👑',
      verified: true,
    },
    title: 'UFC 306 Breakdown',
    body: "Full analysis and betting angles for this weekend's main card. Covering key matchups, value bets and my final predictions.",
    video: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200&h=675&fit=crop',
      duration: '12:34',
    },
    likes: 102,
    comments: 28,
  },
];

export function shouldUseMemberHomeDemo(opts: {
  feedCount: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (opts.disableDemo) return false;
  if (opts.forceDemo) return true;
  return opts.feedCount === 0;
}

export function isMemberHomeDemoId(id: string): boolean {
  return id.startsWith('demo-member-pick-');
}
