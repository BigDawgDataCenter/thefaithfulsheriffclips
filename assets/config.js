// The one place to change channel facts. Walley's clipper writes clips.json; nothing here needs a rebuild.
window.SHERIFF = {
  twitch: 'thefaithfulsheriff',
  // Clips channel on YouTube. Fill channelId (starts with UC) once the channel is public: the board then
  // falls back to the channel's uploads playlist whenever clips.json is empty.
  clipsYouTube: 'https://www.youtube.com/@TheFaithfulSheriffClips',
  clipsChannelId: '',
  // Optional playlists shown as filter tabs: { label, id } (YouTube playlist ids, PL...).
  playlists: [],
  // Stream schedule from his Twitch About page: Monday to Friday, 3 PM Eastern.
  schedule: { days: [1, 2, 3, 4, 5], hour: 15, minute: 0, tz: 'America/New_York' },
  clipsFeed: 'clips.json'
};
