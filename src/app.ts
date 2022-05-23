import { getEpisodeList } from './crawler/crawler';
import { FunctionError } from './lib/error.handler';

async function main() {
  const PAGE_NUM = 9;

  const episodeList = await getEpisodeList(PAGE_NUM);
  if (episodeList instanceof FunctionError) {
    console.log(episodeList.trace);
    console.error(episodeList);
  } else {
    console.log(episodeList);
  }
}

main();
