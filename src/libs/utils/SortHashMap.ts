export class SortHashMap<T = number> {
  private map: Map<T, number>;
  private sortedKeys: T[];

  constructor() {
    this.map = new Map();
    this.sortedKeys = [];
  }

  set(key: T, value: number) {
    this.map.set(key, value);
    this.sortedKeys.push(key);
    this.sortedKeys.sort((a, b) => this.map.get(b)! - this.map.get(a)!);
    return this;
  }

  get(key: T) {
    return this.map.get(key);
  }

  first() {
    return this.map.get(this.sortedKeys[0]);
  }

  shift() {
    const key = this.sortedKeys.shift();
    if (key) {
      const value = this.map.get(key);
      this.map.delete(key);
      return value as T;
    }
    return;
  }

  isEmpty() {
    return this.sortedKeys.length === 0;
  }
}
