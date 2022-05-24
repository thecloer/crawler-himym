import axios from 'axios';
import * as cheerio from 'cheerio';
import { FunctionError, errorTracer } from '../lib/error.handler';

const BASE_URL = 'https://transcripts.foreverdreaming.org';
const GAP = 25;

const getDOM = errorTracer(async function getDOM(url: string) {
  try {
    const res = await axios.get(url);
    return cheerio.load(res.data);
  } catch (error) {
    const message = `getDOM error: ${url}\n`;
    if (error instanceof Error) {
      const err = new FunctionError(error);
      err.addTrace(message);
      return err;
    } else {
      console.error(error);
      return new FunctionError(message);
    }
  }
});

export const getScript = errorTracer(async function getScript({ title, url }: Episode) {
  const $ = await getDOM(url);
  if ($ instanceof FunctionError) return $;

  const pList = $('.postbody > p');

  const script: Script = [];
  // const script = new Proxy([], {
  //   get(target, idx) {
  //     if (!isNaN(idx)) {
  //       idx = parseInt(idx, 10);
  //       if (idx < 0) idx += target.length;
  //     }
  //     return target[idx];
  //   },
  // });

  pList.each((i, p) => {
    const pInnerText = $(p).text();
    if (pInnerText.includes(':')) {
      const [character, _dialogue] = pInnerText.split(':');
      const dialogue = _dialogue.trim();
      const line: Line = { character, dialogue };
      script.push(line);
    }
    // else if (pInnerText.includes(':...')) {
    //   const [character, _] = pInnerText.split(':');
    //   const dialogue = _.replace(/\.\.\./g, '').trim();
    //   const line = script.pop();
    //   if (line[0] === character) line[1] = line[1].concat(' ', dialogue);
    //   else {
    //     console.log('\n#### Warning: line[0] !== character');
    //     console.log(line);
    //     console.log(pInnerText);
    //   }
    //   script.push(line);
    // }
  });

  console.log(`getScript done: ${title}`);
  return script;
});

// test
export const getEpisodeListOnPage = errorTracer(async function getEpisodeListOnPage(page: number) {
  const episodeList: Episode[] = [];
  const $ = await getDOM(`${BASE_URL}/viewforum.php?f=177&start=${GAP * page}`);
  if ($ instanceof FunctionError) return $;

  const aList = $('tbody > tr:nth-child(n+4) > td:first-child > h3 > a');
  aList.each((i, a) => {
    const aTag = $(a);
    const title = aTag.text();
    const url = BASE_URL + aTag.attr('href')!.slice(1);
    episodeList.push({ title, url });
  });

  return episodeList;
});

export const getEpisodeList = errorTracer(async function getEpisodeList(pageNum: number) {
  let episodeList: Episode[] = [];

  for (let page = 0; page < pageNum; page++) {
    const episodeListOnAPage = await getEpisodeListOnPage(page);
    if (episodeListOnAPage instanceof FunctionError) return episodeListOnAPage;

    episodeList = [...episodeList, ...episodeListOnAPage];
  }
  return episodeList;
});
