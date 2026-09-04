import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FieldShellProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function FieldShell({ label, htmlFor, error, hint, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
      {error && <p className="mt-1 text-xs text-ember">{error}</p>}
    </div>
  );
}

const inputStyles =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-ink focus:outline-none disabled:bg-sand/50 disabled:text-ink/40";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextField({ label, error, hint, id, className = "", ...rest }: TextFieldProps) {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint}>
      <input id={fieldId} className={`${inputStyles} ${className}`} {...rest} />
    </FieldShell>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextAreaField({ label, error, hint, id, className = "", ...rest }: TextAreaFieldProps) {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint}>
      <textarea id={fieldId} className={`${inputStyles} min-h-[100px] resize-y ${className}`} {...rest} />
    </FieldShell>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function SelectField({ label, error, hint, id, className = "", children, ...rest }: SelectFieldProps) {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint}>
      <select id={fieldId} className={`${inputStyles} ${className}`} {...rest}>
        {children}
      </select>
    </FieldShell>
  );
}

type CheckboxFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function CheckboxField({ label, id, className = "", ...rest }: CheckboxFieldProps) {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label htmlFor={fieldId} className="flex items-center gap-2 text-sm text-ink">
      <input
        id={fieldId}
        type="checkbox"
        className={`h-4 w-4 rounded border-line text-moss-700 focus:ring-moss-500 ${className}`}
        {...rest}
      />
      {label}
    </label>
  );
}
