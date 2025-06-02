import { Mail, User, Phone, AtSign } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-secondary text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Mail className="text-primary text-2xl" />
              <span className="text-xl font-bold">Mail Automation</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Streamline your email campaigns with our powerful automation platform. Send personalized emails to thousands of recipients effortlessly.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Home
                </a>
              </li>
              <li>
                <a href="/automation" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Mail Automation
                </a>
              </li>
              <li>
                <a href="/admin" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Admin
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Vinay Sawarkar</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>8329925318</span>
              </div>
              <div className="flex items-center space-x-2">
                <AtSign className="w-4 h-4" />
                <a 
                  href="mailto:vinaysawarkar19@gmail.com" 
                  className="hover:text-white transition-colors duration-200"
                >
                  vinaysawarkar19@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-600 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            &copy; 2024 Mail Automation Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
