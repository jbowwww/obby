import { isDate } from "node:util/types";

export const isBoolean = (v: any): v is boolean => typeof v === "boolean";
export const isNumber = (v: any): v is number => typeof v === "number";
export const isString = (v: any): v is string => typeof v === "string";
export const isFalseOrEmptyString = (v: string): boolean => v === undefined || v === null || v.trim() === "";
export const hasPrototype = (prototype: object, value: unknown): boolean =>
    !!value && (value === prototype || (prototype && (typeof value === "object" && "prototype" in value) ? hasPrototype(prototype, value.prototype) : false));
export const isObject = (o: any): o is Object => !!o && typeof o === "object" && !Array.isArray(o) && !isDate(o);
export const isNonDateObject = (o: any): o is Object => typeof o === "object" && !isDate(o) && !(o instanceof Date);
export const isNonArrayObject = (o: any): o is Object => typeof o === "object" && !Array.isArray(o) && !(o instanceof Date);
const _isPropertyDescriptor = (value: any): value is PropertyDescriptor => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const hasDescriptorKey = "value" in value || "writable" in value || "get" in value || "set" in value || "enumerable" in value || "configurable" in value;
    const hasAccessorKey = "get" in value || "set" in value;
    const hasDataKey = "value" in value || "writable" in value;
    return (
        hasDescriptorKey &&
        !(
            ("get" in value && value.get !== undefined && typeof value.get !== "function") ||
            ("set" in value && value.set !== undefined && typeof value.set !== "function") ||
            ("enumerable" in value && typeof value.enumerable !== "boolean") ||
            ("configurable" in value && typeof value.configurable !== "boolean") ||
            ("writable" in value && typeof value.writable !== "boolean") ||
            (hasAccessorKey && hasDataKey)
        )
    );
};
export const isPropertyDescriptor = _isPropertyDescriptor;
export const isPlainObject = (o: any): o is Record<string, unknown> => {
  if (!isObject(o)) return false;
  const proto = Object.getPrototypeOf(o);
  return proto === Object.prototype || proto === null;
}
export type AnyParameters<T = any> = [] | [T] | T[];  // Use for ...rest parameters on functions, this type better handles both 0, 1, or more arguments, while using any[] sometimes fails with one parameter
export type EmptyParameters = [];
export type NonEmptyParameters<T = any> = [T] | T[];
export type Array<T> = T[];

export type Optional<T extends {}, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P]; }
export type PartiallyRequired<T extends {}, R extends keyof T> = Required<Pick<T, R>> & Partial<Omit<T, R>>;
export type MaybeAsync<T> = T | Promise<T>;
export type MaybeAsyncFn<I extends AnyParameters = AnyParameters, T = any> = (...args: I) => MaybeAsync<T>;
export type MaybeAsyncGenerator<T, TReturn = any, TNext = any> =
  | Generator<T, TReturn, TNext>
  | AsyncGenerator<T, TReturn, TNext>;

export type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined
  | Date
  | RegExp
  | Function;

export type IsAny<T> = 0 extends 1 & T ? true : false;
export type IsUnknown<T> = unknown extends T ? (T extends unknown ? true : false) : false;
export type IsArray<T, U = any> = T extends readonly U[] ? true : false;
export type GetArrayElementType<T extends Array<any>> = T extends Array<infer U> ? U : never;

export type DotPath<T> = IsAny<T> extends true
  ? string
  : IsUnknown<T> extends true
    ? string
    : T extends Primitive
      ? never
      : T extends readonly (infer U)[]
        ? DotPath<U>
        : {
            [K in Extract<keyof T, string>]: T[K] extends Primitive
              ? K
              : T[K] extends Array<infer U>
                ? K | `${K}.${DotPath<U>}`
                : K | `${K}.${DotPath<T[K]>}`;
          }[Extract<keyof T, string>];

export type OptionsDefaultContainer<T extends {}> = {
    default: T;
    mergeDefaults: (options?: Partial<T>) => T;
    applyDefaults: (options: Partial<T>) => void;
};
export function mergeOptions<T extends {}>(this: OptionsDefaultContainer<T>, options?: Partial<T>): T {
    return ({ ...this.default, ...options, });
}
export function applyDefaultOptions<T extends {}>(this: OptionsDefaultContainer<T>, options: Partial<T>): void {
    for (const name in this.default) {
        if (!(name in options)) {
            options[name as keyof T] = this.default[name as keyof T];
        }
    }
}
export function makeDefaultOptions<T extends {}>(defaultOptions: T): OptionsDefaultContainer<T> {
    return ({ default: defaultOptions, mergeDefaults: mergeOptions, applyDefaults: applyDefaultOptions, });
}

export type Function<A extends AnyParameters = any[], R extends any = any> = ((...args: A) => R) & { name?: string; };

export const isFunction = <A extends AnyParameters = AnyParameters, R extends any = any>(fn: any): fn is Function<A, R> => typeof fn === "function";
export const isPlainFunction = (fn: any): fn is Function => isFunction(fn) && !isAsyncGeneratorFunction(fn);
export const getFunctionName = (fn: Function, ...fallbackNames: string[]) => (fn.name?.trim() ?? "").length > 0 ? fn.name : fallbackNames.length > 0 ? fallbackNames.reduce((setName, nextName) => setName?.trim() === "" ? nextName : setName) : "(anon)";
export const isThenable = <T = any>(value: any): value is PromiseLike<T> => "then" in value && typeof value.then === "function";
export const makeFunction = <P extends AnyParameters, R extends any>(name: string, fn: Function<P, R>) => Object.defineProperty(fn, "name", { value: name });
export type ObjectOrFunction = {} | (() => {});
export function makeObject<O extends ObjectOrFunction, A extends AnyParameters>(objectOrFunction: O, ...args: A): O;
export function makeObject<O extends {}, A extends AnyParameters>(args: AnyParameters, fn: Function<A, O>): O;
export function makeObject<O extends {}, A extends AnyParameters>(objectOrFunctionOrArgs: any, ...fnOrArgs: [Function] | A): O {
    return (
        isFunction(objectOrFunctionOrArgs) ? objectOrFunctionOrArgs(...fnOrArgs) :
        Array.isArray(objectOrFunctionOrArgs) && isFunction(fnOrArgs) ? fnOrArgs(objectOrFunctionOrArgs) :
        objectOrFunctionOrArgs);
}

export function isGetterDescriptor(value: PropertyDescriptor): boolean { return !!value.get; }
export function isSetterDescriptor(value: PropertyDescriptor): boolean { return !!value.set; }
export function isDataDescriptor(value: PropertyDescriptor): boolean { return !!value.value; }

// Can I replace usage of this with Constructor? Should this be an instance type instead? is that useful? maybe as a util to extract instance from Constructor?
export type Class<T extends { new(...args: AnyParameters): T; } = any, P extends AnyParameters = AnyParameters> = { new(...args: P): InstanceType<T>; };

export type AsyncGeneratorFunction<I = any, O = any, R = any, N = any, L extends number = 0 | 1> =
    (...args:
        L extends 1 ? [AsyncIterable<I>/* , ...extra: AnyParameters */] :
        L extends 0 ? [/* ...extra: AnyParameters */] : [AsyncIterable<I>, ...extra: AnyParameters]) => AsyncGenerator<O, R, N>;

export const isIterable = <T = any, R = any, N = any>(value: any): value is Iterable<T, R, N> => typeof value === "object" && Symbol.iterator in value && typeof value[Symbol.iterator] === "function";
export const isGenerator = <T = any, R = any, N = any>(value: any): value is Generator<T, R, N> => typeof value === "object" && isIterable(value) && "next" in value && typeof value.next === "function";
export const isAsyncIterable = <T = any, R = any, N = any>(value: any): value is AsyncIterable<T, R, N> => typeof value === "object" && Symbol.asyncIterator in value && typeof value[Symbol.asyncIterator] === "function";
export const isAsyncGenerator = <T = any, R = any, N = any>(value: any): value is AsyncGenerator<T, R, N> => typeof value === "object" && isAsyncIterable(value) && "next" in value && typeof value.next === "function";
export const isAsyncGeneratorFunction = <I = any, O = any, R = any, N = any, L extends 0 | 1 = 0 | 1>(value: any, argumentsLength?: L): value is AsyncGeneratorFunction<I, R, N> =>
    typeof value === "function" && typeof value === "function" && isAsyncGenerator<O, R, N>(value.prototype) && (!argumentsLength || value.length === argumentsLength);

export type TypeGuard<T> = (value: any) => value is T;

export type AbstractConstructor<T = any> = abstract new (...args: any[]) => T;
// export type AbstractConstructor<T = any> = {
//     name: string;
//     prototype?: object;
//     abstract new(...args: any[]): T;
// };
export type Constructor<T = any> = {
    // name?: string;
    // prototype?: object;
    new(...args: AnyParameters): T; /* prototype: T; */
};
export const isConstructor = <T = {}>(value: any, ctor?: AbstractConstructor<T>): value is Constructor<T> =>
    value && typeof value === "function" && value.prototype && (
        !ctor || (typeof ctor.name === "string" &&
            typeof ctor.prototype === "object" && hasPrototype(ctor.prototype, value as Constructor<T>)));

export type AsyncFunction<A extends AnyParameters = EmptyParameters, R extends any = void> = (...args: A) => Promise<R>;
export type MaybeAsyncFunction<A extends AnyParameters = EmptyParameters, R extends any = void> = (...args: A) => R | Promise<R>;

export type PropertyDescriptors<T extends {}> = { [K in keyof T]: TypedPropertyDescriptor<T[K]>; };
export type FunctionPropertyNames<T extends {}> = { [K in keyof T]: T[K] extends Function ? K : never; }[keyof T];
export type FunctionProperties<T extends {}> = Pick<T, FunctionPropertyNames<T>>;
export type NonFunctionPropertyNames<T extends {}> = { [K in keyof T]: T[K] extends Function ? never : K; }[keyof T];
type StringPropertyNames<T extends {}> = Extract<keyof T, string>;
export type NullaryFunctionPropertyNames<T extends {}> = {
    [K in StringPropertyNames<T>]:
        T[K] extends (this: any, ...args: infer P) => any
            ? (P extends [] ? K : never)
            : T[K] extends (...args: infer P) => any
                ? (P extends [] ? K : never)
            : never;
}[StringPropertyNames<T>];
export type DataProperties<T extends {}> = Pick<T, NonFunctionPropertyNames<T>>;
export type RequiredKeys<T> = { [K in keyof T]-?:
    ({} extends { [P in K]: T[K] } ? never : K)
}[keyof T];
export type RequiredProperties<T> = Pick<T, RequiredKeys<T>>;
type IfEquals<X, Y, A, B = never> =
    (<T>() => T extends X ? 1 : 2) extends
    (<T>() => T extends Y ? 1 : 2) ? A : B;
export type WritableDataPropertyNames<T> = { [P in keyof T]: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P> }[keyof T];
export type WritableDataProperties<T> = { [P in WritableDataPropertyNames<T>]-?: P extends undefined ? never : T[P]; };// as keyof T];
export type InvokedReturnType<T> =
    T extends (this: any, ...args: any[]) => infer R ? Awaited<R> :
    T extends (...args: any[]) => infer R ? Awaited<R> :
    T;
export type InvokedProperties<T extends {}, K extends keyof T = keyof T> = {
    [P in K]: InvokedReturnType<T[P]>;
};
export type PropertyDefinition<T = any> = T | TypedPropertyDescriptor<T>;
export type PropertyDefinitionMap<T extends {}> = { [K in keyof T]: PropertyDefinition<T[K]>; };
export type InferPropertyDefinition<T> =
    T extends { value: infer V } ? V :
    T extends { get: (...args: any[]) => infer V } ? V :
    T extends { set: (value: infer V, ...args: any[]) => any } ? V :
    T;
export type InferPropertyDefinitionMap<T extends Record<PropertyKey, any>> = { [K in keyof T]: InferPropertyDefinition<T[K]>; };

export type Wrap = {
    <T extends object, O extends {}>(target: T, properties: PropertyDefinitionMap<O>): T & O;
    <T extends object, O extends Record<PropertyKey, any>>(target: T, properties: O): T & InferPropertyDefinitionMap<O>;
};
const _wrap: Wrap = (target: object, properties: Record<PropertyKey, any>) => Object.defineProperties(
    target,
    Reflect.ownKeys(properties).reduce<Record<PropertyKey, PropertyDescriptor>>((descriptors, key) => {
        const property = properties[key];
        descriptors[key] = !isPropertyDescriptor(property) ? {
            value: property,
            enumerable: false,
            configurable: false,
            writable: false,
        } : (
            ("get" in property || "set" in property) ? {
                enumerable: false,
                configurable: false,
                ...property,
            } : {
                enumerable: false,
                configurable: false,
                writable: false,
                ...property,
            }
        );
        return descriptors;
    }, {})
) as any;
export const wrap = _wrap;

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

export const throwError = <E extends Error = Error>(error: E) => { throw error; };

// TODO: make this a npm module ?
export class obby<I extends {}> {
    constructor(public input: I) { }
    valueOf() { return this.input; }
    getParts() { return obby.getParts(this.input); }
    getPartsDescriptors() { return obby.getPartsDescriptors(this.input); }
    wrap<O extends Record<PropertyKey, any>>(properties: O) { return new obby(obby.wrap(this.input, properties)); }
    filter(filterFn: obby.FilterFn<I>) { return new obby(obby.filter<I>(this.input, filterFn)); }
    split(input: I, filterFn: obby.FilterFn<I>) { return new obby(obby.split<I>(this.input, filterFn)) }
    map<O extends Record<PropertyKey, any>>(mapFn: obby.MapFn<I, O>) { return new obby(obby.map<I, O>(this.input, mapFn)); }
    pick(...keys: (keyof I)[]) { return new obby(obby.pick(this.input, ...keys)); }
    omit(...keys: (keyof I)[]) { return new obby(obby.filter(this.input, ([K, V]) => keys.includes(K))); }
    race() { return new obby(obby.race(this.input)); }
    async await<O extends {}>(input: I) { return new obby(await obby.await<I, O>(this.input)); }
}

export namespace obby {
    export const isPropertyDescriptor = _isPropertyDescriptor;
    export const isMethodProperty = (descriptor: PropertyDescriptor) => "value" in descriptor && typeof descriptor.value === "function";
    export const isDataProperty = (descriptor: PropertyDescriptor) => "value" in descriptor && typeof descriptor.value !== "function";
    export const isAccessorProperty = (descriptor: PropertyDescriptor) => ("get" in descriptor && typeof descriptor.get === "function") || ("set" in descriptor && typeof descriptor.set === "function");
    export const isGetterProperty = (descriptor: PropertyDescriptor) => "get" in descriptor && typeof descriptor.get === "function";
    export const isSetterProperty = (descriptor: PropertyDescriptor) => "set" in descriptor && typeof descriptor.set === "function";

    export type PropertyDescriptorMap<T extends {}> = { [K in keyof T]: TypedPropertyDescriptor<T[K]>; };
    export type PropertyDefinitionMap<T extends {}> = { [K in keyof T]: PropertyDefinition<T[K]>; };
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
    export type AwaitedObject<T extends {}> = MaybeAsync<{ [K in keyof T]: T[K] extends PromiseLike<infer T> ? Awaited<T> : T[K]; }>;

    export function getParts<I extends {}>(input: I) {
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

    export function getPartsDescriptors<I extends {}>(input: I) {
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

    export const wrap: Wrap = _wrap;

    export function filter<I extends {}>(input: I, filterFn: obby.FilterFn<I>): Partial<I> {
        return Object.keys(input).reduce<Partial<I>>((result, key) => {
            if (filterFn([key as keyof I, input[key as keyof I]])) {
                result[key as keyof I] = input[key as keyof I];
            }
            return result;
        }, {} as Partial<I>);
    }

    export function split<I extends {}>(input: I, filterFn: obby.FilterFn<I>): [Partial<I>, Partial<I>] {
        return Object.keys(input).reduce<[Partial<I>, Partial<I>]>(([result1, result2], key) => {
            (filterFn([key as keyof I, input[key as keyof I]]) ? result1 : result2)[key as keyof I] = input[key as keyof I];
            return [result1, result2];
        }, [{} as Partial<I>, {} as Partial<I>]);
    }

    export function map<I extends {}, O extends Record<PropertyKey, any>>(input: I, mapFn: obby.MapFn<I, O>): O {
        return Object.keys(input).reduce<O>((result, key) => {
            const [K, V] = mapFn([key as keyof I, input[key as keyof I]]);
            result[K] = V;
            return result;
        }, {} as O);
    }

    export function pick<I extends {}, K extends keyof I>(input: I, ...keys: K[]): Pick<I, K> {
        return filter(input, ([K, V]) => keys.includes(K as K)) as Pick<I, K>;
    }

    export function omit<I extends {}, K extends keyof I>(input: I, ...keys: K[]): Omit<I, K> {
        return filter(input, ([K, V]) => keys.includes(K as K)) as Omit<I, K>;
    }

    export function race<I extends {}>(input: I) {
        return Promise.race(Object.entries(input).map(([K, V]) => Promise.resolve(V).then(V => ([K, V]))));
    }

    export async function await<I extends {}, O extends {}>(input: I): Promise<AwaitedObject<O>> {
        return Object.fromEntries(
            await Promise.all(
                Object.entries(input).map(
                    ([K, V]) => Promise.resolve(V).then(V => isPlainObject(V) ? [K, obby.await(V)] : ([K, V]))
                )
            )
        ) as obby.AwaitedObject<O>;
        // return Object.fromEntries(Object.entries(input).map(()))
        // return obby.map(input, (async ([K, V]) => ([K, await V])))
    }

    // export function async* asyncYield<I extends {}>(input: FunctionProperties<I> & DataProperties<I>): AsyncGenerator<Partial<I>> {
    //     const promises = obby.map(input, ([K, V]) => isFunction(V) ? V
    // }
};

export default obby;
