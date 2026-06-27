import { describe, expect, it } from 'vitest';
import { ZodError, z } from 'zod';
import { ApiRequestError } from '#/lib/api/request';
import { resolveMutationErrorMessage } from '#/lib/utils/mutation-error';

describe('resolveMutationErrorMessage', () => {
  it('returns API error message', () => {
    expect(
      resolveMutationErrorMessage(
        new ApiRequestError(400, 'VALIDATION_FAILED', '团队名称不能为空'),
        '发布失败',
      ),
    ).toBe('团队名称不能为空');
  });

  it('returns zod validation messages', () => {
    const schema = z.object({
      name: z.string().min(1, '请填写团队名称'),
    });
    const result = schema.safeParse({ name: '' });

    if (result.success) {
      throw new Error('expected validation failure');
    }

    expect(resolveMutationErrorMessage(result.error, '发布失败')).toBe(
      '请填写团队名称',
    );
  });

  it('joins multiple zod issues', () => {
    const error = new ZodError([
      {
        code: 'custom',
        message: '请填写团队名称',
        path: ['name'],
      },
      {
        code: 'custom',
        message: '请选择副本',
        path: ['dungeonId'],
      },
    ]);

    expect(resolveMutationErrorMessage(error, '发布失败')).toBe(
      '请填写团队名称；请选择副本',
    );
  });

  it('returns native error message', () => {
    expect(resolveMutationErrorMessage(new Error('请先暂存'), '发布失败')).toBe(
      '请先暂存',
    );
  });

  it('falls back when error is unknown', () => {
    expect(resolveMutationErrorMessage(null, '发布失败')).toBe('发布失败');
  });
});
