"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className = "btn btn-forest !min-h-[2.75rem]", pendingText = "Enregistrement…" }: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

/** Submit button that asks for confirmation first (for destructive actions). */
export function ConfirmButton({ children, message, className = "text-sm text-[#a23a2a] underline-offset-4 hover:underline" }: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
