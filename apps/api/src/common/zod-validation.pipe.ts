import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

type SafeParseResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: { issues: Array<{ path: Array<string | number>; message: string }> };
    };

type SchemaLike<T> = {
  safeParse(value: unknown): SafeParseResult<T>;
};

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: SchemaLike<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) {
      return result.data;
    }

    throw new BadRequestException({
      message: 'Validation failed',
      errors: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
}
