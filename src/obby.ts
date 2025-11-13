import { DataProperties, Function, FunctionProperties, FunctionPropertyNames, isFunction, NonFunctionPropertyNames } from ".";

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
    split(input: I, filterFn: obby.FilterFn<I>) { return new obby(obby.split<I>(this.input, filterFn))}
    map<O extends Record<PropertyKey, any>>(mapFn: obby.MapFn<I, O>) { return new obby(obby.map<I, O>(this.input, mapFn)); }
    pick(...keys: (keyof I)[]) { return new obby(obby.pick(this.input, ...keys)); }
    omit(...keys: (keyof I)[]) { return new obby(obby.filter(this.input, ([K, V]) => keys.includes(K))); }
    race() { return new obby(obby.race(this.input)); }
    async await<O extends {}>(input: I) { return new obby(await obby.await<I, O>(this.input)); }
}
