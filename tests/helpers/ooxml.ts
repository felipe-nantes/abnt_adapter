import JSZip from 'jszip';

export type DocxXml = { documentXml: string; stylesXml: string; headerXmls: string[] };

export async function readDocx(buf: Buffer): Promise<DocxXml> {
  const zip = await JSZip.loadAsync(buf);
  const read = async (path: string) => {
    const f = zip.file(path);
    return f ? await f.async('string') : '';
  };
  const headerPaths = Object.keys(zip.files).filter((p) => /^word\/header\d+\.xml$/.test(p));
  const headerXmls = await Promise.all(headerPaths.map(read));
  return {
    documentXml: await read('word/document.xml'),
    stylesXml: await read('word/styles.xml'),
    headerXmls,
  };
}
