const rawQuery = "Lucario 092/193";
const numberMatch = rawQuery.match(/^(\d{1,4})\s*\/\s*(\d{1,4})$/);
console.log("numberMatch:", numberMatch);

const numberMatchLoose = rawQuery.match(/(?:^|\s)(\d{1,4})\s*\/\s*(\d{1,4})(?:\s|$)/);
console.log("numberMatchLoose:", numberMatchLoose);
