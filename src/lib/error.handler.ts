import { isAsyncFunction } from 'util/types';

export type HandledError = FunctionError | Error;

export class FunctionError {
  trace: string = '';
  constructor(readonly error: Error | string) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    this.addTrace(errorMessage);
  }
  addTrace(message: string) {
    this.trace = `${this.trace}\n${message}`;
  }
}

export function errorTracer<T extends (...args: any[]) => any>(func: T) {
  if (isAsyncFunction(func)) {
    return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      const result = await func(...args);
      if (result instanceof FunctionError) result.addTrace(`in ${func.name}`);
      return result;
    };
  } else {
    return (...args: Parameters<T>): ReturnType<T> => {
      const result = func(...args);
      if (result instanceof FunctionError) result.addTrace(`in ${func.name}`);
      return result;
    };
  }
}
