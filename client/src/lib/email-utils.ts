import * as XLSX from "xlsx";
import { z } from "zod";

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  attachments?: string[];
}

export interface ParsedEmail {
  email: string;
  name?: string;
}

export interface EmailValidationResult {
  valid: string[];
  invalid: string[];
}

export const parseEmailAddresses = (text: string): ParsedEmail[] => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Split by common separators and extract emails
  const lines = text.split(/[\n\r,;]+/);
  const emails: ParsedEmail[] = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed) {
      // Check if it looks like an email
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      const matches = trimmed.match(emailRegex);
      
      if (matches) {
        matches.forEach(email => {
          emails.push({ email: email.trim() });
        });
      }
    }
  });

  // Remove duplicates
  const uniqueEmails = emails.filter((item, index, arr) => 
    arr.findIndex(other => other.email === item.email) === index
  );

  return uniqueEmails;
};

export const readExcelFile = async (file: File, sheetName?: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const targetSheet = sheetName || workbook.SheetNames[0];
        
        if (!workbook.Sheets[targetSheet]) {
          reject(new Error(`Sheet "${targetSheet}" not found`));
          return;
        }
        
        const worksheet = workbook.Sheets[targetSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

export const validateEmails = (emailText: string): EmailValidationResult => {
  const emails = parseEmailAddresses(emailText);
  const valid: string[] = [];
  const invalid: string[] = [];

  emails.forEach(({ email }) => {
    if (validateEmail(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  });

  return { valid, invalid };
};

export const formatEmailContent = (
  template: string,
  variables: Record<string, string>,
): string => {
  let content = template;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    content = content.replace(regex, value);
  });

  return content;
};

export async function processExcelFile(
  file: File, 
  emailColumn: string = 'email'
): Promise<{ validEmails: string[], invalidEmails: string[], notFoundEmails: string[] }> {
  try {
    const data = await readExcelFile(file);
    
    if (!data || data.length === 0) {
      throw new Error('No data found in the file');
    }

    const validEmails: string[] = [];
    const invalidEmails: string[] = [];
    const notFoundEmails: string[] = [];

    data.forEach((row: any, index: number) => {
      const email = row[emailColumn] || row.email || row.Email || row.EMAIL;
      
      if (!email) {
        notFoundEmails.push(`Row ${index + 1}: Email column not found`);
      } else if (validateEmail(email)) {
        validEmails.push(email);
      } else {
        invalidEmails.push(email);
      }
    });

    return { validEmails, invalidEmails, notFoundEmails };
  } catch (error: any) {
    throw new Error(`Failed to process Excel file: ${error.message}`);
  }
}

export function formatEmailStats(validCount: number, invalidCount: number, notFoundCount: number = 0) {
  return {
    valid: validCount,
    invalid: invalidCount,
    notFound: notFoundCount,
    total: validCount + invalidCount + notFoundCount
  };
}

export function simulateEmailSending(
  validEmails: string[],
  subject: string,
  body: string
): Promise<{ sentCount: number, failedCount: number, results: Array<{ email: string, status: 'sent' | 'failed' }> }> {
  return new Promise((resolve) => {
    const results = validEmails.map(email => {
      // Simulate success rate of 95%
      const success = Math.random() > 0.05;
      return {
        email,
        status: success ? 'sent' as const : 'failed' as const
      };
    });

    const sentCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    // Simulate processing time
    setTimeout(() => {
      resolve({ sentCount, failedCount, results });
    }, 1000);
  });
}

export const generateEmailPreview = (subject: string, body: string): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .email-header {
            border-bottom: 2px solid #e1e5e9;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .email-subject {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin: 0;
          }
          .email-body {
            font-size: 16px;
            line-height: 1.8;
          }
        </style>
      </head>
      <body>
        <div class="email-header">
          <h1 class="email-subject">${subject}</h1>
        </div>
        <div class="email-body">
          ${body}
        </div>
      </body>
    </html>
  `;
};
