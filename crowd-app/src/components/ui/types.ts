export type RenderFunction<T> = (arg:T) => JSX.Element | null;
export type StateUpdateFunction<T> = (arg:T) => void;
export type RenderPassthroughFunction<T> = (defaultRenderer:RenderFunction<T>) => JSX.Element | null;
