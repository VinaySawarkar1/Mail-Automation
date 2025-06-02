import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Home, Mail } from "lucide-react";
import { Link } from "wouter";

export default function WaitingApproval() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <img 
          src="https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400" 
          alt="Waiting for approval illustration" 
          className="mx-auto mb-8 rounded-2xl shadow-lg w-full max-w-md" 
        />
        
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-secondary mb-6">Waiting for Admin Approval</h1>
          
          <Card className="bg-yellow-50 border border-yellow-200 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-yellow-500 mr-3" />
                <span className="text-yellow-700 font-semibold text-lg">Account Under Review</span>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                Your account is awaiting administrator approval. You will receive an email notification once your access has been granted. This process typically takes 24-48 hours during business days.
              </p>
            </CardContent>
          </Card>
          
          <div className="space-y-4">
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 h-auto transform hover:scale-105 transition-all duration-200">
                <Home className="w-5 h-5 mr-2" />
                Return to Home
              </Button>
            </Link>
            
            <p className="text-gray-600">
              Need help? Contact our support team at{" "}
              <a 
                href="mailto:vinaysawarkar19@gmail.com" 
                className="text-primary hover:underline font-medium"
              >
                vinaysawarkar19@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
