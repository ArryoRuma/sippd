export function useProfilePreferences() {
  const brewFrequencyOptions = [
    'Daily',
    'Multiple times daily',
    'A few times a week',
    'Weekends mostly',
    'Occasionally'
  ]

  const onboardingGoalOptions = [
    'Track favorites',
    'Discover new beans',
    'Improve brewing',
    'Keep a coffee journal'
  ]

  const brewMethodOptions = [
    'Pour Over',
    'Espresso',
    'AeroPress',
    'French Press',
    'Drip',
    'Cold Brew',
    'Moka Pot',
    'Other'
  ]

  const roastPreferenceOptions = ['Light', 'Medium', 'Dark', 'No preference']

  const flavorNoteOptions = ['Chocolate', 'Citrus', 'Berry', 'Floral', 'Nutty', 'Caramel', 'Stone fruit', 'Spice']

  const originOptions = ['Ethiopia', 'Kenya', 'Colombia', 'Guatemala', 'Brazil', 'Costa Rica', 'Panama', 'Other']

  return {
    brewFrequencyOptions,
    onboardingGoalOptions,
    brewMethodOptions,
    roastPreferenceOptions,
    flavorNoteOptions,
    originOptions
  }
}
