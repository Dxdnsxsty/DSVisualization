import { readFile } from 'node:fs/promises';

const han = /\p{Script=Han}/u;
const placeholders = (text) => [...text.matchAll(/\{(\d+)\}/g)].map((match) => match[1]).sort().join(',');

export async function checkEnglishLocale(algorithms) {
  const file = new URL('../src/locales/en.json', import.meta.url);
  const dictionary = JSON.parse(await readFile(file, 'utf8'));
  const errors = [];
  for (const [source, translation] of Object.entries(dictionary)) {
    if (typeof translation !== 'string' || han.test(translation) || placeholders(source) !== placeholders(translation)) {
      errors.push(`英文译文或占位符不正确：${source}`);
    }
  }
  for (const algo of algorithms) {
    const texts = [
      algo.title, algo.summary, algo.inputHint, algo.complexity.extra,
      ...algo.doc.flatMap((section) => [section.heading, section.body, ...(section.points ?? [])]),
      ...algo.quiz.flatMap((question) => [question.q, ...question.options, question.explain]),
    ];
    for (const source of new Set(texts)) {
      if (source && han.test(source) && !dictionary[source.trim()]) {
        errors.push(`${algo.slug} 缺少英文讲解或界面词条：${source}`);
      }
    }
  }
  if (!errors.length) console.log(`  英文词条覆盖检查通过：${Object.keys(dictionary).length} 条，涵盖全部算法的标题、输入提示、讲解和自测。`);
  return errors;
}
