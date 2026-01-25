import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { APP_NAME } from "@/lib/constants";

export default function About() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container py-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-display font-bold mb-4">About {APP_NAME}</h1>
          <p className="text-muted-foreground mb-6">
            {APP_NAME} is Pakistan's premier Shariah-compliant investment platform. We help investors pool capital
            to fund ethical businesses and share profits in a halal way.
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Our Mission</h2>
            <p className="text-muted-foreground">To make halal investing accessible, transparent, and impactful.</p>

            <h2 className="text-xl font-semibold">What We Do</h2>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>Screen businesses for Shariah compliance</li>
              <li>Pool investor capital into vetted projects</li>
              <li>Provide clear profit-sharing and reporting</li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}