import { toast } from 'sonner';
import { ZodError } from 'zod';
import { ApiRequestError } from '#/lib/api/request';

export const resolveMutationErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  if (error instanceof ZodError) {
    const messages = error.issues
      .map((issue) => issue.message)
      .filter((message) => message.length > 0);

    if (messages.length > 0) {
      return messages.join('；');
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
};

export const showMutationErrorToast = (
  error: unknown,
  fallbackMessage: string,
): void => {
  toast.error(resolveMutationErrorMessage(error, fallbackMessage));
};
