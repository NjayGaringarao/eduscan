import { Logo } from "@/components/Logo";
import { cn } from "@/utils/style";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans min-h-screen bg-background text-textBody relative">
      {/* Floating Menu */}
      <header className="fixed top-0 left-0 w-full bg-background/80 backdrop-blur-sm border-b border-secondary z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
          {/* Branding */}
          <div className="flex items-center gap-2">
            <Logo className="h-12 w-12" />

            <span className="text-primary font-bold text-lg">EDUSCAN</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-base text-textBody font-medium">
            <a href="#hero" className=" hover:text-primary hover:text-lg">
              Home
            </a>
            <a href="#about" className="hover:text-primary hover:text-lg">
              About
            </a>
            <a
              href="#announcement"
              className="hover:text-primary hover:text-lg"
            >
              Announcement
            </a>
            <a href="#contact" className="hover:text-primary hover:text-lg">
              Contact
            </a>
          </nav>

          <Link
            href="/auth"
            className={cn(
              "p-1 md:px-4 rounded-lg shadow-lg",
              "hover:shadow-[0_0_4px_1px_var(--tw-shadow-color)] hover:shadow-primary/70 hover:scale-102 ",
              "transition-all transform duration-200",
              "text-base font-semibold",
              "flex flex-row gap-2 items-center justify-center",
              "border border-primary",
              "bg-transparent text-primary"
            )}
          >
            Admin Console
          </Link>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section
          id="hero"
          className={cn(
            "relative h-screen px-6",
            "flex flex-col justify-center items-center text-center "
          )}
        >
          {/** TODO: Implement a background video that utilizes the kiosk and the admin who manages it. Make it epic! */}
          {/* <Image
            src={"/image/prmsu-foreground.png"}
            alt="PRMSU Logo"
            width={1080}
            height={1920}
            className="absolute h-screen w-full opacity-20"
          />
          <div className="absolute h-screen w-full backdrop-blur-xs" /> */}
          <div
            className={cn(
              "z-20 px-6",
              "flex flex-col justify-center items-start",
              "text-start"
            )}
          >
            <div className="flex flex-row gap-4 mb-4 opacity-80">
              <Logo className="h-28 w-28" />
              <Image
                src={"/image/prmsu.png"}
                alt="PRMSU Logo"
                width={512}
                height={512}
                className="w-28 contain-content"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6">
              Welcome Ramonians!
            </h1>
            <p className="max-w-4xl text-lg text-textBody mb-8">
              EDUSCAN: ADVANCE STUDENT AND EMPLOYEE TRACKING SYSTEM WITH FACIAL
              RECOGNITION TECHNOLOGY OF PRMSU - CASTILLEJOS CAMPUS
            </p>
            <a
              href="#about"
              className={cn(
                "px-6 py-2 rounded-xl bg-primary",
                "text-background text-lg",
                "hover:opacity-90 transition"
              )}
            >
              Learn More
            </a>
          </div>
        </section>

        {/* About Section */}
        <section
          id="about"
          className="bg-secondary py-36 px-6 mx-auto flex flex-col items-center"
        >
          <div className="flex flex-col max-w-5xl text-center">
            <h2 className="text-3xl font-semibold text-primary mb-4">
              About Eduscan
            </h2>
            <p className="text-lg text-textBody leading-relaxed">
              Eduscan is a system that provides the capability of recording and
              tracking campus attendance. This system utilizes facial
              recognition technology to ease the process for both students and
              employees, ensuring secure and efficient monitoring. Designed for
              PRMSU - Castillejos Campus, Eduscan streamlines attendance
              management, reduces manual errors, and enhances campus
              configuration.
            </p>
          </div>
        </section>

        {/* Announcement Section */}
        <section
          id="announcement"
          className="py-36 px-6 max-w-5xl mx-auto text-center"
        >
          <h2 className="text-3xl font-semibold text-primary mb-8">
            Announcements
          </h2>
          <div className="space-y-6">
            <article className="p-6 rounded-2xl bg-secondary/5 border border-secondary/20 shadow-sm">
              <h3 className="font-semibold text-lg text-primary mb-2">
                New Feature Release
              </h3>
              <p className="text-textBody">
                Our kiosk app is now available for download. Experience smoother
                attendance tracking!
              </p>
            </article>
            <article className="p-6 rounded-2xl bg-secondary/5 border border-secondary/20 shadow-sm">
              <h3 className="font-semibold text-lg text-primary mb-2">
                Scheduled Maintenance
              </h3>
              <p className="text-textBody">
                The system will undergo maintenance this weekend to improve
                reliability.
              </p>
            </article>
          </div>
        </section>

        {/* Contact Section */}
        <section
          id="contact"
          className="bg-secondary py-36 px-6 mx-auto flex flex-col items-center"
        >
          <div className="flex flex-col max-w-5xl text-center">
            <h2 className="text-3xl font-semibold text-primary mb-4">
              Contact Us
            </h2>
            <p className="text-textBody mb-6">
              Have questions or need support? Reach out to us anytime.
            </p>
            <a
              href="mailto:support@eduscan.com"
              className="px-6 py-3 rounded-xl bg-primary text-background text-lg hover:opacity-90 transition"
            >
              Email Support
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
