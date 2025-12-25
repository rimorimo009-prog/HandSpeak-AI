import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Star, HelpCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const feedbackSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000),
  rating: z.number().min(1, "Please provide a rating").max(5)
});

const Feedback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      feedbackSchema.parse({ name, email, message, rating });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0].message,
        });
        return;
      }
    }

    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase.from('feedback').insert({
      user_id: session?.user.id || null,
      name: name.trim(),
      email: email.trim(),
      message: `Rating: ${rating}/5\n\n${message.trim()}`
    });

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
      });
    } else {
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });
      setName("");
      setEmail("");
      setMessage("");
      setRating(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/5">
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Help & Feedback</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Help Section */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <CardTitle>Need Help?</CardTitle>
              </div>
              <CardDescription>Quick guide to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  Real-Time Detection
                </h3>
                <p className="text-sm text-muted-foreground ml-8">
                  Allow camera access, show sign language gestures, and click "Capture & Predict" for instant recognition.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  Static Image Upload
                </h3>
                <p className="text-sm text-muted-foreground ml-8">
                  Upload a photo containing sign language and click "Predict Sign" to get results.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                  View History
                </h3>
                <p className="text-sm text-muted-foreground ml-8">
                  Access prediction history to review past results, play audio, and delete entries.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                  Manage Profile
                </h3>
                <p className="text-sm text-muted-foreground ml-8">
                  Update your username and profile picture from the Profile page.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips Card */}
          <Card className="border-accent/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-accent" />
                <CardTitle>Pro Tips</CardTitle>
              </div>
              <CardDescription>Get the best results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="bg-accent/10 text-accent rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <p className="text-sm text-muted-foreground">
                  Ensure good lighting when capturing images for better accuracy
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="bg-accent/10 text-accent rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <p className="text-sm text-muted-foreground">
                  Position your hand clearly in the center of the frame
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="bg-accent/10 text-accent rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <p className="text-sm text-muted-foreground">
                  Use a plain background for clearer sign recognition
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="bg-accent/10 text-accent rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <p className="text-sm text-muted-foreground">
                  Check your confidence level - higher percentages mean more accurate predictions
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Form */}
        <Card className="shadow-xl border-2 border-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl">Share Your Feedback</CardTitle>
            <CardDescription>
              We value your opinion! Help us improve HandSpeak AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating Section */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">How would you rate your experience?</Label>
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                    >
                      <Star
                        className={`h-10 w-10 transition-colors ${
                          star <= (hoveredStar || rating)
                            ? "fill-primary text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-3 text-sm font-medium text-primary">
                      {rating === 5 ? "Excellent!" : rating === 4 ? "Great!" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Needs Improvement"}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    maxLength={100}
                    className="border-muted-foreground/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    maxLength={255}
                    className="border-muted-foreground/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Your Feedback</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you think about HandSpeak AI..."
                  rows={6}
                  required
                  maxLength={1000}
                  className="border-muted-foreground/20 resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/1000 characters
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold shadow-lg" 
                disabled={loading || rating === 0}
              >
                {loading ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Feedback;
