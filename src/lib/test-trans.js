const fs = require('fs');
const pokemonNamesMap = JSON.parse(fs.readFileSync('pokemonNames.json', 'utf8'));

function translateName(name) {
  const lower = name.toLowerCase().trim();
  if (pokemonNamesMap[lower]) return pokemonNamesMap[lower];
  
  for (const [fr, en] of Object.entries(pokemonNamesMap)) {
    if (lower.includes(fr) && fr.length >= 3) {
      // Replace the French name with English name
      return lower.replace(new RegExp(fr, 'g'), en.toLowerCase());
    }
  }
  return name;
}

console.log(translateName("mega dracaufeu ex"));
console.log(translateName("drattak vmax"));
console.log(translateName("mega ptera ex"));

