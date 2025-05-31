
import { useState } from 'react';
import { Send, Sparkles, Code, Rocket, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface HeroSectionProps {
  onIdeaSubmit: (idea: string) => void;
}

const HeroSection = ({ onIdeaSubmit }: HeroSectionProps) => {
  const [idea, setIdea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    setIsSubmitting(true);
    try {
      await onIdeaSubmit(idea.trim());
      setIdea('');
      toast({
        title: "Idea submitted!",
        description: "Your project is being created with AI assistance.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your idea. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exampleIdeas = [
    "Build a todo app with drag & drop functionality",
    "Create a weather dashboard with charts",
    "Design a personal finance tracker",
    "Build a recipe sharing platform"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="bg-gray-900 p-3 rounded-xl">
              <Code className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">AI Coding Agent</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your ideas into fully functional web applications with the power of AI
          </p>
        </div>

        {/* Main Input Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold text-gray-900 flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              What would you like to build today?
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Describe your app idea and watch AI bring it to life
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Describe your app idea in detail... For example: 'I want to build a task management app with team collaboration features, real-time updates, and a modern dashboard interface.'"
                  className="min-h-[120px] text-lg p-4 border-2 border-gray-200 focus:border-gray-900 resize-none"
                  disabled={isSubmitting}
                />
                <div className="absolute bottom-3 right-3 text-sm text-gray-400">
                  {idea.length}/1000
                </div>
              </div>
              
              <Button 
                type="submit" 
                size="lg"
                disabled={!idea.trim() || isSubmitting}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 text-lg font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Bot className="h-5 w-5 mr-2 animate-spin" />
                    Creating your project...
                  </>
                ) : (
                  <>
                    <Rocket className="h-5 w-5 mr-2" />
                    Build with AI
                  </>
                )}
              </Button>
            </form>

            {/* Example Ideas */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Need inspiration? Try these ideas:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {exampleIdeas.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setIdea(example)}
                    className="text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-sm text-gray-600"
                    disabled={isSubmitting}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm">
            <div className="bg-blue-100 p-3 rounded-lg w-fit mx-auto mb-4">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Development</h3>
            <p className="text-gray-600 text-sm">Advanced AI understands your requirements and builds functional code</p>
          </Card>
          
          <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm">
            <div className="bg-green-100 p-3 rounded-lg w-fit mx-auto mb-4">
              <Code className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Modern Tech Stack</h3>
            <p className="text-gray-600 text-sm">Built with React, TypeScript, and cutting-edge web technologies</p>
          </Card>
          
          <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm">
            <div className="bg-purple-100 p-3 rounded-lg w-fit mx-auto mb-4">
              <Rocket className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Instant Deployment</h3>
            <p className="text-gray-600 text-sm">Deploy your app instantly with one click to share with the world</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
