import ChangePasswordForm from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default function ChangePasswordPage() {
  return (
    <>
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Defina sua nova senha</h2>
      <p className="text-sm text-slate-500 mb-4">
        Por segurança, você precisa trocar a senha temporária antes de continuar.
      </p>
      <ChangePasswordForm />
    </>
  );
}
