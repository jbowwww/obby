import { isDate } from "node:util/types";

export const isBoolean = (v: any): v is boolean => typeof v === "boolean";
export const isNumber = (v: any): v is number => typeof v === "number";
export const isString = (v: any): v is string => typeof v === "string";
export const isFalseOrEmptyString = (v: string): boolean => v === undefined || v === null || v.trim() === "";
export const hasPrototype = (prototype: object, value: Constructor<any>): boolean =>
    value && (value === prototype || (prototype && hasPrototype(prototype, value.prototype)));
export const isObject = (o: any): o is Object => o !== null && typeof o === "object";
export const isNonDateObject = (o: any): o is Object => typeof o === "object" && !isDate(o) && !(o instanceof Date);

export type AnyParameters<T = any> = [] | [T] | T[];  // Use for ...rest parameters on functions, this type better handles both 0, 1, or more arguments, while using any[] sometimes fails with one parameter
export type NonEmptyArray<T = any> = [T] | T[];
export type Optional<T extends {}, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P]; }
export type PartiallyRequired<T extends {}, R extends keyof T> = Required<Pick<T, R>> & Partial<Omit<T, R>>;

export type Function<A extends AnyParameters = any[], R extends any = any> = ((...args: A) => R) & { name?: string; };

export const isFunction = <A extends AnyParameters = AnyParameters, R extends any = any>(fn: any): fn is Function<A, R> => typeof fn === "function";
export const isPlainFunction = (fn: any): fn is Function => isFunction(fn) && !isAsyncGeneratorFunction(fn);
export const getFunctionName = (fn: Function, ...fallbackNames: string[]) => (fn.name?.trim() ?? "").length > 0 ? fn.name : fallbackNames.length > 0 ? fallbackNames.reduce((setName, nextName) => setName?.trim() === "" ? nextName : setName) : "(anon)";
export const makeFunction = <P extends AnyParameters, R extends any>(name: string, fn: Function<P, R>) => Object.defineProperty(fn, "name", { value: name });
export const isThenable = <T = any>(value: any): value is PromiseLike<T> => "then" in value && typeof value.then === "function";

export type AsyncGeneratorFunction<I = any, O = any, R = any, N = any, L extends number = 0 | 1> =
    (...args:
        L extends 1 ? [AsyncIterable<I>/* , ...extra: AnyParameters */] :
        L extends 0 ? [/* ...extra: AnyParameters */] : [AsyncIterable<I>, ...extra: AnyParameters]) => AsyncGenerator<O, R, N>;

export const isIterable = <T = any, R = any, N = any>(value: any): value is Iterable<T, R, N> => value && Symbol.iterator in value && typeof value[Symbol.iterator] === "function";
export const isAsyncIterable = <T = any, R = any, N = any>(value: any): value is AsyncIterable<T, R, N> => value && Symbol.asyncIterator in value && typeof value[Symbol.asyncIterator] === "function";
export const isAsyncGenerator = <T = any, R = any, N = any>(value: any): value is AsyncGenerator<T, R, N> => value && isAsyncIterable(value) && "next" in value && typeof value.next === "function";
export const isAsyncGeneratorFunction = <I = any, O = any, R = any, N = any, L extends 0 | 1 = 0 | 1>(value: any, argumentsLength?: L): value is AsyncGeneratorFunction<I, R, N> =>
    value && typeof value === "function" && isAsyncGenerator<O, R, N>(value.prototype) && (!argumentsLength || value.length === argumentsLength);

export type TypeGuard<T> = (value: any) => value is T;

export type AbstractConstructor<T = any> = abstract new (...args: any[]) => T;
export type Constructor<T = any> = { name: string; new(...args: any[]): T; /* prototype: T; */ };
export const isConstructor = <T = {}>(value: any, ctor?: AbstractConstructor<T>): value is Constructor<T> =>
    value && typeof value === "function" && value.prototype && (
        !ctor || (typeof ctor.name === "string" &&
            typeof ctor.prototype === "object" && hasPrototype(ctor.prototype, value as Constructor<T>)));

export type AsyncFunction<A extends AnyParameters = [], R extends any = void> = (...args: A) => Promise<R>;
export type MaybeAsyncFunction<A extends AnyParameters = [], R extends any = void> = (...args: A) => R | Promise<R>;

export type PropertyDescriptors<T extends {}> = { [K in keyof T]: TypedPropertyDescriptor<T[K]>; };
export type FunctionPropertyNames<T extends {}> = { [K in keyof T]: T[K] extends Function ? K : never; }[keyof T];
export type FunctionProperties<T extends {}> = Pick<T, FunctionPropertyNames<T>>;
export type NonFunctionPropertyNames<T extends {}> = { [K in keyof T]: T[K] extends Function ? never : K; }[keyof T];
export type DataProperties<T extends {}> = Pick<T, NonFunctionPropertyNames<T>>;

export type KeyValuePair<K extends PropertyKey = PropertyKey, V = any> = [K: K, V: V];
export type FilterFn<T extends {}> = (kv: KeyValuePair<keyof T, T[keyof T]>) => boolean;
export type MapFn<T extends {}, TOut extends {} = T> = (kv: KeyValuePair<keyof T, T[keyof T]>/* , obj: {} */) => KeyValuePair<keyof TOut, TOut[keyof TOut]>;
function _mapObject<T extends { [K: string]: any; }, TOut extends { [K: string]: any; }>(o: T, map: MapFn<T, TOut>): TOut;
function _mapObject<T extends { [K: string]: any; }, TOut extends { [K: string]: any; }>(o: T, filter: FilterFn<T> | MapFn<T, TOut>, map?: MapFn<T, TOut>): TOut;
function _mapObject<T extends { [K: string]: any; }, TOut extends { [K: string]: any; }>(o: T, filterOrMap: FilterFn<T> | MapFn<T, TOut>, map?: MapFn<T, TOut>): TOut {
    return Object.fromEntries((Object.entries(o) as KeyValuePair<keyof T, T[keyof T]>[])
        .filter(map ? filterOrMap : () => true)
        .map(map ?? ((kv: KeyValuePair<keyof T, T[keyof T]>) => kv as KeyValuePair<PropertyKey, any>))) as TOut;
}
_mapObject.recursive = function <T extends { [K: string]: any; }, TOut extends { [K: string]: any; }>(o: T, filterOrMap: FilterFn<T[keyof T]> | MapFn<T[keyof T], TOut>, map?: MapFn<T[keyof T], TOut>): TOut {
    const filter = map ? filterOrMap as FilterFn<any> : () => true;
    const recursiveMap: MapFn<any, any> = ([K, V]: [any, any]) => (map ? map : filterOrMap as MapFn<any, TOut>)([K, _mapObject.recursive(V, filter, recursiveMap)]);
    return _mapObject<any, TOut>(o, filter, recursiveMap)
};
export const mapObject: typeof _mapObject & { recursive: typeof _mapObject.recursive; } = Object.assign(_mapObject, { recursive: _mapObject.recursive });
export const filterObject = <T extends {}>(o: T, filter: FilterFn<T>): Partial<T> => Object.fromEntries((Object.entries(o) as KeyValuePair<keyof T, T[keyof T]>[]).filter(filter)) as Partial<T>;

export const partialObject = <T extends {}>(o: T, ...keys: (keyof T)[]): Partial<T> => filterObject(o, ([K, V]) => !!keys.find(k => k === K));
export const pickFromObject = partialObject;

export const omitFromObject = <T extends {}, K extends keyof T>(o: T, ...keys: K[]): Omit<T, K> => filterObject(o, ([K, V]) => !keys.find(k => k === K)) as Omit<T, K>;

export type ValueUnion<T extends {}> = T[keyof T];
export type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = Extract<T, Record<K, V>>;
export type DiscriminatedModel<T extends Record<K, T[K]>, K extends PropertyKey = "_T"> = { [V in T[K]]: DiscriminateUnion<T, K, V> };

export namespace obby {

    export type PropertyDescriptorMap<T extends {}> = { [K in keyof T]: TypedPropertyDescriptor<T[K]>; };
    export type FunctionPropertyNames<T extends {}> = { [K in keyof T]: T[K] extends Function ? K : never; }[keyof T];
    export type FunctionProperties<T extends {}, K extends FunctionPropertyNames<T> = FunctionPropertyNames<T>> = { [k in K]: T[k] extends Function ? T[k] : never; };
    export type NonFunctionPropertyNames<T extends {}> = { [K in keyof T]: T[K] extends Function ? never : K; }[keyof T];
    export type DataProperties<T extends {}, K extends NonFunctionPropertyNames<T> = NonFunctionPropertyNames<T>> = { [k in K]: T[k] extends Function ? never : k; };
    export type ObjectParts<I extends {} = {}> = {
        fields: DataProperties<I>;
        methods: FunctionProperties<I>;
        getters: FunctionProperties<I>;
        setters: FunctionProperties<I>;
    };
    export type ObjectPartsDescriptors<I extends {} = {}> = {
        fields: PropertyDescriptorMap<I>;
        methods: PropertyDescriptorMap<I>;
        getters: PropertyDescriptorMap<I>;
        setters: PropertyDescriptorMap<I>;
    };

    export type FilterFn<I extends {}> = ([K, V]: [keyof I, I[keyof I]]) => boolean;
    export type MapFn<I extends {}, O extends {}> = ([K, V]: [keyof I, I[keyof I]]) => [keyof O, O[keyof O]];
    export type AwaitedObject<T extends {}> = { [K in keyof T]: T[K] extends PromiseLike<infer T> ? Awaited<T> : T[K]; };
};

// TODO: make this a npm module ?
export class obby<I extends {}> {

    static isMethodProperty = (descriptor: PropertyDescriptor) => "value" in descriptor && typeof descriptor.value === "function";
    static isDataProperty = (descriptor: PropertyDescriptor) => "value" in descriptor && typeof descriptor.value !== "function";
    static isAccessorProperty = (descriptor: PropertyDescriptor) => ("get" in descriptor && typeof descriptor.get === "function") || ("set" in descriptor && typeof descriptor.set === "function");
    static isGetterProperty = (descriptor: PropertyDescriptor) => "get" in descriptor && typeof descriptor.get === "function";
    static isSetterProperty = (descriptor: PropertyDescriptor) => "set" in descriptor && typeof descriptor.set === "function";

    static getParts<I extends {}>(input: I) {
        const parts = { fields: {}, methods: {}, getters: {}, setters: {}, } as obby.ObjectParts<I>;
        const descriptors = Object.getOwnPropertyDescriptors(input);
        Object.entries(descriptors).forEach(([K, descriptor]) => {
            if (obby.isDataProperty(descriptor)) {
                parts.fields[K as obby.NonFunctionPropertyNames<I>] = descriptor.value;
            } else if (obby.isMethodProperty(descriptor)) {
                parts.methods[K as obby.FunctionPropertyNames<I>] = descriptor.value;
            } else if (obby.isGetterProperty(descriptor)) {
                parts.getters[K as obby.FunctionPropertyNames<I>] = descriptor.get as obby.FunctionProperties<I>[FunctionPropertyNames<I>];
            } else if (obby.isSetterProperty(descriptor)) {
                parts.setters[K as obby.FunctionPropertyNames<I>] = descriptor.set as obby.FunctionProperties<I>[FunctionPropertyNames<I>];
            }
        });
        return parts as obby.ObjectParts<I>;
    }

    static getPartsDescriptors<I extends {}>(input: I) {
        const parts = { fields: {}, methods: {}, getters: {}, setters: {}, } as obby.ObjectPartsDescriptors<I>;
        const descriptors = Object.getOwnPropertyDescriptors(input);
        Object.entries(descriptors).forEach(([K, descriptor]) => {
            if (obby.isDataProperty(descriptor)) {
                parts.fields[K as keyof I] = descriptor;
            } else if (obby.isMethodProperty(descriptor)) {
                parts.methods[K as keyof I] = descriptor;
            } else if (obby.isGetterProperty(descriptor)) {
                parts.getters[K as keyof I] = descriptor;
            } else if (obby.isSetterProperty(descriptor)) {
                parts.setters[K as keyof I] = descriptor;
            }
        });
        return parts;
    }

    static filter<I extends {}>(input: I, filterFn: obby.FilterFn<I>): Partial<I> {
        return Object.keys(input).reduce<Partial<I>>((result, key) => {
            if (filterFn([key as keyof I, input[key as keyof I]])) {
                result[key as keyof I] = input[key as keyof I];
            }
            return result;
        }, {} as Partial<I>);
    }

    static split<I extends {}>(input: I, filterFn: obby.FilterFn<I>): [Partial<I>, Partial<I>] {
        return Object.keys(input).reduce<[Partial<I>, Partial<I>]>(([result1, result2], key) => {
            (filterFn([key as keyof I, input[key as keyof I]]) ? result1 : result2)[key as keyof I] = input[key as keyof I];
            return [result1, result2];
        }, [{} as Partial<I>, {} as Partial<I>]);
    }

    static map<I extends {}, O extends Record<PropertyKey, any>>(input: I, mapFn: obby.MapFn<I, O>): O {
        return Object.keys(input).reduce<O>((result, key) => {
            const [K, V] = mapFn([key as keyof I, input[key as keyof I]]);
            result[K] = V;
            return result;
        }, {} as O);
    }

    static pick<I extends {}, K extends keyof I>(input: I, ...keys: K[]): Pick<I, K> {
        return this.filter(input, ([K, V]) => keys.includes(K as K)) as Pick<I, K>;
    }

    static omit<I extends {}, K extends keyof I>(input: I, ...keys: K[]): Omit<I, K> {
        return this.filter(input, ([K, V]) => keys.includes(K as K)) as Omit<I, K>;
    }

    static race<I extends {}>(input: I) {
        return Promise.race(Object.entries(input).map(([K, V]) => Promise.resolve(V).then(V => ([K, V]))));
    }

    static async await<I extends {}, O extends {}>(input: I) {
        return Object.fromEntries(await Promise.all(Object.entries(input).map(([K, V]) => Promise.resolve(V).then(V => ([K, V]))))) as /* obby.AwaitedObject< */O;
        // return Object.fromEntries(Object.entries(input).map(()))
        // return obby.map(input, (async ([K, V]) => ([K, await V])))
    }

    // static async* asyncYield<I extends {}>(input: FunctionProperties<I> & DataProperties<I>): AsyncGenerator<Partial<I>> {
    //     const promises = obby.map(input, ([K, V]) => isFunction(V) ? V
    // }

    constructor(public input: I) { }

    valueOf() { return this.input; }

    getParts() { return obby.getParts(this.input); }
    getPartsDescriptors() { return obby.getPartsDescriptors(this.input); }
    filter(filterFn: obby.FilterFn<I>) { return new obby(obby.filter<I>(this.input, filterFn)); }
    split(input: I, filterFn: obby.FilterFn<I>) { return new obby(obby.split<I>(this.input, filterFn)) }
    map<O extends Record<PropertyKey, any>>(mapFn: obby.MapFn<I, O>) { return new obby(obby.map<I, O>(this.input, mapFn)); }
    pick(...keys: (keyof I)[]) { return new obby(obby.pick(this.input, ...keys)); }
    omit(...keys: (keyof I)[]) { return new obby(obby.filter(this.input, ([K, V]) => keys.includes(K))); }
    race() { return new obby(obby.race(this.input)); }
    async await<O extends {}>(input: I) { return new obby(await obby.await<I, O>(this.input)); }
}
