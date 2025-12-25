import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Camera,
  Image,
  History,
  User,
  MessageCircle,
  LogOut,
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    // logged-in user ke liye sign out, guest ke liye ye harmless hai
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-accent/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">HandSpeak AI</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Welcome to HandSpeak AI</h2>
            <p className="text-muted-foreground">
              Choose how you'd like to recognize sign language
            </p>
          </div>

          {/* Main Options */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => navigate("/realtime")}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Real-Time Detection</CardTitle>
                <CardDescription>
                  Use your camera to recognize sign language in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Start Camera</Button>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => navigate("/static")}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Image className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Static Image</CardTitle>
                <CardDescription>
                  Upload an image to recognize sign language
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">
                  Upload Image
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access Links */}
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="flex flex-col h-auto py-6 gap-2"
              onClick={() => navigate("/history")}
            >
              <History className="w-6 h-6" />
              <span>History</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col h-auto py-6 gap-2"
              onClick={() => navigate("/profile")}
            >
              <User className="w-6 h-6" />
              <span>Profile</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col h-auto py-6 gap-2"
              onClick={() => navigate("/feedback")}
            >
              <MessageCircle className="w-6 h-6" />
              <span>Feedback</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
