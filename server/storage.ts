import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { User, InsertUser, Template, InsertTemplate, ScheduledEmail, InsertScheduledEmail } from '@shared/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');
const SCHEDULED_EMAILS_FILE = path.join(DATA_DIR, 'scheduled_emails.json');

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserApprovalStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;
  setPasswordResetToken(userId: string, token: string, expiry: string): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updateUserPassword(userId: string, newPassword: string): Promise<void>;
  clearPasswordResetToken(userId: string): Promise<void>;
  
  // Template operations
  getTemplatesByUserId(userId: string): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplate(id: string): Promise<Template | undefined>;
  
  // Scheduled email operations
  createScheduledEmail(email: InsertScheduledEmail): Promise<ScheduledEmail>;
  getScheduledEmailsByUserId(userId: string): Promise<ScheduledEmail[]>;
  updateScheduledEmailStatus(id: string, status: "pending" | "sent" | "failed"): Promise<ScheduledEmail | undefined>;
}

export class JSONFileStorage implements IStorage {
  private async ensureDataDir(): Promise<void> {
    try {
      await fs.access(DATA_DIR);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
  }

  private async readJSONFile<T>(filePath: string, defaultValue: T[] = []): Promise<T[]> {
    try {
      await this.ensureDataDir();
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return defaultValue as T[];
    }
  }

  private async writeJSONFile<T>(filePath: string, data: T[]): Promise<void> {
    await this.ensureDataDir();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const users = await this.readJSONFile<User>(USERS_FILE);
    return users.find(user => user.id === id);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await this.readJSONFile<User>(USERS_FILE);
    return users.find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await this.readJSONFile<User>(USERS_FILE);
    return users.find(user => user.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const users = await this.readJSONFile<User>(USERS_FILE);
    
    // Check if user already exists
    const existingUser = users.find(u => u.username === userData.username || u.email === userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user: User = {
      id: this.generateId(),
      username: userData.username,
      email: userData.email,
      mobile: userData.mobile,
      password: hashedPassword,
      approvalStatus: userData.approvalStatus || 'pending',
      role: userData.role || 'user',
      createdAt: new Date().toISOString()
    };

    users.push(user);
    await this.writeJSONFile(USERS_FILE, users);
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async updateUserApprovalStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<User | undefined> {
    const users = await this.readJSONFile<User>(USERS_FILE);
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) return undefined;
    
    users[userIndex].approvalStatus = status;
    await this.writeJSONFile(USERS_FILE, users);
    
    const { password, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword as User;
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.readJSONFile<User>(USERS_FILE);
    return users.map(({ password, ...user }) => user as User);
  }

  async deleteUser(id: string): Promise<boolean> {
    const users = await this.readJSONFile<User>(USERS_FILE);
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) return false;
    
    users.splice(userIndex, 1);
    await this.writeJSONFile(USERS_FILE, users);
    return true;
  }

  // Template operations
  async getTemplatesByUserId(userId: string): Promise<Template[]> {
    const templates = await this.readJSONFile<Template>(TEMPLATES_FILE);
    return templates.filter(template => template.userId === userId);
  }

  async createTemplate(templateData: InsertTemplate): Promise<Template> {
    const templates = await this.readJSONFile<Template>(TEMPLATES_FILE);
    
    const template: Template = {
      id: this.generateId(),
      ...templateData,
      createdAt: new Date().toISOString()
    };

    templates.push(template);
    await this.writeJSONFile(TEMPLATES_FILE, templates);
    return template;
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const templates = await this.readJSONFile<Template>(TEMPLATES_FILE);
    return templates.find(template => template.id === id);
  }

  // Scheduled email operations
  async createScheduledEmail(emailData: InsertScheduledEmail): Promise<ScheduledEmail> {
    const emails = await this.readJSONFile<ScheduledEmail>(SCHEDULED_EMAILS_FILE);
    
    const email: ScheduledEmail = {
      id: this.generateId(),
      ...emailData,
      createdAt: new Date().toISOString()
    };

    emails.push(email);
    await this.writeJSONFile(SCHEDULED_EMAILS_FILE, emails);
    return email;
  }

  async getScheduledEmailsByUserId(userId: string): Promise<ScheduledEmail[]> {
    const emails = await this.readJSONFile<ScheduledEmail>(SCHEDULED_EMAILS_FILE);
    return emails.filter(email => email.userId === userId);
  }

  async updateScheduledEmailStatus(id: string, status: "pending" | "sent" | "failed"): Promise<ScheduledEmail | undefined> {
    const emails = await this.readJSONFile<ScheduledEmail>(SCHEDULED_EMAILS_FILE);
    const emailIndex = emails.findIndex(email => email.id === id);
    
    if (emailIndex === -1) return undefined;
    
    emails[emailIndex].status = status;
    await this.writeJSONFile(SCHEDULED_EMAILS_FILE, emails);
    return emails[emailIndex];
  }

  // Initialize with admin user if none exists
  async initializeAdminUser(): Promise<void> {
    const users = await this.readJSONFile<User>(USERS_FILE);
    const adminExists = users.some(user => user.role === 'admin');
    
    if (!adminExists) {
      await this.createUser({
        username: 'admin',
        email: 'admin@example.com',
        mobile: '1234567890',
        password: 'admin123',
        approvalStatus: 'approved',
        role: 'admin'
      });
    }
  }

  // Verify password
  async verifyPassword(username: string, password: string): Promise<User | null> {
    const users = await this.readJSONFile<User>(USERS_FILE);
    const user = users.find(u => u.username === username);
    
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  // Password reset methods
  async setPasswordResetToken(userId: string, token: string, expiry: string): Promise<void> {
    const users = await this.readJSONFile<User>(USERS_FILE);
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      (users[userIndex] as any).resetToken = token;
      (users[userIndex] as any).resetTokenExpiry = expiry;
      await this.writeJSONFile(USERS_FILE, users);
    }
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const users = await this.readJSONFile<User>(USERS_FILE);
    const user = users.find(u => 
      (u as any).resetToken === token && 
      (u as any).resetTokenExpiry && 
      new Date((u as any).resetTokenExpiry) > new Date()
    );
    
    if (!user) return undefined;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const users = await this.readJSONFile<User>(USERS_FILE);
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      users[userIndex].password = hashedPassword;
      await this.writeJSONFile(USERS_FILE, users);
    }
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    const users = await this.readJSONFile<User>(USERS_FILE);
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      delete (users[userIndex] as any).resetToken;
      delete (users[userIndex] as any).resetTokenExpiry;
      await this.writeJSONFile(USERS_FILE, users);
    }
  }
}

export const storage = new JSONFileStorage();
