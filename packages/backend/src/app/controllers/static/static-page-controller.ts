import type { HttpData, ResponseData } from '#vendor/types/types.js';

type StaticHttpData = Readonly<
  Omit<HttpData, 'payload' | 'params' | 'contentType' | 'isJson'> & {
    path: string;
    referer: string | undefined;
  }
>;

type StaticPageContext = {
  httpData: StaticHttpData;
  responseData: ResponseData;
};

const staticPageController = async (_context: StaticPageContext): Promise<void> => {
  // No-op: static pages are served as-is
};

export default staticPageController;
