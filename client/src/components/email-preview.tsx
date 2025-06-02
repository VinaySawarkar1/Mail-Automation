
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Mail } from 'lucide-react';

interface EmailPreviewProps {
  subject: string;
  bodyPart1: string;
  bodyFooter: string;
  fontFamily: string;
  senderEmail: string;
  recipientEmail?: string;
  selectedImage?: File | null;
}

export function EmailPreview({ 
  subject, 
  bodyPart1, 
  bodyFooter, 
  fontFamily, 
  senderEmail,
  recipientEmail = "recipient@example.com",
  selectedImage = null
}: EmailPreviewProps) {
  const [imageDataUrl, setImageDataUrl] = React.useState<string>('');

  // Convert selected image to data URL for preview
  React.useEffect(() => {
    if (selectedImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageDataUrl(e.target?.result as string || '');
      };
      reader.readAsDataURL(selectedImage);
    } else {
      setImageDataUrl('');
    }
  }, [selectedImage]);

  const convertToHtml = (text: string) => {
    // Convert our formatting to actual HTML
    return text
      .replace(/\n/g, '<br>')
      .replace(/\[IMAGE: ([^\]]+)\]/g, '<img src="#" alt="$1" style="max-width: 100%; height: auto; margin: 10px 0;">')
      // Keep existing HTML tags as is
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  };

  const emailHtml = `
    <div style="max-width: 600px; margin: 0 auto; font-family: ${fontFamily}, sans-serif; line-height: 1.6; color: #333;">
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px 8px 0 0; border-bottom: 3px solid #007bff;">
        <h2 style="margin: 0; color: #007bff;">📧 ${subject}</h2>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
          From: ${senderEmail} | To: ${recipientEmail}
        </p>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
        <div style="margin-bottom: 20px;">
          ${convertToHtml(bodyPart1)}
        </div>
        ${imageDataUrl ? `<div style="text-align: center; margin: 20px 0;">
          <img src="${imageDataUrl}" alt="Email Image" style="max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
        </div>` : ''}
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          ${convertToHtml(bodyFooter)}
        </div>
      </div>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666;">
        This email was sent via Mail Automation Platform
      </div>
    </div>
  `;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Eye className="w-4 h-4 mr-2" />
          Preview Email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Email Preview
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div 
            dangerouslySetInnerHTML={{ __html: emailHtml }}
            className="border rounded-lg overflow-hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
