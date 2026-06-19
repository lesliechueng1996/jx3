export class RaidRunValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RaidRunValidationError';
  }
}

export class RaidRunForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RaidRunForbiddenError';
  }
}

export class RaidRunConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RaidRunConflictError';
  }
}
