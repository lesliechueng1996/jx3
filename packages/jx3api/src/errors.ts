export class Jx3ApiError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly cause?: unknown;

  constructor(
    message: string,
    options: {
      code: string;
      status?: number;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = 'Jx3ApiError';
    this.code = options.code;
    this.status = options.status;
    this.cause = options.cause;
  }
}
