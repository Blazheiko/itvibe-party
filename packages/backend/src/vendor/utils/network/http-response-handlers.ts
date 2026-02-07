import type { Cookie, Header } from "#vendor/types/types.js";
import type { HttpResponse } from "#vendor/start/server.js";

export const setHeaders = (res: HttpResponse, headers: Header[]): void => {
    headers.forEach((header) => {
      res.writeHeader(header.name, header.value);
    });
  };

/*  example responseData.cookies
|[
|  {
|      name: 'cookieOne',
|      value: 'valueOne',
|      path: '/',
|      httpOnly: true,
|      secure: true,
|      expires:
|      maxAge: 3600, // Max-Age in seconds
|   },
|]
 */
export const setCookies = (res: HttpResponse, cookies: Map<string, Cookie>): void => {
    for (const cookie of cookies.values()) {
      const cookieHeader = `${cookie.name}=${encodeURIComponent(cookie.value)}`;
      const pathPart = cookie.path !== undefined ? `; Path=${cookie.path}` : "";
      const expiresPart =
        cookie.expires !== undefined
          ? `; Expires=${cookie.expires.toUTCString()}`
          : "";
      const httpOnlyPart = cookie.httpOnly !== undefined ? "; HttpOnly" : "";
      const securePart = cookie.secure !== undefined ? "; Secure" : "";
      const maxAgePart =
        cookie.maxAge !== undefined ? `; Max-Age=${String(cookie.maxAge)}` : "";
      const sameSitePart =
        cookie.sameSite !== undefined ? `; SameSite=${cookie.sameSite}` : "";
  
      res.writeHeader(
        "Set-Cookie",
        `${cookieHeader}${pathPart}${expiresPart}${httpOnlyPart}${securePart}${maxAgePart}${sameSitePart}`
      );
    }
  };