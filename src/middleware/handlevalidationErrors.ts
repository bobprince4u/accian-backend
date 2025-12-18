import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationError } from "express-validator";

// Define a proper type for formatted errors
interface FormattedValidationError {
  field: string;
  message: string;
}

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors: FormattedValidationError[] = errors
      .array()
      .map((err: ValidationError) => {
        // Use type assertion to access additional properties safely
        const errorWithField = err as ValidationError & {
          param?: string;
          path?: string;
          field?: string;
        };

        const field =
          errorWithField.param ||
          errorWithField.path ||
          errorWithField.field ||
          "unknown";

        return {
          field,
          message: err.msg,
        };
      });

    return res.status(400).json({
      success: false,
      message: "Validation errors",
      errors: formattedErrors,
    });
  }

  next();
};
