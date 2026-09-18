import {
  buildWebSearchContext,
  buildWebSearchDynamicContext,
  createDdgsWebSearchTool,
} from './web';

jest.mock('librechat-data-provider', () => ({
  Tools: { web_search: 'web_search' },
  replaceSpecialVars: jest.fn(({ now }: { now?: string }) => now ?? 'NOW'),
}));

describe('web search context', () => {
  const originalDdgsToolName = process.env.DDGS_TOOL_NAME;

  afterEach(() => {
    if (originalDdgsToolName === undefined) {
      delete process.env.DDGS_TOOL_NAME;
    } else {
      process.env.DDGS_TOOL_NAME = originalDdgsToolName;
    }
  });

  it('keeps static context free of volatile date replacements', () => {
    const context = buildWebSearchContext();

    expect(context).toContain('web_search');
    expect(context).not.toContain('NOW');
    expect(context).not.toContain('{{iso_datetime}}');
  });

  it('guides the model to answer directly when search is not warranted', () => {
    const context = buildWebSearchContext();

    expect(context).toContain('respond directly without searching');

    expect(context).toContain('current, real-time, externally verified');
  });

  it('instructs the model to search once and read a source', () => {
    const context = buildWebSearchContext();

    expect(context).toContain('Use `action: "search_and_read"`');

    expect(context).toContain('Search again only if no suitable source was found');

    expect(context).toContain('Search-result snippets help select a source');

    expect(context).toContain('they are not sufficient evidence');
  });

  it('defines the expected source priority', () => {
    const context = buildWebSearchContext();

    const officialSourcePosition = context.indexOf('Official organization, artist');

    const newsSourcePosition = context.indexOf('Reputable news publication');

    const referenceSourcePosition = context.indexOf('Reference source such as Wikipedia');

    const socialSourcePosition = context.indexOf('Aggregators, social media');

    expect(officialSourcePosition).toBeGreaterThan(-1);
    expect(newsSourcePosition).toBeGreaterThan(officialSourcePosition);
    expect(referenceSourcePosition).toBeGreaterThan(newsSourcePosition);
    expect(socialSourcePosition).toBeGreaterThan(referenceSourcePosition);
  });

  it('requires standard Markdown citations instead of provider anchors', () => {
    const context = buildWebSearchContext();

    expect(context).toContain('Use only standard Markdown links');

    expect(context).toContain('Do not produce unicode citation markers');

    expect(context).toContain('turn0search0');
  });

  it('encourages focused, date-aware queries for latest information', () => {
    const context = buildWebSearchContext();

    expect(context).toContain('"latest," "current," "today," or "most recent"');

    expect(context).toContain('Twenty One Pilots latest studio album 2026 official');

    expect(context).toContain('conversation date/time');
  });

  it('builds dynamic context from the supplied conversation anchor', () => {
    const context = buildWebSearchDynamicContext('2024-01-02T03:04:05.000Z');

    const secondContext = buildWebSearchDynamicContext('2024-01-02T03:04:05.000Z');

    expect(context).toBe(
      '# `web_search` Runtime Context\n' +
        'Conversation Date & Time: ' +
        '2024-01-02T03:04:05.000Z',
    );

    expect(secondContext).toBe(context);
  });

  it('uses a custom tool name when DDGS_TOOL_NAME is configured', () => {
    process.env.DDGS_TOOL_NAME = 'ddgs_web_search';

    const context = buildWebSearchContext();
    const dynamicContext = buildWebSearchDynamicContext('2024-01-02T03:04:05.000Z');
    const webTool = createDdgsWebSearchTool();

    expect(context).toContain('# `ddgs_web_search`');

    expect(dynamicContext).toContain('# `ddgs_web_search` Runtime Context');

    expect(webTool.name).toBe('ddgs_web_search');
  });

  it('exposes explicit search, read, and search-and-read actions', () => {
    const webTool = createDdgsWebSearchTool();

    expect(
      webTool.schema.safeParse({
        action: 'search',
        query: 'Twenty One Pilots latest album',
      }).success,
    ).toBe(true);

    expect(
      webTool.schema.safeParse({
        action: 'read',
        url: 'https://example.com/article',
      }).success,
    ).toBe(true);

    expect(
      webTool.schema.safeParse({
        action: 'search_and_read',
        query: 'Twenty One Pilots latest studio album 2026 official',
        maxResults: 5,
      }).success,
    ).toBe(true);
  });

  it('rejects unsupported actions and invalid result limits', () => {
    const webTool = createDdgsWebSearchTool();

    expect(
      webTool.schema.safeParse({
        action: 'browse',
        query: 'example',
      }).success,
    ).toBe(false);

    expect(
      webTool.schema.safeParse({
        action: 'search',
        query: 'example',
        maxResults: 20,
      }).success,
    ).toBe(false);
  });
});
