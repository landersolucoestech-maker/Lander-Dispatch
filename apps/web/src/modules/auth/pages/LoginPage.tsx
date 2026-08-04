import { useAuth } from '@workspace/auth-web';

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <div className="z-10 flex w-full max-w-sm flex-col gap-8 border border-border bg-card/50 p-8 backdrop-blur-sm">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="flex items-center justify-center gap-2 text-2xl font-bold uppercase tracking-tight text-foreground">
            <span className="block h-3 w-3 bg-primary" />
            Lander Dispatch
          </h1>
          <p className="font-mono text-sm text-muted-foreground">
            Authentication required
          </p>
        </div>

        <button
          type="button"
          onClick={login}
          className="flex h-12 w-full items-center justify-center gap-2 bg-primary px-4 font-mono font-medium uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
