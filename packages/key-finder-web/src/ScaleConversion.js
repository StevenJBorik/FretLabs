function convertToNumericValue(key) {
  const letterValues = {
    E: 0,
    F: 1,
    'F#': 2,
    Gb: 2,
    G: 3,
    'G#': 4,
    Ab: 4,
    A: 5,
    'A#': 6,
    Bb: 6,
    B: 7,
    C: 8,
    'C#': 9,
    Db: 9,
    D: 10,
    'D#': 11,
    Eb: 11,
  };

  const letter = key.charAt(0).toUpperCase();
  const octave = parseInt(key.charAt(key.length - 1));

  if (letter in letterValues) {
    return octave * 12 + letterValues[letter];
  }
  return null;
}
