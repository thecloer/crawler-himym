import { errorTracer, FunctionError, HandledError } from './lib/error.handler';

const getData = errorTracer(async function getData(str: string, i: number) {
  if (i % 3 === 0) {
    console.log('error!!');
    return new FunctionError(new Error(`My Error: ${str}`));
  } else {
    console.log('return!!');
    return { data: str };
  }
});

const oneMoreFunc = errorTracer(async function oneMoreFunc(str: string, i: number) {
  return await getData(str, i);
});

const getDataList = async (strList: string[]) => {
  const promiseList = strList.map((str, idx) => oneMoreFunc(str, idx));
  const result = await Promise.allSettled(promiseList);

  const ful = result.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<{ data: string } | FunctionError>[];
  const values = ful.map((f) => f.value);
  return values;
};

async function test() {
  const dummy = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십'];
  const result = await getDataList(dummy);

  for (const v of result) {
    if (v instanceof FunctionError) console.error(v);
  }
}
test();
