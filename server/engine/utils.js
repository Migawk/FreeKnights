export function judge(arrow, player) {
  const distance = Math.sqrt(
    (player.x - arrow.x) ** 2 + (player.y - arrow.y) ** 2
  );
  if (distance < 30) return true;
  else return false;
}

export function generateUID() {
  // Creates a random 4-character string
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }

  // Returns a concatenated string of four random strings
  return (
    S4() +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    S4() +
    S4()
  );
}

const names = [
  "Andriy",
  "Oleksandr",
  "Mykhailo",
  "Viktor",
  "Serhiy",
  "Yuriy",
  "Volodymyr",
  "Anatoliy",
  "Petro",
  "Ihor",
  "Valeriy",
  "Vasyl",
  "Oleg",
  "Oleksiy",
  "Roman",
  "Maksym",
  "Dmytro",
  "Borys",
  "Vitaliy",
  "Oleksandr",
  "Yevhen",
  "Ihor",
  "Vadym",
  "Hryhoriy",
  "Taras",
  "Ivan",
  "Pavlo",
  "Stepan",
  "Artem",
  "Yaroslav",
  "Vladyslav",
  "Leonid",
  "Rostyslav",
  "Bohdan",
  "Kyrylo",
  "Stanislav",
  "Konstantyn",
  "Yurii",
  "Viktor",
  "Mykola",
  "Fedir",
  "Arsen",
  "Vsevolod",
  "Zinoviy",
  "Illia",
  "Lev",
  "Rostyk",
  "Danylo",
  "Bohuslav",
  "Myroslav",
];
export function generateName() {
  const ind = Math.round(Math.random() * (names.length - 0) + 0);
  return names[ind];
}
