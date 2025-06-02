import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { loginSchema, registerSchema, type LoginData, type RegisterData } from "@shared/schema";
import { UserPlus, LogIn, Mail, Settings } from "lucide-react";

export default function AuthModals() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const { toast } = useToast();
  const { login, register } = useAuth();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: ""
    }
  });

  const forgotPasswordForm = useForm({
    defaultValues: {
      email: ""
    }
  });

  const resetPasswordForm = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: ""
    }
  });

  // Listen for custom events to open modals
  useEffect(() => {
    const openLoginModal = () => setLoginOpen(true);
    const openRegisterModal = () => setRegisterOpen(true);
    const openForgotPasswordModal = () => setForgotPasswordOpen(true);
    const openResetPasswordModal = () => setResetPasswordOpen(true);

    window.addEventListener('openLoginModal', openLoginModal);
    window.addEventListener('openRegisterModal', openRegisterModal);
    window.addEventListener('openForgotPasswordModal', openForgotPasswordModal);
    window.addEventListener('openResetPasswordModal', openResetPasswordModal);

    // Check for reset token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    if (resetToken) {
      setResetPasswordOpen(true);
    }

    return () => {
      window.removeEventListener('openLoginModal', openLoginModal);
      window.removeEventListener('openRegisterModal', openRegisterModal);
      window.removeEventListener('openForgotPasswordModal', openForgotPasswordModal);
      window.removeEventListener('openResetPasswordModal', openResetPasswordModal);
    };
  }, []);

  const onLoginSubmit = async (data: LoginData) => {
    try {
      await login(data);
      setLoginOpen(false);
      loginForm.reset();
      toast({ title: "Login successful!" });
    } catch (error: any) {
      toast({ 
        title: "Login failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const onRegisterSubmit = async (data: RegisterData) => {
    try {
      await register(data);
      setRegisterOpen(false);
      registerForm.reset();
      toast({ 
        title: "Registration successful!", 
        description: "Please wait for admin approval." 
      });
    } catch (error: any) {
      toast({ 
        title: "Registration failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const switchToRegister = () => {
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  const switchToLogin = () => {
    setRegisterOpen(false);
    setLoginOpen(true);
  };

  const switchToForgotPassword = () => {
    setLoginOpen(false);
    setForgotPasswordOpen(true);
  };

  const onForgotPasswordSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (response.ok) {
        setForgotPasswordOpen(false);
        forgotPasswordForm.reset();
        toast({ 
          title: "Reset link sent!", 
          description: result.message 
        });
      } else {
        toast({ 
          title: "Error", 
          description: result.message, 
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: "Failed to send reset email. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const onResetPasswordSubmit = async (data: any) => {
    try {
      if (data.newPassword !== data.confirmPassword) {
        toast({ 
          title: "Error", 
          description: "Passwords do not match", 
          variant: "destructive" 
        });
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const resetToken = urlParams.get('token');

      if (!resetToken) {
        toast({ 
          title: "Error", 
          description: "Invalid reset token", 
          variant: "destructive" 
        });
        return;
      }

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: resetToken, 
          newPassword: data.newPassword 
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setResetPasswordOpen(false);
        resetPasswordForm.reset();
        
        // Clear token from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        toast({ 
          title: "Password reset successful!", 
          description: result.message 
        });
        
        // Open login modal
        setTimeout(() => setLoginOpen(true), 1000);
      } else {
        toast({ 
          title: "Error", 
          description: result.message, 
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: "Failed to reset password. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <>
      {/* Login Modal */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-secondary">
              <LogIn className="w-5 h-5 mr-2" />
              Login
            </DialogTitle>
          </DialogHeader>
          
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loginForm.formState.isSubmitting}
              >
                {loginForm.formState.isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
          
          <div className="text-center mt-6 space-y-3">
            <p className="text-gray-600">
              <button 
                onClick={switchToForgotPassword}
                className="text-primary hover:underline font-medium"
              >
                Forgot your password?
              </button>
            </p>
            <p className="text-gray-600">
              Don't have an account?{" "}
              <button 
                onClick={switchToRegister}
                className="text-primary hover:underline font-medium"
              >
                Register here
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-secondary">
              <UserPlus className="w-5 h-5 mr-2" />
              Register
            </DialogTitle>
          </DialogHeader>
          
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Choose username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={registerForm.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Enter mobile number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Create password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={registerForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={registerForm.formState.isSubmitting}
              >
                {registerForm.formState.isSubmitting ? "Registering..." : "Register"}
              </Button>
            </form>
          </Form>
          
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{" "}
              <button 
                onClick={switchToLogin}
                className="text-primary hover:underline font-medium"
              >
                Login here
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Modal */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-secondary">
              <Mail className="w-5 h-5 mr-2" />
              Forgot Password
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="Enter your email address"
                {...forgotPasswordForm.register("email", { required: "Email is required" })}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={forgotPasswordForm.formState.isSubmitting}
            >
              {forgotPasswordForm.formState.isSubmitting ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Remember your password?{" "}
              <button 
                onClick={switchToLogin}
                className="text-primary hover:underline font-medium"
              >
                Back to login
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-secondary">
              <Settings className="w-5 h-5 mr-2" />
              Reset Password
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <Input
                type="password"
                placeholder="Enter new password"
                {...resetPasswordForm.register("newPassword", { 
                  required: "Password is required",
                  minLength: { value: 6, message: "Password must be at least 6 characters" }
                })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <Input
                type="password"
                placeholder="Confirm new password"
                {...resetPasswordForm.register("confirmPassword", { 
                  required: "Please confirm your password"
                })}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={resetPasswordForm.formState.isSubmitting}
            >
              {resetPasswordForm.formState.isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
