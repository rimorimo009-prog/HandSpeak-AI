import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-sign-language.jpg";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Image Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.6)), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
          HandSpeak AI
        </h1>

        <p className="text-xl md:text-2xl text-white/95 mb-12 max-w-2xl drop-shadow-md">
          Bridge communication gaps with AI-powered sign language recognition
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* ✅ Get Started → Auth (Login/Signup) */}
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg"
            onClick={() => navigate("/auth")}
          >
            Get Started
          </Button>

          {/* ✅ Try as Guest → Direct Home (no login screen) */}
          <Button
            size="lg"
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border-2 border-white/50 px-8 py-6 text-lg"
            onClick={() => navigate("/home")}
          >
            Try as Guest
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
