export interface Game {
  slug: string;
  title: string;
  tagline: string;
  blurb: string;
  tag: "zen" | "arcade" | "puzzle";
  /** Short "how to play" line shown above the stage. */
  instructions: string;
}

export const games: Game[] = [
  {
    slug: "koi-pond",
    title: "Koi Pond",
    tagline: "Seven fish, endlessly hungry.",
    blurb: "Toss snacks into the water and watch the koi race each other for them.",
    tag: "zen",
    instructions: "Tap anywhere in the water to toss in a snack.",
  },
  {
    slug: "sand",
    title: "Sand",
    tagline: "A falling-sand box with nothing to win.",
    blurb: "Pour sand, flood it with water, wall it off, then grow something in it.",
    tag: "zen",
    instructions: "Pick a material, then drag inside the box to pour it into open space.",
  },
  {
    slug: "bloom",
    title: "Bloom",
    tagline: "Plant a seed, look away, come back to a garden.",
    blurb: "Every click grows a branching vine that opens into flowers wherever it runs out of room.",
    tag: "zen",
    instructions: "Click anywhere to plant a seed. The vines grow on their own.",
  },
  {
    slug: "trail",
    title: "Trail",
    tagline: "Draw with light. It doesn't stick around.",
    blurb: "Your line cycles through the rainbow as you drag, then quietly fades away a few seconds later.",
    tag: "zen",
    instructions: "Click and drag to draw. Everything fades on its own after a few seconds.",
  },
  {
    slug: "ripple",
    title: "Ripple",
    tagline: "An instrument disguised as a puddle.",
    blurb: "Touch the water for a ring and a note. It's a pentatonic scale, so there are no wrong ones.",
    tag: "zen",
    instructions: "Click the water to drop a note. Higher in the pond means a higher pitch.",
  },
];

export const gameBySlug = (slug: string): Game => {
  const game = games.find((entry) => entry.slug === slug);
  if (!game) throw new Error(`Unknown game: ${slug}`);
  return game;
};
