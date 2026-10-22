// Fake data for parts of the app whose backend isn't ready yet.
// Events and clubs come from Person B's module, so they stay fake for now.

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
