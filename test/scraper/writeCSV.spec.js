const fs = require('fs');
const os = require('os');
const path = require('path');
const { createCsvStream } = require('../../app/scraper/writeCSV');

describe('writeCSV streaming helper', () => {
  it('writes a header with Tag column and appends records one by one', async () => {
    const tmpFile = path.join(os.tmpdir(), `test-csv-${Date.now()}.csv`);
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);

    const { write, end } = createCsvStream(tmpFile);

    write({
      title: 'Title1',
      description: 'desc1',
      url: 'http://example.com',
      email: 'a@b.com',
      phones: '123',
      facebook: 'fb',
      instagram: 'ig',
      twitter: 'tw',
      linkedin: 'li',
      meta: 'meta1',
      tag: 'tag1',
    });

    write({
      title: 'Title2',
      description: 'desc2',
      url: 'http://example2.com',
      email: 'c@d.com',
      phones: '456',
      facebook: 'fb2',
      instagram: 'ig2',
      twitter: 'tw2',
      linkedin: 'li2',
      meta: 'meta2',
      tag: 'tag2',
    });

    await end();

    const contents = fs.readFileSync(tmpFile, 'utf8');
    const lines = contents.trim().split(/\r?\n/);
    expect(lines[0]).toMatch(/Tag/); // header contains Tag
    expect(lines.length).toBe(3);
    expect(lines[1]).toContain('tag1');
    expect(lines[2]).toContain('tag2');
  });
});
