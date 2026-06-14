export default interface ValidationError {
  id: number;
  message: string;
}

abstract class ValidationErrorBase implements ValidationError {
  id: number;
  message: string;

  private static nextId = 1;

  protected constructor(message: string) {
    this.id = ValidationErrorBase.nextId++;
    this.message = message;
  }
}

class ShortEmailError extends ValidationErrorBase {
  constructor() {
    super("Email is too short");
  }
}

class LongEmailError extends ValidationErrorBase {
  constructor() {
    super("Email is too long");
  }
}

class ShortPasswordError extends ValidationErrorBase {
  constructor() {
    super("Password is too short");
  }
}

class LongPasswordError extends ValidationErrorBase {
  constructor() {
    super("Password is too long");
  }
}

class PasswordsDoNotMatchError extends ValidationErrorBase {
  constructor() {
    super("Passwords do not match");
  }
}

class ShortNameError extends ValidationErrorBase {
  constructor() {
    super("Name is too short");
  }
}

class LongNameError extends ValidationErrorBase {
  constructor() {
    super("Name is too long");
  }
}

export {
  ShortEmailError,
  LongEmailError,
  ShortPasswordError,
  LongPasswordError,
  PasswordsDoNotMatchError,
  ShortNameError,
  LongNameError,
};
