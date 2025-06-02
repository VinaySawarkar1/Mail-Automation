import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, TrendingUp, Users, Globe, Rocket } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user } = useAuth();

  const benefits = [
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Time-Saving",
      description: "Automate repetitive email tasks and focus on strategy rather than manual sending.",
      bgColor: "bg-primary/10",
      iconColor: "text-primary"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Increased Efficiency",
      description: "Process thousands of emails simultaneously with advanced scheduling and batching.",
      bgColor: "bg-secondary/10",
      iconColor: "text-secondary"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Personalized Communication",
      description: "Customize emails with dynamic content and personalized messaging.",
      bgColor: "bg-primary/10",
      iconColor: "text-primary"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Wider Reach",
      description: "Connect with unlimited recipients across multiple platforms and formats.",
      bgColor: "bg-secondary/10",
      iconColor: "text-secondary"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Register & Get Approved",
      description: "Create your account and wait for admin approval to ensure platform security."
    },
    {
      number: "2", 
      title: "Upload Recipient Lists",
      description: "Import your Excel or CSV files containing recipient email addresses."
    },
    {
      number: "3",
      title: "Design Your Email",
      description: "Create compelling email content with images, attachments, and rich formatting."
    },
    {
      number: "4",
      title: "Schedule & Send",
      description: "Set your preferred timing and let our platform handle the delivery."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-white to-bgLight rounded-2xl mb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center px-8">
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold text-secondary leading-tight">
              Mail <span className="text-primary">Automation</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Streamline your email campaigns with our powerful automation platform. Send personalized emails to thousands of recipients effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white font-semibold text-lg px-8 py-4 h-auto transform hover:scale-105 transition-all duration-200"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-secondary text-secondary hover:bg-secondary hover:text-white font-semibold text-lg px-8 py-4 h-auto transition-all duration-200"
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Email automation dashboard" 
              className="rounded-2xl shadow-2xl w-full h-auto transform hover:scale-105 transition-transform duration-300" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-2xl"></div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white rounded-2xl mb-16">
        <div className="px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary mb-4">Benefits of Mail Automation</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how our platform can transform your email marketing strategy
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 ${benefit.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
                    <div className={benefit.iconColor}>
                      {benefit.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-secondary mb-4">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-20 bg-bgLight rounded-2xl">
        <div className="px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary mb-4">How to Use This Tool</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Follow these simple steps to start automating your email campaigns
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-secondary mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                alt="Email marketing analytics dashboard" 
                className="rounded-2xl shadow-2xl w-full h-auto" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Video Tutorial Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl mb-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-secondary mb-4">How to Use Mail Automation</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Watch our step-by-step tutorial to get started with email automation
          </p>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.68L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Tutorial Video Coming Soon</h3>
                  <p className="text-gray-500">Upload your tutorial video to showcase how to use the platform</p>
                  <div className="mt-4 text-sm text-gray-400">
                    Recommended: MP4 format, 1080p resolution
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-secondary mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to run successful email campaigns
          </p>
        </div>
      </section>
    </div>
  );
}