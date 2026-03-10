export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

export class EmailService {
  private sentCount = 0;

  async sendEmail(options: EmailOptions): Promise<void> {
    // In real code this would call an SMTP server
    this.sentCount++;
    console.log(`[Email] Sending to ${options.to}: ${options.subject}`);
  }

  async sendWelcome(email: string, name: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome!',
      body: `Hi ${name}, welcome to our platform!`,
    });
  }

  getSentCount(): number {
    return this.sentCount;
  }
}
