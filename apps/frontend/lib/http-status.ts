/**
 * Treat every successful HTTP response consistently, including 201 Created,
 * 202 Accepted, and successful responses without a body such as 204 No Content.
 */
export function isSuccessfulHttpStatus(status: number): boolean {
  return status >= 200 && status < 300;
}
