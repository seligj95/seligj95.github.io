/**
 * The words Contexto can pick as the answer.
 *
 * These are chosen by hand rather than taken off the top of the frequency list.
 * The vocabulary comes from GloVe, which is trained on news, so its commonest
 * words are things like "policy", "coalition" and "quarterly" - accurate
 * English, miserable puzzles. A good secret is concrete, familiar, and has
 * obvious neighbours to close in on.
 *
 * Every word here is checked against the shipped vocabulary by a test, so a
 * typo or a word the vectors do not know fails the build rather than the game.
 */
export const secrets = [
  // Around the house
  "kitchen", "bedroom", "window", "door", "garden", "roof", "stairs", "attic",
  "basement", "garage", "porch", "fence", "chimney", "curtain", "carpet",
  "mirror", "lamp", "candle", "pillow", "blanket", "mattress", "drawer",
  "shelf", "closet", "sofa", "chair", "table", "desk", "clock",
  "towel", "soap", "broom", "bucket", "sponge", "laundry", "kettle", "oven",
  "fridge", "freezer", "toaster", "blender", "sink", "faucet", "bathtub",
  "shower", "toilet", "napkin", "plate", "bowl", "spoon", "fork", "knife",
  "cup", "mug", "glass", "bottle", "jar", "basket", "box", "bag", "key",
  "lock", "mailbox", "garbage", "vacuum", "hanger", "ladder",

  // Food and drink
  "bread", "butter", "cheese", "egg", "bacon", "sausage", "pancake", "waffle",
  "cereal", "toast", "sandwich", "salad", "soup", "pasta", "spaghetti",
  "pizza", "burger", "taco", "rice", "noodle", "potato", "tomato", "onion",
  "garlic", "carrot", "celery", "broccoli", "spinach", "lettuce", "cucumber",
  "pepper", "mushroom", "pumpkin", "corn", "bean", "pea", "apple", "banana",
  "orange", "lemon", "lime", "grape", "cherry", "peach", "plum", "pear",
  "strawberry", "blueberry", "raspberry", "watermelon", "pineapple", "mango",
  "coconut", "avocado", "peanut", "almond", "walnut", "raisin", "honey",
  "syrup", "sugar", "salt", "cinnamon", "vanilla", "chocolate", "candy",
  "cookie", "cake", "cupcake", "pie", "muffin", "donut", "popcorn", "pretzel",
  "yogurt", "cream", "milk", "coffee", "tea", "juice", "soda", "water",
  "wine", "beer", "breakfast", "lunch", "dinner", "dessert", "recipe",

  // Animals
  "dog", "cat", "puppy", "kitten", "horse", "cow", "pig", "sheep", "goat",
  "chicken", "duck", "goose", "turkey", "rabbit", "mouse", "rat", "hamster",
  "squirrel", "raccoon", "beaver", "otter", "badger", "hedgehog", "fox",
  "wolf", "bear", "deer", "moose", "lion", "tiger", "leopard", "cheetah",
  "elephant", "giraffe", "zebra", "monkey", "gorilla",
  "kangaroo", "panda", "camel", "bat", "owl", "eagle",
  "hawk", "parrot", "penguin", "flamingo", "ostrich", "peacock", "sparrow",
  "seagull", "pigeon", "crow", "robin", "swan", "frog", "toad", "lizard",
  "snake", "turtle", "crocodile", "shark", "whale", "dolphin", "octopus",
  "jellyfish", "lobster", "crab", "snail", "spider", "ant", "bee", "wasp",
  "butterfly", "moth", "beetle", "dragonfly", "grasshopper", "worm",

  // The natural world
  "mountain", "valley", "hill", "cliff", "cave", "desert", "forest", "jungle",
  "meadow", "swamp", "beach", "island", "ocean", "sea", "lake", "river",
  "stream", "waterfall", "pond", "puddle", "volcano", "earthquake", "glacier",
  "canyon", "prairie", "tree", "oak", "pine", "maple", "branch", "leaf",
  "root", "trunk", "bark", "flower", "rose", "tulip", "daisy", "sunflower",
  "lavender", "orchid", "grass", "moss", "fern", "cactus", "vine", "seed",
  "acorn", "rock", "pebble", "sand", "mud", "soil", "dust", "smoke", "fire",
  "flame", "ash", "ice", "snow", "snowflake", "rain", "storm", "thunder",
  "lightning", "wind", "cloud", "fog", "rainbow", "sunshine", "sunset",
  "sunrise", "moon", "star", "planet", "comet", "galaxy", "sky",

  // People and the body
  "head", "hair", "face", "eye", "nose", "mouth", "tooth", "tongue", "ear",
  "neck", "shoulder", "arm", "elbow", "hand", "finger", "thumb", "chest",
  "stomach", "back", "leg", "knee", "ankle", "foot", "toe", "heart", "brain",
  "bone", "skin", "blood", "muscle", "baby", "child", "teenager", "adult",
  "mother", "father", "sister", "brother", "grandmother", "grandfather",
  "cousin", "aunt", "uncle", "neighbor", "friend", "stranger", "doctor",
  "nurse", "student", "chef", "baker", "artist",
  "musician", "dancer", "writer", "actor", "pilot", "sailor", "soldier",
  "police", "firefighter", "plumber", "carpenter", "mechanic", "lawyer",

  // Clothing
  "shirt", "pants", "jeans", "dress", "skirt", "sweater", "jacket", "coat",
  "raincoat", "scarf", "glove", "hat", "cap", "helmet", "sock", "shoe",
  "boot", "sandal", "slipper", "sneaker", "belt", "tie", "button", "zipper",
  "pocket", "collar", "sleeve", "uniform", "costume", "pajamas", "swimsuit",
  "backpack", "purse", "wallet", "umbrella", "sunglasses", "watch", "ring",
  "necklace", "bracelet",

  // Getting around
  "car", "truck", "bus", "train", "subway", "bicycle", "motorcycle", "scooter",
  "skateboard", "boat", "ship", "canoe", "kayak", "ferry", "airplane",
  "helicopter", "rocket", "balloon", "tractor", "ambulance", "taxi", "wagon",
  "sled", "wheel", "engine", "tire", "brake", "road", "highway", "bridge",
  "tunnel", "airport", "station", "harbor", "traffic", "parking", "sidewalk",
  "map", "compass", "anchor", "sail", "paddle",

  // Tools and stuff that does a job
  "hammer", "nail", "screw", "wrench", "drill", "saw", "axe",
  "shovel", "rake", "hoe", "scissors", "needle", "thread", "rope", "chain",
  "wire", "tape", "glue", "battery", "flashlight", "magnet", "telescope",
  "microscope", "camera", "computer", "keyboard", "phone", "television",
  "radio", "speaker", "calculator", "robot", "machine", "motor",
  "pump", "pipe", "valve", "gear", "lever", "switch",

  // School, work and play
  "school", "classroom", "library", "museum", "hospital", "office", "factory",
  "store", "market", "restaurant", "cafe", "bakery", "hotel", "church",
  "castle", "tower", "stadium", "theater", "cinema", "park", "playground",
  "zoo", "farm", "village", "town", "city", "neighborhood", "street",
  "book", "page", "chapter", "story", "poem", "letter", "envelope", "stamp",
  "pencil", "pen", "crayon", "marker", "paper", "notebook", "ruler",
  "paint", "brush", "canvas", "clay", "sculpture", "photograph", "poster",
  "puzzle", "jigsaw", "crossword", "chess", "checkers", "domino", "dice",
  "card", "board", "toy", "doll", "teddy", "kite", "marble", "swing",
  "seesaw", "trampoline", "slide",

  // Music and sport
  "music", "song", "melody", "rhythm", "drum", "guitar", "piano", "violin",
  "trumpet", "flute", "saxophone", "banjo", "harmonica", "orchestra", "choir",
  "concert", "stage", "microphone", "headphones", "dance", "ballet",
  "football", "baseball", "basketball", "soccer", "hockey", "tennis", "golf",
  "cycling", "wrestling", "boxing", "bowling", "hiking", "camping", "picnic",
  "marathon", "trophy", "medal", "referee", "coach", "whistle",

  // Materials and shapes
  "wood", "metal", "iron", "steel", "copper", "silver", "gold", "plastic",
  "rubber", "cotton", "wool", "silk", "leather", "brick",
  "stone", "concrete", "cement", "diamond", "crystal", "circle",
  "square", "triangle", "rectangle", "cube", "sphere", "spiral", "stripe",
  "color", "red", "blue", "green", "yellow", "purple", "pink",
  "brown", "black", "white", "shadow", "reflection",

  // Time and weather
  "morning", "afternoon", "evening", "night", "midnight",
  "weekend", "holiday", "birthday", "anniversary",
  "wedding", "funeral", "parade", "festival", "carnival", "circus",
  "spring", "summer", "autumn", "winter", "season", "calendar",
  "alarm", "minute", "hour", "century", "yesterday", "tomorrow",

  // Odds and ends that make good puzzles
  "dream", "sleep", "nap", "yawn", "laugh", "giggle", "smile",
  "whisper", "shout", "secret", "surprise", "gift", "present",
  "party", "confetti", "candlelight", "fireplace", "campfire",
  "hammock", "lemonade", "treasure", "pirate", "ghost", "witch",
  "dragon", "wizard", "fairy", "unicorn", "monster", "puppet", "cartoon",
] as const;
