import type ValidationError from "./ValidationError";
import {
  LongEmailError,
  LongNameError,
  LongPasswordError,
  PasswordsDoNotMatchError,
  ShortEmailError,
  ShortNameError,
  ShortPasswordError,
} from "./ValidationError";

class Validate {
  public static email(email: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (email.length < 5) {
      errors.push(new ShortEmailError());
    }
    if (email.length > 50) {
      errors.push(new LongEmailError());
    }

    return errors;
  }

  public static password(password: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (password.length < 8) {
      errors.push(new ShortPasswordError());
    }

    if (password.length > 100) {
      errors.push(new LongPasswordError());
    }

    return errors;
  }

  public static confirmPassword(
    password: string,
    confirm: string,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (password !== confirm) {
      errors.push(new PasswordsDoNotMatchError());
    }

    return errors;
  }

  public static name(name: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (name.length < 2) {
      errors.push(new ShortNameError());
    }

    if (name.length > 100) {
      errors.push(new LongNameError());
    }

    return errors;
  }
}

export default Validate;
