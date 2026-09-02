import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Entrar</h2>
      <LoginForm />
    </>
  );
}
