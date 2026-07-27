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
    tagline: "Hold on long enough and it flowers.",
    blurb: "Press and hold to grow a branching vine. Let go too soon and you get a bare stem.",
    tag: "zen",
    instructions: "Press and hold anywhere to grow a plant. Press a paused tip to continue it.",
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
  {
    slug: "memory",
    title: "Memory",
    tagline: "Two of everything, hidden.",
    blurb: "Flip cards two at a time and remember where things were. Three board sizes, best score kept locally.",
    tag: "puzzle",
    instructions: "Flip two cards. Matching pairs stay face up; everything else flips back.",
  },
  {
    slug: "jigsaw",
    title: "Jigsaw",
    tagline: "It's a picture of my dog.",
    blurb: "Drag the pieces back into the frame. Twelve pieces if you're in a hurry, forty if you're not.",
    tag: "puzzle",
    instructions: "Drag a piece into the frame. Get it close to its spot and it snaps in.",
  },
  {
    slug: "queens",
    title: "Queens",
    tagline: "One crown per row, column, and color.",
    blurb: "A logic puzzle with a fresh board every time, generated and checked for a single solution in your browser.",
    tag: "puzzle",
    instructions: "Tap once to cross a square out, twice to place a crown. Drag to cross out a run. Crowns can't touch, even diagonally.",
  },
];

export const gameBySlug = (slug: string): Game => {
  const game = games.find((entry) => entry.slug === slug);
  if (!game) throw new Error(`Unknown game: ${slug}`);
  return game;
};
