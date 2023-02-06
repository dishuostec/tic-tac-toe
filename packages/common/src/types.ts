export type PrependParam<T extends any, Fn extends (...args: any) => any> = (...args: [T, ...Parameters<Fn>]) => ReturnType<Fn>;
export type PrependParams<T extends any[], Fn extends (...args: any) => any> = (...args: [...T, ...Parameters<Fn>]) => ReturnType<Fn>;

export type AppendParam<T extends any, Fn extends (...args: any) => any> = (...args: [...Parameters<Fn>, T]) => ReturnType<Fn>;
export type AppendParams<T extends any[], Fn extends (...args: any) => any> = (...args: [...Parameters<Fn>, ...T]) => ReturnType<Fn>;


export type CombineString<T extends string, Prepend extends string = '', Append extends string = ''> = `${Prepend}${T}${Append}`;
