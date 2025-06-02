import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  validateEmails,
  readExcelFile,
  parseEmailAddresses,
} from "@/lib/email-utils";
import { RichTextEditor } from "@/components/rich-text-editor";
import { EmailPreview } from "@/components/email-preview";
import {
  Mail,
  Upload,
  Send,
  Calendar,
  Clock,
  FileText,
  Plus,
  Save,
  Download,
  Users,
  Settings,
  BarChart3,
  Target,
  Zap,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Paperclip,
  X,
  Eye,
  Copy,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Layers,
  Edit,
  Image,
  Trash2,
} from "lucide-react";

const emailFormSchema = z.object({
  senderEmail: z.string().email("Invalid email address"),
  senderPassword: z.string().min(1, "Password is required"),
  subject: z.string().min(1, "Subject is required"),
  ccAddress: z.string().email().optional().or(z.literal("")),
  bccAddress: z.string().email().optional().or(z.literal("")),
  bccCcCount: z.number().min(0).default(0),
  bccCcType: z.enum(["BCC", "CC"]).default("BCC"),
  fontFamily: z.string().default("Times New Roman"),
  bodyPart1: z.string().default(""),
  bodyFooter: z.string().default(""),
  sheetName: z.string().default("Sheet1"),
  emailColumn: z.string().default("ContactEmail"),
  scheduleDate: z.string().optional(),
  scheduleTime: z.string().optional(),
  templateName: z.string().optional(),
});

type EmailFormData = z.infer<typeof emailFormSchema>;

export default function MailAutomation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [emailData, setEmailData] = useState({
    bodyPart1: "",
    bodyFooter: "",
  });

  const [recipientList, setRecipientList] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentNames, setAttachmentNames] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [columnName, setColumnName] = useState("");
  const [showImportConfig, setShowImportConfig] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const [validEmails, setValidEmails] = useState<string[]>([]);
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);
  const [consoleMessages, setConsoleMessages] = useState<string[]>([
    "Mail Automation Console",
    "Ready to process emails...",
  ]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
  const [emailStats, setEmailStats] = useState({
    valid: 0,
    invalid: 0,
    sent: 0,
  });

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      senderEmail: "",
      senderPassword: "",
      subject: "",
      ccAddress: "",
      bccAddress: "",
      bccCcCount: 0,
      bccCcType: "BCC",
      fontFamily: "Times New Roman",
      bodyPart1: "",
      bodyFooter: "",
      sheetName: "Sheet1",
      emailColumn: "ContactEmail",
      scheduleDate: "",
      scheduleTime: "",
      templateName: "",
    },
  });

  // Fetch templates
  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["/api/templates"],
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/templates", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Template saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Schedule email mutation
  const scheduleEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/scheduled-emails", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Email scheduled successfully!" });
      addConsoleMessage("Email scheduled for future delivery");
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error scheduling email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send emails mutation
  const sendEmailsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "POST",
        "/api/emails/simulate-send",
        data,
      );
      return await response.json();
    },
    onSuccess: (data: any) => {
      console.log("Email response data:", data);

      const sentCount = data?.sentCount ?? 0;
      const failedCount = data?.failedCount ?? 0;
      const totalEmails = data?.totalEmails ?? validEmails.length;

      // Update statistics regardless of count
      setEmailStats((prev) => ({
        ...prev,
        sent: sentCount,
      }));

      addConsoleMessage(`Email sending completed!`);
      addConsoleMessage(
        `${sentCount} emails sent successfully, ${failedCount} failed out of ${totalEmails} total`,
      );

      if (sentCount > 0) {
        toast({
          title: "Email sending completed!",
          description: `${sentCount} emails sent successfully${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
        });
      } else {
        toast({
          title: "No emails sent",
          description: "Please check your email configuration and try again",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Error sending emails:", error);
      toast({
        title: "Error scheduling email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addConsoleMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleMessages((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const parseRecipientEmails = (text: string): string[] => {
    const parsed = parseEmailAddresses(text);
    return parsed.map((item) => item.email);
  };

  const handleImageInsert = (file: File) => {
    setSelectedImage(file);
    addConsoleMessage(`Image "${file.name}" selected for email`);
  };

  // Check if images exist in editor content
  const checkImagesInContent = () => {
    const bodyPart1 = form.getValues("bodyPart1");
    const bodyFooter = form.getValues("bodyFooter");

    const hasImages =
      (bodyPart1 && bodyPart1.includes("<img")) ||
      (bodyFooter && bodyFooter.includes("<img"));

    if (!hasImages && selectedImage) {
      setSelectedImage(null);
      addConsoleMessage("Image removed from email content");
    }
  };

  // Watch for content changes to update image status
  React.useEffect(() => {
    const subscription = form.watch(() => {
      checkImagesInContent();
    });
    return () => subscription.unsubscribe();
  }, [form, selectedImage]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setShowImportConfig(true);
    }
  };

  const handleImportEmails = async () => {
    if (!uploadedFile || !columnName) {
      toast({
        title: "Missing Information",
        description: "Please provide column name",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await readExcelFile(uploadedFile, sheetName || undefined);
      const emails = data
        .map((row) => row[columnName])
        .filter((email) => email && typeof email === "string")
        .join("\n");

      setRecipientList(emails);

      // Validate the imported emails
      const validation = validateEmails(emails);
      setValidEmails(validation.valid);
      setInvalidEmails(validation.invalid);
      setEmailStats((prev) => ({
        ...prev,
        valid: validation.valid.length,
        invalid: validation.invalid.length,
      }));

      setShowImportConfig(false);
      setUploadedFile(null);
      setSheetName("");
      setColumnName("");

      addConsoleMessage(
        `Imported ${validation.valid.length} valid emails, ${validation.invalid.length} invalid emails`,
      );

      toast({
        title: "Import Successful",
        description: `Imported ${validation.valid.length} valid email addresses`,
      });
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      addConsoleMessage(`Image selected: ${file.name}`);
    }
  };

  const handleAttachmentUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    setSelectedAttachments((prev) => [...prev, ...files]);
    files.forEach((file) =>
      addConsoleMessage(`Attachment added: ${file.name}`),
    );
  };

  const clearAttachments = () => {
    setSelectedAttachments([]);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
    addConsoleMessage("All attachments cleared");
  };

  const saveTemplate = () => {
    const templateName = form.getValues("templateName");
    if (!templateName) {
      toast({ title: "Please enter a template name", variant: "destructive" });
      return;
    }

    const formData = form.getValues();
    saveTemplateMutation.mutate({
      name: templateName,
      subject: formData.subject,
      bodyPart1: formData.bodyPart1,
      bodyFooter: formData.bodyFooter,
      fontFamily: formData.fontFamily,
      ccAddress: formData.ccAddress,
      bccAddress: formData.bccAddress,
      attachmentNames: selectedAttachments.map((f) => f.name),
    });
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find((t: any) => t.id === templateId);
    if (template) {
      form.setValue("subject", template.subject);
      form.setValue("bodyPart1", template.bodyPart1);
      form.setValue("bodyFooter", template.bodyFooter);
      form.setValue("fontFamily", template.fontFamily);
      form.setValue("ccAddress", template.ccAddress || "");
      form.setValue("bccAddress", template.bccAddress || "");
      addConsoleMessage(`Template "${template.name}" loaded`);
    }
  };

  const scheduleEmail = () => {
    const formData = form.getValues();
    if (!formData.scheduleDate || !formData.scheduleTime) {
      toast({ title: "Please select date and time", variant: "destructive" });
      return;
    }

    // Validate that the scheduled time is in the future
    const now = new Date();
    const scheduledDateTime = new Date(
      `${formData.scheduleDate}T${formData.scheduleTime}`,
    );

    if (scheduledDateTime <= now) {
      toast({
        title: "Please select a future date and time",
        variant: "destructive",
      });
      return;
    }

    addConsoleMessage(
      `Scheduling email for ${formData.scheduleDate} at ${formData.scheduleTime} (24-hour format)`,
    );

    scheduleEmailMutation.mutate({
      subject: formData.subject,
      bodyPart1: formData.bodyPart1,
      bodyFooter: formData.bodyFooter,
      fontFamily: formData.fontFamily,
      ccAddress: formData.ccAddress,
      bccAddress: formData.bccAddress,
      bccCcCount: formData.bccCcCount,
      bccCcType: formData.bccCcType,
      attachmentNames: selectedAttachments.map((f) => f.name),
      scheduledDate: formData.scheduleDate,
      scheduledTime: formData.scheduleTime,
    });
  };

  const sendEmailsNow = () => {
    if (validEmails.length === 0) {
      toast({
        title: "No valid emails to send",
        description: "Please import emails first",
        variant: "destructive",
      });
      addConsoleMessage("Error: No valid emails imported");
      return;
    }

    const formData = form.getValues();
    if (!formData.subject || !formData.senderEmail) {
      toast({
        title: "Missing required fields",
        description: "Please fill in subject and sender email",
        variant: "destructive",
      });
      addConsoleMessage("Error: Missing required email configuration");
      return;
    }

    if (!formData.senderPassword) {
      toast({
        title: "Missing password",
        description: "Please enter your email password",
        variant: "destructive",
      });
      addConsoleMessage("Error: Email password not provided");
      return;
    }

    addConsoleMessage(
      `Starting email send to ${validEmails.length} recipients...`,
    );
    addConsoleMessage(`Subject: ${formData.subject}`);
    addConsoleMessage(`Sender: ${formData.senderEmail}`);

    const requestData = {
      validEmails,
      emailData: formData,
    };

    console.log("About to send email request with:", requestData);

    sendEmailsMutation.mutate(requestData);
  };

  // Handle manual email input
  const handleManualEmailInput = (emailText: string) => {
    setRecipientList(emailText);
    const validation = validateEmails(emailText);
    setValidEmails(validation.valid);
    setInvalidEmails(validation.invalid);
    setEmailStats((prev) => ({
      ...prev,
      valid: validation.valid.length,
      invalid: validation.invalid.length,
    }));

    if (validation.valid.length > 0 || validation.invalid.length > 0) {
      addConsoleMessage(
        `Processed ${validation.valid.length} valid emails, ${validation.invalid.length} invalid emails`,
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-secondary mb-2">
          Mail Automation Tool
        </h1>
        <p className="text-lg text-gray-600">
          Configure and send your email campaigns
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            {/* Email Configuration Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-secondary">
                  <Settings className="w-5 h-5 mr-2 text-primary" />
                  Email Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="senderEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="your.email@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="senderPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="App password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ccAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CC Address (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="cc@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bccAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BCC Address (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="bcc@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* File Upload Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-secondary">
                  <FileText className="w-5 h-5 mr-2 text-primary" />
                  Recipient List
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {showImportConfig && (
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h3 className="font-semibold mb-3">Import Configuration</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sheetName">Sheet Name</Label>
                        <Input
                          id="sheetName"
                          value={sheetName}
                          onChange={(e) => setSheetName(e.target.value)}
                          placeholder="Sheet1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="columnName">Email Column Name</Label>
                        <Input
                          id="columnName"
                          value={columnName}
                          onChange={(e) => setColumnName(e.target.value)}
                          placeholder="ContactEmail"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button onClick={handleImportEmails}>
                        Import Emails
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowImportConfig(false);
                          setUploadedFile(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-secondary hover:bg-secondary/90"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </div>

                <div>
                  <Label htmlFor="recipientList">
                    Or Enter Email Addresses Manually
                  </Label>
                  <Textarea
                    id="recipientList"
                    placeholder="Enter email addresses separated by commas, semicolons, or new lines"
                    value={recipientList}
                    onChange={(e) => handleManualEmailInput(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="bccCcCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Multiple BCC/CC Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bccCcType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="BCC">BCC</SelectItem>
                            <SelectItem value="CC">CC</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end">
                    <span className="text-sm text-gray-600 pb-2">
                      recipients per email
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Content Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-secondary">
                  <Edit className="w-5 h-5 mr-2 text-primary" />
                  Email Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Line</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email subject" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fontFamily"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Font Family</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">
                            Times New Roman
                          </SelectItem>
                          <SelectItem value="Courier New">
                            Courier New
                          </SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bodyPart1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Body (Part 1)</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          onImageInsert={handleImageInsert}
                          placeholder="Enter the first part of your email content..."
                          rows={6}
                          id="bodyPart1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <Label>Email Image</Label>
                  <div className="flex items-center space-x-3 mt-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      ref={imageInputRef}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <Image className="w-4 h-4 mr-2" />
                      Select Image
                    </Button>
                    {selectedImage && (
                      <span className="text-sm text-gray-600">
                        {selectedImage.name}
                      </span>
                    )}
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="bodyFooter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Body (Footer)</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          onImageInsert={handleImageInsert}
                          placeholder="Enter the footer part of your email content..."
                          rows={6}
                          id="bodyFooter"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <Label>Attachments</Label>
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center space-x-3">
                      <Input
                        type="file"
                        multiple
                        onChange={handleAttachmentUpload}
                        ref={attachmentInputRef}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => attachmentInputRef.current?.click()}
                      >
                        <Paperclip className="w-4 h-4 mr-2" />
                        Add Attachments
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearAttachments}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                    {selectedAttachments.length > 0 && (
                      <div className="space-y-2">
                        {selectedAttachments.map((file, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 p-3 rounded-lg text-sm"
                          >
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Templates Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-secondary">
                  <Save className="w-5 h-5 mr-2 text-primary" />
                  Email Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Load Template</Label>
                    <Select onValueChange={loadTemplate}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template: any) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Save Template</Label>
                    <div className="flex items-center space-x-3 mt-2">
                      <FormField
                        control={form.control}
                        name="templateName"
                        render={({ field }) => (
                          <FormControl>
                            <Input placeholder="Template name" {...field} />
                          </FormControl>
                        )}
                      />
                      <Button
                        type="button"
                        onClick={saveTemplate}
                        className="bg-secondary hover:bg-secondary/90"
                        disabled={saveTemplateMutation.isPending}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scheduling Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-secondary">
                  <Calendar className="w-5 h-5 mr-2 text-primary" />
                  Schedule Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduleDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date (YYYY-MM-DD)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="scheduleTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time (24-hour format)</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            step="60"
                            {...field}
                            className="[&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={scheduleEmail}
                      className="w-full bg-secondary hover:bg-secondary/90"
                      disabled={scheduleEmailMutation.isPending}
                    >
                      Schedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Form>
        </div>

        {/* Right Column - Stats and Console */}
        <div className="space-y-6">
          {/* Send Button */}
          <Card className="shadow-lg">
            <CardContent className="p-6 space-y-3">
              <EmailPreview
                subject={form.watch("subject") || "Your Email Subject"}
                bodyPart1={form.watch("bodyPart1") || ""}
                bodyFooter={form.watch("bodyFooter") || ""}
                fontFamily={form.watch("fontFamily") || "Times New Roman"}
                senderEmail={form.watch("senderEmail") || "sender@example.com"}
                recipientEmail={validEmails[0]}
                selectedImage={selectedImage}
              />
              <Button
                onClick={sendEmailsNow}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg py-4 h-auto transform hover:scale-105 transition-all duration-200"
                disabled={sendEmailsMutation.isPending}
              >
                <Layers className="w-5 h-5 mr-2" />
                Send Emails Now
              </Button>
            </CardContent>
          </Card>

          {/* Statistics Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-secondary">Email Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Valid emails imported:</span>
                <span className="font-bold text-green-600">
                  {emailStats.valid}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-gray-700">Invalid emails found:</span>
                <span className="font-bold text-red-600">
                  {emailStats.invalid}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Emails sent:</span>
                <span className="font-bold text-blue-600">
                  {emailStats.sent}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Console Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-secondary">Console</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-80 overflow-y-auto font-mono text-sm">
                {consoleMessages.map((message, index) => (
                  <div key={index} className="mb-1">
                    {message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
