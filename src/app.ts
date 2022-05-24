import { saver } from './pdf-generator/saver';
import { getEpisodeList, getScript } from './crawler/crawler';
import { FunctionError } from './lib/error.handler';

async function main() {
  const PAGE_NUM = 9;

  const episodeList = await getEpisodeList(PAGE_NUM);
  if (episodeList instanceof FunctionError) {
    console.log(episodeList.trace);
    console.error(episodeList);
    return null;
  }

  const scriptPromiseList = episodeList.map((ep) => getScript(ep));
  const settledScriptList = await Promise.allSettled(scriptPromiseList);

  const [scriptList, errorList] = settledScriptList.reduce(
    ([s, e], promiseResult, i) => {
      const { title } = episodeList[i];
      if (promiseResult.status === 'rejected') return [[...s], [...e, { title, error: promiseResult.reason }]];
      else {
        const { value } = promiseResult;
        if (value instanceof FunctionError) return [[...s], [...e, { title, error: value }]];
        else return [[...s, { title, script: value }], [...e]];
      }
    },
    [[], []] as [{ title: string; script: Script }[], { title: string; error: any }[]]
  );

  if (errorList.length > 0) {
    console.log(`=== Error List ${errorList.length}/${episodeList.length} ===`);
    episodeList.forEach((e) => {
      console.log(e.title);
      e instanceof FunctionError ? console.log(e.trace) : console.log(e);
    });
  }

  await saver(scriptList);
}

main();
