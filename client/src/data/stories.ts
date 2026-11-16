export interface StoryItem {
  id: string;
  title: string;
  genre: 'Moral story' | 'Daily life' | 'Travel' | 'Business' | 'Motivation' | 'Mystery';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  paragraphs: string[];
}

export const STORIES_DATABASE: StoryItem[] = [
  // ==========================================
  // 1. MORAL STORIES
  // ==========================================
  {
    id: 'story-1',
    title: 'The Wise Old Oak',
    genre: 'Moral story',
    level: 'Beginner',
    description: 'A gentle tale about patience and standing strong through storms.',
    paragraphs: [
      'In the center of a quiet village stood an ancient oak tree. Its broad branches offered shade to tired travelers during hot summer afternoons, and birds built safe nests among its leaves.',
      'A young sapling growing nearby complained about the fierce autumn winds. It wondered how the old oak remained calm while its own slender branches bent and trembled in fear.',
      'The wise oak smiled gently and spoke to the sapling. It explained that deep roots grow only when a tree endures strong storms rather than gentle breezes.',
      'When winter finally arrived with heavy snow, the sapling stood taller and braver. It learned that true strength is discovered through quiet patience and resilience.',
    ],
  },
  {
    id: 'story-2',
    title: 'The Cracked Clay Pot',
    genre: 'Moral story',
    level: 'Beginner',
    description: 'Every perceived flaw can bring unexpected beauty to the world.',
    paragraphs: [
      'An elderly water bearer carried two large clay pots on a wooden pole across his shoulders. One pot was perfect, but the other had a small hairline crack along its side.',
      'Every morning, the cracked pot leaked half its water along the dusty trail back from the river. It felt ashamed of its defect and apologized to the kind old man.',
      'The old man smiled and pointed toward the side of the footpath. Beautiful wild daisies and sweet herbs were blooming brightly only along the cracked pot side of the path.',
      'The bearer explained that he had planted seeds there knowing the crack would water them daily. What seemed like a weakness had created wonderful beauty for everyone.',
    ],
  },
  {
    id: 'story-3',
    title: 'The Echo in the Valley',
    genre: 'Moral story',
    level: 'Intermediate',
    description: 'What you send out into the world always returns to you.',
    paragraphs: [
      'A curious boy walked through a mountain trail with his father on a sunny Saturday. Suddenly, the boy tripped on a loose rock and shouted in pain and frustration.',
      'To his utter surprise, a voice echoed from the distant canyon repeating his cry. Angry and confused, the boy shouted demanding to know who was hiding out there.',
      'The canyon bounced the exact angry words right back at him with equal force. Terrified, the young boy turned to his father asking why someone was mocking him.',
      'The father laughed softly and shouted praise into the valley calling it wonderful. The voice echoed kindness back, teaching the boy that life reflects what we project.',
    ],
  },
  {
    id: 'story-4',
    title: 'The Two Woodcutters',
    genre: 'Moral story',
    level: 'Intermediate',
    description: 'Working smart is just as important as working hard.',
    paragraphs: [
      'Two woodcutters entered the forest for a friendly daily competition. The younger man worked relentlessly without taking a single breath, swinging his axe continuously for eight long hours.',
      'The older man took frequent fifteen-minute breaks every hour, sitting quietly on a stump. The young worker chuckled, convinced that continuous labor would easily secure his victory.',
      'At sunset, both men measured their timber piles beside the forest creek. To the young man surprise, the elder pile was nearly twice the size of his own.',
      'Bewildered, the young worker asked how this was possible with so many rest periods. The elder smiled and explained that during each rest, he sharpened his axe.',
    ],
  },

  // ==========================================
  // 2. DAILY LIFE
  // ==========================================
  {
    id: 'story-5',
    title: 'The Corner Bakery',
    genre: 'Daily life',
    level: 'Beginner',
    description: 'The morning aroma of sourdough and warm neighborhood greetings.',
    paragraphs: [
      'Every morning at dawn, Mrs. Clara opened the shutters of her little neighborhood bakery. The sweet scent of vanilla and golden crusts drifted down the cobblestone sidewalk.',
      'Neighbors on their way to the subway stopped by for fresh croissants and warm conversation. Clara greeted each customer by name and remembered how they liked their morning coffee.',
      'One chilly morning, a young student arrived looking nervous before a big university exam. Clara slipped an extra warm cinnamon pastry into his bag with an encouraging smile.',
      'The simple act of human warmth brought a grateful smile to the young man face. It was not just bread she baked, but community comfort every single morning.',
    ],
  },
  {
    id: 'story-6',
    title: 'Sunday in the Garden',
    genre: 'Daily life',
    level: 'Beginner',
    description: 'Planting tomatoes and finding peace away from smartphone screens.',
    paragraphs: [
      'David decided to spend his Sunday morning offline in the small backyard garden. He turned off his phone notifications, put on gardening gloves, and fetched a spade.',
      'The rich black soil smelled damp and earthy after the light overnight rain. He carefully dug four neat rows to plant heirloom tomato seedlings and fragrant sweet basil.',
      'A robin landed softly on the wooden fence post, chirping a cheerful morning tune. The rhythmic task of watering and weeding cleared the lingering week of digital noise.',
      'By noon, the garden beds were immaculate and ready for summer sunlight. David realized that working with his hands gave his restless mind the deepest relaxation.',
    ],
  },
  {
    id: 'story-7',
    title: 'The Neighborhood Book Box',
    genre: 'Daily life',
    level: 'Intermediate',
    description: 'A small wooden box that connected neighbors through shared stories.',
    paragraphs: [
      'Sarah noticed a miniature wooden house mounted on a cedar post near the park. A painted sign read Take a Book, Leave a Book in cheerful blue letters.',
      'She decided to donate a mystery novel that had kept her reading late into the night. Two days later, she returned to find a rare cookbook tucked inside.',
      'Inside the cookbook was a handwritten note sharing a secret recipe for almond cookies. Sarah baked the cookies that evening, delighted by the anonymous culinary connection.',
      'The little library box became a daily gathering spot for book lovers of all ages. Small everyday gestures created genuine friendships across the busy suburban block.',
    ],
  },

  // ==========================================
  // 3. TRAVEL
  // ==========================================
  {
    id: 'story-8',
    title: 'The Night Train to Kyoto',
    genre: 'Travel',
    level: 'Beginner',
    description: 'Sliding through moonlit mountain valleys on the Japanese railway.',
    paragraphs: [
      'Elena stepped onto the platform as the midnight express arrived right on time. The train was spotless and quiet, glowing warmly against the cool evening air.',
      'She found her window seat and watched the bright neon lights of Tokyo fade into dark mountain valleys. Soft rain tapped against the glass as the engine hummed smoothly.',
      'At dawn, the mist lifted over terraced green hills and wooden temple roofs. A friendly conductor bowed respectfully and handed her a cup of hot green tea.',
      'Arriving in Kyoto felt like stepping directly into a living history book. Travel reminded her that the quiet journey is often as memorable as the destination.',
    ],
  },
  {
    id: 'story-9',
    title: 'Lost in the Spice Market',
    genre: 'Travel',
    level: 'Intermediate',
    description: 'Discovering Istanbul through vibrant colors and hospitality.',
    paragraphs: [
      'Julian wandered into the maze of the ancient Grand Bazaar in Istanbul. The air was thick with the rich fragrance of crushed saffron, cinnamon sticks, and roasted pistachios.',
      'Without a working map, he turned down a narrow alley lined with handmade ceramic tiles. A friendly merchant noticed his curious expression and invited him to sit for apple tea.',
      'They conversed using simple gestures and a translation app on his phone. The shopkeeper shared stories about his family spice trading legacy spanning over four generations.',
      'Julian left with a small brass lantern and a heart warmed by unexpected generosity. Getting lost had led to the most authentic experience of his entire journey.',
    ],
  },
  {
    id: 'story-10',
    title: 'The Northern Lights of Tromso',
    genre: 'Travel',
    level: 'Advanced',
    description: 'Braving Arctic cold to witness the emerald dance in the night sky.',
    paragraphs: [
      'Perched on the icy shoreline of northern Norway, Marcus waited in sub-zero stillness. The Arctic wind whispered through snow-laden pine trees as the thermometer plunged rapidly.',
      'Suddenly, an ethereal ribbon of emerald luminescence ignited across the polar zenith. The celestial curtain undulated gracefully, shifting from pale celadon to vibrant magenta hues.',
      'The reflection mirrored flawlessly upon the glassy fjord below, creating an awe-inspiring illusion. All shivering ceased as the primeval spectacle commanded profound, breathtaking silence.',
      'Witnessing the aurora borealis instilled an indelible appreciation for terrestrial wonder. Nature magnificent choreography reminded him how sublime our universe truly is.',
    ],
  },

  // ==========================================
  // 4. BUSINESS
  // ==========================================
  {
    id: 'story-11',
    title: 'The First Pitch',
    genre: 'Business',
    level: 'Beginner',
    description: 'An entrepreneur presents her clean energy solution to investors.',
    paragraphs: [
      'Maya adjusted her blazer as she stepped into the glass-walled boardroom. Three senior venture capitalists looked up from their tablets, ready to hear her pitch.',
      'She took a steady breath and launched straight into the customer problem. Her startup had developed a smart battery that cut household energy costs by forty percent.',
      'The investors asked probing questions about manufacturing margins and unit economics. Maya answered calmly with clear data points, demonstrating deep operational expertise.',
      'By the end of the presentation, the lead investor extended a handshake and an invitation for term sheet negotiations. Thorough preparation had turned anxiety into opportunity.',
    ],
  },
  {
    id: 'story-12',
    title: 'The Pivot to Cloud',
    genre: 'Business',
    level: 'Intermediate',
    description: 'How a software enterprise transformed its legacy business model.',
    paragraphs: [
      'The quarterly executive review showed declining license revenue for on-premise software. Customers were demanding flexible monthly subscriptions and instant cloud scalability instead.',
      'The leadership team faced a critical crossroad: defend legacy revenue or cannibalize it. The CEO rallied engineering and product divisions to execute an aggressive twelve-month transition.',
      'Migrating multi-tenant databases and retraining sales teams required relentless coordination. Initial quarters were turbulent as short-term margins took a temporary hit.',
      'Two years later, recurring annual revenue tripled and client churn plummeted to historic lows. Decisive transformation had saved the enterprise from market obsolescence.',
    ],
  },
  {
    id: 'story-13',
    title: 'Ethical Supply Chains',
    genre: 'Business',
    level: 'Advanced',
    description: 'Prioritizing fair wages and sustainable sourcing over cheap margins.',
    paragraphs: [
      'When audits revealed environmental infractions among offshore textile subcontractors, the executive committee convened. Shareholders voiced anxiety regarding potential margin compression if contracts were abruptly terminated.',
      'The newly appointed chief sustainability officer advocated for uncompromising corporate integrity. She proposed restructuring the entire supply chain with rigorous traceability benchmarks.',
      'The company invested directly in audited cooperatives, guaranteeing living wages and renewable energy. Transparent disclosures resonated profoundly with an increasingly conscientious consumer demographic.',
      'Brand equity surged alongside customer loyalty, culminating in record-setting fiscal returns. Integrity proved not to be an expenditure, but the ultimate strategic differentiator.',
    ],
  },

  // ==========================================
  // 5. MOTIVATION
  // ==========================================
  {
    id: 'story-14',
    title: 'The Marathon Runner',
    genre: 'Motivation',
    level: 'Beginner',
    description: 'Finding the courage to cross the finish line when legs feel heavy.',
    paragraphs: [
      'Liam reached mile twenty of his very first city marathon. His leg muscles burned with exhaustion, and his inner voice whispered to stop and sit down.',
      'He remembered the countless cold winter mornings spent training while the city slept. He thought of his sister who made him a handmade banner for encouragement.',
      'A spectator on the sidewalk handed him a cup of water with a loud cheer. Liam took a sip, focused on the asphalt ahead, and kept putting one foot forward.',
      'Crossing the finish line brought tears of genuine pride to his eyes. He realized that physical limits are often mental boundaries waiting to be conquered.',
    ],
  },
  {
    id: 'story-15',
    title: 'The Coding Bootcamp',
    genre: 'Motivation',
    level: 'Intermediate',
    description: 'A former retail manager learns to build fullstack web applications.',
    paragraphs: [
      'After working ten years in retail management, Carlos made the brave decision to switch careers. He enrolled in an intensive fullstack engineering bootcamp with zero programming background.',
      'The initial weeks were overwhelming with terminal commands, syntax errors, and algorithmic recursion. Many times he stared at a red error console wondering if he made a mistake.',
      'Instead of giving up, he scheduled daily peer study sessions and asked thoughtful questions. Slowly, cryptic code snippets transformed into functional responsive user interfaces.',
      'On graduation day, Carlos successfully demoed a real-time collaborative application to hiring managers. Self-belief and disciplined daily consistency had completely rewritten his future.',
    ],
  },
  {
    id: 'story-16',
    title: 'The Blank Canvas',
    genre: 'Motivation',
    level: 'Intermediate',
    description: 'Overcoming creative paralysis by making the very first brushstroke.',
    paragraphs: [
      'An immaculate white canvas stood upon the easel under the skylight for three weeks. Maya hovered her sable brush above it, paralyzed by the fear of ruining perfection.',
      'Every masterpiece in the gallery had once been an intimidating blank surface. She realized that perfectionism was merely fear disguised as high artistic standards.',
      'Closing her eyes, she dipped the brush into vibrant cobalt blue and made an assertive stroke. The spell of hesitation broke instantly, unleashing raw creative momentum.',
      'By sunset, colors harmonized into an evocative landscape of emotional depth and texture. The most difficult step in any meaningful pursuit is simply beginning.',
    ],
  },
  {
    id: 'story-17',
    title: 'The Relentless Inventor',
    genre: 'Motivation',
    level: 'Advanced',
    description: 'Treating failed prototypes as valuable blueprints for success.',
    paragraphs: [
      'Four hundred consecutive prototype iterations of the micro-filtration membrane had catastrophic structural failures. Skeptics within the academic consortium urged Dr. Chen to abandon the endeavor.',
      'Rather than interpreting anomalies as defeats, she cataloged every failure as an empirical revelation. Each fissure revealed how polymer molecular bonds reacted under hydrostatic compression.',
      'On the four hundred and first attempt, she incorporated an innovative graphene matrix. The membrane filtered saline impurities flawlessly while sustaining unprecedented structural integrity.',
      'Breakthroughs belong not to those who possess immaculate fortune, but to those who refuse surrender. Relentless persistence transforms theoretical impossibility into undeniable reality.',
    ],
  },

  // ==========================================
  // 6. MYSTERY
  // ==========================================
  {
    id: 'story-18',
    title: 'The Clockmaker Secret',
    genre: 'Mystery',
    level: 'Beginner',
    description: 'An antique clock that chimed thirteen times at midnight.',
    paragraphs: [
      'In a quiet corner of London, master clockmaker Thomas inspected a seventeenth-century brass timepiece. Its ornate pendulum swung with steady precision inside a polished mahogany cabinet.',
      'Late one stormy evening, as thunder rolled overhead, the clock struck midnight. Curiously, it did not stop at twelve chimes, but chimed a distinct thirteenth time.',
      'A hidden compartment beneath the Roman numeral dial clicked open with a soft metallic snap. Inside lay a miniature golden key and an address written on parchment.',
      'Thomas realized the heirloom was an ingenious puzzle box designed centuries ago. He grabbed his coat, eager to unlock the history hidden behind the secret door.',
    ],
  },
  {
    id: 'story-19',
    title: 'The Whispering Lighthouse',
    genre: 'Mystery',
    level: 'Intermediate',
    description: 'A mysterious light that guided ships during heavy sea fog.',
    paragraphs: [
      'The decommissioned lighthouse on Gull Island had stood dark for over fifty years. Yet during heavy winter fog, local fishermen swore they saw a warm beam sweeping the bay.',
      'Young lighthouse historian Clara rowed across the channel at dusk to investigate the legend. The heavy iron door was bolted from inside with thick rusted chains.',
      'Climbing the spiral iron staircase, she discovered an intricate system of brass reflectors and prisms. They captured and focused the moonlight from the night sky into a concentrated beam.',
      'The original keeper had engineered an automated celestial lantern requiring no electricity. An ingenious gift of safety continued protecting mariners long after he was gone.',
    ],
  },
  {
    id: 'story-20',
    title: 'The Cipher in the Archive',
    genre: 'Mystery',
    level: 'Advanced',
    description: 'Deciphering a hidden cryptographic marginalia in a Renaissance treatise.',
    paragraphs: [
      'While cataloging rare Renaissance manuscripts in the university subterranean vaults, Victoria discovered an anomalous folio. Between Latin treatises on geometry lay faint geometric sketches annotated with alphanumeric permutations.',
      'The sequence evaded conventional frequency analysis, indicating a polyalphabetic substitution cipher. She noticed tiny pinprick perforations beside specific letters throughout the illuminated borders.',
      'Superimposing an acetate grid revealed an ingenious steganographic message regarding an underground labyrinth beneath Florence. The cipher had preserved architectural secrets for over five hundred years.',
      'Her discovery revolutionized scholarly understanding of Renaissance engineering guilds. True mysteries linger patiently in plain sight, awaiting an inquisitive intellect to decode them.',
    ],
  },
  {
    id: 'story-21',
    title: 'The Midnight Footsteps',
    genre: 'Mystery',
    level: 'Beginner',
    description: 'A gentle mystery solved in an old mountain cabin.',
    paragraphs: [
      'Leo rented a rustic log cabin in the woods for a quiet weekend of reading. On the very first night, soft tapping footsteps echoed across the wooden attic floorboards.',
      'He grabbed a flashlight and climbed the squeaky wooden ladder into the dark attic. Dust motes danced in the yellow beam, but the room was completely empty.',
      'Near the chimney, he noticed a bowl of dried pine cones had been neatly arranged in a row. A tiny chipmunk peeked from behind a cedar beam with sparkling eyes.',
      'Leo chuckled, relieved that the phantom intruder was just an industrious woodland neighbor. He left a handful of sunflower seeds before heading downstairs to sleep.',
    ],
  },
];
