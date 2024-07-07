export type Message="sortCPUs"|"autoShowMore"|"sortLaptops"
export type Scores = { [model: string]: number };
export type Replacements = [searchValue: string | RegExp, replaceValue: string][];
