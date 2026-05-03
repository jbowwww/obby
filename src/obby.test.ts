import obby, { isPropertyDescriptor } from "./obby";
import type { InvokedProperties, NullaryFunctionPropertyNames } from "./obby";

type Equal<Left, Right> =
    (<Value>() => Value extends Left ? 1 : 2) extends
    (<Value>() => Value extends Right ? 1 : 2)
        ? true
        : false;
type Expect<Value extends true> = Value;

type DemoType = {
    name: string;
    readonly frozen: string;
    count?: number;
    label(): string;
    hydrate(value: string): number;
    ready(): Promise<boolean>;
};

class DemoClassType {
    name = "demo";
    label() {
        return this.name;
    }
    ready() {
        return Promise.resolve(true);
    }
    hydrate(value: string) {
        return value.length;
    }
}

class DemoDerivedClassType extends DemoClassType {
    slug = "demo";
    summary() {
        return `${this.name}:${this.slug}`;
    }
}

type _NullaryFunctionPropertyNames = Expect<
    Equal<NullaryFunctionPropertyNames<DemoType>, "label" | "ready">
>;
type _InvokedProperties = Expect<
    Equal<
        InvokedProperties<DemoType, "label" | "ready">,
        { label: string; ready: boolean }
    >
>;
type _NullaryFunctionPropertyNamesForClass = Expect<
    Equal<NullaryFunctionPropertyNames<DemoClassType>, "label" | "ready">
>;
type _InvokedPropertiesForClass = Expect<
    Equal<
        InvokedProperties<DemoClassType, "label" | "ready">,
        { label: string; ready: boolean }
    >
>;
type _NullaryFunctionPropertyNamesForDerivedClass = Expect<
    Equal<NullaryFunctionPropertyNames<DemoDerivedClassType>, "label" | "ready" | "summary">
>;

describe("isPropertyDescriptor", () => {
    test("accepts valid descriptors and rejects invalid descriptor-like objects", () => {
        expect(isPropertyDescriptor({ value: 1, writable: true })).toBe(true);
        expect(isPropertyDescriptor({ get: () => 1, enumerable: false })).toBe(true);
        expect(isPropertyDescriptor({ value: 1, get: () => 1 })).toBe(false);
        expect(isPropertyDescriptor({ get: "not a function" })).toBe(false);
    });
});

describe("obby.wrap", () => {
    test("defines raw values as non-enumerable, non-configurable, non-writable properties", () => {
        const target = {};
        const nested = { ok: true };
        const wrapped = obby.wrap(target, { hidden: 123, nested });

        expect(wrapped).toBe(target);
        expect(Object.keys(target)).toEqual([]);

        expect(Object.getOwnPropertyDescriptor(target, "hidden")).toEqual({
            value: 123,
            enumerable: false,
            configurable: false,
            writable: false,
        });
        expect(Object.getOwnPropertyDescriptor(target, "nested")).toEqual({
            value: nested,
            enumerable: false,
            configurable: false,
            writable: false,
        });
    });

    test("respects property descriptor overrides", () => {
        const target: { visible?: number; locked?: number; } = {};
        obby.wrap(target, {
            visible: { value: 1, enumerable: true, configurable: true, writable: true },
            locked: { value: 2 },
        });

        expect(Object.keys(target)).toEqual(["visible"]);
        expect(Object.getOwnPropertyDescriptor(target, "visible")).toEqual({
            value: 1,
            enumerable: true,
            configurable: true,
            writable: true,
        });
        expect(Object.getOwnPropertyDescriptor(target, "locked")).toEqual({
            value: 2,
            enumerable: false,
            configurable: false,
            writable: false,
        });

        target.visible = 3;
        expect(target.visible).toBe(3);
    });

    test("defaults accessor descriptors to non-enumerable and non-configurable", () => {
        const target = {};
        let current = 4;

        obby.wrap(target, {
            answer: {
                get: () => current,
                set: (value: number) => {
                    current = value;
                },
            },
        });

        const descriptor = Object.getOwnPropertyDescriptor(target, "answer");
        expect(descriptor).toMatchObject({
            enumerable: false,
            configurable: false,
        });
        expect(descriptor && "writable" in descriptor).toBe(false);

        (target as { answer: number; }).answer = 8;
        expect((target as { answer: number; }).answer).toBe(8);
    });

    test("treats invalid descriptor-like objects as plain values", () => {
        const target = {};
        const invalidDescriptorLike = { get: "not a function" };

        obby.wrap(target, { safe: invalidDescriptorLike });

        expect(Object.getOwnPropertyDescriptor(target, "safe")).toEqual({
            value: invalidDescriptorLike,
            enumerable: false,
            configurable: false,
            writable: false,
        });
    });
});
