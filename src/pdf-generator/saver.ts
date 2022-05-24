import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import * as PDFDocument from 'pdfkit';
import { FunctionError, syncErrorTracer } from '../lib/error.handler';

const SAVE_DIR = path.join(process.cwd(), 'pdf');

const P = {
  fontSize: 10,
  lineGap: 6,
};
const H1 = {
  fontSize: 14,
};

const getWriteStream = syncErrorTracer(function getWriteStream(doc: PDFKit.PDFDocument, season: string, episode: EpisodeNum) {
  try {
    const dirPath = path.join(SAVE_DIR, `season${season}`);
    const filePath = path.join(dirPath, `${episode.num}.${episode.title}.pdf`);

    if (!existsSync(dirPath)) {
      mkdirSync(dirPath);
      console.log(`Create a directory: ${dirPath}`);
    }
    if (!existsSync(filePath)) {
      writeFileSync(filePath, 'Empty PDF');
      console.log(`Create a file: ${filePath}`);
    }

    const writeStream = createWriteStream(filePath).on('error', (error) => {
      throw error;
    });

    return writeStream;
  } catch (error) {
    const message = `createWiteStream error: ${episode.title}\n`;
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

const writeLine = syncErrorTracer(function writeLine(doc: PDFKit.PDFDocument, character: string, dialogue: string) {
  doc.moveDown();
  doc.font('Helvetica-Bold').text(`${character}: `, { continued: true }).font('Helvetica').text(dialogue, {
    align: 'left',
    lineGap: P.lineGap,
  });
});

const pdfSaver = syncErrorTracer(function pdfSaver(titleRaw: string, script: Script): Promise<string | FunctionError> {
  return new Promise((resolve, reject) => {
    try {
      const [season, ep] = titleRaw.split('x');
      const [episodeNum, _title] = ep.split(' - ');
      const title = _title.replace(/ /g, '_');
      const episode: EpisodeNum = { num: episodeNum, title };

      let pendingStepCount = 2;
      const stepFinished = () => {
        if (--pendingStepCount == 0) {
          const SuccessMessage = `pdfSaver done: season${season}/${episodeNum}.${title}.pdf`;
          console.log(SuccessMessage);
          resolve(SuccessMessage);
        }
      };

      const doc = new PDFDocument({ size: 'A4', font: 'Times-Roman', margins: { top: 50, bottom: 50, left: 60, right: 60 } });

      // Set path
      const writeStream = getWriteStream(doc, season, episode);
      if (writeStream instanceof FunctionError) return reject(writeStream);

      writeStream.on('finish', stepFinished);
      doc.pipe(writeStream);

      // Write
      doc.font('Helvetica-Bold').fontSize(H1.fontSize).text(titleRaw, { align: 'center' });
      doc.moveDown();

      doc.fontSize(P.fontSize);
      script.forEach(({ character, dialogue }) => writeLine(doc, character, dialogue));

      // End
      doc.end();
      stepFinished();
    } catch (error) {
      //TODO: FunctionError
      const message = `pdfSaver error: ${titleRaw}\n`;
      if (error instanceof Error) {
        const err = new FunctionError(error);
        err.addTrace(message);
        return reject(err);
      } else {
        console.error(error);
        return reject(new FunctionError(message));
      }
    }
  });
});

export async function saver(scriptList: { title: string; script: Script }[]) {
  if (!existsSync(SAVE_DIR)) {
    mkdirSync(SAVE_DIR);
    console.log(`Create a directory: ${SAVE_DIR}`);
  }

  const pdfPromiseList = scriptList.map(({ title, script }) => pdfSaver(title, script));
  const settledPdfList = await Promise.allSettled(pdfPromiseList);

  const [pdfList, errorList] = settledPdfList.reduce(
    ([p, e], promiseResult, i) => {
      const { title } = scriptList[i];
      if (promiseResult.status === 'rejected') return [[...p], [...e, { title, error: promiseResult.reason }]];
      else {
        const { value } = promiseResult;
        if (value instanceof FunctionError) return [[...p], [...e, { title, error: value }]];
        else return [[...p, { title }], [...e]];
      }
    },
    [[], []] as [{ title: string }[], { title: string; error: any }[]]
  );

  if (errorList.length > 0) {
    console.log(`=== Error List ${errorList.length}/${errorList.length} ===`);
    errorList.forEach((e) => {
      console.log(e.title);
      e instanceof FunctionError ? console.log(e.trace) : console.log(e);
    });
  }
}
