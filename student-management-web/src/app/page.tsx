import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <section className="flex max-w-md flex-col items-start gap-4">
        <p className="text-sm font-medium text-muted-foreground">
          Student Management
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Frontend workspace is ready.
        </h1>
        <p className="text-muted-foreground">
          Next.js, Tailwind CSS, and shadcn/ui are configured.
        </p>
        <Button disabled>Ready to build</Button>
      </section>
    </main>
  );
}
