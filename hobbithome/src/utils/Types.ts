export type Predicate<T> = (t: T) => boolean;
export type Transform<T> = (t: T) => T;
export type TransformPartial<T> = (t: T) => Partial<T>;

/** Shorthand for `Readonly<Record<K,V>>` */
export type Lib<K extends string | number | symbol, V> = Readonly<Record<K, V>>;

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
