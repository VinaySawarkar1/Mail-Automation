import { Link } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Send, 
  Users, 
  BarChart3, 
  Shield, 
  Zap, 
  Star, 
  CheckCircle, 
  ArrowRight, 
  Globe, 
  Smartphone, 
  Clock, 
  TrendingUp,
  Target,
  Layers,
  Briefcase,
  Award
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function EnhancedHome() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // SEO optimization - Dynamic meta tags
    document.title = "Mail Automation Platform | Professional Email Marketing Solutions";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Professional email automation platform with AI-powered suggestions, advanced analytics, and real-time scheduling. Send thousands of emails effortlessly with our secure, scalable solution.");
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = "Professional email automation platform with AI-powered suggestions, advanced analytics, and real-time scheduling. Send thousands of emails effortlessly with our secure, scalable solution.";
      document.head.appendChild(meta);
    }

    // Add structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Mail Automation Platform",
      "description": "Professional email marketing and automation software",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "150"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Content",
      description: "Smart email suggestions and grammar correction powered by advanced AI",
      color: "text-yellow-600"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive tracking with real-time campaign performance insights",
      color: "text-blue-600"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and secure authentication for all communications",
      color: "text-green-600"
    },
    {
      icon: Clock,
      title: "Smart Scheduling",
      description: "Automated email scheduling with timezone optimization",
      color: "text-purple-600"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Send emails worldwide with localization and compliance support",
      color: "text-red-600"
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Responsive templates that look perfect on all devices",
      color: "text-indigo-600"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Director",
      company: "TechCorp Inc.",
      content: "This platform transformed our email marketing. The AI suggestions alone saved us hours of work.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Small Business Owner",
      company: "Local Services",
      content: "Easy to use, powerful features, and excellent customer support. Highly recommended!",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Digital Marketer",
      company: "Growth Agency",
      content: "The analytics dashboard provides insights we never had before. ROI increased by 300%.",
      rating: 5
    }
  ];

  const stats = [
    { number: "10M+", label: "Emails Sent", icon: Send },
    { number: "50K+", label: "Active Users", icon: Users },
    { number: "99.9%", label: "Uptime", icon: TrendingUp },
    { number: "4.8/5", label: "User Rating", icon: Star }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Email Automation
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-secondary mb-6 leading-tight">
              Transform Your 
              <span className="text-primary"> Email Marketing</span>
              <br />with Advanced Automation
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Send thousands of personalized emails effortlessly with our AI-powered platform. 
              Get real-time analytics, smart scheduling, and professional templates that convert.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {!user ? (
                <>
                  <Button size="lg" className="bg-primary hover:bg-primary/90 px-8 py-4 text-lg">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                    Watch Demo
                  </Button>
                </>
              ) : (
                <Link href="/automation">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 px-8 py-4 text-lg">
                    <Mail className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
              )}
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">
                    <stat.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-secondary mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              Powerful Features for Modern Email Marketing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to create, send, and track professional email campaigns
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <CardHeader>
                  <div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-800 w-fit ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Get started in minutes with our simple 3-step process
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Create Campaign</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Design beautiful emails with our AI-powered editor and professional templates
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Add Recipients</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Upload your contact lists via Excel/CSV or manually add recipients
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Send & Track</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Schedule your emails and monitor performance with real-time analytics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Join thousands of satisfied customers who trust our platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Email Marketing?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses already using our platform to grow their audience
          </p>
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="px-8 py-4 text-lg">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-primary">
                Contact Sales
              </Button>
            </div>
          ) : (
            <Link href="/automation">
              <Button size="lg" variant="secondary" className="px-8 py-4 text-lg">
                <Mail className="w-5 h-5 mr-2" />
                Start Creating Campaigns
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}