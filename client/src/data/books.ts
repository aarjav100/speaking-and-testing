export interface ChapterVocabulary {
  word: string;
  phonetic: string;
  ipa: string;
  definition: string;
  example: string;
}

export interface BookChapter {
  id: string;
  title: string;
  description: string;
  // Mode B: ORIGINAL short paragraphs explaining the book's main ideas (30-50 words, 2-4 sentences each)
  keyIdeaParagraphs: string[];
  vocabulary: ChapterVocabulary[];
}

export interface BookItem {
  id: string;
  title: string;
  author: string;
  description: string;
  theme: string;
  coverGradient: string;
  chapters: BookChapter[];
}

export const BOOKS_DATABASE: BookItem[] = [
  // =================================================================
  // BOOK 1: "How to Be People Smart"
  // Theme: communication, understanding people, listening, body language,
  // and building better relationships.
  // COPYRIGHT COMPLIANT: All paragraphs below are ORIGINAL pedagogical
  // explanations of core interpersonal principles.
  // =================================================================
  {
    id: 'book-people-smart',
    title: 'How to Be People Smart',
    author: 'Les Giblin & Communication Masters',
    description:
      'Master the subtle art of understanding human behavior, active listening, decoding body language, and creating meaningful connections.',
    theme: 'Interpersonal Communication & Social Intelligence',
    coverGradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    chapters: [
      {
        id: 'ps-ch-1',
        title: 'The Art of Active Listening',
        description: 'Why true listening means listening with your eyes, mind, and undivided attention.',
        keyIdeaParagraphs: [
          'Most conversations fail because people do not listen to understand. Instead, they simply wait for their turn to speak. Genuine communication requires putting your internal dialogue on hold and focusing entirely on the speaker.',
          'Active listening involves reflecting the speaker feelings rather than rushing to offer instant advice. When someone feels truly heard, their defensive barriers dissolve. This creates an open environment where mutual trust can flourish naturally.',
          'Small verbal acknowledgments like nodding and repeating key phrases show complete presence. Avoid interrupting even when you disagree with the premise. Allowing the other person to finish completely gives them a sense of respect and validation.',
          'Pay careful attention to the emotions beneath the spoken words. Often, the deepest message is not in the vocabulary, but in the vocal tone and pacing. A people smart person always listens for the underlying message.',
          'Before responding, take a brief breath and pause for two seconds. This deliberate pause demonstrates thoughtful consideration and prevents emotional reactions. It transforms a potential argument into a productive and respectful dialogue.',
        ],
        vocabulary: [
          {
            word: 'Dialogue',
            phonetic: 'DY-uh-log',
            ipa: '/ˈdaɪəlɒɡ/',
            definition: 'A conversation between two or more people where ideas are freely exchanged.',
            example: 'A constructive dialogue helped both teams reach a friendly consensus.',
          },
          {
            word: 'Validation',
            phonetic: 'val-i-DAY-shun',
            ipa: '/ˌvælɪˈdeɪʃən/',
            definition: 'Recognition or affirmation that a person or their feelings are valid and worthwhile.',
            example: 'Giving emotional validation helps de-escalate workplace tension immediately.',
          },
          {
            word: 'Deliberate',
            phonetic: 'dih-LIB-er-ut',
            ipa: '/dɪˈlɪbərət/',
            definition: 'Done consciously and intentionally; carefully thought out.',
            example: 'Her deliberate pause allowed everyone to absorb the crucial message.',
          },
        ],
      },
      {
        id: 'ps-ch-2',
        title: 'Decoding Silent Body Language',
        description: 'How nonverbal signals, posture, and facial expressions speak louder than words.',
        keyIdeaParagraphs: [
          'Human beings communicate the majority of their emotional intentions without uttering a single syllable. Your posture, facial micro-expressions, and eye contact convey confidence or insecurity long before you begin speaking.',
          'Crossed arms and leaning backward often indicate defensiveness or discomfort with the topic. Conversely, uncrossed limbs and an open chest signal warm receptivity. Being mindful of your own physical cues puts conversational partners at ease.',
          'Maintaining comfortable eye contact shows confidence and sincere engagement. However, staring continuously can feel intimidating and aggressive. Strike a natural balance by looking away periodically while processing complex thoughts.',
          'Mirroring the subtle posture and energy of the other person builds subconscious rapport. If they speak softly and deliberately, matching their cadence fosters immediate comfort. Never exaggerate mirroring, as authenticity is paramount in building rapport.',
          'Notice subtle changes in foot positioning and shoulder alignment during conversations. People naturally angle their bodies toward subjects that interest them. When someone points their feet toward the door, they are ready to wrap up.',
        ],
        vocabulary: [
          {
            word: 'Receptivity',
            phonetic: 'ree-sep-TIV-ih-tee',
            ipa: '/ˌriːsepˈtɪvəti/',
            definition: 'Willingness to consider or accept new suggestions and ideas.',
            example: 'His warm posture signaled open receptivity to our new proposal.',
          },
          {
            word: 'Rapport',
            phonetic: 'ra-POR',
            ipa: '/ræˈpɔːr/',
            definition: 'A close and harmonious relationship where people understand each other feelings.',
            example: 'She established instant rapport with the client by listening carefully.',
          },
          {
            word: 'Subconscious',
            phonetic: 'sub-KON-shus',
            ipa: '/sʌbˈkɒnʃəs/',
            definition: 'Concerning the part of the mind of which one is not fully aware.',
            example: 'Nonverbal signals create a subconscious feeling of trust and warmth.',
          },
        ],
      },
      {
        id: 'ps-ch-3',
        title: 'Cultivating Genuine Empathy',
        description: 'Stepping into the shoes of others to understand their perspective and motives.',
        keyIdeaParagraphs: [
          'Empathy is not merely feeling sorry for someone; it is the capacity to inhabit their worldview. When you comprehend someone underlying fears and aspirations, their behavioral choices suddenly make complete sense.',
          'Avoid the common trap of viewing disagreements as battles that must be won. Instead, approach conflicts as collaborative puzzles waiting to be solved. Replacing judgment with curious inquiry changes the entire tone of interaction.',
          'Acknowledge another person emotional reality before presenting logical facts. When people feel emotionally dismissed, logic only pushes them further into opposition. Validate their struggle first, and they will gladly consider your suggestions.',
          'True empathy requires setting aside personal ego and the desperate need to be proven right. When you show willingness to be influenced by others, they reciprocate that generosity. Mutual vulnerability is the cornerstone of lasting friendships.',
          'Practice observing daily interactions without forming rapid conclusions. Ask yourself what pressures the other person might be facing today. This quiet compassion protects you from taking minor irritations personally.',
        ],
        vocabulary: [
          {
            word: 'Empathy',
            phonetic: 'EM-puh-thee',
            ipa: '/ˈempəθi/',
            definition: 'The ability to understand and share the feelings of another person.',
            example: 'Showing deep empathy allowed the manager to unite the divided team.',
          },
          {
            word: 'Collaborative',
            phonetic: 'kuh-LAB-er-uh-tiv',
            ipa: '/kəˈlæbərətɪv/',
            definition: 'Produced or conducted by two or more parties working together.',
            example: 'They adopted a collaborative mindset to resolve the contract dispute.',
          },
          {
            word: 'Reciprocate',
            phonetic: 'rih-SIP-ruh-kayt',
            ipa: '/rɪˈsɪprəkeɪt/',
            definition: 'To respond to a gesture or action by making a corresponding one.',
            example: 'When you treat others with kindness, they almost always reciprocate.',
          },
        ],
      },
      {
        id: 'ps-ch-4',
        title: 'Mastering Irresistible First Impressions',
        description: 'How the first seven seconds dictate future perceptions and build instant trust.',
        keyIdeaParagraphs: [
          'Within the first seven seconds of meeting someone, their subconscious brain calculates your warmth and competence. A genuine smile, upright posture, and direct eye contact instantly communicate approachability and inner strength.',
          'Remembering and repeating someone name is one of the sweetest sounds in any language. When introduced, immediately repeat their name aloud and link it to a vivid visual image. This simple habit makes others feel uniquely valued.',
          'Start conversations with positive observations rather than complaints about the weather or traffic. Positivity radiates enthusiasm and signals that spending time with you will be uplifting. Energy is contagious, so choose yours intentionally.',
          'Give people your undivided physical presence when saying hello. Avoid checking your smartphone or glancing over their shoulder to see who else is in the room. Total presence in the first minute builds a foundation of respect.',
          'Focus on making the other person feel fascinating rather than striving to appear interesting yourself. Ask engaging questions about their passions and listen eagerly to their answers. People love those who make them feel appreciated.',
        ],
        vocabulary: [
          {
            word: 'Competence',
            phonetic: 'KOM-pih-tuns',
            ipa: '/ˈkɒmpɪtəns/',
            definition: 'The ability to do something successfully or efficiently.',
            example: 'Her calm confidence demonstrated professional competence to the board.',
          },
          {
            word: 'Contagious',
            phonetic: 'kun-TAY-jus',
            ipa: '/kənˈteɪdʒəs/',
            definition: 'Spread from one person or organism to another by direct or indirect contact.',
            example: 'His joyful enthusiasm was completely contagious throughout the room.',
          },
          {
            word: 'Fascinating',
            phonetic: 'FAS-uh-nay-ting',
            ipa: '/ˈfæsɪneɪtɪŋ/',
            definition: 'Extremely interesting and captivating.',
            example: 'She shared a fascinating perspective on international diplomacy.',
          },
        ],
      },
      {
        id: 'ps-ch-5',
        title: 'Gracefully Handling Difficult People',
        description: 'De-escalating conflict, managing emotional outbursts, and setting firm boundaries.',
        keyIdeaParagraphs: [
          'When dealing with an angry or unreasonable individual, never meet their hostile energy with anger. Lowering your vocal volume and slowing your speaking pace forces them to adjust to your calm demeanor. Calmness is powerful.',
          'Separate the person from the specific behavior that is causing the problem. Attack the challenge directly without attacking their personal dignity or character. This preserves their self-esteem and makes a collaborative resolution possible.',
          'Use neutral phrases that de-escalate tension instead of inflammatory language. Saying "Help me understand your perspective" invites cooperation rather than defense. It shifts the discussion from an adversarial trial to a mutual fact-finding mission.',
          'Set clear, polite, and unyielding boundaries against disrespectful language or abusive conduct. You can remain kind while firmly insisting on professional treatment. Clear boundaries command lasting respect from both friends and colleagues.',
          'Remember that hurt people frequently project their internal pain onto those around them. Recognizing their frustration as an emotional cry prevents you from taking their hostility personally. Emotional detachment keeps you in control.',
        ],
        vocabulary: [
          {
            word: 'Adversarial',
            phonetic: 'ad-ver-SAIR-ee-ul',
            ipa: '/ˌædvərˈseəriəl/',
            definition: 'Involving or characterized by conflict or opposition.',
            example: 'Switching from an adversarial stance saved the negotiation from falling apart.',
          },
          {
            word: 'Detachment',
            phonetic: 'dih-TACH-munt',
            ipa: '/dɪˈtætʃmənt/',
            definition: 'A state of being objective, aloof, or emotionally unattached.',
            example: 'Practicing calm detachment prevented her from reacting to insults.',
          },
          {
            word: 'Inflammatory',
            phonetic: 'in-FLAM-uh-tor-ee',
            ipa: '/ɪnˈflæmətɔːri/',
            definition: 'Tending to arouse anger, hostility, or passion.',
            example: 'Avoid inflammatory words when discussing sensitive workplace policies.',
          },
        ],
      },
      {
        id: 'ps-ch-6',
        title: 'The Power of Thoughtful Questions',
        description: 'Guiding conversations, unlocking deep insights, and inspiring others to open up.',
        keyIdeaParagraphs: [
          'The quality of your relationships depends on the quality of questions you dare to ask. Closed questions that demand simple yes or no answers stifle natural conversation. Open-ended inquiries encourage expansive thoughts and authentic storytelling.',
          'Ask questions that begin with "how" and "what" rather than the defensive "why". Asking someone why they made a mistake triggers instant justification. Asking how they plan to solve the dilemma encourages proactive leadership.',
          'Follow up on interesting details by asking for a concrete real-life example. Saying "Tell me more about that experience" shows sincere curiosity and deep engagement. It invites the speaker into their happiest memories and proudest achievements.',
          'Avoid asking questions simply to steer the spotlight back onto your own personal anecdotes. Allow the other person story to breathe and remain center stage. Generous conversationalists are memorable because they make others shine brightly.',
          'Great conversationalists treat every single person they meet as an unexpected teacher. Everyone you speak with knows something valuable that you do not yet understand. Approach every dialogue with humble curiosity, and you will grow continuously.',
        ],
        vocabulary: [
          {
            word: 'Expansive',
            phonetic: 'ik-SPAN-siv',
            ipa: '/ɪkˈspænsɪv/',
            definition: 'Open, comprehensive, or ready to talk freely and widely.',
            example: 'Open questions invite expansive and creative contributions from the team.',
          },
          {
            word: 'Proactive',
            phonetic: 'proh-AK-tiv',
            ipa: '/proʊˈæktɪv/',
            definition: 'Creating or controlling a situation rather than just responding to it after it happened.',
            example: 'Taking a proactive stance helped prevent unexpected client misunderstandings.',
          },
          {
            word: 'Anecdote',
            phonetic: 'AN-ik-doht',
            ipa: '/ˈænɪkdoʊt/',
            definition: 'A short amusing or interesting story about a real incident or person.',
            example: 'He shared an inspiring personal anecdote about persevering through difficulty.',
          },
        ],
      },
    ],
  },

  // =================================================================
  // BOOK 2: "Crucial Conversations"
  // Theme: high-stakes dialogue, psychological safety, and resolution
  // =================================================================
  {
    id: 'book-crucial-conversations',
    title: 'Crucial Conversations',
    author: 'Patterson, Grenny, McMillan & Switzler',
    description:
      'Tools for talking when stakes are high, opinions vary, and emotions run strong. Learn to create mutual purpose and psychological safety.',
    theme: 'High-Stakes Communication & Conflict Resolution',
    coverGradient: 'linear-gradient(135deg, #10b981, #047857)',
    chapters: [
      {
        id: 'cc-ch-1',
        title: 'Recognizing Crucial Moments',
        description: 'How to notice when a casual conversation turns crucial and emotions flare.',
        keyIdeaParagraphs: [
          'A conversation becomes crucial when opinions diverge, the stakes are elevated, and emotions run high. Most people either retreat into timid silence or burst into aggressive argument. Neither strategy produces meaningful results.',
          'When adrenaline surges through your bloodstream during tense discussions, rational thinking diminishes. Notice your early physical warning signs such as a tightening throat or clenched fists. Recognizing your stress response allows you to regain composure.',
          'The first step in mastering high-stakes dialogue is stepping back from the content to inspect the emotional environment. Ask yourself if both parties still feel safe to express their genuine viewpoints without fear of retribution.',
          'People never become defensive because of the actual content of your message. They become defensive because they perceive malicious intent behind your words. Establishing clear, mutual respect protects dialogue from falling apart.',
          'Before opening a sensitive conversation, clarify what you truly want for yourself, the other person, and the relationship. Refuse the false dilemma of choosing between telling the truth and keeping a friend. You can accomplish both with tact.',
        ],
        vocabulary: [
          {
            word: 'Diverge',
            phonetic: 'dih-VURJ',
            ipa: '/daɪˈvɜːrdʒ/',
            definition: 'To separate from another route or go in a different direction; to differ.',
            example: 'Their opinions began to diverge when discussing the annual budget allocations.',
          },
          {
            word: 'Composure',
            phonetic: 'kum-POH-zher',
            ipa: '/kəmˈpoʊʒər/',
            definition: 'The state or feeling of being calm and in control of oneself.',
            example: 'She maintained her professional composure despite aggressive cross-examination.',
          },
          {
            word: 'Retribution',
            phonetic: 'ret-rih-BYOO-shun',
            ipa: '/ˌretrɪˈbjuːʃən/',
            definition: 'Punishment inflicted on someone as vengeance for a wrong or criminal act.',
            example: 'Employees spoke openly once they realized there was no fear of retribution.',
          },
        ],
      },
      {
        id: 'cc-ch-2',
        title: 'Building Psychological Safety',
        description: 'How mutual purpose and mutual respect keep dialogue constructive.',
        keyIdeaParagraphs: [
          'When safety is compromised in a conversation, people immediately withdraw into silence or attack through sarcasm and insults. You must step out of the argument and restore safety before attempting to address the factual issue.',
          'Establish a compelling mutual purpose that demonstrates you care about the other person goals as much as your own. When people realize you are working toward a shared victory, their resistance turns into energetic cooperation.',
          'If someone misunderstands your intent, utilize the contrasting technique. State explicitly what you do not intend before reaffirming your true objective. This quick clarification dispels misunderstandings before they cause damage.',
          'Apologize sincerely and promptly when you have made a genuine mistake or treated someone disrespectfully. A heartfelt apology rebuilds broken trust and proves that your commitment to the relationship outweighs your ego.',
          'True safety allows diverse teams to share risky observations without hesitation. When everyone contributes their individual piece of information, the shared pool of meaning expands, leading to superior collective decisions.',
        ],
        vocabulary: [
          {
            word: 'Compromise',
            phonetic: 'KOM-pruh-myz',
            ipa: '/ˈkɒmprəmaɪz/',
            definition: 'An agreement reached by each side making concessions; or to undermine.',
            example: 'Emotional hostility can compromise even the best intentions in a meeting.',
          },
          {
            word: 'Contrasting',
            phonetic: 'kon-TRAST-ing',
            ipa: '/kənˈtræstɪŋ/',
            definition: 'A communication technique clarifying what you do and do not mean.',
            example: 'Using contrasting helped clarify that she was praising effort, not results.',
          },
          {
            word: 'Collective',
            phonetic: 'kuh-LEK-tiv',
            ipa: '/kəˈlektɪv/',
            definition: 'Done by people acting as a group; shared by all members of a group.',
            example: 'The team collective wisdom produced an innovative product design.',
          },
        ],
      },
    ],
  },

  // =================================================================
  // BOOK 3: "Atomic Habits"
  // Theme: small improvements, identity, and behavioral excellence
  // =================================================================
  {
    id: 'book-atomic-habits',
    title: 'Atomic Habits',
    author: 'James Clear',
    description:
      'An easy and proven way to build good habits and break bad ones. Learn the power of tiny 1% daily changes and identity-based transformation.',
    theme: 'Personal Mastery & Habit Formation',
    coverGradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    chapters: [
      {
        id: 'ah-ch-1',
        title: 'The Surprising Power of 1% Gains',
        description: 'Why small, consistent improvements compound into remarkable lifelong outcomes.',
        keyIdeaParagraphs: [
          'People often convince themselves that massive success requires massive action. In reality, improving by just one percent each day counts for enormous transformation over time. Small improvements compound quietly into extraordinary achievements.',
          'Habits are the compound interest of self-development. Just as money multiplies through compound interest, the effects of your daily speaking practice multiply as you repeat them. Consistency always triumphs over sporadic bursts of intensity.',
          'Focus on your current trajectory rather than obsessing over your current results. If you are reading and speaking English aloud for ten minutes daily, your trajectory points toward total fluency regardless of initial difficulties.',
          'Achieving a goal only changes your life for a fleeting moment. Building a sustainable system of continuous practice changes the trajectory of your entire life. Do not rise to the level of your goals; fall to the level of your systems.',
          'Every action you take is a vote for the type of person you wish to become. When you practice English today, you cast a vote for your identity as a confident, articulate global communicator.',
        ],
        vocabulary: [
          {
            word: 'Compound',
            phonetic: 'KOM-pownd',
            ipa: '/ˈkɒmpaʊnd/',
            definition: 'To increase or add to; to combine into a larger total over time.',
            example: 'Daily pronunciation drills compound into fluent, effortless articulation.',
          },
          {
            word: 'Trajectory',
            phonetic: 'truh-JEK-tuh-ree',
            ipa: '/trəˈdʒektəri/',
            definition: 'The curved path followed by a projectile or an object through space; a course of development.',
            example: 'Consistent study habits established an upward trajectory for his career.',
          },
          {
            word: 'Articulate',
            phonetic: 'ar-TIK-yuh-lut',
            ipa: '/ɑːrˈtɪkjələt/',
            definition: 'Having or showing the ability to speak fluently and coherently.',
            example: 'She delivered an articulate summary that impressed the entire audience.',
          },
        ],
      },
    ],
  },
];
