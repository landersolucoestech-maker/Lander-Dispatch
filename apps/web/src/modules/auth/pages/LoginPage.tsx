import { useAuth } from "@workspace/replit-auth-web";

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      
      <div className="z-10 w-full max-w-sm p-8 flex flex-col gap-8 border border-border bg-card/50 backdrop-blur-sm">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase flex items-center justify-center gap-2">
            <span className="w-3 h-3 bg-primary block"></span>
            Lander Dispatch
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            SYS.AUTH.REQUIRED
          </p>
        </div>

        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-12 px-4 font-mono font-medium hover:bg-primary/90 transition-colors uppercase tracking-wider"
        >
          Initialize Session
        </button>
      </div>
    </div>
  );
}
