export const asianToEnglishSetMap: Record<string, string> = {
  // Scarlet & Violet
  'sv1v': 'sv1', 'sv1s': 'sv1', 'sv1a': 'sv2', 'sv2p': 'sv2', 'sv2d': 'sv2',
  'sv2a': 'sv3pt5', // 151
  'sv3': 'sv3', 'sv3a': 'sv4',
  'sv4k': 'sv4', 'sv4m': 'sv4',
  'sv4a': 'sv4pt5', // Paldean Fates
  'sv5k': 'sv5', 'sv5m': 'sv5',
  'sv6': 'sv6', 'sv6a': 'sv6',
  'sv7': 'sv7', 'sv7a': 'sv7',
  'sv8': 'sv8', 'sv8a': 'sv8',
  
  // Sword & Shield
  's1w': 'swsh1', 's1h': 'swsh1', 's1a': 'swsh2',
  's2': 'swsh2', 's2a': 'swsh3', 's3': 'swsh3', 's3a': 'swsh4',
  's4': 'swsh4', 's4a': 'swsh45', // Shining Fates
  's5i': 'swsh5', 's5r': 'swsh5', 's5a': 'swsh6',
  's6h': 'swsh6', 's6k': 'swsh6', 's6a': 'swsh7',
  's7d': 'swsh7', 's7r': 'swsh7', 's7a': 'swsh8', 's7b': 'swsh8',
  's8': 'swsh8', 's8a': 'cel25', // Celebrations
  's8b': 'swsh9', // VMAX Climax maps generally to Brilliant Stars
  's9': 'swsh9', 's9a': 'swsh10',
  's10d': 'swsh10', 's10p': 'swsh10', 's10a': 'swsh11', 's10b': 'swsh11',
  's11': 'swsh11', 's11a': 'swsh12', 's12': 'swsh12',
  's12a': 'swsh12pt5', // Crown Zenith
  
  // Sun & Moon
  'sm1m': 'sm1', 'sm1s': 'sm1', 'sm1+': 'sm1',
  'sm2k': 'sm2', 'sm2l': 'sm2', 'sm2+': 'sm3', 'sm2a': 'sm3',
  'sm3h': 'sm3', 'sm3n': 'sm3', 'sm3+': 'sm35',
  'sm4a': 'sm4', 'sm4s': 'sm4', 'sm4+': 'sm5',
  'sm5s': 'sm5', 'sm5m': 'sm5', 'sm5+': 'sm6',
  'sm6': 'sm6', 'sm6a': 'sm7', 'sm6b': 'sm7',
  'sm7': 'sm7', 'sm7a': 'sm8', 'sm7b': 'sm8',
  'sm8': 'sm8', 'sm8a': 'sm9', 'sm8b': 'sm75', // Hidden Fates
  'sm9': 'sm9', 'sm9a': 'sm10', 'sm9b': 'sm10',
  'sm10': 'sm10', 'sm10a': 'sm11', 'sm10b': 'sm11',
  'sm11': 'sm11', 'sm11a': 'sm115', 'sm11b': 'sm12',
  'sm12': 'sm12', 'sm12a': 'sm12'
};

export function getEnglishSetIdFromAsianCode(asianCode: string): string | null {
  const code = asianCode.toLowerCase();
  return asianToEnglishSetMap[code] || null;
}
