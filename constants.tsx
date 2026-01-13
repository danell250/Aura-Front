
import { AdPackage, Ad, User, EnergyType, CreditBundle, Post } from './types';

export const APP_NAME = "Aura";
export const PRIMARY_COLOR = "emerald-600";
export const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://aura-back-s1bw.onrender.com/api';

export const CREDIT_BUNDLES: CreditBundle[] = [
  {
    id: 'bundle-nano',
    name: 'Nano Pulse',
    credits: 100,
    price: '$9.99',
    numericPrice: 9.99,
    description: 'Perfect for quick post boosts.',
    gradient: 'from-blue-400 to-blue-600',
    icon: '🔹'
  },
  {
    id: 'bundle-spark',
    name: 'Neural Spark',
    credits: 500,
    price: '$39.99',
    numericPrice: 39.99,
    description: 'Empower your network visibility.',
    gradient: 'from-emerald-400 to-emerald-600',
    icon: '✨'
  },
  {
    id: 'bundle-radiant',
    name: 'Neural Surge',
    credits: 2000,
    price: '$149.99',
    numericPrice: 149.99,
    description: 'High-frequency growth injection.',
    gradient: 'from-indigo-500 to-purple-700',
    icon: '⚡'
  },
  {
    id: 'bundle-core',
    name: 'Universal Core',
    credits: 5000,
    price: '$349.99',
    numericPrice: 349.99,
    description: 'Maximum dominance in the network.',
    gradient: 'from-amber-400 via-orange-500 to-rose-600',
    icon: '💎'
  }
];

export const INDUSTRIES = [
  'Technology & Software',
  'Healthcare',
  'Finance',
  'Education',
  'Marketing & Advertising',
  'Manufacturing',
  'Real Estate',
  'Retail',
  'Other'
];

export const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'Singapore',
  'Other'
];

export const MOCK_USERS: User[] = [
  {
    id: '1',
    firstName: 'Alex',
    lastName: 'Rivera',
    name: 'Alex Rivera',
    handle: '@arivera',
    avatar: 'https://picsum.photos/id/64/150/150',
    acquaintances: ['2', '3', '4', '6', '7', '8'],
    email: 'alex@aura.io',
    dob: '1992-05-15',
    blockedUsers: [],
    trustScore: 95,
    auraCredits: 0,
    activeGlow: 'emerald',
    bio: 'Architecting the future of neural interfaces. Coffee enthusiast.',
    zodiacSign: 'Taurus ♉'
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Chen',
    name: 'Sarah Chen',
    handle: '@schen',
    avatar: 'https://picsum.photos/id/65/150/150',
    acquaintances: ['1', '3', '5', '9'],
    email: 'sarah@aura.io',
    dob: '1995-08-22',
    blockedUsers: [],
    trustScore: 88,
    auraCredits: 0,
    activeGlow: 'none',
    bio: 'Design Lead at Aura. Obsessed with high-fidelity interactions and minimalism.',
    zodiacSign: 'Leo ♌'
  },
  {
    id: '3',
    firstName: 'Marcus',
    lastName: 'Thorne',
    name: 'Marcus Thorne',
    handle: '@mthorne',
    avatar: 'https://picsum.photos/id/1012/150/150',
    acquaintances: ['1', '2', '4', '10'],
    email: 'marcus@aura.io',
    dob: '1988-11-03',
    blockedUsers: [],
    trustScore: 92,
    auraCredits: 0,
    activeGlow: 'cyan',
    bio: 'VC @ Signal Ventures. Looking for the next 100x neural startup.',
    zodiacSign: 'Scorpio ♏'
  },
  {
    id: '4',
    firstName: 'Elena',
    lastName: 'Vance',
    name: 'Elena Vance',
    handle: '@evance',
    avatar: 'https://picsum.photos/id/1027/150/150',
    acquaintances: ['1', '3', '6', '11'],
    email: 'elena@aura.io',
    dob: '1990-01-12',
    blockedUsers: [],
    trustScore: 98,
    auraCredits: 0,
    activeGlow: 'amber',
    bio: 'Quantum Computing Researcher. My thoughts are usually in superposition.',
    zodiacSign: 'Capricorn ♑'
  },
  {
    id: '5',
    firstName: 'Jordan',
    lastName: 'Bale',
    name: 'Jordan Bale',
    handle: '@jbale',
    avatar: 'https://picsum.photos/id/1005/150/150',
    acquaintances: ['2', '6', '12'],
    email: 'jordan@aura.io',
    dob: '1994-06-30',
    blockedUsers: [],
    trustScore: 85,
    auraCredits: 0,
    activeGlow: 'none',
    bio: 'Digital Nomad. Currently syncing from Bali 🌴',
    zodiacSign: 'Cancer ♋'
  },
  {
    id: '6',
    firstName: 'Dr. Aris',
    lastName: 'Varma',
    name: 'Dr. Aris Varma',
    handle: '@avarma',
    avatar: 'https://picsum.photos/id/1062/150/150',
    acquaintances: ['1', '4', '5', '13'],
    email: 'aris@aura.io',
    dob: '1982-03-25',
    blockedUsers: [],
    trustScore: 99,
    auraCredits: 0,
    activeGlow: 'emerald',
    bio: 'Neuroscientist. Studying the intersection of social nodes and serotonin.',
    zodiacSign: 'Aries ♈'
  },
  {
    id: '7',
    firstName: 'Lila',
    lastName: 'Grant',
    name: 'Lila Grant',
    handle: '@lgrant',
    avatar: 'https://picsum.photos/id/1001/150/150',
    acquaintances: ['1', '8'],
    email: 'lila@aura.io',
    dob: '1993-02-14',
    blockedUsers: [],
    trustScore: 91,
    auraCredits: 0,
    activeGlow: 'none',
    bio: 'Growth Strategist @ FlowState. Helping startups reach escape velocity.',
    zodiacSign: 'Aquarius ♒'
  },
  {
    id: '8',
    firstName: 'Kael',
    lastName: 'Soren',
    name: 'Kael Soren',
    handle: '@ksoren',
    avatar: 'https://picsum.photos/id/1003/150/150',
    acquaintances: ['1', '7', '10'],
    email: 'kael@aura.io',
    dob: '1985-09-12',
    blockedUsers: [],
    trustScore: 82,
    auraCredits: 0,
    activeGlow: 'cyan',
    bio: 'Founder of GreenSphere. Building the world\'s first zero-emission logistics network.',
    zodiacSign: 'Gemini ♊'
  },
  {
    id: '10',
    firstName: 'Sophie',
    lastName: 'Laurent',
    name: 'Sophie Laurent',
    handle: '@slaurent',
    avatar: 'https://picsum.photos/id/1025/150/150',
    acquaintances: ['1', '3', '8'],
    email: 'sophie@aura.io',
    dob: '1991-11-20',
    blockedUsers: [],
    trustScore: 94,
    auraCredits: 0,
    activeGlow: 'none',
    bio: 'Global Strategy at Fintech Alliance. Expert in cross-border professional networking.',
    zodiacSign: 'Scorpio ♏'
  },
  {
    id: '11',
    firstName: 'David',
    lastName: 'Park',
    name: 'David Park',
    handle: '@dpark',
    avatar: 'https://picsum.photos/id/1005/150/150',
    acquaintances: ['2', '4', '6'],
    email: 'david@aura.io',
    dob: '1987-04-15',
    blockedUsers: [],
    trustScore: 89,
    auraCredits: 0,
    activeGlow: 'cyan',
    bio: 'CTO @ NextGen Robotics. We build machines that understand human collaboration.',
    zodiacSign: 'Aries ♈'
  }
];

export const AD_PACKAGES: AdPackage[] = [
  {
    id: 'pkg-starter',
    name: 'Personal Pulse',
    subtitle: 'Boost your digital radiance',
    durationDays: 7,
    price: '$49 for 7 Days',
    numericPrice: 49,
    adLimit: 1,
    idealFor: 'Flash announcements, quick tests.',
    features: ['1 Active Signal', '7-Day Neural Retention', 'Standard Network Propagation', 'Basic Analytics'],
    gradient: 'from-slate-400 to-slate-600'
  },
  {
    id: 'pkg-pro',
    name: 'Aura Radiance',
    subtitle: 'Maximum visibility for creators',
    durationDays: 30,
    price: '$199 for 30 Days',
    numericPrice: 199,
    adLimit: 5,
    idealFor: 'Influencers, Content Creators.',
    features: ['5 Simultaneous Signals', '30-Day Signal Lock', 'Priority Feed Injection', 'Smart CTA Button'],
    gradient: 'from-emerald-500 to-emerald-700'
  },
  {
    id: 'pkg-enterprise',
    name: 'Universal Signal',
    subtitle: 'Network saturation',
    durationDays: 30,
    price: '$699 for 30 Days',
    numericPrice: 699,
    adLimit: 20,
    idealFor: 'Brands, Agencies, Power Users.',
    features: ['20 Simultaneous Signals', 'Global Network Saturation', 'Deep-Dive Neural Analytics', '"Verified" Gold Border on Ads'],
    gradient: 'from-slate-900 via-emerald-900 to-black'
  }
];

export const INITIAL_ADS: Ad[] = [
  {
    id: 'ad-master-ui',
    ownerId: '2',
    ownerName: 'Sarah Chen',
    ownerAvatar: 'https://picsum.photos/id/65/150/150',
    headline: 'Mastering Minimalist UI',
    description: 'Join my masterclass on why less is more in the age of neural noise. Seats filling fast!',
    mediaUrl: 'https://images.unsplash.com/photo-1586717791821-3f44a563dc4c?q=80&w=800&auto=format&fit=crop',
    ctaText: 'Reserve Node',
    ctaLink: '#',
    isSponsored: true,
    placement: 'feed',
    status: 'active',
    subscriptionTier: 'Aura Radiance',
    reactions: { '💎': 12, '💡': 5 }
  },
  {
    id: 'ad-strategy-pro',
    ownerId: '1',
    ownerName: 'Aura Business',
    ownerAvatar: 'https://picsum.photos/id/64/150/150',
    headline: 'Strategic Growth Engine',
    description: 'Unlock $500 in Aura Credits when you launch your first Global Signal campaign this week.',
    mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
    ctaText: 'Claim Credits',
    ctaLink: '#',
    isSponsored: true,
    placement: 'feed',
    status: 'active',
    subscriptionTier: 'Aura Radiance',
    reactions: { '⚡': 234 }
  },
  {
    id: 'ad-venture-capital',
    ownerId: '3',
    ownerName: 'Marcus Thorne',
    ownerAvatar: 'https://picsum.photos/id/1012/150/150',
    headline: 'Signal Ventures Fund III',
    description: 'We are officially open for series A neural-tech applications. Pitch your frequency.',
    mediaUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=800&auto=format&fit=crop',
    ctaText: 'Submit Deck',
    ctaLink: '#',
    isSponsored: true,
    placement: 'feed',
    status: 'active',
    subscriptionTier: 'Universal Signal',
    reactions: { '💰': 42, '🚀': 120 }
  },
  {
    id: 'ad-flowstate',
    ownerId: '7',
    ownerName: 'FlowState Agency',
    ownerAvatar: 'https://picsum.photos/id/1001/150/150',
    headline: 'Scale Your Network Frequency',
    description: 'We help professional nodes gain 10x radiance in under 30 days using proprietary growth syncs.',
    mediaUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
    ctaText: 'Boost My Node',
    ctaLink: '#',
    isSponsored: true,
    placement: 'feed',
    status: 'active',
    subscriptionTier: 'Aura Radiance',
    reactions: { '📈': 31 }
  }
];

export const CURRENT_USER = MOCK_USERS[0];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-strategy-1',
    author: MOCK_USERS[5],
    content: "The most successful leaders of 2025 won't be those with the most data, but those with the most clarity. In an age of synthetic noise, human intuition is the ultimate premium. 🧠✨\n\n#Leadership #Strategy #Intuition",
    energy: EnergyType.DEEP_DIVE,
    radiance: 450,
    timestamp: Date.now() - 1200000,
    reactions: { '💡': 89, '🧠': 45 },
    comments: [],
    isBoosted: true,
    userReactions: []
  },
  {
    id: 'post-innovation-1',
    author: MOCK_USERS[1],
    content: "Just launched the new 'Radiate' sharing protocol! Now you can broadcast your Aura signals to the legacy social networks with high-fidelity transparency. ✨ #Innovation #Sync",
    mediaUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop',
    mediaType: 'image',
    energy: EnergyType.HIGH_ENERGY,
    radiance: 124,
    timestamp: Date.now() - 3600000,
    reactions: { '💡': 18, '🔥': 12 },
    comments: [
      {
        id: 'c1',
        author: MOCK_USERS[0],
        text: "The implementation is incredibly smooth, Sarah. The global sync feels instant.",
        timestamp: Date.now() - 1800000,
        reactions: { '🤝': 2 },
        userReactions: []
      }
    ],
    userReactions: ['💡']
  },
  {
    id: 'post-growth-2',
    author: MOCK_USERS[2],
    content: "Growth isn't linear; it's a series of plateaus and pulses. If you feel stuck, you're likely just in the consolidation phase. Hold your frequency. 📈📡 #Growth #Resilience",
    energy: EnergyType.CALM,
    radiance: 88,
    timestamp: Date.now() - 5400000,
    reactions: { '🌿': 24, '✨': 12 },
    comments: [],
    userReactions: []
  },
  {
    id: 'post-leadership-2',
    author: MOCK_USERS[7],
    content: "Strategy is 10% planning and 90% adaptation. If your 5-year plan hasn't changed in the last 6 months, you're not paying attention to the signals. 💡⚡\n\n#Strategy #Business #Agility",
    energy: EnergyType.HIGH_ENERGY,
    radiance: 320,
    timestamp: Date.now() - 6200000,
    reactions: { '💡': 67, '🔥': 22 },
    comments: [],
    isBoosted: true,
    userReactions: []
  },
  {
    id: 'post-vc-thoughts',
    author: MOCK_USERS[3],
    content: "Is it just me, or is the venture capital frequency shifting toward sustainability and neural ethics this quarter? Thoughts on the horizon? 🧐 #VC #Future #Sustainability",
    energy: EnergyType.DEEP_DIVE,
    radiance: 56,
    timestamp: Date.now() - 7200000,
    reactions: { '🧠': 24, '🤔': 5 },
    comments: [],
    userReactions: []
  },
  {
    id: 'post-leadership-3',
    author: MOCK_USERS[0],
    content: "True power in the AURA network comes from 'Proof of Trust'. I've spent the last 6 months auditing our neural pathways. Transparency is the only strategy that scales. 🛡️💻\n\nCheck out our latest audit report below.",
    mediaUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop',
    mediaType: 'image',
    energy: EnergyType.DEEP_DIVE,
    radiance: 312,
    timestamp: Date.now() - 10800000,
    reactions: { '🤝': 56, '💡': 34 },
    comments: [],
    userReactions: []
  },
  {
    id: 'post-wellness-1',
    author: MOCK_USERS[5],
    content: "Completed a 48-hour dopamine fast to recalibrate my neural baseline. The clarity is staggering. We often forget that the strongest signals come from the quietest nodes. 🌿 #Wellness #Productivity",
    mediaUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop',
    mediaType: 'image',
    energy: EnergyType.CALM,
    radiance: 89,
    timestamp: Date.now() - 14400000,
    reactions: { '🌿': 31, '✨': 14 },
    comments: [],
    userReactions: []
  },
  {
    id: 'post-growth-4',
    author: MOCK_USERS[7],
    content: "Strategy Tip: Stop trying to beat the algorithm. Start trying to solve the problem. High-fidelity value always finds its node. 💡📡 #Startup #Strategy",
    energy: EnergyType.HIGH_ENERGY,
    radiance: 210,
    timestamp: Date.now() - 18000000,
    reactions: { '🔥': 45, '💎': 12 },
    comments: [],
    userReactions: []
  },
  {
    id: 'post-nomad-1',
    author: MOCK_USERS[4],
    content: "Managed to sync a node in a remote jungle in Indonesia. High-speed connectivity is finally catching up to the nomadic lifestyle. The dream is live. 🌴🚀 #DigitalNomad #FutureOfWork",
    mediaUrl: 'https://images.unsplash.com/photo-1493246507139-91e8bef99c1e?q=80&w=800&auto=format&fit=crop',
    mediaType: 'image',
    energy: EnergyType.HIGH_ENERGY,
    radiance: 210,
    timestamp: Date.now() - 86400000,
    reactions: { '🔥': 54, '🚀': 22 },
    comments: [],
    userReactions: []
  },
  {
    id: 'post-leadership-5',
    author: MOCK_USERS[1],
    content: "Don't build a team; build an ecosystem. When every node understands the vision, the system becomes self-optimizing. 🌿🤝 #Leadership #Growth #Culture",
    energy: EnergyType.CALM,
    radiance: 178,
    timestamp: Date.now() - 95000000,
    reactions: { '🌿': 42, '🤝': 29 },
    comments: [],
    userReactions: []
  },
  {
    id: 'post-strategy-partners',
    author: MOCK_USERS[2],
    content: "Looking for 3 strategic partners in the quantum encryption space. Must have a trust score > 90 and active radiance of 500+. Drop a pulse if you're interested. 🤝💡",
    energy: EnergyType.NEUTRAL,
    radiance: 45,
    timestamp: Date.now() - 172800000,
    reactions: { '🤝': 12, '💡': 4 },
    comments: [],
    userReactions: []
  },
  {
    id: 'post-leadership-6',
    author: MOCK_USERS[3],
    content: "The best leaders are mentors, not managers. If your presence doesn't illuminate those around you, your aura needs a reset. ⚡✨\n\n#Leadership #Mentorship #Growth",
    energy: EnergyType.HIGH_ENERGY,
    radiance: 195,
    timestamp: Date.now() - 200000000,
    reactions: { '✨': 38, '🔥': 15 },
    comments: [],
    userReactions: []
  },
  {
    id: 'post-deep-dive-ai',
    author: MOCK_USERS[4],
    content: "Just finished a 4-hour deep dive into decentralized AI governance. The potential for individual node sovereignty is massive if we get the protocols right. 💡🧪 #AI #Ethics #Decentralization",
    energy: EnergyType.DEEP_DIVE,
    radiance: 256,
    timestamp: Date.now() - 250000000,
    reactions: { '💡': 56, '🧠': 22 },
    comments: [],
    userReactions: []
  },
  {
    id: 'post-fintech-1',
    author: MOCK_USERS[9] || MOCK_USERS[0],
    content: "Just finalized the partnership with Alliance Bank! We are expanding our professional networking footprint into the EMEA region. Big things coming in Q1 2026. 🚀🌍\n\n#Fintech #Expansion #Networking",
    energy: EnergyType.HIGH_ENERGY,
    radiance: 156,
    timestamp: Date.now() - 43200000,
    reactions: { '🚀': 24, '🤝': 12 },
    comments: [],
    userReactions: []
  },
  {
    id: 'post-robotics-1',
    author: MOCK_USERS[10] || MOCK_USERS[1],
    content: "The future of the workplace isn't remote or office-based—it's collaborative. Our new neural-sync robots are now being deployed in 5 pilot offices across the US. 🤖⚡\n\n#Robotics #FutureOfWork #Innovation",
    energy: EnergyType.DEEP_DIVE,
    radiance: 210,
    timestamp: Date.now() - 172800000,
    reactions: { '🤖': 45, '⚡': 15 },
    comments: [],
    userReactions: []
  },
  {
    id: 'post-calm-morning',
    author: MOCK_USERS[0],
    content: "Morning synchronization routine: 20 mins meditation, 10 mins reading strategy, 0 mins scrolling. Start your day on your own frequency. 🌿☕ #Productivity #Mindset",
    energy: EnergyType.CALM,
    radiance: 412,
    timestamp: Date.now() - 300000000,
    reactions: { '🌿': 88, '🤝': 31 },
    comments: [],
    userReactions: []
  }
];
