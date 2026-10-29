export type RegistrationErrorCode = "username_taken";

export class RegistrationError extends Error {
  readonly code: RegistrationErrorCode;

  constructor(code: RegistrationErrorCode, message: string) {
    super(message);
    this.name = "RegistrationError";
    this.code = code;
  }
}
