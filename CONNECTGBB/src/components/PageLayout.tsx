import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";

type PageLayoutProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  children?: React.ReactNode;
};

export default function PageLayout({ title, subtitle, eyebrow, children }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Navigation />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-16">
        <PageHeader title={title} subtitle={subtitle} eyebrow={eyebrow} />
        {children}
      </main>
      <Footer />
    </div>
  );
}
