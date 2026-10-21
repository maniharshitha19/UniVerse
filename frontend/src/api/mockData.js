// Temporary fake data. Later, each of these lists will come from the backend API.

export const currentUser = {
  name: 'Kaviya',
  department: 'Information Technology',
  year: 4,
};

export const quickActions = [
  { id: 'teammates', label: 'Find\nteammates', icon: 'account-search' },
  { id: 'post', label: 'New\npost', icon: 'pencil-plus' },
  { id: 'sell', label: 'Sell\nitem', icon: 'tag-outline' },
  { id: 'clubs', label: 'Clubs &\nevents', icon: 'account-group-outline' },
];

export const events = [
  {
    id: 'e1',
    title: 'Hack the Campus 2026',
    category: 'Hackathon',
    date: 'Oct 18',
    time: '9:00 AM',
    location: 'Main Auditorium',
    icon: 'laptop',
    color: '#6C4DF6',
  },
  {
    id: 'e2',
    title: 'Intro to Cloud Workshop',
    category: 'Workshop',
    date: 'Oct 21',
    time: '2:00 PM',
    location: 'Lab 3, IT Block',
    icon: 'cloud-outline',
    color: '#0E9F94',
  },
  {
    id: 'e3',
    title: 'Cultural Fest Auditions',
    category: 'Club',
    date: 'Oct 24',
    time: '4:30 PM',
    location: 'Open Air Theatre',
    icon: 'music-note-outline',
    color: '#E4572E',
  },
];

export const teams = [
  {
    id: 't1',
    event: 'Hack the Campus 2026',
    title: 'Need a UI/UX designer for a campus app',
    owner: 'Ananya R.',
    skills: ['Figma', 'UI/UX'],
    filled: 2,
    total: 4,
  },
  {
    id: 't2',
    event: 'Smart India Hackathon',
    title: 'Looking for ML and Python developers',
    owner: 'Rohit K.',
    skills: ['Python', 'ML', 'Flask'],
    filled: 1,
    total: 5,
  },
  {
    id: 't3',
    event: 'Cloud Workshop Project',
    title: 'Backend developer for a study planner',
    owner: 'Sneha P.',
    skills: ['Node.js', 'SQL'],
    filled: 3,
    total: 4,
  },
];

export const categories = [
  'All',
  'Hackathons',
  'Workshops',
  'Clubs',
  'Discussions',
  'Opportunities',
];

export const posts = [
  {
    id: 'p1',
    author: 'Ananya R.',
    subtitle: 'CSE, 3rd year',
    category: 'Hackathons',
    time: '2h ago',
    text: 'Our team just made the top 10 at the inter-college hackathon! Thanks to everyone who helped us debug at 3 AM. We are looking for one more teammate for the next round. Message me if you know React Native.',
    likes: 42,
    comments: 9,
  },
  {
    id: 'p2',
    author: 'Tech Club',
    subtitle: 'Club announcement',
    category: 'Clubs',
    time: '4h ago',
    text: 'Registrations for the Web Dev Bootcamp are now open. Three weekends of hands-on projects, with certificates for everyone who completes it. Seats are limited to 60.',
    likes: 58,
    comments: 14,
  },
  {
    id: 'p3',
    author: 'Anonymous',
    subtitle: 'Anonymous post',
    category: 'Discussions',
    time: '5h ago',
    anonymous: true,
    text: 'Is the library too crowded during exams for anyone else? Would a booking system for study rooms help? Curious what others think.',
    likes: 31,
    comments: 22,
  },
  {
    id: 'p4',
    author: 'Rohit K.',
    subtitle: 'IT, 4th year',
    category: 'Workshops',
    time: '1d ago',
    text: 'Sharing my notes from the Cloud Computing workshop: containers, deployment, and free-tier hosting basics. Happy to share the doc with anyone who wants it.',
    likes: 17,
    comments: 5,
  },
  {
    id: 'p5',
    author: 'Placement Cell',
    subtitle: 'Official notice',
    category: 'Opportunities',
    time: '2d ago',
    text: 'Internship openings from three companies are live on the portal. The last date to apply is Oct 20. Update your resume and complete your profile skills before applying.',
    likes: 76,
    comments: 11,
  },
];
