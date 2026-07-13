import { isActivityDomain } from "@/lib/auth/activity-domains";

const PASSWORD_MIN_LENGTH = 8;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_SPECIAL = /[^A-Za-z0-9]/;

export type SignUpInput = {
  prenom: string;
  nomSociete: string;
  domaineActivite: string;
  email: string;
  password: string;
  acceptCgu: boolean;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  password: string;
  confirmPassword: string;
};

export type FieldErrors = Partial<
  Record<
    | keyof SignUpInput
    | keyof SignInInput
    | keyof ForgotPasswordInput
    | keyof ResetPasswordInput,
    string
  >
>;

export function getPasswordCriteria(password: string) {
  return [
    {
      id: "length",
      label: "8 caractères minimum",
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: "uppercase",
      label: "Une majuscule",
      met: HAS_UPPERCASE.test(password),
    },
    {
      id: "special",
      label: "Un caractère spécial",
      met: HAS_SPECIAL.test(password),
    },
  ] as const;
}

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return "Le mot de passe doit contenir au moins 8 caractères.";
  }
  if (!HAS_UPPERCASE.test(password)) {
    return "Le mot de passe doit contenir au moins une majuscule.";
  }
  if (!HAS_SPECIAL.test(password)) {
    return "Le mot de passe doit contenir au moins un caractère spécial.";
  }
  return null;
}

export function validateSignUp(input: SignUpInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.prenom.trim()) {
    errors.prenom = "Le prénom est requis.";
  }

  if (!input.nomSociete.trim()) {
    errors.nomSociete = "Le nom de la société est requis.";
  }

  if (!input.domaineActivite.trim()) {
    errors.domaineActivite = "Le domaine d'activité est requis.";
  } else if (!isActivityDomain(input.domaineActivite.trim())) {
    errors.domaineActivite = "Sélectionnez un domaine d'activité valide.";
  }

  if (!input.email.trim()) {
    errors.email = "L'email est requis.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.email = "Adresse email invalide.";
  }

  const passwordError = validatePassword(input.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (!input.acceptCgu) {
    errors.acceptCgu = "Vous devez accepter les CGU pour continuer.";
  }

  return errors;
}

export function validateSignIn(input: SignInInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.email.trim()) {
    errors.email = "L'email est requis.";
  }

  if (!input.password) {
    errors.password = "Le mot de passe est requis.";
  }

  return errors;
}

export function validateForgotPassword(input: ForgotPasswordInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.email.trim()) {
    errors.email = "L'email est requis.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = "Adresse email invalide.";
  }

  return errors;
}

export function validateResetPassword(input: ResetPasswordInput): FieldErrors {
  const errors: FieldErrors = {};

  const passwordError = validatePassword(input.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "Confirmez votre mot de passe.";
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "Les mots de passe ne correspondent pas.";
  }

  return errors;
}

export function getFirstError(errors: FieldErrors): string | null {
  const first = Object.values(errors).find(Boolean);
  return first ?? null;
}
