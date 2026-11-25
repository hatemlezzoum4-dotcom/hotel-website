"use client";
import { useActionState } from "react";
import { login, type LoginState } from "@/app/(admin)/admin/_actions/auth";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-8 grid gap-5">
      {state.error && (
        <p role="alert" className="border-s-4 border-[#b4412f] bg-[#b4412f]/8 px-4 py-3 text-sm text-[#7d2a1e]">
          {state.error}
        </p>
      )}
      <div className="field">
        <label htmlFor="email" className="field-label">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" maxLength={160} defaultValue={state.email} />
      </div>
      <div className="field">
        <label htmlFor="password" className="field-label">Mot de passe</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" maxLength={200} />
      </div>
      <button type="submit" className="btn btn-forest mt-2" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
